import { describe, expect, it } from 'vitest';
import { ALL_CATALOGS, LANGUAGES, isLanguageSetting, resolveLanguage, translate } from './index';

const placeholders = (text: string): string[] =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? '').sort();

describe('catalogs', () => {
  const english = ALL_CATALOGS.en;
  const keys = Object.keys(english) as Array<keyof typeof english>;

  it('has a catalog for every listed language', () => {
    for (const language of LANGUAGES) {
      expect(ALL_CATALOGS[language.id]).toBeDefined();
    }
  });

  it.each(LANGUAGES.map((language) => language.id))(
    '%s has the same keys, no empty values, and the same placeholders as English',
    (lang) => {
      const catalog = ALL_CATALOGS[lang];
      expect(Object.keys(catalog).sort()).toEqual([...keys].sort());
      for (const key of keys) {
        expect(catalog[key].trim(), `${lang}:${key}`).not.toBe('');
        expect(placeholders(catalog[key]), `${lang}:${key}`).toEqual(placeholders(english[key]));
      }
    },
  );
});

describe('resolveLanguage', () => {
  it('honours an explicit choice', () => {
    expect(resolveLanguage('ja', ['de-DE'])).toBe('ja');
  });

  it('follows the first supported device locale when automatic', () => {
    expect(resolveLanguage('auto', ['pt-BR', 'zh-CN', 'en-US'])).toBe('zh');
    expect(resolveLanguage('auto', ['id-ID'])).toBe('id');
  });

  it('falls back to English', () => {
    expect(resolveLanguage('auto', ['pt-BR', 'ru'])).toBe('en');
    expect(resolveLanguage('auto', [])).toBe('en');
  });
});

describe('translate', () => {
  it('fills placeholders', () => {
    expect(translate('en', 'home.connected', { ms: 42 })).toBe('Connected · 42 ms');
    expect(translate('id', 'err.shortPassword', { min: 8 })).toBe('Kata sandi minimal 8 karakter.');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(translate('en', 'home.connected', {})).toBe('Connected · {ms} ms');
  });
});

describe('isLanguageSetting', () => {
  it('accepts auto and supported ids only', () => {
    expect(isLanguageSetting('auto')).toBe(true);
    expect(isLanguageSetting('ko')).toBe(true);
    expect(isLanguageSetting('xx')).toBe(false);
    expect(isLanguageSetting(5)).toBe(false);
  });
});
