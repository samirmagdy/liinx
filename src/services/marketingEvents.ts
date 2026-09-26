import { marketingEventSchema, type MarketingEventPayload } from '../../shared/index.js';
import { api } from './api';

type TrackableMarketingEvent = Omit<MarketingEventPayload, 'anonymousId' | 'sessionId' | 'route'> & {
  anonymousId?: string;
  sessionId?: string;
  route?: string;
};

const ANONYMOUS_ID_KEY = 'raloa-marketing-anonymous-id';
const SESSION_ID_KEY = 'raloa-marketing-session-id';

function createId(prefix: string): string {
  const value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 70)}`;
}

function getStorageId(key: string, prefix: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const current = window.localStorage.getItem(key);
  if (current) return current;
  const next = createId(prefix);
  window.localStorage.setItem(key, next);
  return next;
}

function getSessionId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const current = window.sessionStorage.getItem(SESSION_ID_KEY);
  if (current) return current;
  const next = createId('ses');
  window.sessionStorage.setItem(SESSION_ID_KEY, next);
  return next;
}

export async function trackMarketingEvent(payload: TrackableMarketingEvent): Promise<void> {
  const event: MarketingEventPayload = {
    ...payload,
    anonymousId: payload.anonymousId || getStorageId(ANONYMOUS_ID_KEY, 'anon'),
    sessionId: payload.sessionId || getSessionId(),
    route: payload.route || (typeof window === 'undefined' ? '/' : window.location.pathname)
  };
  if (!marketingEventSchema.safeParse(event).success) return;
  try { await api.marketingEvents.track(event); } catch { /* telemetry never blocks product actions */ }
}
