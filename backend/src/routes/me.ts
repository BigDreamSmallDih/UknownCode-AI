import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import type { AuthService } from '../auth/auth.service.js';

const BEARER = /^Bearer\s+(\S+)$/i;

function fail(reply: FastifyReply, status: number, code: string, message: string) {
  return reply.status(status).send({ error: { code, message } });
}

export function meRoutes(auth: AuthService | null): FastifyPluginAsync {
  return async (app) => {
    app.get('/me', async (request, reply) => {
      if (!auth) {
        return fail(reply, 503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured');
      }

      const match = BEARER.exec(request.headers.authorization ?? '');
      const token = match?.[1];
      if (!token) return fail(reply, 401, 'UNAUTHORIZED', 'Missing bearer token');

      try {
        const user = await auth.verifyToken(token);
        if (!user) return fail(reply, 401, 'UNAUTHORIZED', 'Invalid or expired token');

        const profile = await auth.getProfile(token, user.id);
        return { user, profile };
      } catch (error) {
        request.log.error({ err: error }, 'Auth backend unavailable');
        return fail(reply, 503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable');
      }
    });
  };
}
