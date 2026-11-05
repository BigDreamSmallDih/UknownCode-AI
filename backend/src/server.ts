import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const app = await buildApp(env);

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'Shutting down');
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: env.PORT, host: env.HOST });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
