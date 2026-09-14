import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

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

    const blocks = db.prepare('SELECT * FROM blocks WHERE profile_id = ? ORDER BY position ASC').all(profile.id) as any[];

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
      customTheme: safeJsonParse(profile.custom_theme_json, null),
      socials: safeJsonParse(profile.socials_json, []),
      blocks: formattedBlocks
    });
  } catch (err: any) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
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

    const { displayName, bio, avatarUrl, category, themeId, customTheme, socials } = parse.data;

    const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const now = Date.now();
    const updatedDisplayName = displayName !== undefined ? displayName : existing.display_name;
    const updatedBio = bio !== undefined ? bio : existing.bio;
    const updatedAvatarUrl = avatarUrl !== undefined ? avatarUrl : existing.avatar_url;
    const updatedCategory = category !== undefined ? category : existing.category;
    const updatedThemeId = themeId !== undefined ? themeId : existing.theme_id;
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

// Authenticated: Update subscription plan
profilesRouter.put('/studio/plan', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { plan } = req.body;
    if (!['free', 'pro', 'studio'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan tier. Choose from free, pro, or studio.' });
    }

    db.prepare('UPDATE profiles SET plan = ?, updated_at = ? WHERE id = ?').run(
      plan,
      Date.now(),
      req.user!.profileId
    );

    res.json({ success: true, plan, message: `Successfully upgraded to ${plan.toUpperCase()} tier!` });
  } catch (err: any) {
    console.error('Update plan error:', err);
    res.status(500).json({ error: 'Failed to update subscription plan.' });
  }
});
