import { useEffect, useState } from 'react';
import { useSettings } from './SettingsContext';

export type LayoutSetting = 'auto' | 'phone' | 'desktop';
export type LayoutMode = 'phone' | 'desktop';

/** Wide enough for a side rail and two panes. */
export const DESKTOP_MIN_WIDTH = 900;

const LAYOUT_SETTINGS: readonly LayoutSetting[] = ['auto', 'phone', 'desktop'];

export function isLayoutSetting(value: unknown): value is LayoutSetting {
  return LAYOUT_SETTINGS.includes(value as LayoutSetting);
}

/** "auto" follows the window width; an explicit choice always wins. */
export function resolveLayout(setting: LayoutSetting, width: number): LayoutMode {
  if (setting === 'phone') return 'phone';
  if (setting === 'desktop') return 'desktop';
  return width >= DESKTOP_MIN_WIDTH ? 'desktop' : 'phone';
}

/** Current layout mode. Also mirrors it to <html data-layout> so CSS can react to it. */
export function useLayoutMode(): LayoutMode {
  const { settings } = useSettings();
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const mode = resolveLayout(settings.layout, width);
  useEffect(() => {
    document.documentElement.dataset.layout = mode;
  }, [mode]);
  return mode;
}
