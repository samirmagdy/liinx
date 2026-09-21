import { Router } from 'express';
import { z } from 'zod';
import dns from 'dns';
import { db } from '../db.js';
import { issueCurrentSession } from '../services/session.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  RESERVED_USERNAMES,
  brand,
  findSystemDemoProfile,
  isHttpUrl, isSafeCreatorCss, DUPLICATED_SEED_BLOCK_URL, SEED_BLOCK_TITLE,
  normalizeBlockExtra,
  normalizeEditorBlockExtra,
  normalizePublicSocials,
  profileUpdateContract
} from '../../shared/index.js';
import { createId } from '../utils/ids.js';
import { createHomePage, insertBlocks, insertPages, newBlockId, newPageId } from '../services/siteComposition.js';
import { entitlementsFor, hasEntitlement, normalizePlan } from '../entitlements.js';
import { buildSetupProgress } from '../services/setupProgress.js';
import { getEffectivePlan, syncAccountPlanToProfiles } from '../accountEntitlements.js';
import { normalizeCustomDomain } from '../utils/customDomain.js';
import { testOnlySessionToken } from './sessionResponse.js';

export const profilesRouter = Router();

interface PublicProfileCacheEntry {
  expiresAt: number;
  payload: Record<string, unknown>;
}

// Public pages are already cacheable for a short period at the HTTP layer.
// Keeping the assembled payload briefly in-process also avoids repeating the
// profile, block, and click-count queries for every concurrent visitor.
const publicProfileCache = new Map<string, PublicProfileCacheEntry>();
const PUBLIC_PROFILE_CACHE_TTL_MS = 5_000;
const MAX_PUBLIC_PROFILE_CACHE_ENTRIES = 10_000;

export function invalidatePublicProfileCache(profileId: string) {
  const row = db.prepare('SELECT username FROM profiles WHERE id = ?').get(profileId) as { username?: string } | undefined;
  if (row?.username) {
    const prefix = `${row.username.toLowerCase()}:`;
    for (const key of publicProfileCache.keys()) if (key === row.username.toLowerCase() || key.startsWith(prefix)) publicProfileCache.delete(key);
  }
}

const publicProfileCachePurge = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of publicProfileCache) {
    if (entry.expiresAt <= now) publicProfileCache.delete(key);
  }
}, 60_000);
publicProfileCachePurge.unref();

function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

export function isAllowedFontStylesheetUrl(value: string | null | undefined): boolean {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && (parsed.hostname === 'fonts.googleapis.com' || parsed.hostname.endsWith('.fonts.googleapis.com'));
  } catch { return false; }
}

const publishedPagesSql = 'SELECT id, slug, title, description, sort_order as sortOrder, is_home as isHome, published FROM pages WHERE profile_id = ? AND published = 1 ORDER BY sort_order ASC, created_at ASC';
const studioPagesSql = 'SELECT id, slug, title, description, sort_order as sortOrder, is_home as isHome, published, updated_at as revision FROM pages WHERE profile_id = ? ORDER BY sort_order ASC, created_at ASC';

function publicDemoPayload(systemDemo: any) {
  const homePage = { id: `page_${systemDemo.id}_home`, slug: 'home', title: 'Home', sortOrder: 0, isHome: true, published: true };
  return {
    ...systemDemo,
    plan: 'pro', hideBranding: false, gaMeasurementId: null, metaPixelId: null,
    customDomain: null, customCss: null, customFontUrl: null,
    shareTitle: `${systemDemo.displayName} (@${systemDemo.username}) | ${brand.productName}`,
    shareDescription: systemDemo.bio, shareImageUrl: null,
    footerLogoUrl: null, footerLogoLink: null, footerLogoAlt: null,
    backgroundMediaUrl: null, backgroundMediaType: null,
    pageRedirectUrl: null, pageRedirectUntil: null, customTheme: null,
    socials: systemDemo.socials || [], pages: [homePage], page: homePage,
    blocks: systemDemo.blocks || []
  };
}

function publishedPagesForProfile(profile: any): any[] {
  let pages = db.prepare(publishedPagesSql).all(profile.id) as any[];
  if (pages.length) return pages;
  createHomePage(profile.id, profile.display_name || 'Home');
  pages = db.prepare(publishedPagesSql).all(profile.id) as any[];
  return pages;
}

function publicBlocksForPage(profile: any, page: any, now: number): any[] {
  const rows = db.prepare(`
    SELECT * FROM blocks
    WHERE profile_id = ? AND (page_id = ? OR (page_id IS NULL AND ? = 1)) AND COALESCE(visible, 1) = 1
      AND (start_at IS NULL OR start_at <= ?) AND (end_at IS NULL OR end_at > ?)
    ORDER BY position ASC
  `).all(profile.id, page.id, page.isHome ? 1 : 0, now, now) as any[];
  const clickRows = db.prepare('SELECT block_id, COUNT(*) as clicks FROM link_clicks WHERE profile_id = ? GROUP BY block_id')
    .all(profile.id) as { block_id: string; clicks: number }[];
  const clicks = new Map(clickRows.map(row => [row.block_id, row.clicks]));
  const canSchedule = hasEntitlement(getEffectivePlan(profile.id), 'scheduling');
  return rows.map(block => {
    const extra = safeJsonParse(block.extra_json, null);
    const formatted: any = {
      id: block.id, pageId: block.page_id || page.id, type: block.type,
      title: block.title, url: block.url, subtitle: block.subtitle,
      icon: block.icon, badge: block.badge, highlighted: Boolean(block.highlighted),
      startAt: canSchedule ? (block.start_at || null) : null,
      endAt: canSchedule ? (block.end_at || null) : null,
      clicks: clicks.get(block.id) || 0
    };
    if (extra) Object.assign(formatted, normalizeBlockExtra(block.type, extra));
    return formatted;
  });
}

