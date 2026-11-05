import type { MessageKey } from '../i18n';

export interface AuthErrorLike {
  code?: string | undefined;
  message?: string | undefined;
  status?: number | undefined;
  name?: string | undefined;
}

/** Maps a Supabase auth error to a translation key. Raw server text is never shown. */
export function mapAuthError(error: AuthErrorLike | null | undefined): MessageKey {
  if (!error) return 'err.generic';
  switch (error.code) {
    case 'invalid_credentials':
      return 'err.invalidCredentials';
    case 'email_not_confirmed':
      return 'err.emailNotConfirmed';
    case 'user_already_exists':
    case 'email_exists':
      return 'err.userExists';
    case 'weak_password':
      return 'err.weakPassword';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'err.rateLimit';
    case 'signup_disabled':
      return 'err.signupDisabled';
    default:
      break;
  }
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) return 'err.network';
  return 'err.generic';
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export type CredentialError =
  | { key: 'err.invalidEmail' }
  | { key: 'err.shortPassword'; params: { min: number } };

/** Returns what is wrong with the input, or null when it is acceptable. */
export function validateCredentials(email: string, password: string): CredentialError | null {
  if (!EMAIL_PATTERN.test(email.trim())) return { key: 'err.invalidEmail' };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { key: 'err.shortPassword', params: { min: MIN_PASSWORD_LENGTH } };
  }
  return null;
}
