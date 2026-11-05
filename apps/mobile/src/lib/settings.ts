export type FontSize = 'sm' | 'md' | 'lg';

export interface AppSettings {
  /** Base URL of the UknownCode backend, e.g. https://uknowncode-backend.onrender.com */
  backendUrl: string;
  fontSize: FontSize;
  reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  backendUrl: '',
  fontSize: 'md',
  reduceMotion: false,
};

export const SETTINGS_KEY = 'uknowncode.settings.v1';

const FONT_SIZES: readonly FontSize[] = ['sm', 'md', 'lg'];

/**
 * Validates a backend URL. Only https is allowed, except http for localhost
 * (development). Returns the normalized URL (no trailing slash) or null if invalid.
 * An empty string is valid and means "not configured".
 */
export function normalizeBackendUrl(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed === '') return '';
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) return null;
  if (url.username || url.password) return null;
  return url.origin + url.pathname.replace(/\/+$/, '');
}

/** Parses stored JSON into valid settings. Unknown or invalid fields fall back to defaults. */
export function parseSettings(raw: string | null): AppSettings {
  if (!raw) return { ...DEFAULT_SETTINGS };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  if (typeof data !== 'object' || data === null) return { ...DEFAULT_SETTINGS };
  const record = data as Record<string, unknown>;

  const backendUrl =
    typeof record.backendUrl === 'string'
      ? (normalizeBackendUrl(record.backendUrl) ?? DEFAULT_SETTINGS.backendUrl)
      : DEFAULT_SETTINGS.backendUrl;
  const fontSize = FONT_SIZES.find((size) => size === record.fontSize) ?? DEFAULT_SETTINGS.fontSize;
  const reduceMotion =
    typeof record.reduceMotion === 'boolean' ? record.reduceMotion : DEFAULT_SETTINGS.reduceMotion;

  return { backendUrl, fontSize, reduceMotion };
}
