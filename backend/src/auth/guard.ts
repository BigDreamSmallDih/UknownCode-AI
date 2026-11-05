import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthService, AuthedUser } from './auth.service.js';

const BEARER = /^Bearer\s+(\S+)$/i;

export function sendError(reply: FastifyReply, status: number, code: string, message: string) {
  return reply.status(status).send({ error: { code, message } });
}

export interface Authenticated {
  user: AuthedUser;
  token: string;
}

/**
 * Verifies the Bearer token. On any failure it sends the error response itself and returns
 * null, so callers just `if (!session) return reply;`.
 */
export async function authenticate(
  auth: AuthService | null,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<Authenticated | null> {
  if (!auth) {
    sendError(reply, 503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured');
    return null;
  }

  const token = BEARER.exec(request.headers.authorization ?? '')?.[1];
  if (!token) {
    sendError(reply, 401, 'UNAUTHORIZED', 'Missing bearer token');
    return null;
  }

  try {
    const user = await auth.verifyToken(token);
    if (!user) {
      sendError(reply, 401, 'UNAUTHORIZED', 'Invalid or expired token');
      return null;
    }
    return { user, token };
  } catch (error) {
    request.log.error({ err: error }, 'Auth backend unavailable');
    sendError(reply, 503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable');
    return null;
  }
}
