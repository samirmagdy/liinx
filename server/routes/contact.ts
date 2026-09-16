import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '../db.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { logError } from '../logger.js';

export const contactRouter = Router();
const schema = z.object({ name: z.string().trim().min(1).max(120), email: z.email().max(254), message: z.string().trim().min(1).max(5000) });
contactRouter.post('/contact', sharedRateLimit({ name: 'contact', limit: 10, windowMs: 60 * 60 * 1000 }), (req, res) => {
  const input = schema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Enter a name, valid email, and message (up to 5000 characters).' });
  db.exec(`CREATE TABLE IF NOT EXISTS contact_messages (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL, created_at INTEGER NOT NULL)`);
  const recent = db.prepare('SELECT count(*) AS count FROM contact_messages WHERE email = ? AND created_at > ?').get(input.data.email, Date.now() - 3600000) as { count: number };
  if (recent.count >= 5) return res.status(429).json({ error: 'Too many messages. Please try again later.' });
  const id = randomUUID();
  db.prepare('INSERT INTO contact_messages VALUES (?, ?, ?, ?, ?)').run(id, input.data.name, input.data.email, input.data.message, Date.now());
  void notifySupport(input.data).catch(error => logError('Contact notification failed', error));
  res.status(201).json({ success: true, id });
});

async function notifySupport(message: { name: string; email: string; message: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CONTACT_NOTIFICATION_EMAIL;
  const sender = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !recipient || !sender) return;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: sender, to: [recipient], subject: `LIINX support message from ${message.name}`, text: `From: ${message.name} <${message.email}>\n\n${message.message}` })
  });
  if (!response.ok) throw new Error(`Notification provider returned HTTP ${response.status}`);
}

contactRouter.get('/support/inbox', requireAuth, (req: AuthenticatedRequest, res) => {
  const adminUserId = process.env.SUPPORT_INBOX_ADMIN_USER_ID?.trim();
  if (!adminUserId || req.user?.userId !== adminUserId) {
    return res.status(403).json({ error: 'Support inbox access is not enabled for this account.' });
  }
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS contact_messages (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL, created_at INTEGER NOT NULL)`);
    const messages = db.prepare('SELECT id, name, email, message, created_at AS createdAt FROM contact_messages ORDER BY created_at DESC LIMIT 200').all();
    return res.json({ messages });
  } catch (error) {
    logError('Support inbox read failed', error);
    return res.status(500).json({ error: 'Support inbox is temporarily unavailable.' });
  }
});
