import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { logError } from '../logger.js';
import { contactSchema } from '../../shared/index.js';

export const contactRouter = Router();
const schema = contactSchema;
contactRouter.post('/contact', sharedRateLimit({ name: 'contact', limit: 10, windowMs: 60 * 60 * 1000 }), (req, res) => {
  const input = schema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Enter a name, valid email, and message (up to 5000 characters).' });
  if (input.data.website?.trim()) return res.status(400).json({ error: 'Unable to accept this request. Please try again.' });
  const recent = db.prepare('SELECT count(*) AS count FROM contact_messages WHERE email = ? AND created_at > ?').get(input.data.email, Date.now() - 3600000) as { count: number };
  if (recent.count >= 5) return res.status(429).json({ error: 'Too many messages. Please try again later.' });
  const id = randomUUID();
  const message = { name: input.data.name, email: input.data.email, message: input.data.message };
  db.prepare('INSERT INTO contact_messages VALUES (?, ?, ?, ?, ?)').run(id, message.name, message.email, message.message, Date.now());
  void notifySupport(message).then(notification => {
    res.status(201).json({ success: true, id, notification });
  }).catch(error => {
    logError('Contact notification failed', error);
    res.status(201).json({ success: true, id, notification: 'failed' });
  });
});

async function notifySupport(message: { name: string; email: string; message: string }): Promise<'sent' | 'not_configured'> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CONTACT_NOTIFICATION_EMAIL;
  const sender = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !recipient || !sender) return 'not_configured';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: sender, to: [recipient], subject: `RALOA support message from ${message.name}`, text: `From: ${message.name} <${message.email}>\n\n${message.message}` })
  });
  if (!response.ok) throw new Error(`Notification provider returned HTTP ${response.status}`);
  return 'sent';
}

contactRouter.get('/support/inbox', requireAuth, (req: AuthenticatedRequest, res) => {
  const adminUserId = process.env.SUPPORT_INBOX_ADMIN_USER_ID?.trim();
  if (!adminUserId || req.user?.userId !== adminUserId) {
    return res.status(403).json({ error: 'Support inbox access is not enabled for this account.' });
  }
  try {
    const messages = db.prepare('SELECT id, name, email, message, created_at AS createdAt FROM contact_messages ORDER BY created_at DESC LIMIT 200').all();
    return res.json({ messages });
  } catch (error) {
    logError('Support inbox read failed', error);
    return res.status(500).json({ error: 'Support inbox is temporarily unavailable.' });
  }
});
