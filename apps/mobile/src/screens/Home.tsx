import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import type { MessageKey, TranslateParams } from '../i18n';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../lib/AuthContext';
import { useSettings } from '../lib/SettingsContext';
import { useNetwork } from '../lib/useNetwork';

interface Failure {
  key: MessageKey;
  params?: TranslateParams;
}

type BackendState =
  | { kind: 'unconfigured' }
  | { kind: 'checking' }
  | { kind: 'ok'; latencyMs: number }
  | { kind: 'error'; failure: Failure };

type ProfileState =
  | { kind: 'idle' }
  | { kind: 'ok'; name: string | null }
  | { kind: 'error'; failure: Failure };

const REQUEST_TIMEOUT_MS = 10_000;

async function checkBackend(baseUrl: string): Promise<BackendState> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}/health`, { signal: controller.signal });
    if (!response.ok) {
      return { kind: 'error', failure: { key: 'home.errHttp', params: { status: response.status } } };
    }
    const body: unknown = await response.json();
    if ((body as { status?: unknown } | null)?.status !== 'ok') {
      return { kind: 'error', failure: { key: 'home.errInvalid' } };
    }
    return { kind: 'ok', latencyMs: Math.round(performance.now() - started) };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    return { kind: 'error', failure: { key: aborted ? 'home.errTimeout' : 'home.errConnect' } };
  } finally {
    clearTimeout(timer);
  }
}

/** Calls /me with the user's access token, which verifies auth end to end. */
async function fetchProfile(baseUrl: string, accessToken: string): Promise<ProfileState> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    if (response.status === 401) return { kind: 'error', failure: { key: 'home.profileRejected' } };
    if (!response.ok) {
      return { kind: 'error', failure: { key: 'home.errHttp', params: { status: response.status } } };
    }
    const body = (await response.json()) as { profile?: { display_name?: string | null } | null };
    return { kind: 'ok', name: body.profile?.display_name ?? null };
  } catch {
    return { kind: 'error', failure: { key: 'home.profileFailed' } };
  } finally {
    clearTimeout(timer);
  }
}

export function Home() {
  const { t } = useI18n();
  const { settings, loaded } = useSettings();
  const { session } = useAuth();
  const { online } = useNetwork();
  const [state, setState] = useState<BackendState>({ kind: 'unconfigured' });
  const [profile, setProfile] = useState<ProfileState>({ kind: 'idle' });

  const run = useCallback(async () => {
    if (!settings.backendUrl) {
      setState({ kind: 'unconfigured' });
      return;
    }
    setState({ kind: 'checking' });
    setState(await checkBackend(settings.backendUrl));
  }, [settings.backendUrl]);

  useEffect(() => {
    if (loaded) void run();
  }, [loaded, run]);

  const accessToken = session?.access_token;
  useEffect(() => {
    if (state.kind !== 'ok' || !accessToken) {
      setProfile({ kind: 'idle' });
      return;
    }
    let active = true;
    void fetchProfile(settings.backendUrl, accessToken).then((result) => {
      if (active) setProfile(result);
    });
    return () => {
      active = false;
    };
  }, [state.kind, accessToken, settings.backendUrl]);

  const failure =
    state.kind === 'error' ? state.failure : profile.kind === 'error' ? profile.failure : null;

  return (
    <div className="screen">
      <header className="hero">
        <Logo size={44} />
        <div>
          <h1>
            Uknown<span className="accent">Code</span> AI
          </h1>
          <p className="muted">{t('home.tagline')}</p>
        </div>
      </header>

      <section className="card">
        <h2>{t('home.statusTitle')}</h2>
        <ul className="status-list">
          <li>
            <span>{t('home.internet')}</span>
            <span className={online ? 'ok' : 'bad'}>
              <i className={`dot ${online ? 'ok' : 'bad'}`} />
              {online ? t('home.online') : t('home.offline')}
            </span>
          </li>
          <li>
            <span>{t('home.backend')}</span>
            <BackendBadge state={state} />
          </li>
          {accessToken && (
            <li>
              <span>{t('home.account')}</span>
              {profile.kind === 'ok' && (
                <span className="ok">{profile.name ?? t('home.noName')}</span>
              )}
              {profile.kind === 'error' && <span className="bad">{t('home.failed')}</span>}
              {profile.kind === 'idle' && <span className="muted">—</span>}
            </li>
          )}
        </ul>

        {state.kind === 'unconfigured' && (
          <p className="muted">
            {t('home.backendNotSet')} <Link to="/settings">{t('home.openSettings')}</Link>
          </p>
        )}
        {failure && <p className="error-text">{t(failure.key, failure.params)}</p>}
        {settings.backendUrl && (
          <button
            type="button"
            className="btn"
            onClick={() => void run()}
            disabled={state.kind === 'checking' || !online}
          >
            {state.kind === 'checking' ? t('home.checking') : t('home.recheck')}
          </button>
        )}
      </section>

      <section className="card">
        <h2>{t('home.progressTitle')}</h2>
        <p className="muted">{t('home.progressText')}</p>
      </section>
    </div>
  );
}

function BackendBadge({ state }: { state: BackendState }) {
  const { t } = useI18n();
  switch (state.kind) {
    case 'unconfigured':
      return <span className="muted">{t('home.notSet')}</span>;
    case 'checking':
      return <span className="muted">{t('home.checking')}</span>;
    case 'ok':
      return (
        <span className="ok">
          <i className="dot ok" />
          {t('home.connected', { ms: state.latencyMs })}
        </span>
      );
    case 'error':
      return (
        <span className="bad">
          <i className="dot bad" />
          {t('home.failed')}
        </span>
      );
  }
}
