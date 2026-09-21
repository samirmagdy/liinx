import { Router } from 'express';
import { db } from '../db.js';
import { createId } from '../utils/ids.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  formSubmissionSchema,
  normalizeFormFields,
  getPhoneHref,
  type FormFieldContract
} from '../../shared/index.js';

export const formsRouter = Router();
const submissionSchema = formSubmissionSchema;

function validateSubmittedFields(fields: FormFieldContract[], submitted: Record<string, string>): string | null {
  const configuredNames = new Set(fields.map(field => field.name));
  if (Object.keys(submitted).some(name => !configuredNames.has(name))) return 'The form contains an unknown field.';
  for (const field of fields) {
    const value = submitted[field.name];
    if (field.required && !value?.trim()) return `${field.label} is required.`;
    if (!value) continue;
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.';
    if (field.type === 'tel' && !getPhoneHref(value)) return 'Enter a valid phone number.';
    if (field.minLength !== undefined && value.length < field.minLength) return `${field.label} is too short.`;
    if (field.maxLength !== undefined && value.length > field.maxLength) return `${field.label} is too long.`;
  }
  return null;
}

formsRouter.post('/api/forms/submit', sharedRateLimit({ name: 'form-submit', limit: 20, windowMs: 60 * 60 * 1000 }), (req, res) => {
  try {
    const parsed = submissionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Please complete the form with valid values.' });
    const now = Date.now();
    const block = db.prepare(`SELECT b.id, b.extra_json FROM blocks b JOIN pages p ON p.id = b.page_id AND p.profile_id = b.profile_id WHERE b.id = ? AND b.profile_id = ? AND b.type = 'form' AND p.published = 1 AND COALESCE(b.visible, 1) = 1 AND (b.start_at IS NULL OR b.start_at <= ?) AND (b.end_at IS NULL OR b.end_at > ?)`).get(parsed.data.blockId, parsed.data.profileId, now, now) as { id: string; extra_json?: string | null } | undefined;
    if (!block) return res.status(404).json({ error: 'This form is no longer available.' });
    let rawExtra: Record<string, unknown> = {};
    try { rawExtra = JSON.parse(block.extra_json || '{}') as Record<string, unknown>; } catch { return res.status(500).json({ error: 'This form configuration is invalid.' }); }
    const fields: FormFieldContract[] = normalizeFormFields(rawExtra.fields);
    if (Array.isArray(rawExtra.fields) && fields.length === 0) return res.status(409).json({ error: 'This form configuration is invalid.' });
    if (fields.length === 0) return res.status(409).json({ error: 'This form has no configured fields.' });
    if (rawExtra.consentRequired === true && parsed.data.consent !== true) return res.status(400).json({ error: 'Please confirm consent before sending this form.' });
    const fieldError = validateSubmittedFields(fields, parsed.data.fields);
    if (fieldError) return res.status(400).json({ error: fieldError });
    if (parsed.data.submissionKey) {
      const duplicate = db.prepare('SELECT id FROM form_submissions WHERE block_id = ? AND submission_key = ?').get(parsed.data.blockId, parsed.data.submissionKey);
      if (duplicate) return res.status(200).json({ success: true, duplicate: true, message: 'Your response was already received.' });
    }
    db.prepare('INSERT INTO form_submissions (id, profile_id, block_id, fields_json, submission_key, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(createId('form'), parsed.data.profileId, parsed.data.blockId, JSON.stringify(parsed.data.fields), parsed.data.submissionKey || null, now);
    res.status(201).json({ success: true, message: 'Thanks — your response was sent.' });
  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({ error: 'We could not save your response. Please try again.' });
  }
});

formsRouter.get('/api/studio/form-submissions', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.user!.profileId;
    const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(req.query.pageSize || '25'), 10) || 25));
    const blockId = typeof req.query.blockId === 'string' && req.query.blockId ? req.query.blockId : null;
    if (blockId && !db.prepare("SELECT id FROM blocks WHERE id = ? AND profile_id = ? AND type = 'form'").get(blockId, profileId)) return res.status(404).json({ error: 'Form not found.' });
    const where = blockId ? 'WHERE profile_id = ? AND block_id = ?' : 'WHERE profile_id = ?';
    const args = blockId ? [profileId, blockId] : [profileId];
    const total = (db.prepare(`SELECT COUNT(*) AS count FROM form_submissions ${where}`).get(...args) as { count: number }).count;
    const rows = db.prepare(`SELECT id, block_id AS blockId, fields_json AS fieldsJson, created_at AS createdAt FROM form_submissions ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`).all(...args, pageSize, (page - 1) * pageSize) as any[];
    const formRows = db.prepare("SELECT id, title, extra_json AS extraJson FROM blocks WHERE profile_id = ? AND type = 'form'").all(profileId) as Array<{ id: string; title: string; extraJson?: string | null }>;
    const formInfo = new Map(formRows.map(form => {
      let extra: Record<string, unknown> = {};
      try { extra = JSON.parse(form.extraJson || '{}') as Record<string, unknown>; } catch {}
      const labels = Object.fromEntries(normalizeFormFields(extra.fields).map(field => [field.name, field.label]));
      return [form.id, { title: form.title, fieldLabels: labels }];
    }));
    res.json({
      submissions: rows.map(row => ({ ...row, formTitle: formInfo.get(row.blockId)?.title || 'Form', fieldLabels: formInfo.get(row.blockId)?.fieldLabels || {}, fields: JSON.parse(row.fieldsJson) })),
      page, pageSize, total, hasMore: page * pageSize < total, limited: false
    });
  } catch (error) {
    console.error('Form submissions error:', error);
    res.status(500).json({ error: 'Failed to retrieve form responses.' });
  }
});

