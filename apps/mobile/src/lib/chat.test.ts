import { describe, expect, it } from 'vitest';
import {
  createSseParser,
  messageKeyForHttpError,
  messageKeyForStreamError,
  pickModel,
  sortModels,
  type ModelOption,
} from './chat';

const models: ModelOption[] = [
  { id: 'p/zeta', name: 'Zeta', free: false },
  { id: 'f/beta:free', name: 'Beta', free: true },
  { id: 'f/alpha:free', name: 'Alpha', free: true },
  { id: 'p/gamma', name: 'Gamma', free: false },
];

describe('sortModels', () => {
  it('puts free models first, each group alphabetical', () => {
    expect(sortModels(models).map((m) => m.id)).toEqual([
      'f/alpha:free',
      'f/beta:free',
      'p/gamma',
      'p/zeta',
    ]);
  });

  it('does not mutate its input', () => {
    const copy = [...models];
    sortModels(models);
    expect(models).toEqual(copy);
  });
});

describe('pickModel', () => {
  const sorted = sortModels(models);

  it('keeps a saved model that still exists', () => {
    expect(pickModel(sorted, 'p/gamma')).toBe('p/gamma');
  });

  it('falls back to the first free model, then the first model, then empty', () => {
    expect(pickModel(sorted, 'gone/model')).toBe('f/alpha:free');
    expect(pickModel([{ id: 'p/only', name: 'Only', free: false }], '')).toBe('p/only');
    expect(pickModel([], 'x')).toBe('');
  });
});

describe('createSseParser', () => {
  it('returns complete events and keeps partial ones', () => {
    const parser = createSseParser();
    expect(parser.feed('data: {"a":1}\n\ndata: {"b"')).toEqual(['{"a":1}']);
    expect(parser.feed(':2}\n\n')).toEqual(['{"b":2}']);
  });

  it('handles CRLF and ignores comments', () => {
    const parser = createSseParser();
    expect(parser.feed(': ping\r\n\r\ndata: x\r\n\r\n')).toEqual(['x']);
  });
});

describe('error mapping', () => {
  it('maps HTTP errors', () => {
    expect(messageKeyForHttpError(401, undefined)).toBe('chat.errUnauthorized');
    expect(messageKeyForHttpError(429, 'RATE_LIMITED')).toBe('chat.errRate');
    expect(messageKeyForHttpError(503, 'PROVIDER_NOT_CONFIGURED')).toBe('chat.errNotConfigured');
    expect(messageKeyForHttpError(500, undefined)).toBe('chat.errGeneric');
  });

  it('maps stream errors', () => {
    expect(messageKeyForStreamError('RATE_LIMITED')).toBe('chat.errRate');
    expect(messageKeyForStreamError('MODEL')).toBe('chat.errModel');
    expect(messageKeyForStreamError('UPSTREAM')).toBe('chat.errGeneric');
  });
});
