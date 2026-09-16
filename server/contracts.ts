import { z } from 'zod';
import { bookingUrl } from '../src/utils/booking.js';
import { isHttpUrl, isSafeLinkUrl } from './utils/urlValidation.js';

/** Versioned wire/storage boundary for creator-owned content. */
export const CONTRACT_VERSION = 1 as const;

const MAX_URL = 2048;
const MAX_EXTRA_BYTES = 64 * 1024;
const RESERVED_KEYS = new Set([
  'id', 'type', 'profileid', 'profile_id', 'pageid', 'page_id',
  'owneruserid', 'owner_user_id', 'profileownership', 'pageownership',
  'position', 'createdat', 'updatedat', 'created_at', 'updated_at'
]);

function rejectReservedKeys(value: Record<string, unknown>, context: z.RefinementCtx) {
  for (const key of Object.keys(value)) {
    if (RESERVED_KEYS.has(key.toLowerCase())) {
      context.addIssue({ code: 'custom', path: [key], message: `The field ${key} is reserved.` });
    }
  }
}

const extraObject = (shape: z.ZodRawShape = {}) => z.object(shape).catchall(z.unknown()).superRefine(rejectReservedKeys);
const optionalHttpUrl = z.string().max(MAX_URL).refine(value => value === '' || isHttpUrl(value), 'Must be an HTTP(S) URL.').optional().nullable();
const optionalSafeUrl = z.string().max(MAX_URL).refine(value => value === '' || isSafeLinkUrl(value), 'Must use HTTP(S), mailto, or tel.').optional().nullable();
const shortText = z.string().max(500);
const itemId = z.string().min(1).max(100).optional();

const socialDomains: Record<string, string[]> = {
  instagram: ['instagram.com'], tiktok: ['tiktok.com'], youtube: ['youtube.com', 'youtu.be'],
  spotify: ['spotify.com'], twitter: ['twitter.com', 'x.com'], github: ['github.com'], linkedin: ['linkedin.com']
};

function hostnameMatches(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function validateSocialLink(value: { platform: string; url: string }, context: z.RefinementCtx) {
  const url = value.url.trim();
  if (value.platform === 'email') {
    if (!/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(url)) {
      context.addIssue({ code: 'custom', path: ['url'], message: 'Email links must use a valid mailto address.' });
    }
    return;
  }
  if (value.platform === 'phone') {
    const digits = url.replace(/\D/g, '');
    if (!/^tel:\+?[0-9][0-9 ()-]{3,24}$/i.test(url) || digits.length < 4) {
      context.addIssue({ code: 'custom', path: ['url'], message: 'Phone links must use a valid tel number.' });
    }
    return;
  }
  try {
    const parsed = new URL(url);
    const domains = socialDomains[value.platform] || [];
    if (!['http:', 'https:'].includes(parsed.protocol) || !domains.some(domain => hostnameMatches(parsed.hostname.toLowerCase(), domain))) {
      context.addIssue({ code: 'custom', path: ['url'], message: 'The URL does not match the selected social provider.' });
    }
  } catch {
    context.addIssue({ code: 'custom', path: ['url'], message: 'Enter a valid URL for the selected social provider.' });
  }
}

export const socialLinkSchema = z.object({
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'spotify', 'twitter', 'github', 'email', 'linkedin', 'phone']),
  url: z.string().trim().min(1).max(MAX_URL).refine(isSafeLinkUrl, 'Social links must use HTTP(S), mailto, or tel.')
}).strict().superRefine(validateSocialLink);

const socialsSchema = z.array(socialLinkSchema).max(20).superRefine((socials, context) => {
  const seen = new Set<string>();
  socials.forEach((social, index) => {
    const key = social.url.trim().toLowerCase();
    if (seen.has(key)) context.addIssue({ code: 'custom', path: [index, 'url'], message: 'Duplicate social links are not allowed.' });
    seen.add(key);
  });
});

/** Keep legacy malformed entries out of public output without deleting stored creator data. */
export function normalizePublicSocials(input: unknown): Array<{ platform: string; url: string }> {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  return input.flatMap(candidate => {
    const parsed = socialLinkSchema.safeParse(candidate);
    if (!parsed.success) return [];
    const key = parsed.data.url.toLowerCase();
    if (seen.has(key)) return [];
    seen.add(key);
    return [parsed.data];
  });
}

const folderItemSchema = z.object({
  id: itemId,
  title: z.string().min(1).max(150),
  url: z.string().max(MAX_URL).refine(isSafeLinkUrl, 'Folder links must use HTTP(S), mailto, or tel.'),
  subtitle: z.string().max(250).optional().nullable()
}).strict();

