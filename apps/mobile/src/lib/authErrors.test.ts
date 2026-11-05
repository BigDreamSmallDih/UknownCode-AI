import { describe, expect, it } from 'vitest';
import { mapAuthError, validateCredentials } from './authErrors';

describe('mapAuthError', () => {
  it('maps known codes to translation keys', () => {
    expect(mapAuthError({ code: 'invalid_credentials' })).toBe('err.invalidCredentials');
    expect(mapAuthError({ code: 'user_already_exists' })).toBe('err.userExists');
    expect(mapAuthError({ code: 'weak_password' })).toBe('err.weakPassword');
  });

  it('detects network failures', () => {
    expect(mapAuthError({ name: 'AuthRetryableFetchError' })).toBe('err.network');
  });

  it('never leaks raw server messages', () => {
    expect(mapAuthError({ code: 'unexpected', message: 'duplicate key at db.internal' })).toBe(
      'err.generic',
    );
  });

  it('handles a missing error', () => {
    expect(mapAuthError(null)).toBe('err.generic');
  });
});

describe('validateCredentials', () => {
  it('accepts a valid email and password', () => {
    expect(validateCredentials('a@b.co', 'password1')).toBeNull();
  });

  it('rejects a bad email', () => {
    expect(validateCredentials('not-an-email', 'password1')).toEqual({ key: 'err.invalidEmail' });
  });

  it('rejects a short password', () => {
    expect(validateCredentials('a@b.co', '1234567')).toEqual({
      key: 'err.shortPassword',
      params: { min: 8 },
    });
  });
});
