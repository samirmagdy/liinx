import { Router } from 'express';
import { z } from 'zod';
import dns from 'dns';
import { db } from '../db.js';
import { signJwt } from '../auth.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { RESERVED_USERNAMES, brand } from '../../src/config/brand.js';
import { isHttpUrl, isSafeLinkUrl } from '../utils/urlValidation.js';
import { createId } from '../utils/ids.js';
import { normalizeBlockExtra, normalizePublicSocials, profileUpdateContract } from '../contracts.js';
import { entitlementsFor, hasEntitlement, normalizePlan } from '../entitlements.js';

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

function isSafeCustomCss(value: string | null | undefined): boolean {
  if (!value) return true;
  return !/(?:@import|expression\s*\(|behavior\s*:|javascript\s*:|url\s*\()/i.test(value);
}

const avatarUrlSchema = z.string().refine(value => {
  // Uploaded avatars are intentionally stored as same-origin relative paths.
  if (/^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) return true;
  return isHttpUrl(value);
}, 'Avatar must use HTTP(S) or a valid same-origin upload path.');

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
      return res.status(404).json({ error: `Creator profile @${cleanUsername} was not found.` });
    }

    let pages = db.prepare('SELECT id, slug, title, description, sort_order as sortOrder, is_home as isHome, published FROM pages WHERE profile_id = ? AND published = 1 ORDER BY sort_order ASC, created_at ASC').all(profile.id) as any[];
    if (pages.length === 0) {
      const homeId = createId('page');
      db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, 'home', ?, NULL, 0, 1, 1, ?, ?)`)
        .run(homeId, profile.id, profile.display_name || 'Home', Date.now(), Date.now());
      db.prepare('UPDATE blocks SET page_id = ? WHERE profile_id = ? AND page_id IS NULL').run(homeId, profile.id);
      pages = db.prepare('SELECT id, slug, title, description, sort_order as sortOrder, is_home as isHome, published FROM pages WHERE profile_id = ? AND published = 1 ORDER BY sort_order ASC, created_at ASC').all(profile.id) as any[];
    }
    const selectedPage = pages.find(page => page.slug === requestedSlug) || (requestedSlug === 'home' ? pages.find(page => page.isHome) : undefined);
    if (!selectedPage) return res.status(404).json({ error: 'This page is not available.' });

    const now = Date.now();
    const blocks = db.prepare(`
      SELECT * FROM blocks 
      WHERE profile_id = ? 
        AND (page_id = ? OR (page_id IS NULL AND ? = 1))
        AND (start_at IS NULL OR start_at <= ?) 
        AND (end_at IS NULL OR end_at >= ?)
      ORDER BY position ASC
    `).all(profile.id, selectedPage.id, selectedPage.isHome ? 1 : 0, now, now) as any[];

    // Calculate total clicks for blocks
    const clickCounts = db.prepare(`
      SELECT block_id, COUNT(*) as clicks 
      FROM link_clicks 
      WHERE profile_id = ? 
      GROUP BY block_id
    `).all(profile.id) as { block_id: string; clicks: number }[];

    const clickMap = new Map(clickCounts.map(c => [c.block_id, c.clicks]));

    const formattedBlocks = blocks.map(b => {
      let extra = null;
      if (b.extra_json) {
        try { extra = JSON.parse(b.extra_json); } catch (e) {}
      }

      const baseBlock: any = {
        id: b.id,
        pageId: b.page_id || selectedPage.id,
        type: b.type,
        title: b.title,
        url: b.url,
        subtitle: b.subtitle,
        icon: b.icon,
        badge: b.badge,
        highlighted: Boolean(b.highlighted),
        startAt: hasEntitlement(profile.plan, 'scheduling') ? (b.start_at || null) : null,
        endAt: hasEntitlement(profile.plan, 'scheduling') ? (b.end_at || null) : null,
        clicks: clickMap.get(b.id) || 0
      };

      if (extra) {
        if (b.type === 'content_gate') {
          delete extra.body;
          delete extra.password;
          delete extra.passwordHash;
          extra.locked = true;
        }
        Object.assign(baseBlock, normalizeBlockExtra(b.type, extra));
      }

      return baseBlock;
    });

    const payload = {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      bio: profile.bio || '',
      avatarUrl: profile.avatar_url || '',
      category: profile.category || 'Creator',
      verified: Boolean(profile.verified),
      themeId: profile.theme_id || 'editorial-stone',
      plan: normalizePlan(profile.plan),
      hideBranding: hasEntitlement(profile.plan, 'paidCustomization') && Boolean(profile.hide_branding),
      gaMeasurementId: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.ga_measurement_id || null) : null,
      metaPixelId: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.meta_pixel_id || null) : null,
      customDomain: profile.custom_domain || null,
      customCss: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.custom_css || null) : null,
      customFontUrl: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.custom_font_url || null) : null,
      shareTitle: profile.share_title || null,
      shareDescription: profile.share_description || null,
      shareImageUrl: profile.share_image_url || null,
      footerLogoUrl: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.footer_logo_url || null) : null,
      backgroundMediaUrl: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.background_media_url || null) : null,
      backgroundMediaType: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.background_media_type || null) : null,
      pageRedirectUrl: profile.page_redirect_url || null,
      pageRedirectUntil: profile.page_redirect_until || null,
      customTheme: safeJsonParse(profile.custom_theme_json, null),
      socials: normalizePublicSocials(safeJsonParse(profile.socials_json, [])),
      pages: pages.map(page => ({ ...page, isHome: Boolean(page.isHome), published: Boolean(page.published) })),
      page: { ...selectedPage, isHome: Boolean(selectedPage.isHome), published: Boolean(selectedPage.published) },
      blocks: formattedBlocks
    };

    if (process.env.NODE_ENV !== 'test') {
      if (publicProfileCache.size >= MAX_PUBLIC_PROFILE_CACHE_ENTRIES) {
        const oldestKey = publicProfileCache.keys().next().value;
        if (oldestKey) publicProfileCache.delete(oldestKey);
      }
      publicProfileCache.set(cacheKey, {
        expiresAt: Date.now() + PUBLIC_PROFILE_CACHE_TTL_MS,
        payload
      });
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
    const profile = db.prepare('SELECT username, plan FROM profiles WHERE lower(custom_domain) = ? AND custom_domain_verified = 1').get(domain) as { username: string; plan: string } | undefined;
    if (!profile || !hasEntitlement(profile.plan, 'customDomain')) {
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
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const blocks = db.prepare('SELECT * FROM blocks WHERE profile_id = ? ORDER BY position ASC').all(profile.id) as any[];
    let pages = db.prepare('SELECT id, slug, title, description, sort_order as sortOrder, is_home as isHome, published, updated_at as revision FROM pages WHERE profile_id = ? ORDER BY sort_order ASC, created_at ASC').all(profile.id) as any[];
    if (pages.length === 0) {
      const homeId = createId('page');
      db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, 'home', ?, NULL, 0, 1, 1, ?, ?)`)
        .run(homeId, profile.id, profile.display_name || 'Home', Date.now(), Date.now());
      db.prepare('UPDATE blocks SET page_id = ? WHERE profile_id = ? AND page_id IS NULL').run(homeId, profile.id);
      pages = db.prepare('SELECT id, slug, title, description, sort_order as sortOrder, is_home as isHome, published, updated_at as revision FROM pages WHERE profile_id = ? ORDER BY sort_order ASC, created_at ASC').all(profile.id) as any[];
    }

    // Calculate real total clicks per block
    const clickCounts = db.prepare(`
      SELECT block_id, COUNT(*) as clicks 
      FROM link_clicks 
      WHERE profile_id = ? 
      GROUP BY block_id
    `).all(profile.id) as { block_id: string; clicks: number }[];
    const clickMap = new Map(clickCounts.map(c => [c.block_id, c.clicks]));

    const formattedBlocks = blocks.map(b => {
      let extra = null;
      if (b.extra_json) {
        try { extra = JSON.parse(b.extra_json); } catch (e) {}
      }

      const baseBlock: any = {
        id: b.id,
        revision: b.updated_at,
        pageId: b.page_id || pages.find(page => page.isHome)?.id || null,
        type: b.type,
        title: b.title,
        url: b.url,
        subtitle: b.subtitle,
        icon: b.icon,
        badge: b.badge,
        highlighted: Boolean(b.highlighted),
        startAt: hasEntitlement(profile.plan, 'scheduling') ? (b.start_at || null) : null,
        endAt: hasEntitlement(profile.plan, 'scheduling') ? (b.end_at || null) : null,
        clicks: clickMap.get(b.id) || 0
      };

      if (extra) {
        Object.assign(baseBlock, normalizeBlockExtra(b.type, extra));
      }

      return baseBlock;
    });

    res.json({
      id: profile.id,
      revision: profile.updated_at,
      username: profile.username,
      displayName: profile.display_name,
      bio: profile.bio || '',
      avatarUrl: profile.avatar_url || '',
      category: profile.category || 'Creator',
      verified: Boolean(profile.verified),
      themeId: profile.theme_id || 'editorial-stone',
      plan: normalizePlan(profile.plan),
      hideBranding: hasEntitlement(profile.plan, 'paidCustomization') && Boolean(profile.hide_branding),
      gaMeasurementId: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.ga_measurement_id || null) : null,
      metaPixelId: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.meta_pixel_id || null) : null,
      customDomain: hasEntitlement(profile.plan, 'customDomain') ? (profile.custom_domain || null) : null,
      customCss: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.custom_css || null) : null,
      customFontUrl: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.custom_font_url || null) : null,
      shareTitle: profile.share_title || null,
      shareDescription: profile.share_description || null,
      shareImageUrl: profile.share_image_url || null,
      footerLogoUrl: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.footer_logo_url || null) : null,
      backgroundMediaUrl: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.background_media_url || null) : null,
      backgroundMediaType: hasEntitlement(profile.plan, 'paidCustomization') ? (profile.background_media_type || null) : null,
      pageRedirectUrl: profile.page_redirect_url || null,
      pageRedirectUntil: profile.page_redirect_until || null,
      customTheme: safeJsonParse(profile.custom_theme_json, null),
      socials: normalizePublicSocials(safeJsonParse(profile.socials_json, [])),
      pages: pages.map(page => ({ ...page, isHome: Boolean(page.isHome), published: Boolean(page.published) })),
      blocks: formattedBlocks
    });
  } catch (err: any) {
    console.error('Studio profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve creator profile.' });
  }
});

