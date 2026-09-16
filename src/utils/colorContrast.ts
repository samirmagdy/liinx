import type { ThemeConfig } from '../types';

const DARK_TEXT = '#181817';
const LIGHT_TEXT = '#FFFFFF';

function parseHex(value: unknown): [number, number, number] | null {
  if (typeof value !== 'string') return null;
  const hex = value.trim().replace('#', '');
  if (!/^[\da-f]{3}([\da-f]{3})?$/i.test(hex)) return null;
  const expanded = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;
  return [0, 2, 4].map(index => parseInt(expanded.slice(index, index + 2), 16) / 255) as [number, number, number];
}

function luminance(value: unknown): number | null {
  const rgb = parseHex(value);
  if (!rgb) return null;
  return rgb.reduce((total, channel, index) => {
    const linear = channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return total + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}

export function contrastRatio(foreground: unknown, background: unknown): number | null {
  const foregroundLum = luminance(foreground);
  const backgroundLum = luminance(background);
  if (foregroundLum === null || backgroundLum === null) return null;
  const lighter = Math.max(foregroundLum, backgroundLum);
  const darker = Math.min(foregroundLum, backgroundLum);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Selects button/badge text that remains readable over a theme accent. */
export function getAccessibleTextColor(background: unknown, fallback: string = DARK_TEXT): string {
  const lightContrast = contrastRatio(LIGHT_TEXT, background);
  const darkContrast = contrastRatio(DARK_TEXT, background);
  if (lightContrast === null || darkContrast === null) return fallback;
  return lightContrast >= darkContrast ? LIGHT_TEXT : DARK_TEXT;
}

/** Normalizes creator-provided colors at render time so public pages stay readable. */
export function ensureThemeContrast(theme: Partial<ThemeConfig> | null | undefined): ThemeConfig {
  const stringOr = (value: unknown, fallback: string) => typeof value === 'string' && value.trim() ? value : fallback;
  const isDark = typeof theme?.isDark === 'boolean' ? theme.isDark : false;
  const fallbackCardBackground = isDark ? '#1E293B' : '#FFFFFF';
  const safeTheme: ThemeConfig = {
    id: stringOr(theme?.id, 'safe-default'),
    name: stringOr(theme?.name, 'Safe Default'),
    bgType: theme?.bgType === 'gradient' || theme?.bgType === 'mesh' ? theme.bgType : 'solid',
    bgColor: stringOr(theme?.bgColor, '#FAF9F6'),
    bgGradient: typeof theme?.bgGradient === 'string' ? theme.bgGradient : undefined,
    textColor: stringOr(theme?.textColor, DARK_TEXT),
    subtextColor: stringOr(theme?.subtextColor, '#525252'),
    cardBg: stringOr(theme?.cardBg, fallbackCardBackground),
    cardText: stringOr(theme?.cardText, isDark ? '#E2E8F0' : DARK_TEXT),
    cardBorder: stringOr(theme?.cardBorder, isDark ? '1px solid #334155' : '1px solid #E5E5E0'),
    cardHover: stringOr(theme?.cardHover, isDark ? '#273548' : '#F9FAFA'),
    cardRadius: theme?.cardRadius === 'none' || theme?.cardRadius === 'md' || theme?.cardRadius === 'full' ? theme.cardRadius : 'xl',
    accentColor: stringOr(theme?.accentColor, isDark ? '#38BDF8' : '#92400E'),
    fontFamily: theme?.fontFamily === 'display' || theme?.fontFamily === 'mono' ? theme.fontFamily : 'sans',
    isDark
  };

  const background = safeTheme.bgColor;
  const cardBackground = safeTheme.cardBg.startsWith('#') ? safeTheme.cardBg : fallbackCardBackground;
  const readableText = contrastRatio(safeTheme.textColor, background) !== null && contrastRatio(safeTheme.textColor, background)! >= 4.5
    ? safeTheme.textColor
    : (safeTheme.isDark ? '#F8FAFC' : DARK_TEXT);
  const readableSubtext = contrastRatio(safeTheme.subtextColor, background) !== null && contrastRatio(safeTheme.subtextColor, background)! >= 4.5
    ? safeTheme.subtextColor
    : (safeTheme.isDark ? '#CBD5E1' : '#525252');
  const readableCardText = contrastRatio(safeTheme.cardText, cardBackground) !== null && contrastRatio(safeTheme.cardText, cardBackground)! >= 4.5
    ? safeTheme.cardText
    : readableText;
  const readableAccent = contrastRatio(safeTheme.accentColor, background) !== null && contrastRatio(safeTheme.accentColor, background)! >= 3
    ? safeTheme.accentColor
    : (safeTheme.isDark ? '#38BDF8' : '#92400E');

  return { ...safeTheme, textColor: readableText, subtextColor: readableSubtext, cardText: readableCardText, accentColor: readableAccent };
}
