import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../lib/AuthContext';
import { validateCredentials } from '../lib/authErrors';
import { useNetwork } from '../lib/useNetwork';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const { online } = useNetwork();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const validation = validateCredentials(email, password);
    if (validation) {
      setError(validation);
      return;
    }

    setBusy(true);
    try {
      const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
      if (!result.ok) {
        setError(result.message);
      } else if (result.needsConfirmation) {
        setInfo('Pendaftaran berhasil. Buka emailmu dan konfirmasi akun, lalu masuk.');
        setMode('signin');
        setPassword('');
      }
      // On success with a session, AuthProvider updates and the app opens by itself.
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setInfo(null);
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <div className="screen auth">
          <header className="hero">
            <h1>
              Uknown<span className="accent">Code</span> AI
            </h1>
            <p className="muted">{mode === 'signin' ? 'Masuk ke akunmu' : 'Buat akun baru'}</p>
          </header>

          <form className="card" onSubmit={(event) => void submit(event)} noValidate>
            <label htmlFor="auth-email" className="muted">
              Email
            </label>
            <input
              id="auth-email"
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <label htmlFor="auth-password" className="muted">
              Kata sandi
            </label>
            <input
              id="auth-password"
              className="input"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            {info && (
              <p className="ok" role="status">
                {info}
              </p>
            )}
            {!online && <p className="error-text">Tidak ada koneksi internet.</p>}

            <button type="submit" className="btn primary" disabled={busy || !online}>
              {busy ? 'Memproses…' : mode === 'signin' ? 'Masuk' : 'Daftar'}
            </button>
            <button type="button" className="btn" onClick={switchMode} disabled={busy}>
              {mode === 'signin' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
