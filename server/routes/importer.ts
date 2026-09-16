import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { importFromPublicUrl } from '../services/importer.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { isHttpUrl } from '../utils/urlValidation.js';
import { createId } from '../utils/ids.js';
import { invalidatePublicProfileCache } from './profiles.js';

export const importerRouter = Router();

const previewSchema = z.object({
  url: z.string().min(1, 'Profile URL is required').max(2048)
});

const commitSchema = z.object({
  links: z.array(z.object({
    title: z.string().min(1).max(150),
    url: z.string().refine(isHttpUrl, 'Only HTTP(S) links are allowed.'),
    subtitle: z.string().max(250).optional()
  })).max(100),
  updateProfileInfo: z.boolean().optional(),
  displayName: z.string().max(120).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().refine(isHttpUrl, 'Only HTTP(S) avatar URLs are allowed.').optional()
});

// Authenticated: Preview imported links from public URL
importerRouter.post('/studio/import/preview', requireAuth, sharedRateLimit({ name: 'import-preview', limit: 10, windowMs: 60 * 60 * 1000 }), async (req: AuthenticatedRequest, res) => {
  try {
    const parse = previewSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const data = await importFromPublicUrl(parse.data.url);
    res.json({
      success: true,
      data
    });
  } catch (err: any) {
    console.error('Import preview error:', err);
    res.status(400).json({ error: err.message || 'Failed to import profile data.' });
  }
});

// Authenticated: Commit imported links into profile
importerRouter.post('/studio/import/commit', requireAuth, sharedRateLimit({ name: 'import-commit', limit: 20, windowMs: 60 * 60 * 1000 }), async (req: AuthenticatedRequest, res) => {
  try {
    const parse = commitSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { links, updateProfileInfo, displayName, bio, avatarUrl } = parse.data;
    const profileId = req.user!.profileId;

    // Get current max position
    let homePage = db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(profileId) as { id: string } | undefined;
    if (!homePage) {
      const profile = db.prepare('SELECT display_name as displayName FROM profiles WHERE id = ?').get(profileId) as { displayName?: string } | undefined;
      if (!profile) return res.status(404).json({ error: 'Creator profile not found.' });
      const homeId = createId('page');
      const now = Date.now();
      db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, 'home', ?, NULL, 0, 1, 1, ?, ?)`).run(homeId, profileId, profile.displayName || 'Home', now, now);
      homePage = { id: homeId };
    }
    const maxPosRow = db.prepare('SELECT MAX(position) as max_pos FROM blocks WHERE profile_id = ? AND page_id = ?').get(profileId, homePage.id) as { max_pos: number | null };
    let currentPos = (maxPosRow?.max_pos ?? -1) + 1;

    const now = Date.now();
    const insertBlock = db.prepare(`
      INSERT INTO blocks (
        id, profile_id, type, title, url, subtitle, position, page_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((linkItems: typeof links) => {
      for (const item of linkItems) {
        const id = createId('blk');
        insertBlock.run(
          id,
          profileId,
          'link',
          item.title,
          item.url,
          item.subtitle || null,
          currentPos++,
          homePage.id,
          now,
          now
        );
      }

      if (updateProfileInfo) {
        const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId) as any;
        if (profile) {
          db.prepare(`
            UPDATE profiles 
            SET display_name = COALESCE(?, display_name),
                bio = COALESCE(?, bio),
                avatar_url = COALESCE(?, avatar_url),
                updated_at = ?
            WHERE id = ?
          `).run(
            displayName || null,
            bio || null,
            avatarUrl || null,
            now,
            profileId
          );
        }
      }
    });

    insertMany(links);
    invalidatePublicProfileCache(profileId);

    res.json({
      success: true,
      count: links.length,
      message: `Successfully imported ${links.length} links into your LIINX profile!`
    });
  } catch (err: any) {
    console.error('Import commit error:', err);
    res.status(500).json({ error: err.message || 'Failed to save imported links.' });
  }
});
