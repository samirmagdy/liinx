import { brand } from '../config/brand.js';
import { SITE_TEMPLATES } from '../config/siteTemplates.js';

/**
 * The exact values a fresh account is seeded with. Setup progress is derived by comparing stored
 * rows against these, so the seeding code and the derivation code have to read the same constants:
 * if one side drifts, a finished page would silently look unfinished, or an empty one looks done.
 */
export const SEED_AVATAR_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';

export const SEED_BIO = 'Welcome to my links! Tap below to explore my latest updates.';

export const SEED_BLOCK_TITLE = 'My Website';

/** The placeholder link a newly opened account gets. */
export const SEED_BLOCK_URL = `https://${brand.domain}`;

/** Duplicating a profile copies the same placeholder row with a neutral destination. */
export const DUPLICATED_SEED_BLOCK_URL = 'https://example.com';

export const SEED_BLOCK_URLS = [SEED_BLOCK_URL, DUPLICATED_SEED_BLOCK_URL];

/** A social row aimed at a provider home page is not yet a link to the creator. */
export const SEED_INSTAGRAM_HOME_URL = 'https://instagram.com';

export const SEED_SOCIAL_URLS = [SEED_INSTAGRAM_HOME_URL, 'https://x.com', 'https://youtube.com', 'https://spotify.com'];

/**
 * Copy the product wrote on the creator's behalf. Only the account's own words count as written, so
 * a starter site's instruction line cannot tick the bio step.
 */
export const PLACEHOLDER_BIOS = new Set(
  [SEED_BIO, ...SITE_TEMPLATES.map(template => template.profile?.bio || '')].map(value => value.trim()).filter(Boolean)
);

export function isSeedBlock(block: { title?: string | null; url?: string | null }): boolean {
  return (block.title || '').trim() === SEED_BLOCK_TITLE && SEED_BLOCK_URLS.includes((block.url || '').trim());
}

/**
 * A social row the creator added themselves. The contact address written for them at signup and a
 * provider home page that names nobody are both excluded, because neither is a profile they linked.
 */
export function isSeedSocial(social: { url?: string | null } | null | undefined, ownerEmail?: string | null): boolean {
  const url = (social?.url || '').trim().toLowerCase();
  if (!url || SEED_SOCIAL_URLS.includes(url)) return true;
  return Boolean(ownerEmail && url === `mailto:${ownerEmail.trim().toLowerCase()}`);
}

export function isSeedAvatar(avatarUrl?: string | null): boolean {
  return !avatarUrl || avatarUrl === SEED_AVATAR_URL;
}

export function isPlaceholderBio(bio?: string | null): boolean {
  const value = (bio || '').trim();
  return !value || PLACEHOLDER_BIOS.has(value);
}
