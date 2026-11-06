import type { LanguageId } from '../index';

type Others = Exclude<LanguageId, 'en'>;

/**
 * Declares one feature's strings. English defines the keys; every other language must provide
 * exactly the same keys (checked by the compiler and by index.test.ts).
 * Keys must be prefixed with the part's own namespace (e.g. "workspace.") so parts never collide.
 */
export function defineMessages<const E extends Record<string, string>>(
  catalogs: { en: E } & Record<Others, Record<keyof E, string>>,
): { en: E } & Record<Others, Record<keyof E, string>> {
  return catalogs;
}
