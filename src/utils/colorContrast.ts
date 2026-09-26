import type { ThemeConfig } from '../types';
import { THEMES } from '../config/themes';

const DARK_TEXT = '#181817';
const LIGHT_TEXT = '#FFFFFF';

type Rgba = [number, number, number, number];

function parseColor(value: unknown): Rgba | null {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  const hex = input.replace(/^#/, '');
  if (/^[\da-f]{3}([\da-f]{3})?$/i.test(hex)) {
    const expanded = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;
    return [0, 2, 4].map(index => parseInt(expanded.slice(index, index + 2), 16) / 255).concat(1) as Rgba;
  }
  const rgba = input.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/i);
  if (!rgba) return null;
  const alpha = rgba[4] ? (rgba[4].endsWith('%') ? Number(rgba[4].slice(0, -1)) / 100 : Number(rgba[4])) : 1;
  return [Number(rgba[1]) / 255, Number(rgba[2]) / 255, Number(rgba[3]) / 255, Math.min(Math.max(alpha, 0), 1)];
}

function luminance(value: unknown): number | null {
  const rgb = parseColor(value);
  if (!rgb) return null;
  return rgb.reduce((total, channel, index) => {
    if (index === 3) return total;
    const linear = channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return total + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}

function compositeColor(foreground: string, background: string): string {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg || !bg || fg[3] >= 1) return foreground;
  const alpha = fg[3] + bg[3] * (1 - fg[3]);
  if (alpha <= 0) return background;
  const channels = [0, 1, 2].map(index => Math.round(((fg[index] * fg[3]) + (bg[index] * bg[3] * (1 - fg[3]))) / alpha * 255));
  return `rgb(${channels.join(', ')})`;
}

function extractGradientColors(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return [...value.matchAll(/#[\da-f]{3,8}\b|rgba?\([^)]*\)/gi)].map(match => match[0]);
}

function hasRequiredContrast(foreground: string, backgrounds: string[], minimum: number): boolean {
  return backgrounds.every(background => {
    const ratio = contrastRatio(foreground, background);
    return ratio !== null && ratio >= minimum;
  });
}

/** Returns the complete selected preset with creator overrides applied. */
export function resolveTheme(themeId?: string | null, customTheme?: Partial<ThemeConfig> | Record<string, unknown> | null): ThemeConfig {
  const preset = THEMES.find(theme => theme.id === themeId) || THEMES[0];
  const legacy = (customTheme || {}) as Partial<ThemeConfig> & Record<string, unknown>;
  const overrides = {
    ...legacy,
    bgColor: legacy.bgColor || legacy.background,
    cardBg: legacy.cardBg || legacy.surface,
    textColor: legacy.textColor || legacy.text,
    accentColor: legacy.accentColor || legacy.accent,
    cardRadius: legacy.cardRadius || legacy.radius
  };
  return ensureThemeContrast({ ...preset, ...overrides } as Partial<ThemeConfig>);
}

/** Extracts a valid color from a CSS border declaration without splitting rgba(). */
export function getBorderColor(border: unknown, fallback: string): string {
  if (typeof border !== 'string') return fallback;
  const match = border.trim().match(/^(?:\d+(?:\.\d+)?px|thin|medium|thick)\s+(?:none|hidden|solid|dashed|dotted|double|groove|ridge|inset|outset)\s+(.+)$/i);
  return match?.[1]?.trim() || fallback;
}

/** Builds a usable background declaration for solid, gradient, and mesh themes. */
export function getThemeBackground(theme: ThemeConfig): { backgroundColor: string; backgroundImage?: string } {
  const imageLayer = theme.backgroundImageUrl ? `url("${theme.backgroundImageUrl.replace(/"/g, '')}")` : undefined;
  if (theme.bgType === 'gradient' && theme.bgGradient) return { backgroundColor: theme.bgColor, backgroundImage: [theme.bgGradient, imageLayer].filter(Boolean).join(', ') || undefined };
  if (theme.bgType === 'mesh') {
    const color = theme.bgColor;
    return {
      backgroundColor: color,
      backgroundImage: [theme.bgGradient || `radial-gradient(circle at 20% 20%, ${color}, transparent 55%), radial-gradient(circle at 80% 80%, ${color}, transparent 55%)`, imageLayer].filter(Boolean).join(', ')
    };
  }
  return { backgroundColor: theme.bgColor, backgroundImage: imageLayer };
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
  const colorOr = (value: unknown, fallback: string) => typeof value === 'string' && parseColor(value) ? value.trim() : fallback;
  const gradientOr = (value: unknown, fallback?: string) => typeof value === 'string' && /^(?:linear|radial)-gradient\([^;{}]+\)$/i.test(value.trim()) ? value.trim() : fallback;
  const borderOr = (value: unknown, fallback: string) => typeof value === 'string' && /^(?:0|[1-9]\d*(?:\.\d+)?)px\s+(?:none|solid|dashed|dotted|double)\s+(?:#[\da-f]{3,8}|rgba?\([^)]*\))$/i.test(value.trim()) ? value.trim() : fallback;
  const isDark = typeof theme?.isDark === 'boolean' ? theme.isDark : false;
  const fallbackCardBackground = isDark ? '#1E293B' : '#FFFFFF';
  const safeTheme: ThemeConfig = {
    id: stringOr(theme?.id, 'safe-default'),
    name: stringOr(theme?.name, 'Safe Default'),
    bgType: theme?.bgType === 'gradient' || theme?.bgType === 'mesh' ? theme.bgType : 'solid',
    bgColor: colorOr(theme?.bgColor, '#FAF9F6'),
    bgGradient: gradientOr(theme?.bgGradient),
    backgroundImageUrl: typeof theme?.backgroundImageUrl === 'string' && theme.backgroundImageUrl.trim() ? theme.backgroundImageUrl.trim() : null,
    textColor: colorOr(theme?.textColor, DARK_TEXT),
    subtextColor: colorOr(theme?.subtextColor, '#525252'),
    cardBg: colorOr(theme?.cardBg, fallbackCardBackground),
    cardText: colorOr(theme?.cardText, isDark ? '#E2E8F0' : DARK_TEXT),
    cardBorder: borderOr(theme?.cardBorder, isDark ? '1px solid #334155' : '1px solid #E5E5E0'),
    cardHover: colorOr(theme?.cardHover, isDark ? '#273548' : '#F9FAFA'),
    cardRadius: theme?.cardRadius === 'none' || theme?.cardRadius === 'md' || theme?.cardRadius === 'full' ? theme.cardRadius : 'xl',
    shapeStyle: theme?.shapeStyle === 'organic' || theme?.shapeStyle === 'pill' || theme?.shapeStyle === 'cutout' ? theme.shapeStyle : 'soft',
    profileShape: theme?.profileShape === 'rounded' || theme?.profileShape === 'square' || theme?.profileShape === 'blob' ? theme.profileShape : 'circle',
    buttonStyle: theme?.buttonStyle === 'outline' || theme?.buttonStyle === 'ghost' ? theme.buttonStyle : 'fill',
    shadow: theme?.shadow === 'none' || theme?.shadow === 'md' || theme?.shadow === 'lg' ? theme.shadow : 'sm',
    accentColor: colorOr(theme?.accentColor, isDark ? '#38BDF8' : '#92400E'),
    fontFamily: theme?.fontFamily === 'display' || theme?.fontFamily === 'mono' ? theme.fontFamily : 'sans',
    isDark
  };

  const backgrounds = [safeTheme.bgColor, ...extractGradientColors(safeTheme.bgGradient)];
  const cardBackgrounds = backgrounds.map(background => compositeColor(safeTheme.cardBg, background));
  const readableText = hasRequiredContrast(safeTheme.textColor, backgrounds, 4.5)
    ? safeTheme.textColor
    : (safeTheme.isDark ? '#F8FAFC' : DARK_TEXT);
  const readableSubtext = hasRequiredContrast(safeTheme.subtextColor, backgrounds, 4.5)
    ? safeTheme.subtextColor
    : (safeTheme.isDark ? '#CBD5E1' : '#525252');
  const readableCardText = hasRequiredContrast(safeTheme.cardText, cardBackgrounds, 4.5)
    ? safeTheme.cardText
    : readableText;
  const readableAccent = hasRequiredContrast(safeTheme.accentColor, backgrounds, 3)
    ? safeTheme.accentColor
    : (safeTheme.isDark ? '#38BDF8' : '#92400E');

  return { ...safeTheme, textColor: readableText, subtextColor: readableSubtext, cardText: readableCardText, accentColor: readableAccent };
}
