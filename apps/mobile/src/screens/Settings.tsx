import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { LANGUAGES, isLanguageSetting, type MessageKey } from '../i18n';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../lib/AuthContext';
import { useSettings } from '../lib/SettingsContext';
import { normalizeBackendUrl, type FontSize } from '../lib/settings';
import { THEMES } from '../lib/theme';

const FONT_OPTIONS: ReadonlyArray<{ value: FontSize; labelKey: MessageKey }> = [
  { value: 'sm', labelKey: 'size.sm' },
  { value: 'md', labelKey: 'size.md' },
  { value: 'lg', labelKey: 'size.lg' },
];

export function Settings() {
  const { t } = useI18n();
  const { settings, loaded, update } = useSettings();
  const auth = useAuth();
  const [urlInput, setUrlInput] = useState('');
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; key: MessageKey } | null>(null);

  useEffect(() => {
    if (loaded) setUrlInput(settings.backendUrl);
  }, [loaded, settings.backendUrl]);

  async function saveUrl(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizeBackendUrl(urlInput);
    if (normalized === null) {
      setMessage({ kind: 'error', key: 'settings.urlInvalid' });
      return;
    }
    const saved = await update({ backendUrl: normalized });
    setUrlInput(normalized);
    setMessage(
      saved ? { kind: 'ok', key: 'settings.saved' } : { kind: 'error', key: 'settings.saveFailed' },
    );
  }

  return (
    <div className="screen">
      <h1>{t('settings.title')}</h1>

      <section className="card">
        <h2>{t('settings.account')}</h2>
        {!auth.configured && <p className="muted">{t('settings.accountNotConfigured')}</p>}
        {auth.configured && auth.session && (
          <>
            <p className="muted">{t('settings.signedInAs')}</p>
            <p>{auth.session.user.email}</p>
            <button type="button" className="btn" onClick={() => void auth.signOut()}>
              {t('settings.signOut')}
            </button>
          </>
        )}
      </section>

      <section className="card">
        <h2>{t('settings.language')}</h2>
        <select
          className="input"
          aria-label={t('settings.language')}
          value={settings.language}
          onChange={(event) => {
            const value = event.target.value;
            if (isLanguageSetting(value)) void update({ language: value });
          }}
        >
          <option value="auto">{t('language.auto')}</option>
          {LANGUAGES.map((language) => (
            <option key={language.id} value={language.id}>
              {language.nativeName}
            </option>
          ))}
        </select>
      </section>

      <form className="card" onSubmit={(event) => void saveUrl(event)}>
        <h2>{t('settings.backend')}</h2>
        <label htmlFor="backend-url" className="muted">
          {t('settings.backendLabel')}
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
          {t('settings.save')}
        </button>
        {message && (
          <p className={message.kind === 'ok' ? 'ok' : 'error-text'} role="status">
            {t(message.key)}
          </p>
        )}
      </form>

      <section className="card">
        <h2>{t('settings.appearance')}</h2>
        <p className="muted">{t('settings.theme')}</p>
        <div className="theme-grid" role="radiogroup" aria-label={t('settings.theme')}>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={settings.theme === theme.id}
              className="theme-option"
              onClick={() => void update({ theme: theme.id })}
            >
              <span
                className="swatch"
                style={{
                  background: `linear-gradient(135deg, ${theme.swatch[0]} 50%, ${theme.swatch[1]} 50%)`,
                }}
              />
              {t(`theme.${theme.id}`)}
            </button>
          ))}
        </div>
        <p className="muted">{t('settings.textSize')}</p>
        <div className="segmented" role="radiogroup" aria-label={t('settings.textSize')}>
          {FONT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={settings.fontSize === option.value}
              className={settings.fontSize === option.value ? 'active' : ''}
              onClick={() => void update({ fontSize: option.value })}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(event) => void update({ reduceMotion: event.target.checked })}
          />
          <span>{t('settings.reduceMotion')}</span>
        </label>
      </section>

      <section className="card">
        <h2>{t('settings.about')}</h2>
        <p className="muted">UknownCode AI v0.3.0</p>
      </section>
    </div>
  );
}
