import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { MILESTONE_IDS } from '../../shared/index.js';
import { pendingMilestones } from '../services/setupProgress.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { studioBlocksForProfile, studioPagesForProfile, studioProfilePayload } from './profiles.js';

export const setupRouter = Router();

/**
 * Setup progress is derived from rows, so these routes exist to write the one row a click produces
 * and nothing else: they change no public field and return the studio payload so the checklist
 * re-renders from stored truth instead of an optimistic guess. `updated_at` doubles as the save
 * revision, so these bookkeeping writes deliberately leave it alone rather than forcing a conflict
 * on an edit the creator has in flight.
 */
function refreshedPayload(profileId: string) {
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId) as any;
  const pages = studioPagesForProfile(profile);
  return studioProfilePayload(profile, pages, studioBlocksForProfile(profile, pages));
}

// Authenticated: the creator opened their own page in the full-screen preview.
setupRouter.post('/studio/previewed', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    db.prepare('UPDATE profiles SET last_previewed_at = ? WHERE id = ?').run(Date.now(), req.user!.profileId);
    res.json({ success: true, profile: refreshedPayload(req.user!.profileId) });
  } catch (err) {
    console.error('Preview acknowledgement error:', err);
    res.status(500).json({ error: 'We could not record that preview. Please try again.' });
  }
});

// Authenticated: hide the setup checklist. Stored on the account so another device agrees.
setupRouter.post('/studio/setup/dismiss', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    db.prepare('UPDATE profiles SET setup_dismissed_at = ? WHERE id = ?').run(Date.now(), req.user!.profileId);
    res.json({ success: true, profile: refreshedPayload(req.user!.profileId) });
  } catch (err) {
    console.error('Setup dismissal error:', err);
    res.status(500).json({ error: 'We could not hide the setup list. Please try again.' });
  }
});

// Authenticated: the creator acknowledged one milestone. It is stored against the row that caused
// it, so the same first visitor cannot be celebrated again from another device.
setupRouter.post('/studio/setup/milestone/:milestone/ack', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const parsed = z.object({ milestone: z.enum(MILESTONE_IDS) }).safeParse({ milestone: req.params.milestone });
    if (!parsed.success) return res.status(400).json({ error: 'That is not a milestone RALOA reports.' });
    const pending = pendingMilestones(req.user!.profileId).find(milestone => milestone.id === parsed.data.milestone);
    if (!pending) return res.status(400).json({ error: 'That has not happened on your page yet.' });

    db.prepare(`INSERT INTO setup_milestone_ack (profile_id, milestone, event_id, acknowledged_at)
      VALUES (?, ?, ?, ?) ON CONFLICT(profile_id, milestone) DO NOTHING`)
      .run(req.user!.profileId, pending.id, pending.eventId, Date.now());
    res.json({ success: true, profile: refreshedPayload(req.user!.profileId) });
  } catch (err) {
    console.error('Milestone acknowledgement error:', err);
    res.status(500).json({ error: 'We could not record that. Please try again.' });
  }
});
