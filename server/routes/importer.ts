import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { importFromPublicUrl } from '../services/importer.js';

export const importerRouter = Router();

const previewSchema = z.object({
  url: z.string().min(1, 'Profile URL is required')
});

const commitSchema = z.object({
  links: z.array(z.object({
    title: z.string().min(1),
    url: z.string().url(),
    subtitle: z.string().optional()
  })),
  updateProfileInfo: z.boolean().optional(),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional()
});

// Authenticated: Preview imported links from public URL
importerRouter.post('/studio/import/preview', requireAuth, async (req: AuthenticatedRequest, res) => {
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
importerRouter.post('/studio/import/commit', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parse = commitSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { links, updateProfileInfo, displayName, bio, avatarUrl } = parse.data;
    const profileId = req.user!.profileId;

    // Get current max position
    const maxPosRow = db.prepare('SELECT MAX(position) as max_pos FROM blocks WHERE profile_id = ?').get(profileId) as { max_pos: number | null };
    let currentPos = (maxPosRow?.max_pos ?? -1) + 1;

    const now = Date.now();
    const insertBlock = db.prepare(`
      INSERT INTO blocks (
        id, profile_id, type, title, url, subtitle, position, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((linkItems: typeof links) => {
      for (const item of linkItems) {
        const id = `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        insertBlock.run(
          id,
          profileId,
          'link',
          item.title,
          item.url,
          item.subtitle || null,
          currentPos++,
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
