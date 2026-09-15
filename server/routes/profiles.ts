import { Router } from 'express';
import { z } from 'zod';
import dns from 'dns';
import { db } from '../db.js';
import { signJwt } from '../auth.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { RESERVED_USERNAMES } from '../../src/config/brand.js';

export const profilesRouter = Router();

function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

// Public: Get profile by username
profilesRouter.get('/profiles/:username', (req, res) => {
  try {
    const cleanUsername = req.params.username.toLowerCase().trim();
    const profile = db.prepare('SELECT * FROM profiles WHERE lower(username) = ?').get(cleanUsername) as any;

    if (!profile) {
      return res.status(404).json({ error: `Creator profile @${cleanUsername} was not found.` });
    }

    const now = Date.now();
    const blocks = db.prepare(`
      SELECT * FROM blocks 
      WHERE profile_id = ? 
        AND (start_at IS NULL OR start_at <= ?) 
        AND (end_at IS NULL OR end_at >= ?)
      ORDER BY position ASC
    `).all(profile.id, now, now) as any[];

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
        type: b.type,
        title: b.title,
        url: b.url,
        subtitle: b.subtitle,
        icon: b.icon,
        badge: b.badge,
        highlighted: Boolean(b.highlighted),
        startAt: b.start_at || null,
        endAt: b.end_at || null,
        clicks: clickMap.get(b.id) || 0
      };

      if (extra) {
        Object.assign(baseBlock, extra);
      }

      return baseBlock;
    });

    res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
    res.json({
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      bio: profile.bio || '',
      avatarUrl: profile.avatar_url || '',
      category: profile.category || 'Creator',
      verified: Boolean(profile.verified),
      themeId: profile.theme_id || 'editorial-stone',
      plan: profile.plan || 'free',
      hideBranding: Boolean(profile.hide_branding),
      gaMeasurementId: profile.ga_measurement_id || null,
      metaPixelId: profile.meta_pixel_id || null,
      customDomain: profile.custom_domain || null,
      customCss: profile.custom_css || null,
      customFontUrl: profile.custom_font_url || null,
      customTheme: safeJsonParse(profile.custom_theme_json, null),
      socials: safeJsonParse(profile.socials_json, []),
      blocks: formattedBlocks
    });
  } catch (err: any) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// Public: Resolve profile by custom domain
profilesRouter.get('/profiles/by-domain/:domain', (req, res) => {
  try {
    const domain = req.params.domain.toLowerCase().trim();
    const profile = db.prepare('SELECT username FROM profiles WHERE lower(custom_domain) = ? AND custom_domain_verified = 1').get(domain) as { username: string } | undefined;
    if (!profile) {
      return res.status(404).json({ error: `No profile mapped to custom domain ${domain}` });
    }
    return res.redirect(307, `/api/profiles/${encodeURIComponent(profile.username)}`);
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
        type: b.type,
        title: b.title,
        url: b.url,
        subtitle: b.subtitle,
        icon: b.icon,
        badge: b.badge,
        highlighted: Boolean(b.highlighted),
        startAt: b.start_at || null,
        endAt: b.end_at || null,
        clicks: clickMap.get(b.id) || 0
      };

      if (extra) {
        Object.assign(baseBlock, extra);
      }

      return baseBlock;
    });

    res.json({
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      bio: profile.bio || '',
      avatarUrl: profile.avatar_url || '',
      category: profile.category || 'Creator',
      verified: Boolean(profile.verified),
      themeId: profile.theme_id || 'editorial-stone',
      plan: profile.plan || 'free',
      hideBranding: Boolean(profile.hide_branding),
      gaMeasurementId: profile.ga_measurement_id || null,
      metaPixelId: profile.meta_pixel_id || null,
      customDomain: profile.custom_domain || null,
      customCss: profile.custom_css || null,
      customFontUrl: profile.custom_font_url || null,
      customTheme: safeJsonParse(profile.custom_theme_json, null),
      socials: safeJsonParse(profile.socials_json, []),
      blocks: formattedBlocks
    });
  } catch (err: any) {
    console.error('Studio profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve creator profile.' });
  }
});

const updateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name cannot be empty').max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().optional(),
  category: z.string().max(50).optional(),
  themeId: z.string().optional(),
  hideBranding: z.boolean().optional(),
  gaMeasurementId: z.string().max(50).nullable().optional(),
  metaPixelId: z.string().max(50).nullable().optional(),
  customDomain: z.string().max(100).nullable().optional(),
  customCss: z.string().max(10000).nullable().optional(),
  customFontUrl: z.string().max(300).nullable().optional(),
  customTheme: z.any().optional(),
  socials: z.array(z.object({
    platform: z.string(),
    url: z.string()
  })).optional()
});

// Authenticated: Update studio profile
profilesRouter.put('/studio/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const parse = updateProfileSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { 
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
      customTheme, 
      socials 
    } = parse.data;

    const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Profile not found.' });
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
        if (existing.plan === 'free') {
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
    const updatedCustomThemeJson = customTheme !== undefined 
      ? (customTheme ? JSON.stringify(customTheme) : null) 
      : existing.custom_theme_json;
    const updatedSocialsJson = socials !== undefined 
      ? (socials ? JSON.stringify(socials) : null) 
      : existing.socials_json;

    db.prepare(`
      UPDATE profiles
      SET display_name = ?,
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
          custom_theme_json = ?,
          socials_json = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      updatedDisplayName,
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
      updatedCustomThemeJson,
      updatedSocialsJson,
      now,
      req.user!.profileId
    );

    res.json({ success: true, message: 'Profile updated successfully.' });
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

    const expectedTarget = 'cname.liinx.app';
    let isVerified = false;
    let cnameRecords: string[] = [];

    try {
      cnameRecords = await dns.promises.resolveCname(cleanDomain);
      isVerified = cnameRecords.some(r => 
        r.toLowerCase().includes('liinx') || 
        r.toLowerCase().includes('vercel') || 
        r.toLowerCase().includes('localhost')
      );
    } catch (dnsErr) {
      // DNS record may not yet be configured or propagating
    }

    // Update verified status in database upon successful verification
    if (isVerified) {
      db.prepare('UPDATE profiles SET custom_domain_verified = 1, updated_at = ? WHERE id = ?').run(
        Date.now(),
        req.user!.profileId
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
  displayName: z.string().min(1, 'Display name cannot be empty').max(100)
});

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

    // Check user's primary/active profile plan to determine allowed limit
    // Free: 1 profile, Pro: 5 profiles, Studio: 25 profiles
    const activeProfile = db.prepare('SELECT plan FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    const userPlan = activeProfile?.plan || 'free';
    const maxProfiles = userPlan === 'studio' ? 25 : userPlan === 'pro' ? 5 : 1;

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

    const newProfileId = 'prf_' + Math.random().toString(36).substring(2, 10);
    const now = Date.now();

    db.prepare(`
      INSERT INTO profiles (
        id, user_id, username, display_name, bio, avatar_url, category, theme_id, plan, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newProfileId,
      userId,
      cleanUsername,
      displayName,
      '',
      '',
      'Creator',
      'editorial-stone',
      userPlan,
      now,
      now
    );

    // Add starter block
    db.prepare(`
      INSERT INTO blocks (
        id, profile_id, type, title, url, position, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'blk_' + Math.random().toString(36).substring(2, 10),
      newProfileId,
      'link',
      'My Website',
      'https://example.com',
      0,
      now,
      now
    );

    // Sign new token for the newly created profile
    const token = signJwt({
      userId,
      email: req.user!.email,
      profileId: newProfileId,
      username: cleanUsername
    });

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
    console.error('Create profile error:', err);
    res.status(500).json({ error: 'Failed to create profile.' });
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
      username: profile.username
    });

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
