import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { createId } from '../utils/ids.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const formsRouter = Router();
function normalizeFormFields(value: unknown): any[] {
  if (!Array.isArray(value)) return [];
  return value.filter(field => field && typeof field === 'object' && typeof field.name === 'string').map(field => ({
    ...field,
    required: field.required === undefined ? true : Boolean(field.required)
  }));
}
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
  const configured = db.prepare('SELECT extra_json FROM blocks WHERE id = ?').get(parsed.data.blockId) as { extra_json?: string | null };
  let fields: any[] = [];
  try { fields = normalizeFormFields(JSON.parse(configured.extra_json || '{}').fields); } catch { return res.status(500).json({ error: 'This form configuration is invalid.' }); }
  if (!Array.isArray(fields) || fields.length === 0) return res.status(409).json({ error: 'This form has no configured fields.' });
  const configuredNames = new Set(fields.map(field => field.name).filter((name): name is string => typeof name === 'string' && /^[A-Za-z0-9_-]+$/.test(name)));
  for (const submittedName of Object.keys(parsed.data.fields)) if (!configuredNames.has(submittedName)) return res.status(400).json({ error: 'The form contains an unknown field.' });
  for (const field of fields) {
    if (field.required && !parsed.data.fields[field.name]?.trim()) return res.status(400).json({ error: `${field.label || field.name} is required.` });
    const value = parsed.data.fields[field.name];
    if (!value) continue;
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (field.type === 'tel' && !/^[+0-9() .-]{7,30}$/.test(value)) return res.status(400).json({ error: 'Enter a valid phone number.' });
  }
  db.prepare('INSERT INTO form_submissions (id, profile_id, block_id, fields_json, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(createId('form'), parsed.data.profileId, parsed.data.blockId, JSON.stringify(parsed.data.fields), Date.now());
  res.status(201).json({ success: true, message: 'Thanks — your response was sent.' });
});

formsRouter.get('/api/studio/form-submissions', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db.prepare(`SELECT id, block_id AS blockId, fields_json AS fieldsJson, created_at AS createdAt FROM form_submissions WHERE profile_id = ? ORDER BY created_at DESC LIMIT 500`).all(req.user!.profileId) as any[];
  res.json({ submissions: rows.map(row => ({ ...row, fields: JSON.parse(row.fieldsJson) })) });
});
