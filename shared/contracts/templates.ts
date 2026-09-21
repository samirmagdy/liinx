import { z } from 'zod';
import { blockExtraSchemas, MAX_URL, normalizeBlockExtra, normalizeFormFields, type ContractBlockType } from './blocks.js';
import { isSafeLinkUrl } from './urlValidation.js';
import { pageContract, presetThemeIds } from './profiles.js';

/**
 * Starter scaffolding may only use block types that render honestly with placeholder copy.
 * Media blocks need real files, content gates need an access code, downloads need an uploaded
 * file, and testimonials/events/products would publish invented quotes, dates, or prices — so a
 * template cannot express them at all.
 */
export const TEMPLATE_ALLOWED_BLOCK_TYPES = [
  'link', 'header', 'folder', 'rich_text', 'spacer', 'newsletter', 'form', 'faq'
] as const satisfies readonly ContractBlockType[];

export const templateBlockTypeSchema = z.enum(TEMPLATE_ALLOWED_BLOCK_TYPES);

/** The disciplines signup collects. A starter site recommends itself through this id. */
export const SIGNUP_INTENTS = ['creator', 'photographer', 'musician', 'developer', 'coach', 'business'] as const;

export const signupIntentSchema = z.enum(SIGNUP_INTENTS);

export type SignupIntent = z.infer<typeof signupIntentSchema>;

/** What an account is filed under when its owner picks a discipline but no starter site. */
export const SIGNUP_INTENT_CATEGORIES: Record<SignupIntent, string> = {
  creator: 'Creator',
  photographer: 'Design & Art',
  musician: 'Musicians',
  developer: 'Tech & Design',
  coach: 'Wellness',
  business: 'Business'
};

export function intentStartingCategory(intent: unknown): string | undefined {
  const parsed = signupIntentSchema.safeParse(intent);
  return parsed.success ? SIGNUP_INTENT_CATEGORIES[parsed.data] : undefined;
}

export const templateBlockSchema = z.object({
  type: templateBlockTypeSchema,
  title: z.string().trim().min(1).max(150),
  url: z.string().max(MAX_URL).optional().nullable(),
  subtitle: z.string().max(250).optional().nullable(),
  badge: z.string().max(30).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  highlighted: z.boolean().optional(),
  /** Target page by slug. Omitted means the profile's home page. */
  page: pageContract.shape.slug.optional(),
  extra: z.record(z.string(), z.unknown()).optional()
}).strict().superRefine((value, context) => {
  if (value.url && !isSafeLinkUrl(value.url)) {
    context.addIssue({ code: 'custom', path: ['url'], message: 'Template links must use HTTP(S), mailto, or tel.' });
  }
  if (value.extra !== undefined) {
    const parsed = blockExtraSchemas[value.type].safeParse(value.extra);
    if (!parsed.success) {
      context.addIssue({ code: 'custom', path: ['extra'], message: parsed.error.issues[0]?.message || 'Invalid template block data.' });
    }
  }
});

export const templatePageSchema = pageContract.omit({ published: true });

export const siteTemplateSchema = z.object({
  id: z.string().regex(/^tmpl-[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/, 'Template ids use tmpl- followed by lowercase letters, numbers, and hyphens.'),
  name: z.string().trim().min(1).max(60),
  /** Matches the intent categories collected during registration so a template can be recommended. */
  intent: signupIntentSchema,
  category: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1).max(300),
  themeId: z.enum(presetThemeIds),
  profile: z.object({
    bio: z.string().trim().max(500).optional(),
    shareTitle: z.string().trim().max(160).optional(),
    shareDescription: z.string().trim().max(300).optional()
  }).strict().optional(),
  pages: z.array(templatePageSchema).max(6).optional(),
  /** Array order is the on-page order; positions are assigned per page at apply time. */
  blocks: z.array(templateBlockSchema).min(3).max(24)
}).strict().superRefine((value, context) => {
  const slugs = new Set<string>();
  (value.pages || []).forEach((page, index) => {
    if (page.slug === 'home') context.addIssue({ code: 'custom', path: ['pages', index, 'slug'], message: 'The home page is implicit in every template.' });
    if (slugs.has(page.slug)) context.addIssue({ code: 'custom', path: ['pages', index, 'slug'], message: 'Template page slugs must be unique.' });
    slugs.add(page.slug);
  });
  value.blocks.forEach((block, index) => {
    if (block.page && !slugs.has(block.page)) {
      context.addIssue({ code: 'custom', path: ['blocks', index, 'page'], message: 'Template blocks may only target a declared page or the home page.' });
    }
  });
});

export type SiteTemplate = z.infer<typeof siteTemplateSchema>;
export type SiteTemplateBlock = z.infer<typeof templateBlockSchema>;

export function parseSiteTemplate(input: unknown) {
  return siteTemplateSchema.safeParse(input);
}

/** Fails fast on a malformed catalog instead of half-applying a template at request time. */
export function assertSiteTemplateCatalog(catalog: readonly unknown[]): SiteTemplate[] {
  const ids = new Set<string>();
  return catalog.map(entry => {
    const parsed = parseSiteTemplate(entry);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new Error(`Invalid site template "${String((entry as SiteTemplate)?.id)}" at ${issue?.path.join('.') || 'root'}: ${issue?.message}`);
    }
    if (ids.has(parsed.data.id)) throw new Error(`Duplicate site template id "${parsed.data.id}".`);
    ids.add(parsed.data.id);
    return parsed.data;
  });
}

/**
 * Turns an authored block's `extra` into the shape a stored row holds.
 *
 * Starter blocks are authored without item ids. Stored rows always carry them, because the
 * builder keys its repeated editors by id and would treat two rows without one as the same row.
 * The preview of a starter site runs through this function too, so what a visitor sees before
 * clicking "use" is the same data the server later writes.
 */
export function templateBlockExtra(type: ContractBlockType, extra: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!extra) return null;
  const normalized = normalizeBlockExtra(type, extra);
  if (Array.isArray(normalized.items)) {
    normalized.items = normalized.items.map((item, index) => (
      item && typeof item === 'object' ? { id: `item_${index}`, ...(item as Record<string, unknown>) } : item
    ));
  }
  if (type === 'form' && Array.isArray(normalized.fields)) normalized.fields = normalizeFormFields(normalized.fields);
  return Object.keys(normalized).length ? normalized : null;
}
