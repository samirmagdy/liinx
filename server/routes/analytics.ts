import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { createId } from '../utils/ids.js';
import { isSafeLinkUrl } from '../utils/urlValidation.js';
import { getMailtoHref, getPhoneHref } from '../../src/utils/contactLinks.js';

export const analyticsRouter = Router();

function hashIp(ip?: string): string {
  if (!ip) return 'anonymous';
  const clientIp = ip.split(',')[0].trim();
  return crypto.createHash('sha256').update(clientIp + 'liinx_salt_2026').digest('hex').substring(0, 16);
}

function sanitizeUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (isSafeLinkUrl(trimmed)) return trimmed;
  // Preserve legacy bare-host links without accepting arbitrary schemes or markup.
  if (/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?:[/:?#].*)?$/i.test(trimmed)) {
    const normalized = `https://${trimmed}`;
    return isSafeLinkUrl(normalized) ? normalized : null;
  }
  return null;
}

interface ClickRecord {
  id: string;
  block_id: string;
  profile_id: string;
  target_url: string;
  ip_hash: string;
  referrer: string;
  user_agent: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  page_id?: string | null;
  dedupe_key?: string | null;
  created_at: number;
}

interface ViewRecord {
  id: string;
  profile_id: string;
  ip_hash: string;
  referrer: string;
  user_agent: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  page_id?: string | null;
  dedupe_key?: string | null;
  created_at: number;
}

let clickBuffer: ClickRecord[] = [];
let viewBuffer: ViewRecord[] = [];

const insertClicksBatch = db.transaction((clicks: ClickRecord[]) => {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO link_clicks (id, block_id, profile_id, target_url, ip_hash, referrer, user_agent, utm_source, utm_medium, utm_campaign, page_id, dedupe_key, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of clicks) {
    stmt.run(c.id, c.block_id, c.profile_id, c.target_url, c.ip_hash, c.referrer, c.user_agent, c.utm_source || null, c.utm_medium || null, c.utm_campaign || null, c.page_id || null, c.dedupe_key || null, c.created_at);
  }
});

const insertViewsBatch = db.transaction((views: ViewRecord[]) => {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO profile_views (id, profile_id, ip_hash, referrer, user_agent, utm_source, utm_medium, utm_campaign, page_id, dedupe_key, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const v of views) {
    stmt.run(v.id, v.profile_id, v.ip_hash, v.referrer, v.user_agent, v.utm_source || null, v.utm_medium || null, v.utm_campaign || null, v.page_id || null, v.dedupe_key || null, v.created_at);
  }
});

export function flushAnalyticsBuffers() {
  if (clickBuffer.length > 0) {
    const toFlush = clickBuffer;
    try {
      insertClicksBatch(toFlush);
      clickBuffer = clickBuffer.slice(toFlush.length);
    } catch (e) {
      console.error('Error flushing click batch:', e);
    }
  }

  if (viewBuffer.length > 0) {
    const toFlush = viewBuffer;
    try {
      insertViewsBatch(toFlush);
      viewBuffer = viewBuffer.slice(toFlush.length);
    } catch (e) {
      console.error('Error flushing view batch:', e);
    }
  }
}

// In-memory sliding-window abuse rate limiter for view & click events
interface RateLimitEntry {
  timestamps: number[];
}
const viewRateLimits = new Map<string, RateLimitEntry>();
const clickRateLimits = new Map<string, RateLimitEntry>();

// Purge stale rate limiter entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const windowMs = 60000;
  for (const [key, entry] of viewRateLimits.entries()) {
    entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
    if (entry.timestamps.length === 0) viewRateLimits.delete(key);
  }
  for (const [key, entry] of clickRateLimits.entries()) {
    entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
    if (entry.timestamps.length === 0) clickRateLimits.delete(key);
  }
}, 300000).unref();

export function isViewRateLimited(ipHash: string, profileId: string, limit = 10, windowMs = 60000): boolean {
  const key = `${ipHash}:${profileId}`;
  const now = Date.now();
  db.prepare('DELETE FROM rate_limit_events WHERE bucket_key = ? AND occurred_at <= ?').run(`view:${key}`, now - windowMs);
  const count = (db.prepare('SELECT COUNT(*) AS count FROM rate_limit_events WHERE bucket_key = ?').get(`view:${key}`) as { count: number }).count;
  if (count >= limit) {
    return true;
  }
  db.prepare('INSERT INTO rate_limit_events (bucket_key, occurred_at) VALUES (?, ?)').run(`view:${key}`, now);
  return false;
}

