import { describe, expect, it } from 'vitest';
import { ensureThemeContrast } from '../src/utils/colorContrast';

describe('theme contrast normalization', () => {
  it('fills missing legacy custom-theme fields without throwing', () => {
    const theme = ensureThemeContrast({ bgColor: '#0F172A', isDark: true });

    expect(theme.cardBg).toBe('#1E293B');
    expect(theme.cardText).toBeDefined();
    expect(theme.accentColor).toBeDefined();
  });

  it('preserves valid custom theme fields', () => {
    const theme = ensureThemeContrast({
      id: 'custom',
      name: 'Custom',
      bgType: 'solid',
      bgColor: '#FFFFFF',
      textColor: '#181817',
      cardBg: '#F5F5F5',
      cardText: '#181817',
      accentColor: '#92400E',
      isDark: false
    });

    expect(theme.id).toBe('custom');
    expect(theme.cardBg).toBe('#F5F5F5');
    expect(theme.accentColor).toBe('#92400E');
  });

  it('falls back safely for malformed runtime values from persisted JSON', () => {
    const theme = ensureThemeContrast({
      bgColor: { bad: true } as unknown as string,
      cardBg: null as unknown as string,
      cardBorder: 42 as unknown as string,
      textColor: ['#fff'] as unknown as string,
      isDark: 'yes' as unknown as boolean
    });

    expect(theme.bgColor).toBe('#FAF9F6');
    expect(theme.cardBg).toBe('#FFFFFF');
    expect(theme.cardBorder).toBe('1px solid #E5E5E0');
    expect(theme.textColor).toBe('#181817');
  });
});