formsRouter.get('/api/studio/form-submissions/export', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.user!.profileId;
    const blockId = typeof req.query.blockId === 'string' && req.query.blockId ? req.query.blockId : null;
    if (blockId && !db.prepare("SELECT id FROM blocks WHERE id = ? AND profile_id = ? AND type = 'form'").get(blockId, profileId)) return res.status(404).json({ error: 'Form not found.' });
    const where = blockId ? 'WHERE profile_id = ? AND block_id = ?' : 'WHERE profile_id = ?';
    const args = blockId ? [profileId, blockId] : [profileId];
    const rows = db.prepare(`SELECT id, block_id AS blockId, fields_json AS fieldsJson, created_at AS createdAt FROM form_submissions ${where} ORDER BY created_at DESC, id DESC`).all(...args) as any[];
    const forms = db.prepare("SELECT id, title, extra_json AS extraJson FROM blocks WHERE profile_id = ? AND type = 'form'").all(profileId) as Array<{ id: string; title: string; extraJson?: string | null }>;
    const formInfo = new Map(forms.map(form => {
      let extra: Record<string, unknown> = {};
      try { extra = JSON.parse(form.extraJson || '{}') as Record<string, unknown>; } catch {}
      return [form.id, { title: form.title, fieldLabels: Object.fromEntries(normalizeFormFields(extra.fields).map(field => [field.name, field.label])) }];
    }));
    const neutralize = (value: unknown) => { const text = String(value ?? ''); return /^[=+\-@]/.test(text) ? `'${text}` : text; };
    const csvCell = (value: unknown) => `"${neutralize(value).replace(/"/g, '""')}"`;
    const lines = ['Submitted At,Form,Field,Value'];
    for (const row of rows) {
      let fields: Record<string, unknown> = {};
      try { fields = JSON.parse(row.fieldsJson) as Record<string, unknown>; } catch { fields = {}; }
      const info = formInfo.get(row.blockId) || { title: 'Form', fieldLabels: {} };
      for (const [name, value] of Object.entries(fields)) lines.push([new Date(row.createdAt).toISOString(), info.title, info.fieldLabels[name] || name, value].map(csvCell).join(','));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="raloa-${blockId ? 'form' : 'forms'}-responses.csv"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(lines.join('\n'));
  } catch (error) {
    console.error('Export form submissions error:', error);
    res.status(500).json({ error: 'Failed to export form responses.' });
  }
});

formsRouter.delete('/api/studio/form-submissions/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const result = db.prepare('DELETE FROM form_submissions WHERE id = ? AND profile_id = ?').run(req.params.id, req.user!.profileId);
    if (result.changes === 0) return res.status(404).json({ error: 'Form response not found.' });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete form submission error:', error);
    res.status(500).json({ error: 'Failed to delete form response.' });
  }
});
