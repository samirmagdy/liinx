import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { createId } from '../utils/ids.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const formsRouter = Router();
const submissionSchema = z.object({
  profileId: z.string().min(1).max(100),
  blockId: z.string().min(1).max(100),
  fields: z.record(z.string(), z.string().trim().max(2000)).refine(value => Object.keys(value).length <= 20)
});

formsRouter.post('/api/forms/submit', sharedRateLimit({ name: 'form-submit', limit: 20, windowMs: 60 * 60 * 1000 }), (req, res) => {
  const parsed = submissionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please complete the form with valid values.' });
  const block = db.prepare('SELECT id FROM blocks WHERE id = ? AND profile_id = ? AND type = ?').get(parsed.data.blockId, parsed.data.profileId, 'form');
  if (!block) return res.status(404).json({ error: 'This form is no longer available.' });
  db.prepare('INSERT INTO form_submissions (id, profile_id, block_id, fields_json, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(createId('form'), parsed.data.profileId, parsed.data.blockId, JSON.stringify(parsed.data.fields), Date.now());
  res.status(201).json({ success: true, message: 'Thanks — your response was sent.' });
});

formsRouter.get('/api/studio/form-submissions', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db.prepare(`SELECT id, block_id AS blockId, fields_json AS fieldsJson, created_at AS createdAt FROM form_submissions WHERE profile_id = ? ORDER BY created_at DESC LIMIT 500`).all(req.user!.profileId) as any[];
  res.json({ submissions: rows.map(row => ({ ...row, fields: JSON.parse(row.fieldsJson) })) });
});
