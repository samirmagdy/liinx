import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import crypto from 'node:crypto';

export const newsletterRouter = Router();

const subscribeSchema = z.object({
  profileId: z.string().min(1, 'Profile ID is required'),
  blockId: z.string().optional().nullable(),
  email: z.string().email('Please enter a valid email address'),
  consent: z.literal(true, 'Please confirm that you want to receive updates.')
});

// Public: Subscribe to a creator's newsletter
newsletterRouter.post('/api/newsletter/subscribe', sharedRateLimit({ name: 'newsletter-subscribe', limit: 10, windowMs: 60 * 60 * 1000 }), (req, res) => {
  try {
    const parse = subscribeSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { profileId, blockId, email } = parse.data;
    const cleanEmail = email.toLowerCase().trim();
    const now = Date.now();

    // Verify creator exists
    const profile = db.prepare('SELECT id, display_name FROM profiles WHERE id = ?').get(profileId) as any;
    if (!profile) {
      return res.status(404).json({ error: 'Creator profile not found.' });
    }

    if (blockId) {
      const block = db.prepare(`
        SELECT b.id
        FROM blocks b
        INNER JOIN pages p ON p.id = b.page_id AND p.profile_id = b.profile_id
        WHERE b.id = ? AND b.profile_id = ? AND b.type = 'newsletter' AND p.published = 1
          AND (b.start_at IS NULL OR b.start_at <= ?) AND (b.end_at IS NULL OR b.end_at > ?)
      `).get(blockId, profileId, now, now);
      if (!block) return res.status(404).json({ error: 'This newsletter form is unavailable.' });
    }

    const id = 'sub_' + crypto.randomBytes(8).toString('hex');
    const unsubscribeToken = crypto.randomBytes(24).toString('base64url');
    const unsubscribeTokenHash = crypto.createHash('sha256').update(unsubscribeToken).digest('hex');
    try {
      const saveSubscription = db.transaction(() => {
        db.prepare(`
          INSERT INTO newsletter_subscribers (id, profile_id, block_id, email, created_at, unsubscribe_token_hash)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, profileId, blockId || null, cleanEmail, now, unsubscribeTokenHash);
        db.prepare('INSERT INTO newsletter_consents (subscriber_id, consented_at) VALUES (?, ?)').run(id, now);
      });
      saveSubscription();

      const origin = process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`;
      res.status(201).json({
        success: true,
        message: `You are now subscribed to ${profile.display_name}'s updates!`,
        unsubscribeUrl: `${origin}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
      });
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return res.json({
          success: true,
          message: `You are already subscribed to ${profile.display_name}!`
        });
      }
      throw err;
    }
  } catch (err: any) {
    console.error('Newsletter subscribe error:', err);
    res.status(500).json({ error: 'Failed to process newsletter subscription.' });
  }
});

newsletterRouter.get('/api/newsletter/unsubscribe', (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) return res.status(400).send('A valid unsubscribe link is required.');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const result = db.prepare('DELETE FROM newsletter_subscribers WHERE unsubscribe_token_hash = ?').run(tokenHash);
  res.setHeader('Cache-Control', 'no-store');
  if (result.changes === 0) return res.status(404).send('This unsubscribe link is invalid or has already been used.');
  return res.status(200).send('You have been unsubscribed successfully.');
});

// Authenticated: Get subscriber list for studio
newsletterRouter.get('/api/studio/subscribers', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.user!.profileId;
    const subscribers = db.prepare(`
      SELECT id, email, created_at 
      FROM newsletter_subscribers 
      WHERE profile_id = ? 
      ORDER BY created_at DESC
    `).all(profileId) as any[];

    res.json({
      count: subscribers.length,
      subscribers: subscribers.map(s => ({
        id: s.id,
        email: s.email,
        subscribedAt: new Date(s.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      }))
    });
  } catch (err: any) {
    console.error('Fetch subscribers error:', err);
    res.status(500).json({ error: 'Failed to retrieve subscribers.' });
  }
});

// Authenticated: Export subscribers as CSV
newsletterRouter.get('/api/studio/subscribers/export', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.user!.profileId;
    const subscribers = db.prepare(`
      SELECT email, created_at 
      FROM newsletter_subscribers 
      WHERE profile_id = ? 
      ORDER BY created_at DESC
    `).all(profileId) as any[];

    const headers = ['Email', 'Subscribed At'];
    const rows = subscribers.map(s => [
      s.email,
      new Date(s.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    ]);

    const escapeCsvCell = (value: unknown) => {
      let cell = String(value ?? '');
      if (/^[=+\-@]/.test(cell)) cell = `'${cell}`;
      return `"${cell.replace(/"/g, '""')}"`;
    };
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsvCell).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
    res.setHeader('Cache-Control', 'no-store');
    res.send(csvContent);
  } catch (err: any) {
    console.error('Export subscribers error:', err);
    res.status(500).json({ error: 'Failed to export subscribers.' });
  }
});

newsletterRouter.delete('/api/studio/subscribers/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM newsletter_subscribers
      WHERE id = ? AND profile_id = ?
    `).run(req.params.id, req.user!.profileId);
    if (result.changes === 0) return res.status(404).json({ error: 'Subscriber not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete subscriber error:', err);
    res.status(500).json({ error: 'Failed to remove subscriber.' });
  }
});
