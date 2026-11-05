import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useSettings } from '../lib/SettingsContext';
import { useNetwork } from '../lib/useNetwork';

type BackendState =
  | { kind: 'unconfigured' }
  | { kind: 'checking' }
  | { kind: 'ok'; latencyMs: number }
  | { kind: 'error'; message: string };

const HEALTH_TIMEOUT_MS = 10_000;

async function checkBackend(baseUrl: string): Promise<BackendState> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}/health`, { signal: controller.signal });
    if (!response.ok) return { kind: 'error', message: `Server membalas HTTP ${response.status}` };
    const body: unknown = await response.json();
    const status = (body as { status?: unknown } | null)?.status;
    if (status !== 'ok') return { kind: 'error', message: 'Respons /health tidak valid' };
    return { kind: 'ok', latencyMs: Math.round(performance.now() - started) };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    return {
      kind: 'error',
      message: aborted ? 'Waktu habis (server mungkin sedang bangun, coba lagi)' : 'Tidak bisa terhubung ke server',
    };
  } finally {
    clearTimeout(timer);
  }
}

type ProfileState =
  | { kind: 'idle' }
  | { kind: 'ok'; name: string }
  | { kind: 'error'; message: string };

/** Calls the backend /me endpoint with the user's access token (verifies auth end to end). */
async function fetchProfile(baseUrl: string, accessToken: string): Promise<ProfileState> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    if (response.status === 401) return { kind: 'error', message: 'Sesi ditolak server. Coba keluar lalu masuk lagi.' };
    if (!response.ok) return { kind: 'error', message: `Server membalas HTTP ${response.status}` };
    const body = (await response.json()) as { profile?: { display_name?: string | null } };
    return { kind: 'ok', name: body.profile?.display_name ?? 'Tanpa nama' };
  } catch {
    return { kind: 'error', message: 'Tidak bisa mengambil profil dari server' };
  } finally {
    clearTimeout(timer);
  }
}

export function Home() {
  const { settings, loaded } = useSettings();
  const { session } = useAuth();
  const [profile, setProfile] = useState<ProfileState>({ kind: 'idle' });
  const { online } = useNetwork();
  const [state, setState] = useState<BackendState>({ kind: 'unconfigured' });

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

  return (
    <div className="screen">
      <header className="hero">
        <h1>
          Uknown<span className="accent">Code</span> AI
        </h1>
        <p className="muted">Lingkungan pengembangan Android berbasis AI.</p>
      </header>

      <section className="card">
        <h2>Status koneksi</h2>
        <ul className="status-list">
          <li>
            <span>Internet</span>
            <span className={online ? 'ok' : 'bad'}>{online ? 'Online' : 'Offline'}</span>
          </li>
          <li>
            <span>Backend</span>
            <BackendBadge state={state} />
          </li>
          {accessToken && (
            <li>
              <span>Akun</span>
              {profile.kind === 'ok' && <span className="ok">{profile.name}</span>}
              {profile.kind === 'error' && <span className="bad">Gagal</span>}
              {profile.kind === 'idle' && <span className="muted">—</span>}
            </li>
          )}
        </ul>
        {profile.kind === 'error' && <p className="error-text">{profile.message}</p>}
        {state.kind === 'unconfigured' && (
          <p className="muted">
            URL backend belum diatur. Atur di <Link to="/settings">Settings</Link>.
          </p>
        )}
        {state.kind === 'error' && <p className="error-text">{state.message}</p>}
        {settings.backendUrl && (
          <button
            type="button"
            className="btn"
            onClick={() => void run()}
            disabled={state.kind === 'checking' || !online}
          >
            {state.kind === 'checking' ? 'Memeriksa…' : 'Periksa ulang'}
          </button>
        )}
      </section>

      <section className="card">
        <h2>Progres pengembangan</h2>
        <p className="muted">Phase 2 dari 10: autentikasi dan database.</p>
      </section>
    </div>
  );
}

function BackendBadge({ state }: { state: BackendState }) {
  switch (state.kind) {
    case 'unconfigured':
      return <span className="muted">Belum diatur</span>;
    case 'checking':
      return <span className="muted">Memeriksa…</span>;
    case 'ok':
      return <span className="ok">Terhubung · {state.latencyMs} ms</span>;
    case 'error':
      return <span className="bad">Gagal</span>;
  }
}
