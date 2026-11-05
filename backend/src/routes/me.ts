import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../auth/auth.service.js';
import { authenticate, sendError } from '../auth/guard.js';

export function meRoutes(auth: AuthService | null): FastifyPluginAsync {
  return async (app) => {
    app.get('/me', async (request, reply) => {
      const session = await authenticate(auth, request, reply);
      if (!session || !auth) return reply;

      try {
        const profile = await auth.getProfile(session.token, session.user.id);
        return { user: session.user, profile };
      } catch (error) {
        request.log.error({ err: error }, 'Profile lookup failed');
        return sendError(reply, 503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable');
      }
    });
  };
}