const formFieldSchema = z.object({
  name: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'Field names may use letters, numbers, underscores, and hyphens.'),
  label: z.string().min(1).max(120),
  type: z.enum(['text', 'email', 'tel', 'textarea']),
  required: z.boolean().optional()
}).strict();

const galleryItemSchema = z.object({
  id: itemId,
  imageUrl: z.string().max(MAX_URL).refine(value => value === '' || isHttpUrl(value) || /^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value), 'Images must use HTTP(S) or a valid upload path.'),
  alt: z.string().max(300).optional(),
  caption: z.string().max(500).optional(),
  title: z.string().max(150).optional()
}).strict();

const faqItemSchema = z.object({ id: itemId, question: z.string().min(1).max(300), answer: z.string().max(5000) }).strict();
const testimonialItemSchema = z.object({ id: itemId, quote: z.string().min(1).max(2000), name: z.string().max(150) }).strict();

export const blockTypeSchema = z.enum([
  'booking', 'link', 'header', 'audio', 'video', 'folder', 'newsletter', 'instagram_grid',
  'rich_text', 'image', 'gallery', 'spacer', 'carousel', 'form', 'download', 'map', 'faq',
  'testimonials', 'event', 'presave', 'phone', 'product', 'tips', 'content_gate'
]);
export type ContractBlockType = z.infer<typeof blockTypeSchema>;

export const blockExtraSchemas: Record<ContractBlockType, z.ZodTypeAny> = {
  booking: extraObject(),
  link: extraObject({
    layout: z.enum(['list', 'grid', 'featured']).optional(),
    animation: z.enum(['none', 'fade', 'lift', 'pulse']).optional()
  }),
  header: extraObject(),
  audio: extraObject({ artist: shortText.optional(), coverUrl: optionalHttpUrl, audioUrl: optionalHttpUrl, platform: z.enum(['spotify', 'soundcloud', 'apple']).optional() }),
  video: extraObject({ videoUrl: optionalHttpUrl, thumbnailUrl: optionalHttpUrl, platform: z.enum(['youtube', 'vimeo', 'tiktok']).optional() }),
  folder: extraObject({ subtitle: shortText.optional(), items: z.array(folderItemSchema).max(50).optional() }),
  newsletter: extraObject({ description: z.string().max(1000).optional(), buttonText: z.string().max(100).optional() }),
  instagram_grid: extraObject({ handle: z.string().max(100).optional(), posts: z.array(extraObject({ id: itemId, imageUrl: optionalHttpUrl, likes: z.string().max(50).optional(), linkUrl: optionalSafeUrl })).max(50).optional() }),
  rich_text: extraObject({ body: z.string().max(20000).optional() }),
  image: extraObject({ imageUrl: z.string().max(MAX_URL).refine(value => value === '' || isHttpUrl(value) || /^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value), 'Images must use HTTP(S) or a valid upload path.').optional(), alt: z.string().max(300).optional(), caption: z.string().max(500).optional() }),
  gallery: extraObject({ items: z.array(galleryItemSchema).max(50).optional() }),
  spacer: extraObject({ height: z.number().int().min(16).max(240).optional() }),
  carousel: extraObject({ items: z.array(galleryItemSchema).max(50).optional() }),
  form: extraObject({ description: z.string().max(1000).optional(), buttonText: z.string().max(100).optional(), fields: z.array(formFieldSchema).max(20).optional() }),
  download: extraObject({ fileUrl: optionalSafeUrl, downloadName: z.string().max(150).optional(), description: z.string().max(1000).optional() }),
  map: extraObject({ location: z.string().max(300).optional() }),
  faq: extraObject({ items: z.array(faqItemSchema).max(50).optional() }),
  testimonials: extraObject({ items: z.array(testimonialItemSchema).max(50).optional() }),
  event: extraObject({ date: z.string().max(100).optional(), url: optionalSafeUrl }),
  presave: extraObject({ url: optionalSafeUrl, description: z.string().max(1000).optional() }),
  phone: extraObject({ phone: z.string().max(40).optional(), description: z.string().max(1000).optional() }),
  product: extraObject({ price: z.string().max(50).optional(), url: optionalSafeUrl, description: z.string().max(1000).optional() }),
  tips: extraObject({ url: optionalSafeUrl, description: z.string().max(1000).optional() }),
  content_gate: extraObject({ password: z.string().max(128).optional(), passwordHash: z.string().max(200).optional(), description: z.string().max(1000).optional(), body: z.string().max(20000).optional(), locked: z.boolean().optional() })
};

