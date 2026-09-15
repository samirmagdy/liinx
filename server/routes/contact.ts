import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '../db.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';

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
  res.status(201).json({ success: true, id });
});
