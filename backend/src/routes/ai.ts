import { Readable } from 'node:stream';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { AuthService } from '../auth/auth.service.js';
import { authenticate, sendError } from '../auth/guard.js';
import type { FixedWindowLimiter } from '../lib/rate-limit.js';
import { ProviderError, publicMessage } from '../providers/errors.js';
import type { ChatMessage, StreamEvent } from '../providers/provider.interface.js';
import type { ProviderRouter } from '../providers/router.js';

const SYSTEM_PROMPT =
  'You are UknownCode AI, a concise and accurate coding assistant inside an Android app. ' +
  'Prefer short answers and code blocks. Reply in the language the user writes in.';

const MAX_TOTAL_CHARS = 60_000;

const chatBody = z.object({
  model: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[A-Za-z0-9._:/@+-]+$/, 'invalid model id'),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(16_000),
      }),
    )
    .min(1)
    .max(40),
});

export interface AiRouteDeps {
  auth: AuthService | null;
  providers: ProviderRouter;
  limiter: FixedWindowLimiter;
}

export function aiRoutes({ auth, providers, limiter }: AiRouteDeps): FastifyPluginAsync {
  return async (app) => {
    app.get('/ai/models', async (request, reply) => {
      const session = await authenticate(auth, request, reply);
      if (!session) return reply;

      const provider = providers.get('openrouter');
      if (!provider) {
        return sendError(reply, 503, 'PROVIDER_NOT_CONFIGURED', 'No AI provider is configured');
      }
      try {
        return { models: await provider.listModels() };
      } catch (error) {
        request.log.error({ err: error }, 'Listing models failed');
        const code = error instanceof ProviderError ? error.code : 'UPSTREAM';
        return sendError(reply, 502, 'PROVIDER_ERROR', publicMessage(code));
      }
    });

    app.post('/ai/chat', async (request, reply) => {
      const session = await authenticate(auth, request, reply);
      if (!session) return reply;

      const provider = providers.get('openrouter');
      if (!provider) {
        return sendError(reply, 503, 'PROVIDER_NOT_CONFIGURED', 'No AI provider is configured');
      }

      const parsed = chatBody.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, 400, 'INVALID_REQUEST', 'Invalid chat request');
      }
      const { model, messages } = parsed.data;
      const totalChars = messages.reduce((sum, message) => sum + message.content.length, 0);
      if (totalChars > MAX_TOTAL_CHARS) {
        return sendError(reply, 400, 'INVALID_REQUEST', 'Conversation is too long');
      }

      const limit = limiter.check(session.user.id);
      if (!limit.allowed) {
        void reply.header('Retry-After', String(limit.retryAfterSec));
        return sendError(reply, 429, 'RATE_LIMITED', 'Too many AI requests');
      }

      const controller = new AbortController();
      const outgoing: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

      async function* events(): AsyncGenerator<string> {
        try {
          for await (const event of provider!.chatStream({
            model,
            messages: outgoing,
            signal: controller.signal,
          })) {
            yield frame(event);
          }
        } catch (error) {
          request.log.error({ err: error }, 'AI stream failed');
          yield frame({
            type: 'error',
            code: 'UPSTREAM',
            message: publicMessage('UPSTREAM'),
            retryable: true,
          });
        } finally {
          // Runs when the client disconnects too, which stops the upstream request.
          controller.abort();
        }
      }

      void reply
        .header('Content-Type', 'text/event-stream; charset=utf-8')
        .header('Cache-Control', 'no-cache, no-transform')
        .header('X-Accel-Buffering', 'no');
      return reply.send(Readable.from(events(), { objectMode: false }));
    });
  };
}

function frame(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