const updateProfileSchema = profileUpdateContract;

// Authenticated: Update studio profile
profilesRouter.put('/studio/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const parse = updateProfileSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { 
      username,
      displayName, 
      bio, 
      avatarUrl, 
      category, 
      themeId, 
      hideBranding, 
      gaMeasurementId, 
      metaPixelId, 
      customDomain,
      customCss,
      customFontUrl,
      shareTitle, shareDescription, shareImageUrl, footerLogoUrl, backgroundMediaUrl, backgroundMediaType, pageRedirectUrl, pageRedirectUntil,
      customTheme, 
      socials 
    } = parse.data;
    const revision = parse.data.revision;

    if (!isSafeCustomCss(customCss)) {
      return res.status(400).json({ error: 'Custom CSS may not import external content or execute scripts.' });
    }

    const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const updatedUsername = username !== undefined ? username.toLowerCase().trim() : existing.username;
    if (updatedUsername !== existing.username) {
      if (RESERVED_USERNAMES.includes(updatedUsername as any)) return res.status(400).json({ error: 'This username is reserved and cannot be claimed.' });
      const conflict = db.prepare('SELECT id FROM profiles WHERE lower(username) = ? AND id != ?').get(updatedUsername, existing.id);
      if (conflict) return res.status(409).json({ error: `The handle @${updatedUsername} is already taken.` });
      invalidatePublicProfileCache(existing.id);
    }

    if (!hasEntitlement(existing.plan, 'paidCustomization') && (hideBranding === true || Boolean(gaMeasurementId) || Boolean(metaPixelId) || Boolean(customCss) || Boolean(customFontUrl))) {
      return res.status(403).json({ error: 'Custom styling, analytics, and branding removal require a Pro or Studio subscription plan.' });
    }
    const isEnablingBackgroundMedia = (backgroundMediaUrl !== undefined && backgroundMediaUrl !== null) || (backgroundMediaType !== undefined && backgroundMediaType !== null);
    if (!hasEntitlement(existing.plan, 'paidCustomization') && isEnablingBackgroundMedia) {
      return res.status(403).json({ error: 'Background media requires a Pro or Studio subscription plan.' });
    }

    // Custom Domain Plan Enforcement & Validation
    let updatedCustomDomain = existing.custom_domain;
    let customDomainVerified = existing.custom_domain_verified || 0;
    if (customDomain !== undefined) {
      if (customDomain === null || customDomain.trim() === '') {
        updatedCustomDomain = null;
        customDomainVerified = 0;
      } else {
        const cleanDomain = customDomain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        if (!hasEntitlement(existing.plan, 'customDomain')) {
          return res.status(403).json({ error: 'Custom domains require a Pro or Studio subscription plan.' });
        }
        if (!/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/.test(cleanDomain)) {
          return res.status(400).json({ error: 'Invalid domain format. Example: links.yourdomain.com' });
        }
        const conflict = db.prepare('SELECT id FROM profiles WHERE lower(custom_domain) = ? AND id != ?').get(cleanDomain, req.user!.profileId);
        if (conflict) {
          return res.status(409).json({ error: `The custom domain "${cleanDomain}" is already mapped to another LIINX profile.` });
        }
        if (cleanDomain !== existing.custom_domain) {
          updatedCustomDomain = cleanDomain;
          customDomainVerified = 0; // Requires re-verification whenever custom domain is modified
        }
      }
    }

    const now = Date.now();
    const updatedDisplayName = displayName !== undefined ? displayName : existing.display_name;
    const updatedBio = bio !== undefined ? bio : existing.bio;
    const updatedAvatarUrl = avatarUrl !== undefined ? avatarUrl : existing.avatar_url;
    const updatedCategory = category !== undefined ? category : existing.category;
    const updatedThemeId = themeId !== undefined ? themeId : existing.theme_id;
    const updatedHideBranding = hideBranding !== undefined ? (hideBranding ? 1 : 0) : existing.hide_branding;
    const updatedGaMeasurementId = gaMeasurementId !== undefined ? gaMeasurementId : existing.ga_measurement_id;
    const updatedMetaPixelId = metaPixelId !== undefined ? metaPixelId : existing.meta_pixel_id;
    const updatedCustomCss = customCss !== undefined ? customCss : existing.custom_css;
    const updatedCustomFontUrl = customFontUrl !== undefined ? customFontUrl : existing.custom_font_url;
    const updatedShareTitle = shareTitle !== undefined ? shareTitle : existing.share_title;
    const updatedShareDescription = shareDescription !== undefined ? shareDescription : existing.share_description;
    const updatedShareImageUrl = shareImageUrl !== undefined ? shareImageUrl : existing.share_image_url;
    const updatedFooterLogoUrl = footerLogoUrl !== undefined ? footerLogoUrl : existing.footer_logo_url;
    const updatedBackgroundMediaUrl = backgroundMediaUrl !== undefined ? backgroundMediaUrl : existing.background_media_url;
    const updatedBackgroundMediaType = backgroundMediaType !== undefined ? backgroundMediaType : existing.background_media_type;
    const updatedPageRedirectUrl = pageRedirectUrl !== undefined ? pageRedirectUrl : existing.page_redirect_url;
    const updatedPageRedirectUntil = pageRedirectUntil !== undefined ? pageRedirectUntil : existing.page_redirect_until;
    const updatedCustomThemeJson = customTheme !== undefined 
      ? (customTheme ? JSON.stringify(customTheme) : null) 
      : existing.custom_theme_json;
    const updatedSocialsJson = socials !== undefined 
      ? (socials ? JSON.stringify(socials) : null) 
      : existing.socials_json;

    const saved = db.prepare(`
      UPDATE profiles
      SET display_name = ?,
          username = ?,
          bio = ?,
          avatar_url = ?,
          category = ?,
          theme_id = ?,
          hide_branding = ?,
          ga_measurement_id = ?,
          meta_pixel_id = ?,
          custom_domain = ?,
          custom_domain_verified = ?,
          custom_css = ?,
          custom_font_url = ?,
          share_title = ?, share_description = ?, share_image_url = ?, footer_logo_url = ?,
          background_media_url = ?, background_media_type = ?, page_redirect_url = ?, page_redirect_until = ?,
          custom_theme_json = ?,
          socials_json = ?,
          updated_at = ?
      WHERE id = ? AND (? IS NULL OR updated_at = ?)
    `).run(
      updatedDisplayName,
      updatedUsername,
      updatedBio || '',
      updatedAvatarUrl || '',
      updatedCategory || 'Creator',
      updatedThemeId || 'editorial-stone',
      updatedHideBranding,
      updatedGaMeasurementId,
      updatedMetaPixelId,
      updatedCustomDomain,
      customDomainVerified,
      updatedCustomCss,
      updatedCustomFontUrl,
      updatedShareTitle, updatedShareDescription, updatedShareImageUrl, updatedFooterLogoUrl,
      updatedBackgroundMediaUrl, updatedBackgroundMediaType, updatedPageRedirectUrl, updatedPageRedirectUntil,
      updatedCustomThemeJson,
      updatedSocialsJson,
      now,
      req.user!.profileId,
      revision ?? null,
      revision ?? null
    );

    if (saved.changes === 0) return res.status(409).json({ error: 'This profile changed in another tab. Reload it before retrying your changes.' });

    invalidatePublicProfileCache(existing.id);
    let token: string | undefined;
    if (updatedUsername !== existing.username) {
      token = signJwt({ userId: req.user!.userId, email: req.user!.email, profileId: existing.id, username: updatedUsername, sessionVersion: Number((db.prepare('SELECT session_version FROM users WHERE id = ?').get(req.user!.userId) as any)?.session_version || 1) });
      res.setHeader('Set-Cookie', `liinx_session=${encodeURIComponent(token)}; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    }
    res.json({ success: true, revision: now, ...(token ? { token } : {}), message: 'Profile updated successfully.' });
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

    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/.test(cleanDomain)) {
      return res.status(400).json({ error: 'Invalid domain format. Example: links.yourdomain.com' });
    }

    const expectedTarget = brand.cnameTarget;
    let isVerified = false;
    let cnameRecords: string[] = [];

    try {
      cnameRecords = await dns.promises.resolveCname(cleanDomain);
      isVerified = cnameRecords.some(r => r.replace(/\.$/, '').toLowerCase() === expectedTarget);
    } catch (dnsErr) {
      // DNS record may not yet be configured or propagating
    }

    // Update verified status in database upon successful verification
    const saved = db.prepare('SELECT custom_domain FROM profiles WHERE id = ?').get(req.user!.profileId) as { custom_domain?: string | null } | undefined;
    if (!saved?.custom_domain || saved.custom_domain !== cleanDomain) {
      return res.status(409).json({ error: 'Verify the exact custom domain saved on this profile.' });
    }
    if (isVerified) {
      db.prepare('UPDATE profiles SET custom_domain_verified = 1, updated_at = ? WHERE id = ? AND custom_domain = ?').run(
        Date.now(),
        req.user!.profileId,
        cleanDomain
      );
    }

    res.json({
      domain: cleanDomain,
      verified: isVerified,
      expectedTarget,
      cnameRecords,
      message: isVerified
        ? 'DNS CNAME verified successfully! Traffic is properly routed.'
        : `DNS verification pending. Please ensure a CNAME record for "${cleanDomain}" points to "${expectedTarget}". Note that DNS propagation may take a few minutes.`
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

    db.prepare('UPDATE profiles SET plan = ?, updated_at = ? WHERE id = ?').run(
      plan,
      Date.now(),
      req.user!.profileId
    );

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
      SELECT id, username, display_name as displayName, avatar_url as avatarUrl, plan, category, created_at as createdAt
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

// Authenticated: Create a new profile under the same account (respecting plan limits)
profilesRouter.post('/studio/profiles', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const parse = createProfileSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const userId = req.user!.userId;
    const cleanUsername = parse.data.username.toLowerCase().trim();
    const displayName = parse.data.displayName.trim();
    const duplicateSource = parse.data.duplicateProfileId ? db.prepare('SELECT * FROM profiles WHERE id = ? AND user_id = ?').get(parse.data.duplicateProfileId, userId) as any : null;
    if (parse.data.duplicateProfileId && !duplicateSource) return res.status(404).json({ error: 'The profile to duplicate was not found.' });

    // Check user's primary/active profile plan to determine allowed limit
    // Profile limits are centralized in the entitlement policy.
    const activeProfile = db.prepare('SELECT plan FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    const planRow = db.prepare("SELECT plan FROM profiles WHERE user_id = ? ORDER BY CASE plan WHEN 'studio' THEN 3 WHEN 'pro' THEN 2 ELSE 1 END DESC LIMIT 1").get(userId) as any;
    const userPlan = planRow?.plan || activeProfile?.plan || 'free';
    const maxProfiles = entitlementsFor(userPlan).maxProfiles;

    const currentCountRow = db.prepare('SELECT COUNT(*) as count FROM profiles WHERE user_id = ?').get(userId) as { count: number };
    const currentCount = currentCountRow ? currentCountRow.count : 0;

    if (currentCount >= maxProfiles) {
      return res.status(403).json({
        error: `Your current ${userPlan.toUpperCase()} plan allows up to ${maxProfiles} bio profile(s). Please upgrade to create more.`
      });
    }

    if (RESERVED_USERNAMES.includes(cleanUsername as any)) {
      return res.status(400).json({ error: 'This username is reserved and cannot be claimed.' });
    }

    // Check username availability
    const existing = db.prepare('SELECT id FROM profiles WHERE username = ?').get(cleanUsername);
    if (existing) {
      return res.status(409).json({ error: `The handle @${cleanUsername} is already taken.` });
    }

    const newProfileId = createId('prf');
    const now = Date.now();
    const sourcePages = duplicateSource ? db.prepare('SELECT * FROM pages WHERE profile_id = ? ORDER BY sort_order ASC, created_at ASC, id ASC').all(duplicateSource.id) as any[] : [];
    const sourceBlocks = duplicateSource ? db.prepare('SELECT * FROM blocks WHERE profile_id = ? ORDER BY position ASC, created_at ASC, id ASC').all(duplicateSource.id) as any[] : [];
    const sourceHome = sourcePages.find(page => page.is_home);

    db.exec('BEGIN');
    db.prepare(`
      INSERT INTO profiles (
        id, user_id, username, display_name, bio, avatar_url, category, theme_id, plan,
        hide_branding, ga_measurement_id, meta_pixel_id, custom_css, custom_font_url,
        custom_theme_json, socials_json, share_title, share_description, share_image_url,
        footer_logo_url, background_media_url, background_media_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newProfileId,
      userId,
      cleanUsername,
      displayName,
      duplicateSource?.bio || '',
      duplicateSource?.avatar_url || '',
      duplicateSource?.category || 'Creator',
      duplicateSource?.theme_id || 'editorial-stone',
      userPlan,
      duplicateSource?.hide_branding || 0,
      null,
      null,
      duplicateSource?.custom_css || null,
      duplicateSource?.custom_font_url || null,
      duplicateSource?.custom_theme_json || null,
      duplicateSource?.socials_json || null,
      duplicateSource?.share_title || null,
      duplicateSource?.share_description || null,
      duplicateSource?.share_image_url || null,
      duplicateSource?.footer_logo_url || null,
      duplicateSource?.background_media_url || null,
      duplicateSource?.background_media_type || null,
      now,
      now
    );

    const homePageId = createId('page');
    db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, 'home', ?, ?, 0, 1, 1, ?, ?)`)
      .run(homePageId, newProfileId, sourceHome?.title || displayName, sourceHome?.description || null, now, now);

    // Add starter block
    db.prepare(`
      INSERT INTO blocks (
        id, profile_id, type, title, url, position, page_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      createId('blk'),
      newProfileId,
      'link',
      'My Website',
      'https://example.com',
      0,
      homePageId,
      now,
      now
    );

    if (duplicateSource) {
      db.prepare('DELETE FROM blocks WHERE profile_id = ?').run(newProfileId);
      db.prepare('DELETE FROM pages WHERE profile_id = ? AND id != ?').run(newProfileId, homePageId);
      const pageMap = new Map<string, string>();
      const blockMap = new Map<string, string>();
      for (const sourcePage of sourcePages) pageMap.set(sourcePage.id, sourcePage.is_home ? homePageId : createId('page'));
      for (const sourceBlock of sourceBlocks) blockMap.set(sourceBlock.id, createId('blk'));
      const insertPage = db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const sourcePage of sourcePages) {
        const copiedId = pageMap.get(sourcePage.id)!;
        if (!sourcePage.is_home) insertPage.run(copiedId, newProfileId, sourcePage.slug, sourcePage.title, sourcePage.description, sourcePage.sort_order, 0, sourcePage.published, now, now);
      }
      const copyBlock = db.prepare(`INSERT INTO blocks (id, profile_id, type, title, url, subtitle, icon, badge, highlighted, position, start_at, end_at, page_id, extra_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const block of sourceBlocks) {
        const extra = duplicatedBlockExtra(block.type, block.extra_json);
        let remappedExtra = extra;
        if (extra) remappedExtra = JSON.stringify(remapDuplicatedValue(JSON.parse(extra), pageMap, blockMap));
        const remappedUrl = typeof block.url === 'string' ? remapDuplicatedValue(block.url, pageMap, blockMap) : block.url;
        copyBlock.run(blockMap.get(block.id)!, newProfileId, block.type, block.title, remappedUrl, block.subtitle, block.icon, block.badge, block.highlighted, block.position, block.start_at, block.end_at, pageMap.get(block.page_id) || homePageId, remappedExtra, now, now);
      }
    }

    db.exec('COMMIT');

    // Sign new token for the newly created profile
    const token = signJwt({
      userId,
      email: req.user!.email,
      profileId: newProfileId,
      username: cleanUsername,
      sessionVersion: Number((db.prepare('SELECT session_version FROM users WHERE id = ?').get(userId) as any)?.session_version || 1)
    });
    res.setHeader('Set-Cookie', `liinx_session=${encodeURIComponent(token)}; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

    res.status(201).json({
      success: true,
      profile: {
        id: newProfileId,
        username: cleanUsername,
        displayName,
        plan: userPlan
      },
      token
    });
  } catch (err: any) {
    try { db.exec('ROLLBACK'); } catch {}
    console.error('Create profile error:', err);
    res.status(500).json({ error: 'Failed to create profile.' });
  }
});

