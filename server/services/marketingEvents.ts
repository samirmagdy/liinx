import { createHash, randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { type MarketingEventName, type MarketingEventPayload } from '../../shared/index.js';

export interface StoredMarketingEvent extends MarketingEventPayload {
  id: string;
  userId?: string;
  createdAt: number;
}

export function recordMarketingEvent(payload: MarketingEventPayload, userId?: string): StoredMarketingEvent {
  const id = randomUUID();
  const createdAt = Date.now();
  const identity = JSON.stringify({ event: payload.event, anonymousId: payload.anonymousId || null, sessionId: payload.sessionId || null, userId: userId || null, route: payload.route, templateId: payload.templateId || null, planId: payload.planId || null });
  const dedupeKey = createHash('sha256').update(`${Math.floor(createdAt / 60000)}:${identity}`).digest('hex');
  db.prepare(`INSERT OR IGNORE INTO marketing_events
    (id, event_name, anonymous_id, session_id, user_id, route, language, segment, template_id, plan_id, metadata_json, dedupe_key, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, payload.event, payload.anonymousId || null, payload.sessionId || null, userId || null,
      payload.route, payload.language, payload.segment || null, payload.templateId || null,
      payload.planId || null, JSON.stringify(payload.metadata || {}), dedupeKey, createdAt);
  const stored = db.prepare('SELECT id, created_at AS createdAt FROM marketing_events WHERE dedupe_key = ?').get(dedupeKey) as { id: string; createdAt: number };
  return { ...payload, id: stored.id, userId, createdAt: stored.createdAt };
}

export function serverMarketingEvent(event: MarketingEventName, route: string, language: 'en' | 'ar', userId?: string, metadata?: Record<string, string | number | boolean>) {
  try {
    return recordMarketingEvent({ event, route, language, metadata }, userId);
  } catch {
    return undefined;
  }
}
