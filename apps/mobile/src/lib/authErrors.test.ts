import { describe, expect, it } from 'vitest';
import { mapAuthError, validateCredentials } from './authErrors';

describe('mapAuthError', () => {
  it('maps known codes to Indonesian messages', () => {
    expect(mapAuthError({ code: 'invalid_credentials' })).toBe('Email atau kata sandi salah.');
    expect(mapAuthError({ code: 'user_already_exists' })).toMatch(/sudah terdaftar/);
    expect(mapAuthError({ code: 'weak_password' })).toMatch(/minimal 8/);
  });

  it('detects network failures', () => {
    expect(mapAuthError({ name: 'AuthRetryableFetchError' })).toMatch(/Tidak bisa terhubung/);
  });

  it('never leaks raw server messages', () => {
    const message = mapAuthError({ code: 'unexpected', message: 'duplicate key value at db.internal' });
    expect(message).not.toMatch(/db\.internal/);
  });

  it('handles a missing error', () => {
    expect(mapAuthError(null)).toBe('Terjadi kesalahan. Coba lagi.');
  });
});

describe('validateCredentials', () => {
  it('accepts a valid email and password', () => {
    expect(validateCredentials('a@b.co', 'password1')).toBeNull();
  });

  it('rejects a bad email', () => {
    expect(validateCredentials('not-an-email', 'password1')).toMatch(/email yang valid/);
  });

  it('rejects a short password', () => {
    expect(validateCredentials('a@b.co', '1234567')).toMatch(/minimal 8/);
  });
});
