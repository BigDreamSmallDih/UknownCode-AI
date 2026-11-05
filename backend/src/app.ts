import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { createSupabaseAuthService, type AuthService } from './auth/auth.service.js';
import type { Env } from './config/env.js';
import { FixedWindowLimiter } from './lib/rate-limit.js';
import { OpenRouterProvider } from './providers/openrouter.js';
import { ProviderRouter } from './providers/router.js';
import { aiRoutes } from './routes/ai.js';
import { healthRoutes } from './routes/health.js';
import { meRoutes } from './routes/me.js';

export interface AppDeps {
  /** Override the auth service (tests). `null` means "not configured". */
  auth?: AuthService | null;
  /** Override the AI providers (tests). */
  providers?: ProviderRouter;
  /** Override the AI rate limiter (tests). */
  limiter?: FixedWindowLimiter;
}

export async function buildApp(env: Env, deps: AppDeps = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : { level: env.LOG_LEVEL },
    disableRequestLogging: env.NODE_ENV === 'test',
  });

  await app.register(helmet);
  await app.register(cors, { origin: env.CORS_ORIGINS });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    if (statusCode >= 500) {
      request.log.error({ err: error }, 'Unhandled error');
    }
    void reply.status(statusCode).send({
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        // Never leak internal error details for 5xx responses.
        message: statusCode >= 500 ? 'Internal server error' : error.message,
      },
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    void reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  const auth = deps.auth !== undefined ? deps.auth : createSupabaseAuthService(env);

  await app.register(healthRoutes);
  await app.register(meRoutes(auth));

  const providers =
    deps.providers ??
    new ProviderRouter(
      env.OPENROUTER_API_KEY
        ? [
            new OpenRouterProvider({
              apiKey: env.OPENROUTER_API_KEY,
              ...(env.OPENROUTER_REFERER ? { referer: env.OPENROUTER_REFERER } : {}),
            }),
          ]
        : [],
    );
  const limiter = deps.limiter ?? new FixedWindowLimiter(env.AI_RATE_LIMIT, 10 * 60_000);
  await app.register(aiRoutes({ auth, providers, limiter }));

  return app;
}
