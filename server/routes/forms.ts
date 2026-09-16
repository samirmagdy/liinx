import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { createId } from '../utils/ids.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { normalizeFormFields, type FormFieldContract } from '../contracts.js';
import { getPhoneHref } from '../../src/utils/contactLinks.js';

export const formsRouter = Router();
const submissionSchema = z.object({
  profileId: z.string().min(1).max(100),
  blockId: z.string().min(1).max(100),
  submissionKey: z.string().regex(/^[A-Za-z0-9_-]{16,100}$/).optional(),
  consent: z.boolean().optional(),
  fields: z.record(z.string().regex(/^[A-Za-z0-9_-]{1,64}$/), z.string().trim().max(2000)).refine(value => Object.keys(value).length <= 20)
});

formsRouter.post('/api/forms/submit', sharedRateLimit({ name: 'form-submit', limit: 20, windowMs: 60 * 60 * 1000 }), (req, res) => {
  try {
    const parsed = submissionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Please complete the form with valid values.' });
    const block = db.prepare(`SELECT b.id, b.extra_json FROM blocks b JOIN pages p ON p.id = b.page_id AND p.profile_id = b.profile_id WHERE b.id = ? AND b.profile_id = ? AND b.type = 'form' AND p.published = 1`).get(parsed.data.blockId, parsed.data.profileId) as { id: string; extra_json?: string | null } | undefined;
    if (!block) return res.status(404).json({ error: 'This form is no longer available.' });
    let rawExtra: Record<string, unknown> = {};
    try { rawExtra = JSON.parse(block.extra_json || '{}') as Record<string, unknown>; } catch { return res.status(500).json({ error: 'This form configuration is invalid.' }); }
    const fields: FormFieldContract[] = normalizeFormFields(rawExtra.fields);
    if (Array.isArray(rawExtra.fields) && fields.length === 0) return res.status(409).json({ error: 'This form configuration is invalid.' });
    if (fields.length === 0) return res.status(409).json({ error: 'This form has no configured fields.' });
    if (rawExtra.consentRequired === true && parsed.data.consent !== true) return res.status(400).json({ error: 'Please confirm consent before sending this form.' });
    const configuredNames = new Set(fields.map(field => field.name));
    for (const submittedName of Object.keys(parsed.data.fields)) if (!configuredNames.has(submittedName)) return res.status(400).json({ error: 'The form contains an unknown field.' });
    for (const field of fields) {
      if (field.required && !parsed.data.fields[field.name]?.trim()) return res.status(400).json({ error: `${field.label} is required.` });
      const value = parsed.data.fields[field.name];
      if (!value) continue;
      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return res.status(400).json({ error: 'Enter a valid email address.' });
      if (field.type === 'tel' && !getPhoneHref(value)) return res.status(400).json({ error: 'Enter a valid phone number.' });
      if (field.minLength !== undefined && value.length < field.minLength) return res.status(400).json({ error: `${field.label} is too short.` });
      if (field.maxLength !== undefined && value.length > field.maxLength) return res.status(400).json({ error: `${field.label} is too long.` });
    }
    if (parsed.data.submissionKey) {
      const duplicate = db.prepare('SELECT id FROM form_submissions WHERE block_id = ? AND submission_key = ?').get(parsed.data.blockId, parsed.data.submissionKey);
      if (duplicate) return res.status(200).json({ success: true, duplicate: true, message: 'Your response was already received.' });
    }
    db.prepare('INSERT INTO form_submissions (id, profile_id, block_id, fields_json, submission_key, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(createId('form'), parsed.data.profileId, parsed.data.blockId, JSON.stringify(parsed.data.fields), parsed.data.submissionKey || null, Date.now());
    res.status(201).json({ success: true, message: 'Thanks — your response was sent.' });
  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({ error: 'We could not save your response. Please try again.' });
  }
});

formsRouter.get('/api/studio/form-submissions', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db.prepare(`SELECT id, block_id AS blockId, fields_json AS fieldsJson, created_at AS createdAt FROM form_submissions WHERE profile_id = ? ORDER BY created_at DESC LIMIT 500`).all(req.user!.profileId) as any[];
  res.json({ submissions: rows.map(row => ({ ...row, fields: JSON.parse(row.fieldsJson) })) });
});