const blockCreateEnvelope = z.object({
  type: blockTypeSchema,
  title: z.string().min(1, 'Title is required').max(150),
  url: z.string().max(MAX_URL).optional().nullable(),
  subtitle: z.string().max(250).optional().nullable(),
  badge: z.string().max(30).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  highlighted: z.boolean().optional(),
  startAt: z.number().finite().int().min(0).nullable().optional(),
  endAt: z.number().finite().int().min(0).nullable().optional(),
  pageId: z.string().min(1).max(100).optional(),
  extra: z.record(z.string(), z.unknown()).optional()
}).strict();

const blockUpdateEnvelope = blockCreateEnvelope.omit({ type: true, pageId: true }).strict();

function validatePurposefulUrl(type: ContractBlockType, value: string | null | undefined, context: z.RefinementCtx) {
  if (value == null || value === '') return;
  const valid = type === 'booking' ? Boolean(bookingUrl(value)) : isSafeLinkUrl(value);
  if (!valid) context.addIssue({ code: 'custom', path: ['url'], message: type === 'booking' ? 'A valid Calendly event URL is required.' : 'URL must use HTTP(S), mailto, or tel.' });
}

export const createBlockContract = blockCreateEnvelope.superRefine((value, context) => {
  validatePurposefulUrl(value.type, value.url, context);
  if (value.extra !== undefined) {
    const parsed = blockExtraSchemas[value.type].safeParse(value.extra);
    if (!parsed.success) context.addIssue({ code: 'custom', path: ['extra'], message: parsed.error.issues[0]?.message || 'Invalid block data.' });
  }
  if (value.startAt != null && value.endAt != null && value.endAt < value.startAt) context.addIssue({ code: 'custom', path: ['endAt'], message: 'End time must be after start time.' });
});
const updateBlockEnvelope = blockCreateEnvelope.omit({ type: true, pageId: true }).partial().extend({ revision: z.number().int().nonnegative().optional() }).strict();

function invalidContract(message: string, path: (string | number)[]) {
  return { success: false as const, error: new z.ZodError([{ code: 'custom', path, message }]) };
}

export function parseBlockContract(input: unknown, existingType?: ContractBlockType) {
  const raw = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
  const parsed = existingType
    ? updateBlockEnvelope.safeParse(input)
    : createBlockContract.safeParse(input);
  if (!parsed.success) return parsed;
  const type = existingType || (raw.type as ContractBlockType);
  const extra = raw.extra === undefined ? undefined : blockExtraSchemas[type].safeParse(raw.extra);
  if (extra && !extra.success) return extra;
  if (existingType && raw.url !== undefined) {
    const url = typeof raw.url === 'string' || raw.url === null ? raw.url : undefined;
    if (url !== undefined && url !== null && url !== '' && (existingType === 'booking' ? !bookingUrl(url) : !isSafeLinkUrl(url))) {
      return invalidContract(existingType === 'booking' ? 'A valid Calendly event URL is required.' : 'URL must use HTTP(S), mailto, or tel.', ['url']);
    }
  }
  if (existingType && raw.startAt != null && raw.endAt != null && typeof raw.startAt === 'number' && typeof raw.endAt === 'number' && raw.endAt < raw.startAt) {
    return invalidContract('End time must be after start time.', ['endAt']);
  }
  return { success: true as const, data: { ...parsed.data, ...(extra ? { extra: extra.data } : {}), contractVersion: CONTRACT_VERSION, type } };
}

export function normalizeBlockExtra(type: string, input: unknown): Record<string, unknown> {
  const schema = blockExtraSchemas[type as ContractBlockType];
  if (!schema) return {};
  const parsed = schema.safeParse(input || {});
  if (!parsed.success) return {};
  const value = Object.fromEntries(Object.entries(parsed.data));
  if (JSON.stringify(value).length > MAX_EXTRA_BYTES) return {};
  delete value.id;
  delete value.type;
  delete value.profileId;
  delete value.profile_id;
  delete value.pageId;
  delete value.page_id;
  delete value.position;
  if (type === 'content_gate') {
    delete value.body;
    delete value.password;
    delete value.passwordHash;
    value.locked = true;
  }
  return value;
}

export const pageContract = z.object({
  slug: z.string().trim().min(1).max(40).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Page slug may only contain lowercase letters, numbers, and hyphens.'),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).nullable().optional(),
  published: z.boolean().optional()
}).strict();
export const pageUpdateContract = pageContract.partial().extend({ sortOrder: z.number().int().min(0).optional(), revision: z.number().int().nonnegative().optional() }).strict();