// Authenticated: Delete a non-active profile owned by the current account.
profilesRouter.delete('/studio/profiles/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const target = db.prepare('SELECT id FROM profiles WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.userId) as { id: string } | undefined;
    if (!target) return res.status(404).json({ error: 'Profile not found or does not belong to your account.' });
    if (target.id === req.user!.profileId) return res.status(409).json({ error: 'Switch to another profile before deleting this profile.' });
    const count = db.prepare('SELECT COUNT(*) as count FROM profiles WHERE user_id = ?').get(req.user!.userId) as { count: number };
    if (count.count <= 1) return res.status(400).json({ error: 'Your account must keep at least one profile.' });
    db.transaction(() => {
      for (const table of ['link_clicks', 'profile_views', 'newsletter_subscribers', 'form_submissions', 'instagram_sync', 'api_keys', 'uploaded_files', 'blocks', 'pages']) {
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

    const token = signJwt({
      userId,
      email: req.user!.email,
      profileId: profile.id,
      username: profile.username,
      sessionVersion: Number((db.prepare('SELECT session_version FROM users WHERE id = ?').get(userId) as any)?.session_version || 1)
    });
    res.setHeader('Set-Cookie', `liinx_session=${encodeURIComponent(token)}; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

    res.json({
      success: true,
      token,
      profile: {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        plan: profile.plan
      }
    });
  } catch (err: any) {
    console.error('Select profile error:', err);
    res.status(500).json({ error: 'Failed to switch profile.' });
  }
});
