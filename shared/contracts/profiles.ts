import { z } from 'zod';
import { isHttpUrl } from './urlValidation.js';
import { socialsSchema, MAX_URL } from './blocks.js';

export const pageContract = z.object({
  slug: z.string().trim().min(1).max(40).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Page slug may only contain lowercase letters, numbers, and hyphens.'),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).nullable().optional(),
  published: z.boolean().optional()
}).strict();

export const pageUpdateContract = pageContract.partial().extend({
  sortOrder: z.number().int().min(0).optional(),
  revision: z.number().int().nonnegative().optional()
}).strict();

const uploadPath = z.string().regex(/^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Must be a valid upload path.');
const mediaUrl = z.union([uploadPath, z.string().max(500).refine(isHttpUrl, 'Background media must use HTTP(S) or a valid upload path.')]);

export function isSafeCreatorCss(value: string | null | undefined): boolean {
  if (!value) return true;
  if (value.length > 10000 || /[<>]|(?:<\/?(?:style|script|html|body)\b)|(?:@import|expression\s*\(|behavior\s*:|javascript\s*:|url\s*\(|@(?:keyframes|font-face)|position\s*:\s*(?:fixed|absolute|sticky)|z-index\s*:|pointer-events\s*:|display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0)/i.test(value)) return false;
  const withoutComments = value.replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  for (const character of withoutComments) {
    if (character === '{') depth += 1;
    if (character === '}') depth -= 1;
    if (depth < 0) return false;
  }
  if (depth !== 0) return false;
  return withoutComments.split('{').slice(0, -1).every(selector => {
    const trimmed = selector.trim();
    return !trimmed || trimmed.startsWith('@media') || trimmed.startsWith('@supports') || trimmed.split(',').every(part => part.trim().startsWith('#public-bio-view'));
  });
}

const googleFontStylesheet = (value: unknown) => {
  if (value === null || value === undefined || value === '') return true;
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && (parsed.hostname === 'fonts.googleapis.com' || parsed.hostname.endsWith('.fonts.googleapis.com'));
  } catch {
    return false;
  }
};

export const presetThemeIds = ['editorial-stone', 'obsidian-noir', 'tokyo-cyber', 'nordic-minimal', 'sunset-amber', 'velvet-plum', 'brutalist-mono', 'forest-canopy', 'coral-reef', 'midnight-ink', 'sahara-dune', 'elena-rostova'] as const;

export const cssColor = z.string().trim().regex(/^(?:#[\da-f]{3,8}|rgba?\(\s*[\d.]+[\s,]+[\d.]+[\s,]+[\d.]+(?:[\s,/]\s*[\d.]+%?)?\s*\))$/i, 'Use a valid hex or rgb color.');
export const cssGradient = z.string().trim().max(500).regex(/^(?:linear|radial)-gradient\([^;{}]+\)$/i, 'Only safe CSS gradients are supported.');
export const borderValue = z.string().trim().regex(/^(?:0|[1-9]\d*(?:\.\d+)?)px\s+(?:none|solid|dashed|dotted|double)\s+(?:#[\da-f]{3,8}|rgba?\([^)]*\))$/i, 'Use a simple color border declaration.');

export const customThemeSchema = z.object({
  id: z.string().max(80).optional(),
  name: z.string().max(100).optional(),
  bgType: z.enum(['solid', 'gradient', 'mesh']).optional(),
  bgColor: cssColor.optional(),
  bgGradient: cssGradient.optional(),
  cardBg: cssColor.optional(),
  textColor: cssColor.optional(),
  subtextColor: cssColor.optional(),
  mutedColor: cssColor.optional(),
  cardText: cssColor.optional(),
  cardBorder: borderValue.optional(),
  cardHover: cssColor.optional(),
  accentColor: cssColor.optional(),
  cardRadius: z.enum(['none', 'md', 'xl', 'full']).optional(),
  buttonStyle: z.enum(['fill', 'outline', 'ghost']).optional(),
  shadow: z.enum(['none', 'sm', 'md', 'lg']).optional(),
  fontFamily: z.enum(['sans', 'display', 'mono']).optional(),
  isDark: z.boolean().optional(),
  background: cssColor.optional(),
  surface: cssColor.optional(),
  text: cssColor.optional(),
  accent: cssColor.optional(),
  radius: z.enum(['none', 'md', 'xl', 'full']).optional()
}).strict();

export const profileUpdateContract = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Username may only contain lowercase letters, numbers, and underscores.').optional(),
  displayName: z.string().trim().min(1).max(100).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.union([uploadPath, z.string().max(MAX_URL).refine(isHttpUrl, 'Avatar must use HTTP(S) or a valid upload path.')]).optional(),
  category: z.string().trim().max(50).optional(),
  themeId: z.enum(presetThemeIds).optional(),
  hideBranding: z.boolean().optional(),
  gaMeasurementId: z.string().trim().regex(/^G-[A-Z0-9]{4,30}$/i, 'Use a valid GA4 Measurement ID such as G-XXXXXXXXXX.').nullable().optional(),
  metaPixelId: z.string().trim().regex(/^[0-9]{5,20}$/, 'Use a valid numeric Meta Pixel ID.').nullable().optional(),
  customDomain: z.string().max(100).nullable().optional(),
  customCss: z.string().max(10000).refine(isSafeCreatorCss, 'Custom CSS must be scoped to the public page and cannot hide controls or load external content.').nullable().optional(),
  customFontUrl: z.string().max(300).refine(googleFontStylesheet, 'Custom fonts must use an HTTPS Google Fonts stylesheet URL.').nullable().optional(),
  shareTitle: z.string().max(160).nullable().optional(),
  shareDescription: z.string().max(300).nullable().optional(),
  shareImageUrl: z.string().max(500).refine(isHttpUrl, 'Share image must use HTTP(S).').nullable().optional(),
  footerLogoUrl: z.string().max(500).refine(isHttpUrl, 'Footer logo must use HTTP(S).').nullable().optional(),
  footerLogoLink: z.string().max(500).refine(isHttpUrl, 'Footer logo destination must use HTTP(S).').nullable().optional(),
  footerLogoAlt: z.string().trim().max(120).nullable().optional(),
  backgroundMediaUrl: mediaUrl.nullable().optional(),
  backgroundMediaType: z.enum(['image', 'video']).nullable().optional(),
  pageRedirectUrl: z.string().max(500).refine(isHttpUrl, 'Redirect URL must use HTTP(S).').nullable().optional(),
  pageRedirectUntil: z.number().int().positive().nullable().optional(),
  customTheme: customThemeSchema.optional(),
  socials: socialsSchema.optional(),
  revision: z.number().int().nonnegative().optional()
}).strict();
