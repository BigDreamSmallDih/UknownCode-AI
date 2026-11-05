import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';

describe('backend', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp(loadEnv({ NODE_ENV: 'test' }), { auth: null });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    const body = response.json<{ status: string; service: string }>();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('uknowncode-backend');
  });

  it('returns a structured 404 for unknown routes', async () => {
    const response = await app.inject({ method: 'GET', url: '/nope' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });
});

describe('loadEnv', () => {
  it('applies defaults', () => {
    const env = loadEnv({});
    expect(env.PORT).toBe(8080);
    expect(env.CORS_ORIGINS).toContain('https://localhost');
  });

  it('treats blank Supabase values as unset and rejects http URLs', () => {
    expect(loadEnv({ SUPABASE_URL: '' }).SUPABASE_URL).toBeUndefined();
    expect(() => loadEnv({ SUPABASE_URL: 'http://example.com' })).toThrow(/SUPABASE_URL/);
  });

  it('rejects an invalid port with a readable message', () => {
    expect(() => loadEnv({ PORT: 'abc' })).toThrow(/Invalid environment configuration: PORT/);
  });
});
