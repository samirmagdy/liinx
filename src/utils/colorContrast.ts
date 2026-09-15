import type { ThemeConfig } from '../types';

const DARK_TEXT = '#181817';
const LIGHT_TEXT = '#FFFFFF';

function parseHex(value: string): [number, number, number] | null {
  const hex = value.trim().replace('#', '');
  if (!/^[\da-f]{3}([\da-f]{3})?$/i.test(hex)) return null;
  const expanded = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;
  return [0, 2, 4].map(index => parseInt(expanded.slice(index, index + 2), 16) / 255) as [number, number, number];
}

function luminance(value: string): number | null {
  const rgb = parseHex(value);
  if (!rgb) return null;
  return rgb.reduce((total, channel, index) => {
    const linear = channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return total + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}

export function contrastRatio(foreground: string, background: string): number | null {
  const foregroundLum = luminance(foreground);
  const backgroundLum = luminance(background);
  if (foregroundLum === null || backgroundLum === null) return null;
  const lighter = Math.max(foregroundLum, backgroundLum);
  const darker = Math.min(foregroundLum, backgroundLum);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Selects button/badge text that remains readable over a theme accent. */
export function getAccessibleTextColor(background: string, fallback: string = DARK_TEXT): string {
  const lightContrast = contrastRatio(LIGHT_TEXT, background);
  const darkContrast = contrastRatio(DARK_TEXT, background);
  if (lightContrast === null || darkContrast === null) return fallback;
  return lightContrast >= darkContrast ? LIGHT_TEXT : DARK_TEXT;
}

/** Normalizes creator-provided colors at render time so public pages stay readable. */
export function ensureThemeContrast(theme: ThemeConfig): ThemeConfig {
  const background = theme.bgColor;
  const cardBackground = theme.cardBg.startsWith('#') ? theme.cardBg : (theme.isDark ? '#1E293B' : '#FFFFFF');
  const readableText = contrastRatio(theme.textColor, background) !== null && contrastRatio(theme.textColor, background)! >= 4.5
    ? theme.textColor
    : (theme.isDark ? '#F8FAFC' : DARK_TEXT);
  const readableSubtext = contrastRatio(theme.subtextColor, background) !== null && contrastRatio(theme.subtextColor, background)! >= 4.5
    ? theme.subtextColor
    : (theme.isDark ? '#CBD5E1' : '#525252');
  const readableCardText = contrastRatio(theme.cardText, cardBackground) !== null && contrastRatio(theme.cardText, cardBackground)! >= 4.5
    ? theme.cardText
    : readableText;
  const readableAccent = contrastRatio(theme.accentColor, background) !== null && contrastRatio(theme.accentColor, background)! >= 3
    ? theme.accentColor
    : (theme.isDark ? '#38BDF8' : '#92400E');

  return { ...theme, textColor: readableText, subtextColor: readableSubtext, cardText: readableCardText, accentColor: readableAccent };
}
