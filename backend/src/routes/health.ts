import type { FastifyPluginAsync } from 'fastify';

const startedAt = Date.now();

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({
    status: 'ok' as const,
    service: 'uknowncode-backend',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  }));
};