function allowedValue<T>(allowed: boolean, value: T | null | undefined): T | null {
  return allowed ? value || null : null;
}

function allowedSafeValue(allowed: boolean, valid: boolean, value: string | null | undefined): string | null {
  return allowed && valid ? value || null : null;
}

function domainTlsStatus(allowed: boolean, domain: string | null | undefined): string {
  return allowed && domain ? 'external_provider_required' : 'unknown';
}

function publicProfilePayload(profile: any, pages: any[], selectedPage: any, blocks: any[]) {
  const plan = getEffectivePlan(profile.id);
  const canCustomize = hasEntitlement(plan, 'paidCustomization');
  return {
    id: profile.id, username: profile.username, displayName: profile.display_name,
    bio: profile.bio || '', avatarUrl: profile.avatar_url || '',
    category: profile.category || 'Creator', verified: Boolean(profile.verified),
    themeId: profile.theme_id || 'editorial-stone', plan,
    hideBranding: Boolean(allowedValue(canCustomize, profile.hide_branding)),
    gaMeasurementId: allowedValue(canCustomize, profile.ga_measurement_id),
    metaPixelId: allowedValue(canCustomize, profile.meta_pixel_id),
    customDomain: profile.custom_domain || null,
    customCss: allowedSafeValue(canCustomize, isSafeCreatorCss(profile.custom_css), profile.custom_css),
    customFontUrl: allowedSafeValue(canCustomize, isAllowedFontStylesheetUrl(profile.custom_font_url), profile.custom_font_url),
    shareTitle: profile.share_title || null, shareDescription: profile.share_description || null,
    shareImageUrl: profile.share_image_url || null,
    footerLogoUrl: allowedValue(canCustomize, profile.footer_logo_url),
    footerLogoLink: allowedValue(canCustomize, profile.footer_logo_link),
    footerLogoAlt: allowedValue(canCustomize, profile.footer_logo_alt),
    backgroundMediaUrl: allowedValue(canCustomize, profile.background_media_url),
    backgroundMediaType: allowedValue(canCustomize, profile.background_media_type),
    pageRedirectUrl: allowedSafeValue(true, isHttpUrl(profile.page_redirect_url), profile.page_redirect_url),
    pageRedirectUntil: profile.page_redirect_until || null,
    customTheme: safeJsonParse(profile.custom_theme_json, null),
    socials: normalizePublicSocials(safeJsonParse(profile.socials_json, [])),
    pages: pages.map(page => ({ ...page, isHome: Boolean(page.isHome), published: Boolean(page.published) })),
    page: { ...selectedPage, isHome: Boolean(selectedPage.isHome), published: Boolean(selectedPage.published) },
    blocks
  };
}

function cachePublicProfile(key: string, payload: Record<string, unknown>): void {
  if (publicProfileCache.size >= MAX_PUBLIC_PROFILE_CACHE_ENTRIES) {
    const oldestKey = publicProfileCache.keys().next().value;
    if (oldestKey) publicProfileCache.delete(oldestKey);
  }
  publicProfileCache.set(key, { expiresAt: Date.now() + PUBLIC_PROFILE_CACHE_TTL_MS, payload });
}

export function studioPagesForProfile(profile: any): any[] {
  let pages = db.prepare(studioPagesSql).all(profile.id) as any[];
  if (pages.length) return pages;
  createHomePage(profile.id, profile.display_name || 'Home');
  pages = db.prepare(studioPagesSql).all(profile.id) as any[];
  return pages;
}

export function studioBlocksForProfile(profile: any, pages: any[]): any[] {
  const blocks = db.prepare('SELECT * FROM blocks WHERE profile_id = ? ORDER BY position ASC').all(profile.id) as any[];
  const clickRows = db.prepare('SELECT block_id, COUNT(*) as clicks FROM link_clicks WHERE profile_id = ? GROUP BY block_id')
    .all(profile.id) as { block_id: string; clicks: number }[];
  const clicks = new Map(clickRows.map(row => [row.block_id, row.clicks]));
  const canSchedule = hasEntitlement(getEffectivePlan(profile.id), 'scheduling');
  const homePageId = pages.find(page => page.isHome)?.id || null;
  return blocks.map(block => {
    const formatted: any = {
      id: block.id, revision: block.updated_at, pageId: block.page_id || homePageId,
      type: block.type, title: block.title, url: block.url, subtitle: block.subtitle,
      icon: block.icon, badge: block.badge, highlighted: Boolean(block.highlighted), visible: block.visible !== 0,
      startAt: canSchedule ? (block.start_at || null) : null,
      endAt: canSchedule ? (block.end_at || null) : null,
      clicks: clicks.get(block.id) || 0
    };
    const extra = safeJsonParse(block.extra_json, null);
    if (extra) Object.assign(formatted, normalizeEditorBlockExtra(block.type, extra));
    return formatted;
  });
}

