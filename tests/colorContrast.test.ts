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
});
