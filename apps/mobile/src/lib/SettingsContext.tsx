import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  parseSettings,
  type AppSettings,
} from './settings';
import { getItem, setItem } from './storage';

interface SettingsContextValue {
  settings: AppSettings;
  loaded: boolean;
  /** Merges a patch, persists it, and returns false if persisting failed. */
  update: (patch: Partial<AppSettings>) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getItem(SETTINGS_KEY).then((raw) => {
      if (cancelled) return;
      setSettings(parseSettings(raw));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.fontSize = settings.fontSize;
    root.dataset.reduceMotion = String(settings.reduceMotion);
    root.dataset.theme = settings.theme;
  }, [settings.fontSize, settings.reduceMotion, settings.theme]);

  const update = useCallback(
    async (patch: Partial<AppSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      return setItem(SETTINGS_KEY, JSON.stringify(next));
    },
    [settings],
  );

  const value = useMemo(() => ({ settings, loaded, update }), [settings, loaded, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
