import { EventStore, ClickEvent, ViewEvent } from './interfaces.js';
import { db } from '../db.js';

export class MemoryBufferedEventStore implements EventStore {
  readonly name = 'memory-buffered-sqlite';
  private clickBuffer: ClickEvent[] = [];
  private viewBuffer: ViewEvent[] = [];
  private readonly maxBufferSize: number;

  constructor(maxBufferSize = 1000) {
    this.maxBufferSize = maxBufferSize;
  }

  recordClick(click: ClickEvent): void {
    this.clickBuffer.push(click);
    if (this.clickBuffer.length >= this.maxBufferSize) {
      this.flushClicks();
    }
  }

  recordView(view: ViewEvent): void {
    this.viewBuffer.push(view);
    if (this.viewBuffer.length >= this.maxBufferSize) {
      this.flushViews();
    }
  }

  flush(): void {
    this.flushClicks();
    this.flushViews();
  }

  private flushClicks(): void {
    if (this.clickBuffer.length === 0) return;
    const batch = this.clickBuffer;
    this.clickBuffer = [];
    try {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO link_clicks (id, block_id, profile_id, target_url, ip_hash, referrer, user_agent, utm_source, utm_medium, utm_campaign, page_id, dedupe_key, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      db.transaction(() => {
        for (const c of batch) {
          stmt.run(c.id, c.blockId, c.profileId, c.targetUrl, c.ipHash, c.referrer, c.userAgent, c.utmSource || null, c.utmMedium || null, c.utmCampaign || null, c.pageId || null, c.dedupeKey || null, c.createdAt);
        }
      })();
    } catch (err) {
      console.error('Failed to flush click events to SQLite:', err);
    }
  }

  private flushViews(): void {
    if (this.viewBuffer.length === 0) return;
    const batch = this.viewBuffer;
    this.viewBuffer = [];
    try {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO profile_views (id, profile_id, ip_hash, referrer, user_agent, utm_source, utm_medium, utm_campaign, page_id, dedupe_key, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      db.transaction(() => {
        for (const v of batch) {
          stmt.run(v.id, v.profileId, v.ipHash, v.referrer, v.userAgent, v.utmSource || null, v.utmMedium || null, v.utmCampaign || null, v.pageId || null, v.dedupeKey || null, v.createdAt);
        }
      })();
    } catch (err) {
      console.error('Failed to flush view events to SQLite:', err);
    }
  }
}

export const memoryBufferedEventStore = new MemoryBufferedEventStore();
