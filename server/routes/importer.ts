import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { importFromPublicUrl, isSupportedImportUrl } from '../services/importer.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { isHttpUrl } from '../utils/urlValidation.js';
import { createId } from '../utils/ids.js';
import { invalidatePublicProfileCache } from './profiles.js';

export const importerRouter = Router();

const previewSchema = z.object({
  url: z.string().min(1, 'Profile URL is required').max(2048).refine(value => {
    const normalized = value.trim();
    return /^(?:https?):\/\/[^\s]+$/i.test(normalized) || /^(?:@?[a-z0-9._-]+)$|^(?:www\.)?(?:linktr\.ee|beacons\.ai|bio\.fm)\/[a-z0-9._-]+$/i.test(normalized);
  }, 'Only public Linktree, Beacons, or Bio.fm profile URLs are supported.')
});

const commitSchema = z.object({
  pageId: z.string().min(1).max(100).optional(),
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
    const safeLinks = data.links.filter(link => isHttpUrl(link.url));
    const warnings = [...new Set([...(data.warnings || []), ...(safeLinks.length < data.links.length ? ['Some source links were skipped because their destinations were not safe HTTP(S) links.'] : [])])];
    res.json({
      success: true,
      data: {
        ...data,
        links: safeLinks,
        warnings
      }
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

    const { links, pageId, updateProfileInfo, displayName, bio, avatarUrl } = parse.data;
    const profileId = req.user!.profileId;
    const now = Date.now();
    const result = db.transaction(() => {
      const profile = db.prepare('SELECT display_name as displayName FROM profiles WHERE id = ?').get(profileId) as { displayName?: string } | undefined;
      if (!profile) throw new Error('Creator profile not found.');
      let destinationPage = pageId
        ? db.prepare('SELECT id FROM pages WHERE id = ? AND profile_id = ?').get(pageId, profileId) as { id: string } | undefined
        : db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(profileId) as { id: string } | undefined;
      if (pageId && !destinationPage) throw new Error('The selected destination page is unavailable.');
      if (!destinationPage) {
        const homeId = createId('page');
        db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, 'home', ?, NULL, 0, 1, 1, ?, ?)`).run(homeId, profileId, profile.displayName || 'Home', now, now);
        destinationPage = { id: homeId };
      }
      const maxPosRow = db.prepare('SELECT MAX(position) as max_pos FROM blocks WHERE profile_id = ? AND page_id = ?').get(profileId, destinationPage.id) as { max_pos: number | null };
      let currentPos = (maxPosRow?.max_pos ?? -1) + 1;
      const existingUrls = new Set((db.prepare("SELECT url FROM blocks WHERE profile_id = ? AND page_id = ? AND type = 'link' AND url IS NOT NULL").all(profileId, destinationPage.id) as Array<{ url: string }>).map(row => row.url));
      const insertBlock = db.prepare(`INSERT INTO blocks (id, profile_id, type, title, url, subtitle, position, page_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      let imported = 0;
      let skippedDuplicates = 0;
      for (const item of links) {
        if (existingUrls.has(item.url)) { skippedDuplicates++; continue; }
        const id = createId('blk');
        insertBlock.run(
          id,
          profileId,
          'link',
          item.title,
          item.url,
          item.subtitle || null,
          currentPos++,
          destinationPage.id,
          now,
          now
        );
        existingUrls.add(item.url);
        imported++;
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
      return { imported, skippedDuplicates };
    })();
    invalidatePublicProfileCache(profileId);

    res.json({
      success: true,
      count: result.imported,
      skippedDuplicates: result.skippedDuplicates,
      message: result.imported > 0 ? `Successfully imported ${result.imported} links into your LIINX profile!` : 'No new links were imported.'
    });
  } catch (err: any) {
    console.error('Import commit error:', err);
    const status = err?.message === 'The selected destination page is unavailable.' || err?.message === 'Creator profile not found.' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Failed to save imported links.' });
  }
});
