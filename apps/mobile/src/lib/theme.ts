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
    statusBarColor: '#0b1220',
    dark: true,
    swatch: ['#0b1220', '#3b82f6'],
  },
  {
    id: 'gray',
    label: 'Abu-abu',
    description: 'Lembut, nyaman di mata',
    statusBarColor: '#24272c',
    dark: true,
    swatch: ['#24272c', '#7aa2d6'],
  },
  {
    id: 'light',
    label: 'Terang',
    description: 'Putih dengan aksen biru',
    statusBarColor: '#f4f7fc',
    dark: false,
    swatch: ['#f4f7fc', '#2563eb'],
  },
];

export const DEFAULT_THEME: ThemeId = 'blue';

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function getTheme(id: ThemeId): ThemeInfo {
  return THEMES.find((theme) => theme.id === id) ?? (THEMES[0] as ThemeInfo);
}
