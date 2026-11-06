import { describe, expect, it } from 'vitest';
import { DESKTOP_MIN_WIDTH, isLayoutSetting, resolveLayout } from './layout';

describe('resolveLayout', () => {
  it('follows the width when automatic', () => {
    expect(resolveLayout('auto', DESKTOP_MIN_WIDTH - 1)).toBe('phone');
    expect(resolveLayout('auto', DESKTOP_MIN_WIDTH)).toBe('desktop');
  });
  it('lets an explicit choice win', () => {
    expect(resolveLayout('phone', 2000)).toBe('phone');
    expect(resolveLayout('desktop', 300)).toBe('desktop');
  });
  it('validates settings', () => {
    expect(isLayoutSetting('auto')).toBe(true);
    expect(isLayoutSetting('tablet')).toBe(false);
  });
});
