import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { importFromPublicUrl, commitImportedLinks } from '../services/importer.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { isHttpUrl } from '../utils/urlValidation.js';
import { importerPreviewSchema, importerCommitSchema } from '../../shared/index.js';

export const importerRouter = Router();

const previewSchema = importerPreviewSchema;
const commitSchema = importerCommitSchema;

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
