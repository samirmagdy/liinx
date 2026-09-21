import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { createId } from '../utils/ids.js';
import { isSafeLinkUrl } from '../utils/urlValidation.js';
import { getMailtoHref, getPhoneHref } from '../../shared/index.js';
import { sqliteAnalyticsEventStore } from '../infrastructure/sqliteAnalyticsEventStore.js';

export const analyticsRouter = Router();

function hashIp(ip?: string): string {
  if (!ip) return 'anonymous';
  const clientIp = ip.split(',')[0].trim();
  return crypto.createHash('sha256').update(clientIp + 'raloa_salt_2026').digest('hex').substring(0, 16);
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

export function flushAnalyticsBuffers() {
  sqliteAnalyticsEventStore.flush();
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

function parseBlockExtra(raw: string | null | undefined): any {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function targetFromBlockType(block: any, extra: any): string | null {
  let target = block.url as string | null;
  if (!target && block.type === 'image') target = typeof extra?.linkUrl === 'string' ? extra.linkUrl : null;
  if (!target && ['event', 'presave', 'product', 'tips'].includes(block.type)) {
    target = typeof extra?.url === 'string' ? extra.url : null;
  }
  if (!target && block.type === 'phone') {
    target = extra?.contactType === 'email'
      ? getMailtoHref(extra?.email, extra?.subject, extra?.body)
      : getPhoneHref(extra?.phone);
  }
  return target;
}

function targetFromListItem(extra: any, query: Record<string, unknown>): string | null | undefined {
  const itemId = typeof query.item === 'string' ? query.item : null;
  const itemIndex = typeof query.itemIndex === 'string' && /^\d+$/.test(query.itemIndex) ? Number(query.itemIndex) : null;
  if (!itemId && itemIndex === null) return undefined;
  const items = Array.isArray(extra?.items) ? extra.items : [];
  const item = itemId ? items.find((candidate: any) => candidate?.id === itemId) : items[itemIndex!];
  if (!item) return null;
  return typeof item.linkUrl === 'string' ? item.linkUrl : typeof item.url === 'string' ? item.url : null;
}

function resolveRedirectTarget(block: any, query: Record<string, unknown>): string | null {
  const extra = parseBlockExtra(block.extra_json);
  const itemTarget = targetFromListItem(extra, query);
  const target = itemTarget === undefined ? targetFromBlockType(block, extra) : itemTarget;
  return typeof target === 'string' && target.trim() ? target : null;
}

function recordClickIfAllowed(req: any, block: any, targetUrl: string): void {
  const ip = req.ip || req.socket.remoteAddress || '';
  const ipHash = hashIp(ip);
  if (isClickRateLimited(ipHash, block.id)) return;

  const userAgent = (req.headers['user-agent'] as string) || '';
  if (isLikelyBot(userAgent)) return;

  const referrer = boundedQueryValue(req.headers['referer']) || 'direct';
  const utmSource = boundedQueryValue(req.query.utm_source);
  const utmMedium = boundedQueryValue(req.query.utm_medium);
  const utmCampaign = boundedQueryValue(req.query.utm_campaign);
  const now = Date.now();
  const clickId = createId('clk');
  try {
    sqliteAnalyticsEventStore.recordClick({
      id: clickId,
      blockId: block.id,
      profileId: block.profile_id,
      targetUrl,
      ipHash,
      referrer,
      userAgent,
      utmSource,
      utmMedium,
      utmCampaign,
      pageId: block.page_id,
      dedupeKey: analyticsDedupeKey('click', [ipHash, block.id, targetUrl, utmSource || '', utmMedium || '', utmCampaign || ''], now),
      createdAt: now
    });
  } catch (error) {
    console.error('Analytics click event was not queued:', error);
  }
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
      WHERE b.id = ? AND COALESCE(b.visible, 1) = 1
    `).get(blockId) as any;

    if (!block) {
      return res.status(404).send('Link not found or inactive.');
    }
    const now = Date.now();
    if ((block.start_at != null && block.start_at > now) || (block.end_at != null && block.end_at <= now)) {
      return res.status(404).send('Link not found or inactive.');
    }

    const rawTarget = resolveRedirectTarget(block, req.query);
    if (!rawTarget) {
      return res.status(404).send('Link not found or inactive.');
    }
    const targetUrl = sanitizeUrl(rawTarget);
    if (!targetUrl) {
      return res.status(400).send('Invalid destination URL.');
    }

    recordClickIfAllowed(req, block, targetUrl);

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
    try {
      sqliteAnalyticsEventStore.recordView({
        id: viewRecord.id,
        profileId: viewRecord.profile_id,
        ipHash: viewRecord.ip_hash,
        referrer: viewRecord.referrer,
        userAgent: viewRecord.user_agent,
        utmSource: viewRecord.utm_source,
        utmMedium: viewRecord.utm_medium,
        utmCampaign: viewRecord.utm_campaign,
        pageId: viewRecord.page_id,
        dedupeKey: viewRecord.dedupe_key,
        createdAt: viewRecord.created_at
      });
    } catch (error) {
      console.error('Analytics view event was not queued:', error);
    }

    res.json({ success: true, recorded: true });
  } catch (err: any) {
    console.error('Log view error:', err);
    res.status(500).json({ error: 'Failed to record view' });
  }
});

// Authenticated Creator Analytics Stats
function buildDailyTimeline(scope: string, scopeArgs: string[]) {
  const dayMs = 24 * 60 * 60 * 1000;
  const timeline = [];
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const dayStartTime = todayStart.getTime() - i * dayMs;
    const dayEndTime = dayStartTime + dayMs;
    const date = new Date(dayStartTime).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
    const views = (db.prepare(`SELECT COUNT(*) as count FROM profile_views WHERE profile_id = ?${scope} AND created_at >= ? AND created_at < ?`)
      .get(...scopeArgs, dayStartTime, dayEndTime) as { count: number }).count;
    const clicks = (db.prepare(`SELECT COUNT(*) as count FROM link_clicks WHERE profile_id = ?${scope} AND created_at >= ? AND created_at < ?`)
      .get(...scopeArgs, dayStartTime, dayEndTime) as { count: number }).count;
    timeline.push({ date, views, clicks });
  }
  return timeline;
}

function loadTopLinks(pageId: string | null, scopeArgs: string[], cutoff: number) {
  return db.prepare(`
    SELECT c.block_id AS id, COALESCE(b.title, 'Deleted link') AS title,
      COALESCE(b.url, MAX(c.target_url)) AS url, COALESCE(b.type, 'link') AS type,
      COUNT(c.id) AS clicks
    FROM link_clicks c
    LEFT JOIN blocks b ON b.id = c.block_id AND b.profile_id = c.profile_id
    WHERE c.profile_id = ?${pageId ? ' AND c.page_id = ?' : ''} AND c.created_at >= ?
    GROUP BY c.block_id, b.title, b.url, b.type
    ORDER BY clicks DESC
    LIMIT 5
  `).all(...scopeArgs, cutoff) as any[];
}

function loadTopReferrers(scope: string, scopeArgs: string[], cutoff: number) {
  return db.prepare(`
    SELECT referrer, COUNT(*) as count FROM profile_views
    WHERE profile_id = ?${scope} AND created_at >= ?
    GROUP BY referrer ORDER BY count DESC LIMIT 5
  `).all(...scopeArgs, cutoff) as { referrer: string; count: number }[];
}

function loadTopUtmCampaigns(scope: string, scopeArgs: string[], cutoff: number) {
  return db.prepare(`
    SELECT COALESCE(utm_source, '(direct)') as source,
      COALESCE(utm_medium, '(none)') as medium,
      COALESCE(utm_campaign, '(unnamed)') as campaign, COUNT(*) as count
    FROM profile_views
    WHERE profile_id = ?${scope} AND created_at >= ? AND (utm_campaign IS NOT NULL OR utm_source IS NOT NULL)
    GROUP BY utm_source, utm_medium, utm_campaign ORDER BY count DESC LIMIT 5
  `).all(...scopeArgs, cutoff) as { source: string; medium: string; campaign: string; count: number }[];
}

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
    const scopeArgs: string[] = pageId ? [profileId, pageId] : [profileId];
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const viewsRow = db.prepare(`SELECT COUNT(*) as count, COUNT(DISTINCT ip_hash) as uniqueCount FROM profile_views WHERE profile_id = ?${scope} AND created_at >= ?`)
      .get(...scopeArgs, thirtyDaysAgo) as { count: number; uniqueCount: number };
    const clicksRow = db.prepare(`SELECT COUNT(*) as count FROM link_clicks WHERE profile_id = ?${scope} AND created_at >= ?`)
      .get(...scopeArgs, thirtyDaysAgo) as { count: number };
    const totalViews = viewsRow?.count || 0;
    const uniqueVisitors = viewsRow?.uniqueCount || 0;
    const totalClicks = clicksRow?.count || 0;
    const ctr = totalViews ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';
    const topLinks = loadTopLinks(pageId, scopeArgs, thirtyDaysAgo);
    const dailyTimeline = buildDailyTimeline(scope, scopeArgs);
    const topReferrers = loadTopReferrers(scope, scopeArgs, thirtyDaysAgo);
    const topUtmCampaigns = loadTopUtmCampaigns(scope, scopeArgs, thirtyDaysAgo);

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
