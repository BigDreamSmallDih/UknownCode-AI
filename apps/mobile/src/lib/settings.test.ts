import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeBackendUrl, parseSettings } from './settings';

describe('normalizeBackendUrl', () => {
  it('accepts https URLs and strips trailing slashes', () => {
    expect(normalizeBackendUrl(' https://api.example.com/ ')).toBe('https://api.example.com');
  });

  it('accepts http only for localhost', () => {
    expect(normalizeBackendUrl('http://localhost:8080')).toBe('http://localhost:8080');
    expect(normalizeBackendUrl('http://example.com')).toBeNull();
  });

  it('treats empty input as "not configured"', () => {
    expect(normalizeBackendUrl('   ')).toBe('');
  });

  it('rejects garbage and credentials in the URL', () => {
    expect(normalizeBackendUrl('not a url')).toBeNull();
    expect(normalizeBackendUrl('https://user:pass@example.com')).toBeNull();
    expect(normalizeBackendUrl('ftp://example.com')).toBeNull();
  });
});

describe('parseSettings', () => {
  it('returns defaults for missing or corrupt data', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{not json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('42')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid fields and replaces invalid ones', () => {
    const parsed = parseSettings(
      JSON.stringify({
        backendUrl: 'http://evil.com',
        fontSize: 'lg',
        reduceMotion: 'yes',
        theme: 'neon',
        language: 'klingon',
        aiModel: 42,
        layout: 'tablet',
        autoUpdateCheck: 'sure',
      }),
    );
    expect(parsed).toEqual({
      backendUrl: '',
      fontSize: 'lg',
      reduceMotion: false,
      theme: 'blue',
      language: 'auto',
      aiModel: '',
      layout: 'auto',
      autoUpdateCheck: true,
    });
  });

  it('keeps a valid language and model', () => {
    const parsed = parseSettings(JSON.stringify({ language: 'ja', aiModel: 'vendor/model:free' }));
    expect(parsed.language).toBe('ja');
    expect(parsed.aiModel).toBe('vendor/model:free');
  });

  it('keeps a valid theme', () => {
    expect(parseSettings(JSON.stringify({ theme: 'gray' })).theme).toBe('gray');
    expect(parseSettings(JSON.stringify({ theme: 'light' })).theme).toBe('light');
  });
});
