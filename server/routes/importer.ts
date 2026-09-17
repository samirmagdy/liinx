import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { importFromPublicUrl, commitImportedLinks } from '../services/importer.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { isHttpUrl } from '../utils/urlValidation.js';

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

    const result = commitImportedLinks(req.user!.profileId, parse.data);

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
