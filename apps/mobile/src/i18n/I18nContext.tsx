import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useSettings } from '../lib/SettingsContext';
import { resolveLanguage, translate, type LanguageId, type MessageKey, type TranslateParams } from './index';

interface I18nValue {
  lang: LanguageId;
  t: (key: MessageKey, params?: TranslateParams) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();

  const lang = useMemo(
    () => resolveLanguage(settings.language, navigator.languages ?? [navigator.language]),
    [settings.language],
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: MessageKey, params?: TranslateParams) => translate(lang, key, params),
    [lang],
  );

  const value = useMemo(() => ({ lang, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