export function studioProfilePayload(profile: any, pages: any[], blocks: any[]) {
  const plan = getEffectivePlan(profile.id);
  const canCustomize = hasEntitlement(plan, 'paidCustomization');
  const canUseDomain = hasEntitlement(plan, 'customDomain');
  const customDomain = canUseDomain ? (profile.custom_domain || null) : null;
  return {
    id: profile.id, revision: profile.updated_at, username: profile.username,
    displayName: profile.display_name, bio: profile.bio || '', avatarUrl: profile.avatar_url || '',
    category: profile.category || 'Creator', signupIntent: profile.signup_intent || null, verified: Boolean(profile.verified),
    themeId: profile.theme_id || 'editorial-stone', plan,
    hideBranding: Boolean(allowedValue(canCustomize, profile.hide_branding)),
    gaMeasurementId: allowedValue(canCustomize, profile.ga_measurement_id),
    metaPixelId: allowedValue(canCustomize, profile.meta_pixel_id),
    customDomain,
    customDomainVerified: Boolean(allowedValue(canUseDomain, profile.custom_domain_verified)),
    customDomainTlsStatus: domainTlsStatus(canUseDomain, profile.custom_domain),
    customCss: allowedSafeValue(canCustomize, isSafeCreatorCss(profile.custom_css), profile.custom_css),
    customFontUrl: allowedSafeValue(canCustomize, isAllowedFontStylesheetUrl(profile.custom_font_url), profile.custom_font_url),
    shareTitle: profile.share_title || null, shareDescription: profile.share_description || null,
    shareImageUrl: profile.share_image_url || null,
    footerLogoUrl: allowedValue(canCustomize, profile.footer_logo_url),
    footerLogoLink: allowedValue(canCustomize, profile.footer_logo_link),
    footerLogoAlt: allowedValue(canCustomize, profile.footer_logo_alt),
    backgroundMediaUrl: allowedValue(canCustomize, profile.background_media_url),
    backgroundMediaType: allowedValue(canCustomize, profile.background_media_type),
    pageRedirectUrl: allowedSafeValue(true, isHttpUrl(profile.page_redirect_url), profile.page_redirect_url),
    pageRedirectUntil: profile.page_redirect_until || null,
    customTheme: safeJsonParse(profile.custom_theme_json, null),
    socials: normalizePublicSocials(safeJsonParse(profile.socials_json, [])),
    pages: pages.map(page => ({ ...page, isHome: Boolean(page.isHome), published: Boolean(page.published) })),
    blocks,
    setup: buildSetupProgress({ profile, socials: normalizePublicSocials(safeJsonParse(profile.socials_json, [])), pages, blocks })
  };
}

// Public: Get profile by username
profilesRouter.get('/profiles/:username', (req, res) => {
  try {
    const cleanUsername = req.params.username.toLowerCase().trim();
    const requestedSlug = typeof req.query.page === 'string' ? req.query.page.toLowerCase().trim() : 'home';
    const cacheKey = `${cleanUsername}:${requestedSlug}`;
    if (process.env.NODE_ENV !== 'test') {
      const cached = publicProfileCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
        return res.json(cached.payload);
      }
      if (cached) publicProfileCache.delete(cacheKey);
    }

    const profile = db.prepare('SELECT * FROM profiles WHERE lower(username) = ?').get(cleanUsername) as any;
    if (!profile) {
      const systemDemo = findSystemDemoProfile(cleanUsername);
      if (systemDemo) {
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        return res.json(publicDemoPayload(systemDemo));
      }
      return res.status(404).json({ error: `Creator profile @${cleanUsername} was not found.` });
    }

    const pages = publishedPagesForProfile(profile);
    const selectedPage = pages.find(page => page.slug === requestedSlug) || (requestedSlug === 'home' ? pages.find(page => page.isHome) : undefined);
    if (!selectedPage) return res.status(404).json({ error: 'This page is not available.' });

    const now = Date.now();
    const blocks = publicBlocksForPage(profile, selectedPage, now);
    const payload = publicProfilePayload(profile, pages, selectedPage, blocks);
    if (process.env.NODE_ENV !== 'test') {
      cachePublicProfile(cacheKey, payload);
    }

    res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
    res.json(payload);
  } catch (err: any) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// Public: Resolve profile by custom domain
profilesRouter.get('/profiles/by-domain/:domain', (req, res) => {
  try {
    const domain = req.params.domain.toLowerCase().trim();
    const profile = db.prepare('SELECT id, username FROM profiles WHERE lower(custom_domain) = ? AND custom_domain_verified = 1').get(domain) as { id: string; username: string } | undefined;
    if (!profile || !hasEntitlement(getEffectivePlan(profile.id), 'customDomain')) {
      return res.status(404).json({ error: `No profile mapped to custom domain ${domain}` });
    }
    const pageQuery = typeof req.query.page === 'string' ? `?page=${encodeURIComponent(req.query.page)}` : '';
    return res.redirect(307, `/api/profiles/${encodeURIComponent(profile.username)}${pageQuery}`);
  } catch (err: any) {
    console.error('Custom domain lookup error:', err);
    res.status(500).json({ error: 'Failed to lookup custom domain.' });
  }
});

// Authenticated: Get current studio profile
profilesRouter.get('/studio/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });
    const pages = studioPagesForProfile(profile);
    const blocks = studioBlocksForProfile(profile, pages);
    res.json(studioProfilePayload(profile, pages, blocks));
  } catch (err: any) {
    console.error('Studio profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve creator profile.' });
  }
});

