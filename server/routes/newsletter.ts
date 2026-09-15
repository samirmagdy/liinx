import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const newsletterRouter = Router();

const subscribeSchema = z.object({
  profileId: z.string().min(1, 'Profile ID is required'),
  blockId: z.string().optional().nullable(),
  email: z.string().email('Please enter a valid email address')
});

// Public: Subscribe to a creator's newsletter
newsletterRouter.post('/api/newsletter/subscribe', (req, res) => {
  try {
    const parse = subscribeSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { profileId, blockId, email } = parse.data;
    const cleanEmail = email.toLowerCase().trim();

    // Verify creator exists
    const profile = db.prepare('SELECT id, display_name FROM profiles WHERE id = ?').get(profileId) as any;
    if (!profile) {
      return res.status(404).json({ error: 'Creator profile not found.' });
    }

    const id = 'sub_' + Math.random().toString(36).substring(2, 10);
    const now = Date.now();

    try {
      db.prepare(`
        INSERT INTO newsletter_subscribers (id, profile_id, block_id, email, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, profileId, blockId || null, cleanEmail, now);

      res.status(201).json({
        success: true,
        message: `You are now subscribed to ${profile.display_name}'s updates!`
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

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
    res.send(csvContent);
  } catch (err: any) {
    console.error('Export subscribers error:', err);
    res.status(500).json({ error: 'Failed to export subscribers.' });
  }
});
