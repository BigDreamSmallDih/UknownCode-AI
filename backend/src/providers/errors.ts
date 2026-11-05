import type { ProviderErrorCode } from './provider.interface.js';

export class ProviderError extends Error {
  constructor(
    readonly code: ProviderErrorCode,
    readonly retryable: boolean,
  ) {
    super(`Provider error: ${code}`);
    this.name = 'ProviderError';
  }
}

/** Maps an upstream HTTP status to a provider error category. */
export function errorFromStatus(status: number): ProviderError {
  if (status === 429) return new ProviderError('RATE_LIMITED', true);
  if (status === 401 || status === 403) return new ProviderError('AUTH', false);
  if (status === 408 || status === 504) return new ProviderError('TIMEOUT', true);
  if (status === 400 || status === 404 || status === 422) return new ProviderError('MODEL', false);
  return new ProviderError('UPSTREAM', status >= 500);
}

const PUBLIC_MESSAGES: Record<ProviderErrorCode, string> = {
  RATE_LIMITED: 'The AI provider is rate limiting requests',
  AUTH: 'The server could not authenticate with the AI provider',
  MODEL: 'The AI provider rejected the request or model',
  TIMEOUT: 'The AI provider timed out',
  UPSTREAM: 'The AI provider failed',
};

export function publicMessage(code: ProviderErrorCode): string {
  return PUBLIC_MESSAGES[code];
}
