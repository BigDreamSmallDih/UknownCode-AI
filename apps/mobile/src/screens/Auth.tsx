import { useState } from 'react';
import type { FormEvent } from 'react';
import { Logo } from '../components/Logo';
import type { MessageKey, TranslateParams } from '../i18n';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../lib/AuthContext';
import { validateCredentials } from '../lib/authErrors';
import { useNetwork } from '../lib/useNetwork';

type Mode = 'signin' | 'signup';

interface Notice {
  key: MessageKey;
  params?: TranslateParams;
}

export function AuthScreen() {
  const { t } = useI18n();
  const { signIn, signUp } = useAuth();
  const { online } = useNetwork();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Notice | null>(null);
  const [info, setInfo] = useState<Notice | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const invalid = validateCredentials(email, password);
    if (invalid) {
      setError(invalid.key === 'err.shortPassword' ? invalid : { key: invalid.key });
      return;
    }

    setBusy(true);
    try {
      const result =
        mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
      if (!result.ok) {
        setError({ key: result.messageKey });
      } else if (result.needsConfirmation) {
        setInfo({ key: 'auth.confirmEmail' });
        setMode('signin');
        setPassword('');
      }
      // With a session, AuthProvider updates and the app opens by itself.
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
            <Logo size={48} />
            <div>
              <h1>
                Uknown<span className="accent">Code</span> AI
              </h1>
              <p className="muted">
                {mode === 'signin' ? t('auth.signinSubtitle') : t('auth.signupSubtitle')}
              </p>
            </div>
          </header>

          <form className="card" onSubmit={(event) => void submit(event)} noValidate>
            <label htmlFor="auth-email" className="muted">
              {t('auth.email')}
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
              {t('auth.password')}
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
                {t(error.key, error.params)}
              </p>
            )}
            {info && (
              <p className="ok" role="status">
                {t(info.key, info.params)}
              </p>
            )}
            {!online && <p className="error-text">{t('auth.noInternet')}</p>}

            <button type="submit" className="btn primary" disabled={busy || !online}>
              {busy ? t('auth.working') : mode === 'signin' ? t('auth.signin') : t('auth.signup')}
            </button>
            <button type="button" className="btn" onClick={switchMode} disabled={busy}>
              {mode === 'signin' ? t('auth.toSignup') : t('auth.toSignin')}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
