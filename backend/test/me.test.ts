import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import type { AuthService } from '../src/auth/auth.service.js';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';

const VALID_TOKEN = 'valid-token';

const fakeAuth: AuthService = {
  async verifyToken(token) {
    if (token === 'outage') throw new Error('upstream down');
    return token === VALID_TOKEN ? { id: 'user-1', email: 'a@b.co' } : null;
  },
  async getProfile(_token, userId) {
    return { id: userId, display_name: 'Tester', avatar_url: null };
  },
};

let app: FastifyInstance | undefined;

async function start(auth: AuthService | null): Promise<FastifyInstance> {
  app = await buildApp(loadEnv({ NODE_ENV: 'test' }), { auth });
  return app;
}

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('GET /me', () => {
  it('returns 503 when auth is not configured', async () => {
    const instance = await start(null);
    const response = await instance.inject({ method: 'GET', url: '/me' });
    expect(response.statusCode).toBe(503);
    expect(response.json<{ error: { code: string } }>().error.code).toBe('AUTH_NOT_CONFIGURED');
  });

  it('returns 401 without a bearer token', async () => {
    const instance = await start(fakeAuth);
    const response = await instance.inject({ method: 'GET', url: '/me' });
    expect(response.statusCode).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const instance = await start(fakeAuth);
    const response = await instance.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: 'Bearer nope' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('returns the user and profile for a valid token', async () => {
    const instance = await start(fakeAuth);
    const response = await instance.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: `Bearer ${VALID_TOKEN}` },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user: { id: 'user-1', email: 'a@b.co' },
      profile: { id: 'user-1', display_name: 'Tester', avatar_url: null },
    });
  });

  it('returns 503 (not 500) when the auth backend is down', async () => {
    const instance = await start(fakeAuth);
    const response = await instance.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: 'Bearer outage' },
    });
    expect(response.statusCode).toBe(503);
    expect(response.json<{ error: { code: string } }>().error.code).toBe('AUTH_UNAVAILABLE');
  });
});
