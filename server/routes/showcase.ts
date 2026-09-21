import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { normalizePublicSocials } from '../../shared/index.js';
import {
  invalidatePublicProfileCache,
  publicBlocksForPage,
  safeJsonParse
} from './profiles.js';
import type { ThemeConfig } from '../../shared/types/index.js';

export const showcaseRouter = Router();

/** The marketing page shows a wall, not a directory. */
const SHOWCASE_LIMIT = 12;

const consentSchema = z.object({ optedIn: z.boolean() }).strict();

const showcaseProfilesSql = `
  SELECT p.id, p.username, p.display_name, p.bio, p.avatar_url, p.category, p.verified,
         p.theme_id, p.custom_theme_json, p.socials_json
  FROM profiles p
  WHERE p.showcase_opt_in = 1
    AND EXISTS (
      SELECT 1 FROM pages pg
      WHERE pg.profile_id = p.id AND pg.is_home = 1 AND pg.published = 1
    )
  ORDER BY p.updated_at DESC
  LIMIT ${SHOWCASE_LIMIT}
`;

const publishedHomeSql = 'SELECT id, slug, title, description, sort_order as sortOrder, is_home as isHome, published FROM pages WHERE profile_id = ? AND is_home = 1 AND published = 1 ORDER BY sort_order ASC LIMIT 1';

function showcaseEntry(row: any, now: number) {
  const home = db.prepare(publishedHomeSql).get(row.id) as any;
  if (!home) return null;
  const blocks = publicBlocksForPage(row, home, now).map(block => ({ ...block, pageId: home.id }));
  if (!blocks.length) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio || '',
    avatarUrl: row.avatar_url || '',
    category: row.category || 'Creator',
    verified: Boolean(row.verified),
    themeId: row.theme_id || 'editorial-stone',
    customTheme: safeJsonParse<ThemeConfig | null>(row.custom_theme_json, null),
    socials: normalizePublicSocials(safeJsonParse(row.socials_json, [])),
    blocks,
    url: `/@${row.username}`
  };
}

/**
 * Consent is read from the rows on every hit instead of cached: withdrawing it, or
 * unpublishing the page, has to empty the gallery on the next request. The query is
 * bounded by SHOWCASE_LIMIT and rate-limited, so the honest answer stays cheap.
 */
showcaseRouter.get('/showcase', sharedRateLimit({ name: 'showcase', limit: 60, windowMs: 60_000 }), (_req, res) => {
  try {
    const now = Date.now();
    const rows = db.prepare(showcaseProfilesSql).all() as any[];
    const profiles = rows.map(row => showcaseEntry(row, now)).filter(Boolean);
    res.json({ profiles });
  } catch (err: any) {
    console.error('Showcase listing error:', err);
    res.status(500).json({ error: 'The gallery is unavailable right now.' });
  }
});

/**
 * Authenticated: offer or withdraw this profile from the public gallery. Only the
 * caller own row is ever written, and `updated_at` stays put so the Studio revision
 * check on the content editor is not invalidated by a consent click.
 */
showcaseRouter.put('/studio/profile/showcase', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const parsed = consentSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const result = db.prepare('UPDATE profiles SET showcase_opt_in = ? WHERE id = ?')
      .run(parsed.data.optedIn ? 1 : 0, req.user!.profileId);
    if (result.changes === 0) return res.status(404).json({ error: 'Profile not found.' });
    invalidatePublicProfileCache(req.user!.profileId);
    res.json({ success: true, showcaseOptIn: parsed.data.optedIn });
  } catch (err: any) {
    console.error('Showcase consent error:', err);
    res.status(500).json({ error: 'We could not save that choice. Please try again.' });
  }
});
