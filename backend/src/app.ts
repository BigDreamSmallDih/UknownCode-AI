import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { createSupabaseAuthService, type AuthService } from './auth/auth.service.js';
import type { Env } from './config/env.js';
import { healthRoutes } from './routes/health.js';
import { meRoutes } from './routes/me.js';

export interface AppDeps {
  /** Override the auth service (tests). `null` means "not configured". */
  auth?: AuthService | null;
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

  return app;
}