const updateProfileSchema = profileUpdateContract;

type ProfileUpdateData = z.infer<typeof updateProfileSchema>;
type ProfileUpdateError = { status: number; message: string };

function usernameUpdateError(username: string, existing: any): ProfileUpdateError | null {
  if (username === existing.username) return null;
  if (RESERVED_USERNAMES.includes(username as any)) {
    return { status: 400, message: 'This username is reserved and cannot be claimed.' };
  }
  const conflict = db.prepare('SELECT id FROM profiles WHERE lower(username) = ? AND id != ?').get(username, existing.id);
  return conflict ? { status: 409, message: `The handle @${username} is already taken.` } : null;
}

function redirectLoopsToProfile(url: string, existing: any, username: string, requestHost: string): boolean {
  try {
    const target = new URL(url);
    const configuredHosts = [requestHost, process.env.PUBLIC_DOMAIN, process.env.PUBLIC_ORIGIN, process.env.APP_ORIGIN]
      .filter(Boolean)
      .map(value => {
        try { return new URL(value as string).hostname; }
        catch { return String(value).replace(/^https?:\/\//, '').split('/')[0].split(':')[0]; }
      });
    const host = target.hostname.toLowerCase();
    const sameCustomDomain = existing.custom_domain && host === String(existing.custom_domain).toLowerCase();
    const profilePath = target.pathname.toLowerCase();
    const samePlatformProfile = configuredHosts.some(configuredHost => host === configuredHost.toLowerCase())
      && (profilePath === `/@${username}` || profilePath.startsWith(`/@${username}/`));
    return Boolean(sameCustomDomain || samePlatformProfile);
  } catch {
    return false;
  }
}

function requestsPaidCustomization(data: ProfileUpdateData): boolean {
  return data.hideBranding === true || [
    data.gaMeasurementId, data.metaPixelId, data.customCss, data.customFontUrl,
    data.footerLogoUrl, data.footerLogoLink, data.footerLogoAlt
  ].some(Boolean);
}

function profileStyleError(data: ProfileUpdateData): ProfileUpdateError | null {
  if (!isSafeCreatorCss(data.customCss)) return { status: 400, message: 'Custom CSS may not import external content or execute scripts.' };
  if (!isAllowedFontStylesheetUrl(data.customFontUrl)) {
    return { status: 400, message: 'Custom fonts must use an HTTPS Google Fonts stylesheet URL supported by the site policy.' };
  }
  return null;
}

function validateProfileUpdate(data: ProfileUpdateData, existing: any, username: string, requestHost: string): ProfileUpdateError | null {
  if (data.pageRedirectUrl && redirectLoopsToProfile(data.pageRedirectUrl, existing, username, requestHost)) {
    return { status: 400, message: 'A page redirect cannot point back to this profile.' };
  }
  const plan = getEffectivePlan(existing.id);
  const canCustomize = hasEntitlement(plan, 'paidCustomization');
  if (!canCustomize && requestsPaidCustomization(data)) {
    return { status: 403, message: 'Custom styling, analytics, and branding removal require a Pro or Studio subscription plan.' };
  }
  const enablingBackground = data.backgroundMediaUrl != null || data.backgroundMediaType != null;
  if (!canCustomize && enablingBackground) {
    return { status: 403, message: 'Background media requires a Pro or Studio subscription plan.' };
  }
  return null;
}

function resolveCustomDomainUpdate(customDomain: string | null | undefined, existing: any, profileId: string): { value: string | null; verified: number; error?: ProfileUpdateError } {
  let value = existing.custom_domain;
  let verified = existing.custom_domain_verified || 0;
  if (customDomain === undefined) return { value, verified };
  if (customDomain === null || customDomain.trim() === '') return { value: null, verified: 0 };
  const cleanDomain = normalizeCustomDomain(customDomain);
  if (!cleanDomain) return { value, verified, error: { status: 400, message: 'Invalid domain format. Use a hostname such as links.yourdomain.com.' } };
  if (!hasEntitlement(getEffectivePlan(existing.id), 'customDomain')) {
    return { value, verified, error: { status: 403, message: 'Custom domains require a Pro or Studio subscription plan.' } };
  }
  const conflict = db.prepare('SELECT id FROM profiles WHERE lower(custom_domain) = ? AND id != ?').get(cleanDomain, profileId);
  if (conflict) return { value, verified, error: { status: 409, message: `The custom domain "${cleanDomain}" is already mapped to another RALOA profile.` } };
  if (cleanDomain !== existing.custom_domain) {
    value = cleanDomain;
    verified = 0;
  }
  return { value, verified };
}

function preserveWhenUndefined<T>(next: T | undefined, current: T): T {
  return next === undefined ? current : next;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function serializeWhenProvided(value: unknown, current: string | null): string | null {
  return value === undefined ? current : value ? JSON.stringify(value) : null;
}

function updatedProfileValues(data: ProfileUpdateData, existing: any, username: string, domain: string | null, domainVerified: number) {
  return {
    displayName: preserveWhenUndefined(data.displayName, existing.display_name),
    username,
    bio: preserveWhenUndefined(data.bio, existing.bio),
    avatarUrl: preserveWhenUndefined(data.avatarUrl, existing.avatar_url),
    category: preserveWhenUndefined(data.category, existing.category),
    themeId: preserveWhenUndefined(data.themeId, existing.theme_id),
    hideBranding: data.hideBranding === undefined ? existing.hide_branding : Number(data.hideBranding),
    gaMeasurementId: preserveWhenUndefined(data.gaMeasurementId, existing.ga_measurement_id),
    metaPixelId: preserveWhenUndefined(data.metaPixelId, existing.meta_pixel_id),
    customDomain: domain,
    customDomainVerified: domainVerified,
    customCss: preserveWhenUndefined(data.customCss, existing.custom_css),
    customFontUrl: preserveWhenUndefined(data.customFontUrl, existing.custom_font_url),
    shareTitle: preserveWhenUndefined(data.shareTitle, existing.share_title),
    shareDescription: preserveWhenUndefined(data.shareDescription, existing.share_description),
    shareImageUrl: preserveWhenUndefined(data.shareImageUrl, existing.share_image_url),
    footerLogoUrl: preserveWhenUndefined(data.footerLogoUrl, existing.footer_logo_url),
    footerLogoLink: preserveWhenUndefined(data.footerLogoLink, existing.footer_logo_link),
    footerLogoAlt: data.footerLogoAlt === undefined ? existing.footer_logo_alt : normalizeOptionalString(data.footerLogoAlt),
    backgroundMediaUrl: preserveWhenUndefined(data.backgroundMediaUrl, existing.background_media_url),
    backgroundMediaType: preserveWhenUndefined(data.backgroundMediaType, existing.background_media_type),
    pageRedirectUrl: preserveWhenUndefined(data.pageRedirectUrl, existing.page_redirect_url),
    pageRedirectUntil: preserveWhenUndefined(data.pageRedirectUntil, existing.page_redirect_until),
    customThemeJson: serializeWhenProvided(data.customTheme, existing.custom_theme_json),
    socialsJson: serializeWhenProvided(data.socials, existing.socials_json)
  };
}

function saveProfileUpdate(profileId: string, revision: number | undefined, now: number, values: ReturnType<typeof updatedProfileValues>) {
  return db.prepare(`
    UPDATE profiles SET display_name = ?, username = ?, bio = ?, avatar_url = ?, category = ?, theme_id = ?,
      hide_branding = ?, ga_measurement_id = ?, meta_pixel_id = ?, custom_domain = ?, custom_domain_verified = ?,
      custom_css = ?, custom_font_url = ?, share_title = ?, share_description = ?, share_image_url = ?,
      footer_logo_url = ?, footer_logo_link = ?, footer_logo_alt = ?, background_media_url = ?,
      background_media_type = ?, page_redirect_url = ?, page_redirect_until = ?, custom_theme_json = ?,
      socials_json = ?, updated_at = ? WHERE id = ? AND (? IS NULL OR updated_at = ?)
  `).run(
    values.displayName, values.username, values.bio || '', values.avatarUrl || '', values.category || 'Creator',
    values.themeId || 'editorial-stone', values.hideBranding, values.gaMeasurementId, values.metaPixelId,
    values.customDomain, values.customDomainVerified, values.customCss, values.customFontUrl,
    values.shareTitle, values.shareDescription, values.shareImageUrl, values.footerLogoUrl,
    values.footerLogoLink, values.footerLogoAlt, values.backgroundMediaUrl, values.backgroundMediaType,
    values.pageRedirectUrl, values.pageRedirectUntil, values.customThemeJson, values.socialsJson,
    now, profileId, revision ?? null, revision ?? null
  );
}

// Authenticated: Update studio profile
profilesRouter.put('/studio/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const parse = updateProfileSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues[0].message });
    const data = parse.data;
    const revision = data.revision;
    const styleError = profileStyleError(data);
    if (styleError) return res.status(styleError.status).json({ error: styleError.message });
    const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    if (!existing) return res.status(404).json({ error: 'Profile not found.' });
    const updatedUsername = data.username !== undefined ? data.username.toLowerCase().trim() : existing.username;
    const identityError = usernameUpdateError(updatedUsername, existing);
    if (identityError) return res.status(identityError.status).json({ error: identityError.message });
    const requestHost = String(req.headers.host || '').split(':')[0];
    const updateError = validateProfileUpdate(data, existing, updatedUsername, requestHost);
    if (updateError) return res.status(updateError.status).json({ error: updateError.message });
    const domainUpdate = resolveCustomDomainUpdate(data.customDomain, existing, req.user!.profileId);
    if (domainUpdate.error) return res.status(domainUpdate.error.status).json({ error: domainUpdate.error.message });
    if (updatedUsername !== existing.username) invalidatePublicProfileCache(existing.id);
    const now = Date.now();
    const values = updatedProfileValues(data, existing, updatedUsername, domainUpdate.value, domainUpdate.verified);
    const saved = saveProfileUpdate(req.user!.profileId, revision, now, values);

    if (saved.changes === 0) return res.status(409).json({ error: 'This profile changed in another tab. Reload it before retrying your changes.' });

    invalidatePublicProfileCache(existing.id);
    let token: string | undefined;
    if (updatedUsername !== existing.username) {
      token = issueCurrentSession(req.user!.userId, existing.id, updatedUsername, req.user!.email);
      res.setHeader('Set-Cookie', `raloa_session=${encodeURIComponent(token)}; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    }
    res.json({
      success: true,
      revision: now,
      ...testOnlySessionToken(token),
      message: 'Profile updated successfully.'
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Authenticated: Verify DNS CNAME for a custom domain
profilesRouter.post('/studio/custom-domain/verify', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'Domain name is required.' });
    }

    const cleanDomain = normalizeCustomDomain(domain);
    if (!cleanDomain) return res.status(400).json({ error: 'Invalid domain format. Use a hostname such as links.yourdomain.com.' });

    const expectedTarget = brand.cnameTarget;
    let isVerified = false;
    let cnameRecords: string[] = [];

    try {
      cnameRecords = await dns.promises.resolveCname(cleanDomain);
      isVerified = cnameRecords.some(r => r.replace(/\.$/, '').toLowerCase() === expectedTarget);
    } catch (dnsErr) {
      // DNS record may not yet be configured or propagating
    }

    // A failed DNS check must revoke the old flag; otherwise a changed DNS
    // record would remain publicly routable based on stale database state.
    const saved = db.prepare('SELECT custom_domain FROM profiles WHERE id = ?').get(req.user!.profileId) as { custom_domain?: string | null; plan?: string } | undefined;
    if (!saved?.custom_domain || saved.custom_domain !== cleanDomain) {
      return res.status(409).json({ error: 'Verify the exact custom domain saved on this profile.' });
    }
    if (!hasEntitlement(getEffectivePlan(req.user!.profileId), 'customDomain')) return res.status(403).json({ error: 'Custom domains require a Pro or Studio subscription plan.' });
    db.prepare('UPDATE profiles SET custom_domain_verified = ?, updated_at = ? WHERE id = ? AND custom_domain = ?').run(
      isVerified ? 1 : 0, Date.now(), req.user!.profileId, cleanDomain
    );

    res.json({
      domain: cleanDomain,
      verified: isVerified,
      dnsVerified: isVerified,
      tlsStatus: 'external_provider_required',
      tlsProvider: 'fly.io',
      expectedTarget,
      cnameRecords,
      message: isVerified
        ? `DNS record verified! Your CNAME points to ${expectedTarget}. Secure HTTPS becomes active once your hosting provider completes TLS certificate provisioning.`
        : `DNS verification pending. Point your CNAME record to ${expectedTarget} and verify again. DNS changes can take a few minutes to propagate.`
    });
  } catch (err: any) {
    console.error('Custom domain verify error:', err);
    res.status(500).json({ error: 'Failed to verify DNS record.' });
  }
});


// Authenticated: Update subscription plan (restricted to automated test suite and admin sync)
profilesRouter.put('/studio/plan', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const isTest = process.env.NODE_ENV === 'test';
    const isAdmin = process.env.ADMIN_SECRET && req.headers['x-admin-key'] === process.env.ADMIN_SECRET;

    if (!isTest && !isAdmin) {
      return res.status(403).json({
        error: 'Direct plan updates are disabled in production. Paid subscriptions must be activated through verified Stripe checkout.'
      });
    }

    const { plan } = req.body;
    if (!['free', 'pro', 'studio'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan tier. Choose from free, pro, or studio.' });
    }

    const now = Date.now();
    db.prepare('UPDATE users SET subscription_plan = ?, subscription_status = ? WHERE id = ?').run(
      plan, plan === 'free' ? 'inactive' : 'active', req.user!.userId
    );
    syncAccountPlanToProfiles(req.user!.userId, plan, now);

    res.json({ success: true, plan, message: `Successfully updated to ${plan.toUpperCase()} tier!` });
  } catch (err: any) {
    console.error('Update plan error:', err);
    res.status(500).json({ error: 'Failed to update subscription plan.' });
  }
});

// Authenticated: Get all profiles owned by the logged-in user
profilesRouter.get('/studio/profiles', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const profiles = db.prepare(`
      SELECT id, username, display_name as displayName, avatar_url as avatarUrl, coalesce((SELECT u.subscription_plan FROM users u WHERE u.id = profiles.user_id), plan) as plan, category, created_at as createdAt
      FROM profiles
      WHERE user_id = ?
      ORDER BY created_at ASC
    `).all(userId) as any[];

    res.json({
      profiles,
      activeProfileId: req.user!.profileId
    });
  } catch (err: any) {
    console.error('List profiles error:', err);
    res.status(500).json({ error: 'Failed to retrieve accounts.' });
  }
});

const createProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username may only contain lowercase letters, numbers, and underscores'),
  displayName: z.string().min(1, 'Display name cannot be empty').max(100),
  duplicateProfileId: z.string().max(100).optional()
});

function remapDuplicatedValue(value: unknown, pageMap: Map<string, string>, blockMap: Map<string, string>): unknown {
  if (typeof value === 'string') {
    const direct = pageMap.get(value) || blockMap.get(value);
    if (direct) return direct;
    return value.replace(/\/r\/([^/?#]+)/g, (_match, id: string) => `/r/${blockMap.get(id) || id}`);
  }
  if (Array.isArray(value)) return value.map(item => remapDuplicatedValue(item, pageMap, blockMap));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, remapDuplicatedValue(item, pageMap, blockMap)]));
  }
  return value;
}

function duplicatedBlockExtra(type: string, raw: string | null): string | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    // Gate passwords are credentials, not reusable page content. A duplicated
    // gate must be configured with a new password by its owner.
    delete value.password;
    delete value.passwordHash;
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function profileCreationPlan(userId: string): { plan: string; maxProfiles: number; currentCount: number } {
  const account = db.prepare('SELECT subscription_plan FROM users WHERE id = ?').get(userId) as { subscription_plan?: string } | undefined;
  const plan = normalizePlan(account?.subscription_plan);
  const maxProfiles = entitlementsFor(plan).maxProfiles;
  const row = db.prepare('SELECT COUNT(*) as count FROM profiles WHERE user_id = ?').get(userId) as { count: number };
  return { plan, maxProfiles, currentCount: row?.count || 0 };
}

function profileUsernameError(username: string): ProfileUpdateError | null {
  if (RESERVED_USERNAMES.includes(username as any)) return { status: 400, message: 'This username is reserved and cannot be claimed.' };
  const existing = db.prepare('SELECT id FROM profiles WHERE username = ?').get(username);
  return existing ? { status: 409, message: `The handle @${username} is already taken.` } : null;
}

function duplicateSourceProfile(sourceId: string | undefined, userId: string): any | null {
  if (!sourceId) return null;
  return db.prepare('SELECT * FROM profiles WHERE id = ? AND user_id = ?').get(sourceId, userId) as any || null;
}

function duplicatePagesAndBlocks(profileId: string, homePageId: string, now: number, sourcePages: any[], sourceBlocks: any[]): void {
  db.prepare('DELETE FROM blocks WHERE profile_id = ?').run(profileId);
  db.prepare('DELETE FROM pages WHERE profile_id = ? AND id != ?').run(profileId, homePageId);
  const pageMap = new Map<string, string>();
  const blockMap = new Map<string, string>();
  for (const page of sourcePages) pageMap.set(page.id, page.is_home ? homePageId : newPageId());
  for (const block of sourceBlocks) blockMap.set(block.id, newBlockId());
  insertPages(profileId, sourcePages.filter(page => !page.is_home).map(page => ({
    id: pageMap.get(page.id), slug: page.slug, title: page.title, description: page.description,
    sortOrder: page.sort_order, isHome: false, published: Boolean(page.published)
  })), now);
  insertBlocks(profileId, sourceBlocks.map(block => {
    const sanitizedExtra = duplicatedBlockExtra(block.type, block.extra_json);
    const remappedExtra = sanitizedExtra ? JSON.stringify(remapDuplicatedValue(JSON.parse(sanitizedExtra), pageMap, blockMap)) : null;
    const remappedUrl = typeof block.url === 'string' ? remapDuplicatedValue(block.url, pageMap, blockMap) : block.url;
    return {
      id: blockMap.get(block.id), type: block.type, title: block.title, url: remappedUrl, subtitle: block.subtitle,
      icon: block.icon, badge: block.badge, highlighted: Boolean(block.highlighted), visible: block.visible !== 0,
      position: block.position, startAt: block.start_at, endAt: block.end_at,
      pageId: pageMap.get(block.page_id) || homePageId, extraJson: remappedExtra
    };
  }), now);
}

function insertProfileRecord(
  profileId: string,
  userId: string,
  username: string,
  displayName: string,
  plan: string,
  duplicateSource: any | null
): void {
  const now = Date.now();
  const source = duplicateSource || {};
  const sourcePages = duplicateSource ? db.prepare('SELECT * FROM pages WHERE profile_id = ? ORDER BY sort_order ASC, created_at ASC, id ASC').all(duplicateSource.id) as any[] : [];
  const sourceBlocks = duplicateSource ? db.prepare('SELECT * FROM blocks WHERE profile_id = ? ORDER BY position ASC, created_at ASC, id ASC').all(duplicateSource.id) as any[] : [];
  const sourceHome = sourcePages.find(page => page.is_home) || {};
  db.exec('BEGIN');
  db.prepare(`
    INSERT INTO profiles (
      id, user_id, username, display_name, bio, avatar_url, category, theme_id, plan,
      hide_branding, ga_measurement_id, meta_pixel_id, custom_css, custom_font_url,
      custom_theme_json, socials_json, share_title, share_description, share_image_url,
      footer_logo_url, footer_logo_link, footer_logo_alt, background_media_url, background_media_type, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(profileId, userId, username, displayName, source.bio || '', source.avatar_url || '',
    source.category || 'Creator', source.theme_id || 'editorial-stone', plan,
    source.hide_branding || 0, null, null, source.custom_css || null,
    source.custom_font_url || null, source.custom_theme_json || null,
    source.socials_json || null, source.share_title || null,
    source.share_description || null, source.share_image_url || null,
    source.footer_logo_url || null, source.footer_logo_link || null,
    source.footer_logo_alt || null, source.background_media_url || null,
    source.background_media_type || null, now, now);

  const homePageId = newPageId();
  insertPages(profileId, [{
    id: homePageId, slug: 'home', title: sourceHome.title || displayName, description: sourceHome.description || null,
    sortOrder: 0, isHome: true, published: true
  }], now);
  insertBlocks(profileId, [{
    id: newBlockId(), type: 'link', title: SEED_BLOCK_TITLE, url: DUPLICATED_SEED_BLOCK_URL, subtitle: null, icon: null,
    badge: null, highlighted: false, visible: true, position: 0, startAt: null, endAt: null, pageId: homePageId, extraJson: null
  }], now);
  if (duplicateSource) duplicatePagesAndBlocks(profileId, homePageId, now, sourcePages, sourceBlocks);
  db.exec('COMMIT');
}

// Authenticated: Create a new profile under the same account (respecting plan limits)
profilesRouter.post('/studio/profiles', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const parse = createProfileSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues[0].message });
    const userId = req.user!.userId;
    const cleanUsername = parse.data.username.toLowerCase().trim();
    const displayName = parse.data.displayName.trim();
    const duplicateSource = duplicateSourceProfile(parse.data.duplicateProfileId, userId);
    if (parse.data.duplicateProfileId && !duplicateSource) return res.status(404).json({ error: 'The profile to duplicate was not found.' });
    const capacity = profileCreationPlan(userId);
    if (capacity.currentCount >= capacity.maxProfiles) {
      return res.status(403).json({ error: `Your current ${capacity.plan.toUpperCase()} plan allows up to ${capacity.maxProfiles} bio profile(s). Please upgrade to create more.` });
    }
    const usernameError = profileUsernameError(cleanUsername);
    if (usernameError) return res.status(usernameError.status).json({ error: usernameError.message });
    const newProfileId = createId('prf');
    insertProfileRecord(newProfileId, userId, cleanUsername, displayName, capacity.plan, duplicateSource);

    // Sign new token for the newly created profile
    const token = issueCurrentSession(userId, newProfileId, cleanUsername, req.user!.email);
    res.setHeader('Set-Cookie', `raloa_session=${encodeURIComponent(token)}; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

    res.status(201).json({
      success: true,
      profile: {
        id: newProfileId,
        username: cleanUsername,
        displayName,
        plan: capacity.plan
      },
      ...testOnlySessionToken(token)
    });
  } catch (err: any) {
    try { db.exec('ROLLBACK'); } catch {}
    console.error('Create profile error:', err);
    res.status(500).json({ error: 'Failed to create profile.' });
  }
});

// Authenticated: Delete a non-active profile owned by the current account.
profilesRouter.delete('/studio/profiles/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const target = db.prepare('SELECT id, stripe_subscription_id FROM profiles WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.userId) as { id: string; stripe_subscription_id?: string | null } | undefined;
    if (!target) return res.status(404).json({ error: 'Profile not found or does not belong to your account.' });
    if (target.stripe_subscription_id) return res.status(409).json({ error: 'This profile is still linked to a Stripe subscription. Transfer or cancel billing before deleting it.' });
    if (target.id === req.user!.profileId) return res.status(409).json({ error: 'Switch to another profile before deleting this profile.' });
    const count = db.prepare('SELECT COUNT(*) as count FROM profiles WHERE user_id = ?').get(req.user!.userId) as { count: number };
    if (count.count <= 1) return res.status(400).json({ error: 'Your account must keep at least one profile.' });
    db.transaction(() => {
      // uploaded_files are account-owned and can be referenced by another
      // profile; account deletion handles their final cleanup.
      for (const table of ['link_clicks', 'profile_views', 'newsletter_subscribers', 'form_submissions', 'instagram_sync', 'api_keys', 'blocks', 'pages']) {
        try { db.prepare(`DELETE FROM ${table} WHERE profile_id = ?`).run(target.id); } catch {}
      }
      db.prepare('DELETE FROM profiles WHERE id = ? AND user_id = ?').run(target.id, req.user!.userId);
    })();
    res.json({ success: true, message: 'Profile deleted.' });
  } catch (err: any) {
    console.error('Delete profile error:', err);
    res.status(500).json({ error: 'Failed to delete profile.' });
  }
});

// Authenticated: Switch active profile and receive an updated JWT session
profilesRouter.post('/studio/profiles/:id/select', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const targetProfileId = req.params.id;
    const userId = req.user!.userId;

    const profile = db.prepare('SELECT * FROM profiles WHERE id = ? AND user_id = ?').get(targetProfileId, userId) as any;
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found or does not belong to your account.' });
    }

    const token = issueCurrentSession(userId, profile.id, profile.username, req.user!.email);
    res.setHeader('Set-Cookie', `raloa_session=${encodeURIComponent(token)}; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

    res.json({
      success: true,
      ...testOnlySessionToken(token),
      profile: {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        plan: getEffectivePlan(profile.id)
      }
    });
  } catch (err: any) {
    console.error('Select profile error:', err);
    res.status(500).json({ error: 'Failed to switch profile.' });
  }
});