export function isClickRateLimited(ipHash: string, blockId: string, limit = 15, windowMs = 60000): boolean {
  const key = `${ipHash}:${blockId}`;
  const now = Date.now();
  db.prepare('DELETE FROM rate_limit_events WHERE bucket_key = ? AND occurred_at <= ?').run(`click:${key}`, now - windowMs);
  const count = (db.prepare('SELECT COUNT(*) AS count FROM rate_limit_events WHERE bucket_key = ?').get(`click:${key}`) as { count: number }).count;
  if (count >= limit) {
    return true;
  }
  db.prepare('INSERT INTO rate_limit_events (bucket_key, occurred_at) VALUES (?, ?)').run(`click:${key}`, now);
  return false;
}

export function resetAnalyticsRateLimits() {
  viewRateLimits.clear();
  clickRateLimits.clear();
}

function isLikelyBot(userAgent: string): boolean {
  return /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|linkedinbot|embedly|quora link preview|pinterest/i.test(userAgent);
}

function boundedQueryValue(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function analyticsDedupeKey(kind: 'view' | 'click', parts: string[], now: number): string {
  const bucket = Math.floor(now / 60000);
  return crypto.createHash('sha256').update(`${kind}:${parts.join(':')}:${bucket}`).digest('hex');
}

// Background flusher every 100ms
setInterval(flushAnalyticsBuffers, 100).unref();
process.on('exit', flushAnalyticsBuffers);

// Public Link Redirector & Click Logger
analyticsRouter.get('/r/:blockId', sharedRateLimit({ name: 'analytics-click-ip', limit: 180, windowMs: 60000 }), (req, res) => {
  try {
    const blockId = req.params.blockId;
    const block = db.prepare(`
      SELECT b.* FROM blocks b
      INNER JOIN pages p ON p.id = b.page_id AND p.profile_id = b.profile_id AND p.published = 1
      WHERE b.id = ?
    `).get(blockId) as any;

    if (!block) {
      return res.status(404).send('Link not found or inactive.');
    }
    const now = Date.now();
    if ((block.start_at != null && block.start_at > now) || (block.end_at != null && block.end_at <= now)) {
      return res.status(404).send('Link not found or inactive.');
    }

    let rawTarget = block.url as string | null;
    if (!rawTarget && block.type === 'image') {
      try {
        const extra = block.extra_json ? JSON.parse(block.extra_json) : null;
        rawTarget = typeof extra?.linkUrl === 'string' ? extra.linkUrl : null;
      } catch { rawTarget = null; }
    }
    if (!rawTarget && (block.type === 'event' || block.type === 'presave' || block.type === 'product' || block.type === 'tips')) {
      try {
        const extra = block.extra_json ? JSON.parse(block.extra_json) : null;
        rawTarget = typeof extra?.url === 'string' ? extra.url : null;
      } catch { rawTarget = null; }
    }
    if (!rawTarget && block.type === 'phone') {
      try {
        const extra = block.extra_json ? JSON.parse(block.extra_json) : null;
        rawTarget = extra?.contactType === 'email'
          ? getMailtoHref(extra?.email, extra?.subject, extra?.body)
          : getPhoneHref(extra?.phone);
      } catch { rawTarget = null; }
    }
    const itemId = typeof req.query.item === 'string' ? req.query.item : null;
    const itemIndex = typeof req.query.itemIndex === 'string' && /^\d+$/.test(req.query.itemIndex) ? Number(req.query.itemIndex) : null;
    if (itemId || itemIndex !== null) {
      let extra: any = null;
      try { extra = block.extra_json ? JSON.parse(block.extra_json) : null; } catch { extra = null; }
      const item = Array.isArray(extra?.items)
        ? itemId ? extra.items.find((candidate: any) => candidate?.id === itemId) : extra.items[itemIndex]
        : null;
      if (!item) return res.status(404).send('Link not found or inactive.');
      rawTarget = typeof item.linkUrl === 'string' ? item.linkUrl : typeof item.url === 'string' ? item.url : null;
    }
    if (!rawTarget || !rawTarget.trim()) {
      return res.status(404).send('Link not found or inactive.');
    }
    const targetUrl = sanitizeUrl(rawTarget);
    if (!targetUrl) {
      return res.status(400).send('Invalid destination URL.');
    }

    const ip = req.ip || req.socket.remoteAddress || '';
    const ipHash = hashIp(ip);

    // Abuse protection: Only record metric if not flooded with repeated clicks from same IP
    if (!isClickRateLimited(ipHash, block.id)) {
      const referrer = boundedQueryValue(req.headers['referer']) || 'direct';
      const userAgent = (req.headers['user-agent'] as string) || '';
      const utmSource = boundedQueryValue(req.query.utm_source);
      const utmMedium = boundedQueryValue(req.query.utm_medium);
      const utmCampaign = boundedQueryValue(req.query.utm_campaign);
      if (isLikelyBot(userAgent)) return res.redirect(302, targetUrl);
      const now = Date.now();
      const clickId = createId('clk');

      const clickRecord = {
        id: clickId,
        block_id: block.id,
        profile_id: block.profile_id,
        target_url: targetUrl,
        ip_hash: ipHash,
        referrer,
        user_agent: userAgent,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        page_id: block.page_id,
        dedupe_key: analyticsDedupeKey('click', [ipHash, block.id, targetUrl, utmSource || '', utmMedium || '', utmCampaign || ''], now),
        created_at: now
      };
      insertClicksBatch([clickRecord]);
    }

    // Fast 302 Found redirect
    res.redirect(302, targetUrl);
  } catch (err: any) {
    console.error('Redirect error:', err);
    res.status(500).send('Redirection failed.');
  }
});

// Public Record Profile View
analyticsRouter.post('/api/analytics/view', sharedRateLimit({ name: 'analytics-view-ip', limit: 120, windowMs: 60000 }), (req, res) => {
  try {
    const { profileId, pageId, referrer, utmSource, utmMedium, utmCampaign } = req.body;
    if (!profileId) {
      return res.status(400).json({ error: 'profileId is required' });
    }

    const profileExists = db.prepare('SELECT id FROM profiles WHERE id = ?').get(profileId);
    if (!profileExists) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (pageId) {
      const page = db.prepare('SELECT id FROM pages WHERE id = ? AND profile_id = ? AND published = 1').get(pageId, profileId);
      if (!page) return res.status(404).json({ error: 'Page not found or inactive' });
    }

    const ip = req.ip || req.socket.remoteAddress || '';
    const ipHash = hashIp(ip);

    // Abuse rate limiting: prevent view spam / bots inflating counts
    if (isViewRateLimited(ipHash, profileId)) {
      return res.status(429).json({ error: 'Too many view requests. Please slow down.', recorded: false });
    }

    const userAgent = (req.headers['user-agent'] as string) || '';
    if (isLikelyBot(userAgent)) return res.json({ success: true, recorded: false, reason: 'bot' });
    const now = Date.now();
    const viewId = createId('vw');

    const viewRecord = {
      id: viewId,
      profile_id: profileId,
      ip_hash: ipHash,
      referrer: boundedQueryValue(referrer) || 'direct',
      user_agent: userAgent,
      utm_source: boundedQueryValue(utmSource),
      utm_medium: boundedQueryValue(utmMedium),
      utm_campaign: boundedQueryValue(utmCampaign),
      page_id: pageId || null,
      dedupe_key: analyticsDedupeKey('view', [ipHash, profileId, pageId || 'profile', boundedQueryValue(referrer) || 'direct', boundedQueryValue(utmSource) || '', boundedQueryValue(utmMedium) || '', boundedQueryValue(utmCampaign) || ''], now),
      created_at: now
    };
    insertViewsBatch([viewRecord]);

    res.json({ success: true });
  } catch (err: any) {
    console.error('Log view error:', err);
    res.status(500).json({ error: 'Failed to record view' });
  }
});

// Authenticated Creator Analytics Stats
analyticsRouter.get('/api/analytics/stats', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    // Flush any pending buffered clicks and views to ensure 100% up-to-date stats
    flushAnalyticsBuffers();

    const profileId = req.user!.profileId;
    const pageId = typeof req.query.pageId === 'string' ? req.query.pageId : null;
    if (pageId) {
      const page = db.prepare('SELECT id FROM pages WHERE id = ? AND profile_id = ?').get(pageId, profileId);
      if (!page) return res.status(403).json({ error: 'You do not have access to this page.' });
    }
    const scope = pageId ? ' AND page_id = ?' : '';
    const scopeArgs = pageId ? [profileId, pageId] : [profileId];
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Total Views (30 days)
    const viewsRow = db.prepare(`
      SELECT COUNT(*) as count, COUNT(DISTINCT ip_hash) as uniqueCount 
      FROM profile_views 
      WHERE profile_id = ?${scope} AND created_at >= ?
    `).get(...scopeArgs, thirtyDaysAgo) as { count: number; uniqueCount: number };

    const totalViews = viewsRow ? viewsRow.count : 0;
    const uniqueVisitors = viewsRow ? viewsRow.uniqueCount : 0;

    // Total Clicks (30 days)
    const clicksRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM link_clicks 
      WHERE profile_id = ?${scope} AND created_at >= ?
    `).get(...scopeArgs, thirtyDaysAgo) as { count: number };

    const totalClicks = clicksRow ? clicksRow.count : 0;
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';

    // Top Links
    const topLinks = db.prepare(`
      SELECT c.block_id AS id, COALESCE(b.title, 'Deleted link') AS title,
        COALESCE(b.url, MAX(c.target_url)) AS url, COALESCE(b.type, 'link') AS type,
        COUNT(c.id) AS clicks
      FROM link_clicks c
      LEFT JOIN blocks b ON b.id = c.block_id AND b.profile_id = c.profile_id
      WHERE c.profile_id = ?${pageId ? ' AND c.page_id = ?' : ''} AND c.created_at >= ?
      GROUP BY c.block_id, b.title, b.url, b.type
      ORDER BY clicks DESC
      LIMIT 5
    `).all(...scopeArgs, thirtyDaysAgo) as any[];

    // 7-Day Timeline Breakdown
    const dayMs = 24 * 60 * 60 * 1000;
    const dailyTimeline = [];
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const dayStartTime = todayStart.getTime() - i * dayMs;
      const dayEndTime = dayStartTime + dayMs;
      const dateLabel = new Date(dayStartTime).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });

      const dayViews = (db.prepare(`
        SELECT COUNT(*) as count 
        FROM profile_views 
        WHERE profile_id = ?${scope} AND created_at >= ? AND created_at < ?
      `).get(...scopeArgs, dayStartTime, dayEndTime) as { count: number }).count;

      const dayClicks = (db.prepare(`
        SELECT COUNT(*) as count 
        FROM link_clicks 
        WHERE profile_id = ?${scope} AND created_at >= ? AND created_at < ?
      `).get(...scopeArgs, dayStartTime, dayEndTime) as { count: number }).count;

      dailyTimeline.push({
        date: dateLabel,
        views: dayViews,
        clicks: dayClicks
      });
    }

    // Top Traffic Sources
    const topReferrers = db.prepare(`
      SELECT referrer, COUNT(*) as count
      FROM profile_views
      WHERE profile_id = ?${scope} AND created_at >= ?
      GROUP BY referrer
      ORDER BY count DESC
      LIMIT 5
    `).all(...scopeArgs, thirtyDaysAgo) as { referrer: string; count: number }[];

    // Top UTM Campaigns (Source / Medium / Campaign)
    const topUtmCampaigns = db.prepare(`
      SELECT 
        COALESCE(utm_source, '(direct)') as source,
        COALESCE(utm_medium, '(none)') as medium,
        COALESCE(utm_campaign, '(unnamed)') as campaign,
        COUNT(*) as count
      FROM profile_views
      WHERE profile_id = ?${scope} AND created_at >= ? AND (utm_campaign IS NOT NULL OR utm_source IS NOT NULL)
      GROUP BY utm_source, utm_medium, utm_campaign
      ORDER BY count DESC
      LIMIT 5
    `).all(...scopeArgs, thirtyDaysAgo) as { source: string; medium: string; campaign: string; count: number }[];

    res.json({
      totalViews,
      uniqueVisitors,
      totalClicks,
      ctr: `${ctr}%`,
      topLinks: topLinks.map(l => ({
        ...l,
        percentage: totalClicks > 0 ? Math.round((l.clicks / totalClicks) * 100) : 0
      })),
      dailyTimeline,
      topReferrers,
      topUtmCampaigns
      , timezone: 'UTC'
      , period: 'last_30_days'
      , ctrBasis: 'total_clicks / total_views'
      , pageId
    });
  } catch (err: any) {
    console.error('Analytics stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics.' });
  }
});
