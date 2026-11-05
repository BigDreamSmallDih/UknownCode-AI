import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useSettings } from '../lib/SettingsContext';
import { normalizeBackendUrl, type FontSize } from '../lib/settings';

const FONT_OPTIONS: ReadonlyArray<{ value: FontSize; label: string }> = [
  { value: 'sm', label: 'Kecil' },
  { value: 'md', label: 'Sedang' },
  { value: 'lg', label: 'Besar' },
];

export function Settings() {
  const { settings, loaded, update } = useSettings();
  const [urlInput, setUrlInput] = useState('');
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (loaded) setUrlInput(settings.backendUrl);
  }, [loaded, settings.backendUrl]);

  async function saveUrl(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizeBackendUrl(urlInput);
    if (normalized === null) {
      setMessage({
        kind: 'error',
        text: 'URL tidak valid. Gunakan https:// (http:// hanya untuk localhost).',
      });
      return;
    }
    const saved = await update({ backendUrl: normalized });
    setUrlInput(normalized);
    setMessage(
      saved
        ? { kind: 'ok', text: 'Tersimpan.' }
        : { kind: 'error', text: 'Gagal menyimpan pengaturan di perangkat.' },
    );
  }

  return (
    <div className="screen">
      <h1>Settings</h1>

      <form className="card" onSubmit={(event) => void saveUrl(event)}>
        <h2>Backend</h2>
        <label htmlFor="backend-url" className="muted">
          URL server UknownCode
        </label>
        <input
          id="backend-url"
          className="input"
          type="url"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="https://nama-backend.onrender.com"
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
        />
        <button type="submit" className="btn primary">
          Simpan
        </button>
        {message && (
          <p className={message.kind === 'ok' ? 'ok' : 'error-text'} role="status">
            {message.text}
          </p>
        )}
      </form>

      <section className="card">
        <h2>Tampilan</h2>
        <p className="muted">Ukuran teks</p>
        <div className="segmented" role="radiogroup" aria-label="Ukuran teks">
          {FONT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={settings.fontSize === option.value}
              className={settings.fontSize === option.value ? 'active' : ''}
              onClick={() => void update({ fontSize: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(event) => void update({ reduceMotion: event.target.checked })}
          />
          <span>Kurangi animasi</span>
        </label>
      </section>

      <section className="card">
        <h2>Tentang</h2>
        <p className="muted">UknownCode AI v0.1.0 · Phase 1</p>
      </section>
    </div>
  );
}
