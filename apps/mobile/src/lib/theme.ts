export type ThemeId = 'blue' | 'gray' | 'light';

export interface ThemeInfo {
  id: ThemeId;
  label: string;
  description: string;
  /** Status bar background; must match --bg of the theme in styles.css. */
  statusBarColor: string;
  /** True when the theme background is dark (status bar gets light icons). */
  dark: boolean;
  /** Swatch colors shown in the picker: [background, accent]. */
  swatch: readonly [string, string];
}

export const THEMES: readonly ThemeInfo[] = [
  {
    id: 'blue',
    label: 'Biru',
    description: 'Gelap dengan aksen biru',
    statusBarColor: '#081a33',
    dark: true,
    swatch: ['#081a33', '#5aa9ff'],
  },
  {
    id: 'gray',
    label: 'Abu-abu',
    description: 'Lembut, nyaman di mata',
    statusBarColor: '#1f2226',
    dark: true,
    swatch: ['#1f2226', '#79aef0'],
  },
  {
    id: 'light',
    label: 'Terang',
    description: 'Putih dengan aksen biru',
    statusBarColor: '#f3f7ff',
    dark: false,
    swatch: ['#f3f7ff', '#1459e6'],
  },
];

export const DEFAULT_THEME: ThemeId = 'blue';

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function getTheme(id: ThemeId): ThemeInfo {
  return THEMES.find((theme) => theme.id === id) ?? (THEMES[0] as ThemeInfo);
}
