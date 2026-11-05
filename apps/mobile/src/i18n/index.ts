import { de } from './messages/de';
import { en, type MessageKey, type Messages } from './messages/en';
import { es } from './messages/es';
import { fr } from './messages/fr';
import { id } from './messages/id';
import { ja } from './messages/ja';
import { ko } from './messages/ko';
import { zh } from './messages/zh';

export type { MessageKey } from './messages/en';

export type LanguageId = 'id' | 'en' | 'zh' | 'es' | 'fr' | 'de' | 'ja' | 'ko';
export type LanguageSetting = LanguageId | 'auto';

/** Names are written in each language itself so people can always find their own. */
export const LANGUAGES: ReadonlyArray<{ id: LanguageId; nativeName: string }> = [
  { id: 'id', nativeName: 'Bahasa Indonesia' },
  { id: 'en', nativeName: 'English' },
  { id: 'zh', nativeName: '中文（简体）' },
  { id: 'es', nativeName: 'Español' },
  { id: 'fr', nativeName: 'Français' },
  { id: 'de', nativeName: 'Deutsch' },
  { id: 'ja', nativeName: '日本語' },
  { id: 'ko', nativeName: '한국어' },
];

export const DEFAULT_LANGUAGE_SETTING: LanguageSetting = 'auto';

const CATALOGS: Record<LanguageId, Messages> = { id, en, zh, es, fr, de, ja, ko };

export function isLanguageSetting(value: unknown): value is LanguageSetting {
  return value === 'auto' || LANGUAGES.some((language) => language.id === value);
}

/**
 * Picks the language to show. An explicit choice wins; "auto" follows the first device locale
 * we support (matched by its primary subtag, e.g. "zh-CN" -> zh) and falls back to English.
 */
export function resolveLanguage(
  setting: LanguageSetting,
  deviceLocales: readonly string[],
): LanguageId {
  if (setting !== 'auto') return setting;
  for (const locale of deviceLocales) {
    const primary = locale.toLowerCase().split(/[-_]/)[0];
    const match = LANGUAGES.find((language) => language.id === primary);
    if (match) return match.id;
  }
  return 'en';
}

export type TranslateParams = Record<string, string | number>;

/** Looks up a message and fills {placeholders}. Falls back to English, then to the key. */
export function translate(lang: LanguageId, key: MessageKey, params?: TranslateParams): string {
  const template = CATALOGS[lang][key] ?? en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = params[name];
    return value === undefined ? whole : String(value);
  });
}

/** Exposed for tests: every catalog, keyed by language. */
export const ALL_CATALOGS: Readonly<Record<LanguageId, Messages>> = CATALOGS;