const uploadPath = z.string().regex(/^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Must be a valid upload path.');
const mediaUrl = z.union([uploadPath, z.string().max(500).refine(isHttpUrl, 'Background media must use HTTP(S) or a valid upload path.')]);
export function isSafeCreatorCss(value: string | null | undefined): boolean {
  if (!value) return true;
  if (value.length > 10000 || /(?:@import|expression\s*\(|behavior\s*:|javascript\s*:|url\s*\(|@(?:keyframes|font-face)|position\s*:\s*(?:fixed|absolute|sticky)|z-index\s*:|pointer-events\s*:|display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0)/i.test(value)) return false;
  const withoutComments = value.replace(/\/\*[\s\S]*?\*\//g, '');
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
  } catch { return false; }
};
const presetThemeIds = ['editorial-stone', 'obsidian-noir', 'tokyo-cyber', 'nordic-minimal', 'sunset-amber', 'velvet-plum', 'brutalist-mono', 'forest-canopy', 'coral-reef', 'midnight-ink', 'sahara-dune', 'elena-rostova'] as const;
const cssColor = z.string().trim().regex(/^(?:#[\da-f]{3,8}|rgba?\(\s*[\d.]+[\s,]+[\d.]+[\s,]+[\d.]+(?:[\s,/]\s*[\d.]+%?)?\s*\))$/i, 'Use a valid hex or rgb color.');
const cssGradient = z.string().trim().max(500).regex(/^(?:linear|radial)-gradient\([^;{}]+\)$/i, 'Only safe CSS gradients are supported.');
const borderValue = z.string().trim().regex(/^(?:0|[1-9]\d*(?:\.\d+)?)px\s+(?:none|solid|dashed|dotted|double)\s+(?:#[\da-f]{3,8}|rgba?\([^)]*\))$/i, 'Use a simple color border declaration.');
const customThemeSchema = z.object({
  id: z.string().max(80).optional(), name: z.string().max(100).optional(),
  bgType: z.enum(['solid', 'gradient', 'mesh']).optional(), bgColor: cssColor.optional(),
  bgGradient: cssGradient.optional(), cardBg: cssColor.optional(),
  textColor: cssColor.optional(), subtextColor: cssColor.optional(),
  mutedColor: cssColor.optional(), cardText: cssColor.optional(),
  cardBorder: borderValue.optional(), cardHover: cssColor.optional(),
  accentColor: cssColor.optional(), cardRadius: z.enum(['none', 'md', 'xl', 'full']).optional(),
  buttonStyle: z.enum(['fill', 'outline', 'ghost']).optional(), shadow: z.enum(['none', 'sm', 'md', 'lg']).optional(),
  fontFamily: z.enum(['sans', 'display', 'mono']).optional(), isDark: z.boolean().optional(),
  background: cssColor.optional(), surface: cssColor.optional(), text: cssColor.optional(), accent: cssColor.optional(), radius: z.enum(['none', 'md', 'xl', 'full']).optional()
}).strict();
export const profileUpdateContract = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Username may only contain lowercase letters, numbers, and underscores.').optional(),
  displayName: z.string().trim().min(1).max(100).optional(), bio: z.string().trim().max(500).optional(),
  avatarUrl: z.union([uploadPath, z.string().max(MAX_URL).refine(isHttpUrl, 'Avatar must use HTTP(S) or a valid upload path.')]).optional(),
  category: z.string().trim().max(50).optional(), themeId: z.enum(presetThemeIds).optional(), hideBranding: z.boolean().optional(),
  gaMeasurementId: z.string().max(50).nullable().optional(), metaPixelId: z.string().max(50).nullable().optional(),
  customDomain: z.string().max(100).nullable().optional(), customCss: z.string().max(10000).refine(isSafeCreatorCss, 'Custom CSS must be scoped to the public page and cannot hide controls or load external content.').nullable().optional(),
  customFontUrl: z.string().max(300).refine(googleFontStylesheet, 'Custom fonts must use an HTTPS Google Fonts stylesheet URL.').nullable().optional(),
  shareTitle: z.string().max(160).nullable().optional(), shareDescription: z.string().max(300).nullable().optional(),
  shareImageUrl: z.string().max(500).refine(isHttpUrl, 'Share image must use HTTP(S).').nullable().optional(),
  footerLogoUrl: z.string().max(500).refine(isHttpUrl, 'Footer logo must use HTTP(S).').nullable().optional(),
  backgroundMediaUrl: mediaUrl.nullable().optional(),
  backgroundMediaType: z.enum(['image', 'video']).nullable().optional(),
  pageRedirectUrl: z.string().max(500).refine(isHttpUrl, 'Redirect URL must use HTTP(S).').nullable().optional(),
  pageRedirectUntil: z.number().int().positive().nullable().optional(),
  customTheme: customThemeSchema.optional(),
  socials: socialsSchema.optional(),
  revision: z.number().int().nonnegative().optional()
}).strict();
