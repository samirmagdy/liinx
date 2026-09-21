import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { applySiteTemplateById } from '../services/siteComposition.js';
import { invalidatePublicProfileCache, studioBlocksForProfile, studioPagesForProfile, studioProfilePayload } from './profiles.js';

export const templatesRouter = Router();

const applySchema = z.object({
  mode: z.enum(['append', 'replace']).default('append')
}).strict();

// Applying a starter site writes a whole page tree, so it is throttled well above a
// ordinary field save but far below anything a creator would notice.
const applyLimit = sharedRateLimit({ name: 'apply-template', limit: 20, windowMs: 60 * 60 * 1000 });

// Authenticated: Apply a catalog starter site to the current profile.
templatesRouter.post('/studio/templates/:templateId/apply', requireAuth, applyLimit, (req: AuthenticatedRequest, res) => {
  try {
    const parsed = applySchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });
    const outcome = applySiteTemplateById(profile.id, req.params.templateId, parsed.data.mode);
    if (!outcome) return res.status(400).json({ error: 'That starter site does not exist.' });

    invalidatePublicProfileCache(profile.id);
    const refreshed = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profile.id) as any;
    const pages = studioPagesForProfile(refreshed);
    const blocks = studioBlocksForProfile(refreshed, pages);
    res.json({
      success: true,
      applied: { templateId: req.params.templateId, mode: parsed.data.mode, ...outcome },
      profile: studioProfilePayload(refreshed, pages, blocks)
    });
  } catch (err: any) {
    console.error('Apply starter site error:', err);
    res.status(500).json({ error: 'We could not set up that starter site. Please try again.' });
  }
});
