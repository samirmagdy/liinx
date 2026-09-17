import { type AnalyticsEventStore, type ClickEvent, type ViewEvent } from './interfaces.js';
import { db } from '../db.js';

/**
 * Current event sink. It batches analytics writes without participating in the
 * transaction that serves a public page or redirect. The contract is
 * best-effort: events are normally flushed to SQLite, but process failure,
 * storage failure, or a bounded-buffer overflow may lose events. Duplicate
 * delivery is safe because the database dedupe indexes use INSERT OR IGNORE.
 */
export class SQLiteAnalyticsEventStore implements AnalyticsEventStore {
  readonly name: string = 'sqlite-buffered';
  private clickBuffer: ClickEvent[] = [];
  private viewBuffer: ViewEvent[] = [];
  private readonly maxBufferSize: number;
  private droppedEvents = 0;
  private flushScheduled = false;

  constructor(maxBufferSize = 1000) {
    this.maxBufferSize = Math.max(1, maxBufferSize);
  }

  recordClick(click: ClickEvent): void {
    this.enqueue(this.clickBuffer, click);
  }

  recordView(view: ViewEvent): void {
    this.enqueue(this.viewBuffer, view);
  }

  getDroppedEventCount(): number {
    return this.droppedEvents;
  }

  flush(): void {
    this.flushClicks();
    this.flushViews();
  }

  private enqueue<T>(buffer: T[], event: T): void {
    buffer.push(event);
    if (buffer.length > this.maxBufferSize) {
      buffer.shift();
      this.droppedEvents += 1;
    }
    // Flushing is owned by the background scheduler, never by the request
    // that just served a public page or redirect.
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    setImmediate(() => {
      this.flushScheduled = false;
      this.flush();
    });
  }

  private flushClicks(): void {
    if (this.clickBuffer.length === 0) return;
    const batch = this.clickBuffer;
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
      this.clickBuffer = this.clickBuffer.slice(batch.length);
    } catch (err) {
      console.error('Failed to flush click analytics events:', err);
    }
  }

  private flushViews(): void {
    if (this.viewBuffer.length === 0) return;
    const batch = this.viewBuffer;
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
      this.viewBuffer = this.viewBuffer.slice(batch.length);
    } catch (err) {
      console.error('Failed to flush view analytics events:', err);
    }
  }
}

export const sqliteAnalyticsEventStore = new SQLiteAnalyticsEventStore();
