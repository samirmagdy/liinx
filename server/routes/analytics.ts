import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const analyticsRouter = Router();

function hashIp(ip?: string): string {
  if (!ip) return 'anonymous';
  const clientIp = ip.split(',')[0].trim();
  return crypto.createHash('sha256').update(clientIp + 'liinx_salt_2026').digest('hex').substring(0, 16);
}

function sanitizeUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

interface ClickRecord {
  id: string;
  block_id: string;
  profile_id: string;
  target_url: string;
  ip_hash: string;
  referrer: string;
  user_agent: string;
  created_at: number;
}

interface ViewRecord {
  id: string;
  profile_id: string;
  ip_hash: string;
  referrer: string;
  user_agent: string;
  created_at: number;
}

let clickBuffer: ClickRecord[] = [];
let viewBuffer: ViewRecord[] = [];

const insertClicksBatch = db.transaction((clicks: ClickRecord[]) => {
  const stmt = db.prepare(`
    INSERT INTO link_clicks (id, block_id, profile_id, target_url, ip_hash, referrer, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of clicks) {
    stmt.run(c.id, c.block_id, c.profile_id, c.target_url, c.ip_hash, c.referrer, c.user_agent, c.created_at);
  }
});

const insertViewsBatch = db.transaction((views: ViewRecord[]) => {
  const stmt = db.prepare(`
    INSERT INTO profile_views (id, profile_id, ip_hash, referrer, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const v of views) {
    stmt.run(v.id, v.profile_id, v.ip_hash, v.referrer, v.user_agent, v.created_at);
  }
});

export function flushAnalyticsBuffers() {
  if (clickBuffer.length > 0) {
    const toFlush = clickBuffer;
    clickBuffer = [];
    try {
      insertClicksBatch(toFlush);
    } catch (e) {
      console.error('Error flushing click batch:', e);
    }
  }

  if (viewBuffer.length > 0) {
    const toFlush = viewBuffer;
    viewBuffer = [];
    try {
      insertViewsBatch(toFlush);
    } catch (e) {
      console.error('Error flushing view batch:', e);
    }
  }
}

// Background flusher every 100ms
setInterval(flushAnalyticsBuffers, 100).unref();
process.on('exit', flushAnalyticsBuffers);

// Public Link Redirector & Click Logger
analyticsRouter.get('/r/:blockId', (req, res) => {
  try {
    const blockId = req.params.blockId;
    const block = db.prepare('SELECT * FROM blocks WHERE id = ?').get(blockId) as any;

    if (!block || !block.url) {
      return res.status(404).send('Link not found or inactive.');
    }

    const targetUrl = sanitizeUrl(block.url);
    if (!targetUrl) {
      return res.status(400).send('Invalid destination URL.');
    }

    // Record click into buffer (non-blocking for sub-10ms redirect latency)
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const ipHash = hashIp(ip);
    const referrer = (req.headers['referer'] as string) || 'direct';
    const userAgent = (req.headers['user-agent'] as string) || '';
    const now = Date.now();
    const clickId = 'clk_' + Math.random().toString(36).substring(2, 10);

    clickBuffer.push({
      id: clickId,
      block_id: block.id,
      profile_id: block.profile_id,
      target_url: targetUrl,
      ip_hash: ipHash,
      referrer,
      user_agent: userAgent,
      created_at: now
    });

    if (clickBuffer.length >= 100 || process.env.NODE_ENV === 'test') {
      flushAnalyticsBuffers();
    }

    // Fast 302 Found redirect
    res.redirect(302, targetUrl);
  } catch (err: any) {
    console.error('Redirect error:', err);
    res.status(500).send('Redirection failed.');
  }
});

// Public Record Profile View
analyticsRouter.post('/api/analytics/view', (req, res) => {
  try {
    const { profileId, referrer } = req.body;
    if (!profileId) {
      return res.status(400).json({ error: 'profileId is required' });
    }

    const profileExists = db.prepare('SELECT id FROM profiles WHERE id = ?').get(profileId);
    if (!profileExists) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const ipHash = hashIp(ip);
    const userAgent = (req.headers['user-agent'] as string) || '';
    const now = Date.now();
    const viewId = 'vw_' + Math.random().toString(36).substring(2, 10);

    viewBuffer.push({
      id: viewId,
      profile_id: profileId,
      ip_hash: ipHash,
      referrer: referrer || 'direct',
      user_agent: userAgent,
      created_at: now
    });

    if (viewBuffer.length >= 100 || process.env.NODE_ENV === 'test') {
      flushAnalyticsBuffers();
    }

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
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Total Views (30 days)
    const viewsRow = db.prepare(`
      SELECT COUNT(*) as count, COUNT(DISTINCT ip_hash) as uniqueCount 
      FROM profile_views 
      WHERE profile_id = ? AND created_at >= ?
    `).get(profileId, thirtyDaysAgo) as { count: number; uniqueCount: number };

    const totalViews = viewsRow ? viewsRow.count : 0;
    const uniqueVisitors = viewsRow ? viewsRow.uniqueCount : 0;

    // Total Clicks (30 days)
    const clicksRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM link_clicks 
      WHERE profile_id = ? AND created_at >= ?
    `).get(profileId, thirtyDaysAgo) as { count: number };

    const totalClicks = clicksRow ? clicksRow.count : 0;
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';

    // Top Links
    const topLinks = db.prepare(`
      SELECT b.id, b.title, b.url, b.type, COUNT(c.id) as clicks
      FROM blocks b
      LEFT JOIN link_clicks c ON b.id = c.block_id AND c.created_at >= ?
      WHERE b.profile_id = ? AND b.type IN ('link', 'audio', 'video')
      GROUP BY b.id
      ORDER BY clicks DESC
      LIMIT 5
    `).all(thirtyDaysAgo, profileId) as any[];

    // 7-Day Timeline Breakdown
    const dayMs = 24 * 60 * 60 * 1000;
    const dailyTimeline = [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const dayStartTime = todayStart.getTime() - i * dayMs;
      const dayEndTime = dayStartTime + dayMs;
      const dateLabel = new Date(dayStartTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      const dayViews = (db.prepare(`
        SELECT COUNT(*) as count 
        FROM profile_views 
        WHERE profile_id = ? AND created_at >= ? AND created_at < ?
      `).get(profileId, dayStartTime, dayEndTime) as { count: number }).count;

      const dayClicks = (db.prepare(`
        SELECT COUNT(*) as count 
        FROM link_clicks 
        WHERE profile_id = ? AND created_at >= ? AND created_at < ?
      `).get(profileId, dayStartTime, dayEndTime) as { count: number }).count;

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
      WHERE profile_id = ? AND created_at >= ?
      GROUP BY referrer
      ORDER BY count DESC
      LIMIT 5
    `).all(profileId, thirtyDaysAgo) as { referrer: string; count: number }[];

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
      topReferrers
    });
  } catch (err: any) {
    console.error('Analytics stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics.' });
  }
});
