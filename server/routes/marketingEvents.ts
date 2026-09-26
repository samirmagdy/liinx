import { Router } from 'express';
import { marketingEventSchema } from '../../shared/index.js';
import { db } from '../db.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { optionalAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { recordMarketingEvent } from '../services/marketingEvents.js';

export const marketingEventsRouter = Router();

marketingEventsRouter.post('/marketing/events', optionalAuth, sharedRateLimit({ name: 'marketing-event', limit: 120, windowMs: 60 * 60 * 1000 }), (req: AuthenticatedRequest, res) => {
  const parsed = marketingEventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid marketing event.' });
  if (!parsed.data.anonymousId && !req.user) return res.status(400).json({ error: 'An anonymous event identifier is required.' });
  try {
    const event = recordMarketingEvent(parsed.data, req.user?.userId);
    return res.status(202).json({ success: true, id: event.id });
  } catch {
    return res.status(503).json({ error: 'Marketing events are temporarily unavailable.' });
  }
});

export function purgeMarketingEvents(cutoff: number): number {
  return (db.prepare('DELETE FROM marketing_events WHERE created_at < ?').run(cutoff)).changes;
}
