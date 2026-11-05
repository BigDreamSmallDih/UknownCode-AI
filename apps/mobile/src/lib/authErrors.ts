export interface AuthErrorLike {
  code?: string | undefined;
  message?: string | undefined;
  status?: number | undefined;
  name?: string | undefined;
}

/** Turns a Supabase auth error into a short Indonesian message. Never returns raw server text. */
export function mapAuthError(error: AuthErrorLike | null | undefined): string {
  if (!error) return 'Terjadi kesalahan. Coba lagi.';
  switch (error.code) {
    case 'invalid_credentials':
      return 'Email atau kata sandi salah.';
    case 'email_not_confirmed':
      return 'Email belum dikonfirmasi. Cek kotak masuk emailmu.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Email ini sudah terdaftar. Coba masuk.';
    case 'weak_password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 8 karakter.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.';
    case 'signup_disabled':
      return 'Pendaftaran sedang dinonaktifkan.';
    default:
      break;
  }
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
    return 'Tidak bisa terhubung ke server. Periksa koneksi internetmu.';
  }
  return 'Terjadi kesalahan. Coba lagi.';
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

/** Returns an error message for invalid input, or null when the input is acceptable. */
export function validateCredentials(email: string, password: string): string | null {
  if (!EMAIL_PATTERN.test(email.trim())) return 'Masukkan alamat email yang valid.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  return null;
}
