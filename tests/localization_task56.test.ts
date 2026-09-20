import { describe, expect, it } from 'vitest';
import { runtimeTranslations, translateRuntime } from '../src/config/runtimeTranslations';
import { formatUiDate, getUiLocale } from '../src/utils/localization';

describe('localization boundaries', () => {
  it('uses Arabic locale formatting without translating creator data', () => {
    expect(getUiLocale('ar')).toBe('ar-SA');
    expect(getUiLocale('en')).toBe('en-US');
    expect(formatUiDate('2026-01-02T00:00:00.000Z', 'ar')).toMatch(/[٠-٩]/);
    expect(formatUiDate('2026-01-02T00:00:00.000Z', 'en')).toMatch(/2026/);
    expect(translateRuntime('creator.example/مرحبا', 'ar')).toBe('creator.example/مرحبا');
  });

  it('keeps critical creator-flow UI messages translatable', () => {
    for (const key of ['Scheduled', 'Live scheduled', 'Pause track', 'Creator logo', 'Access code', 'Unlock', 'Add Calendly booking']) {
      expect(runtimeTranslations[key], key).toBeTruthy();
      expect(translateRuntime(key, 'ar')).not.toBe(key);
    }
  });
});
