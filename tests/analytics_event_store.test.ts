import { beforeEach, describe, expect, it } from 'vitest';
import { db, initDatabase } from '../server/db.js';
import { SQLiteAnalyticsEventStore } from '../server/infrastructure/sqliteAnalyticsEventStore.js';

describe('AnalyticsEventStore', () => {
  beforeEach(() => initDatabase());

  it('records normalized view and click events in a batch', () => {
    const suffix = `store_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const store = new SQLiteAnalyticsEventStore(20);
    store.recordView({
      id: `${suffix}_view`, profileId: suffix, ipHash: 'ip', referrer: 'direct', userAgent: 'test',
      pageId: 'page_1', dedupeKey: `${suffix}_view_dedupe`, createdAt: Date.now()
    });
    store.recordClick({
      id: `${suffix}_click`, blockId: 'block_1', profileId: suffix, targetUrl: 'https://example.com',
      ipHash: 'ip', referrer: 'direct', userAgent: 'test', pageId: 'page_1',
      dedupeKey: `${suffix}_click_dedupe`, createdAt: Date.now()
    });
    store.flush();

    expect((db.prepare('SELECT COUNT(*) AS count FROM profile_views WHERE id = ?').get(`${suffix}_view`) as { count: number }).count).toBe(1);
    expect((db.prepare('SELECT page_id FROM link_clicks WHERE id = ?').get(`${suffix}_click`) as { page_id: string }).page_id).toBe('page_1');
  });

  it('keeps duplicate delivery idempotent and bounds pending events', () => {
    const suffix = `dedupe_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const store = new SQLiteAnalyticsEventStore(1);
    const event = {
      id: `${suffix}_view`, profileId: suffix, ipHash: 'ip', referrer: 'direct', userAgent: 'test',
      dedupeKey: `${suffix}_same`, createdAt: Date.now()
    };
    store.recordView(event);
    store.flush();
    store.recordView({ ...event, id: `${suffix}_duplicate` });
    store.flush();

    expect((db.prepare('SELECT COUNT(*) AS count FROM profile_views WHERE dedupe_key = ?').get(event.dedupeKey) as { count: number }).count).toBe(1);
    expect(store.getDroppedEventCount()).toBe(0);
  });
});
