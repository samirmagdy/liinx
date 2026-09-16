import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { parseBlockContract } from '../contracts.js';
import { createId } from '../utils/ids.js';
import { invalidatePublicProfileCache } from './profiles.js';
import { hasEntitlement } from '../entitlements.js';

export const apiV1Router = Router();

// Middleware: Authenticate with API Key (liinx_live_...)
export interface ApiKeyRequest extends Request {
  profile?: any;
  apiKeyId?: string;
}

export function requireApiKey(req: ApiKeyRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'API key required. Include "Authorization: Bearer liinx_live_..." header.'
    });
  }

  const rawKey = authHeader.split(' ')[1].trim();
  if (!rawKey.startsWith('liinx_live_')) {
    return res.status(401).json({ error: 'Invalid API key format. Keys start with liinx_live_' });
  }

  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyRecord = db.prepare('SELECT * FROM api_keys WHERE key_hash = ?').get(hash) as any;

  if (!keyRecord) {
    return res.status(401).json({ error: 'Invalid or revoked API key.' });
  }

  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(keyRecord.profile_id) as any;
  if (!profile) {
    return res.status(404).json({ error: 'Associated creator profile not found.' });
  }

  req.profile = profile;
  if (!hasEntitlement(profile.plan, 'apiAccess')) {
    return res.status(403).json({ error: 'Public REST API access is available exclusively on the Studio tier.' });
  }
  req.apiKeyId = keyRecord.id;
  next();
}

// -------------------------------------------------------------
// Studio API Key Management Routes (Authenticated via JWT)
// -------------------------------------------------------------

// List API Keys
apiV1Router.get('/studio/api-keys', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const profileId = req.user!.profileId;
    const keys = db.prepare(`
      SELECT id, prefix, name, created_at as createdAt
      FROM api_keys
      WHERE profile_id = ?
      ORDER BY created_at DESC
    `).all(profileId) as any[];

    res.json({ keys });
  } catch (err: any) {
    console.error('List API keys error:', err);
    res.status(500).json({ error: 'Failed to retrieve API keys' });
  }
});

const createKeySchema = z.object({
  name: z.string().min(1, 'Key name is required').max(50)
});

// Generate New API Key (Studio Plan Required)
apiV1Router.post('/studio/api-keys', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = db.prepare('SELECT plan FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    if (!profile || !hasEntitlement(profile.plan, 'apiAccess')) {
      return res.status(403).json({
        error: 'Public REST API access is available exclusively on the Studio tier. Please upgrade to create API keys.'
      });
    }

    const parse = createKeySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const rawSecret = crypto.randomBytes(24).toString('hex');
    const fullKey = `liinx_live_${rawSecret}`;
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');
    const prefix = `liinx_live_${rawSecret.substring(0, 6)}...`;
    const keyId = createId('key');
    const now = Date.now();

    db.prepare(`
      INSERT INTO api_keys (id, profile_id, key_hash, prefix, name, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(keyId, req.user!.profileId, keyHash, prefix, parse.data.name, now);

    res.status(201).json({
      success: true,
      key: {
        id: keyId,
        name: parse.data.name,
        prefix,
        createdAt: now
      },
      apiKey: fullKey,
      warning: 'Please copy your API key now. You will not be able to view it again.'
    });
  } catch (err: any) {
    console.error('Generate API key error:', err);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// Revoke API Key
apiV1Router.delete('/studio/api-keys/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const keyId = req.params.id;
    const profileId = req.user!.profileId;

    const result = db.prepare('DELETE FROM api_keys WHERE id = ? AND profile_id = ?').run(keyId, profileId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'API key not found or unauthorized' });
    }

    res.json({ success: true, message: 'API key revoked successfully' });
  } catch (err: any) {
    console.error('Revoke API key error:', err);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// -------------------------------------------------------------
// Public REST API v1 Endpoints (Authenticated via API Key)
// -------------------------------------------------------------

// GET /api/v1/profile
apiV1Router.get('/v1/profile', requireApiKey, (req: ApiKeyRequest, res: Response) => {
  try {
    const profile = req.profile;
    const blocks = db.prepare('SELECT id, type, title, url, subtitle, badge, icon, highlighted, position, created_at FROM blocks WHERE profile_id = ? ORDER BY position ASC').all(profile.id);

    res.json({
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      plan: profile.plan,
      customDomain: profile.custom_domain,
      blocks
    });
  } catch (err: any) {
    console.error('v1 profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile via API' });
  }
});

// POST /api/v1/blocks
apiV1Router.post('/v1/blocks', requireApiKey, (req: ApiKeyRequest, res: Response) => {
  try {
    const parse = parseBlockContract({ ...req.body, type: 'link' });
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const profile = req.profile;
    const { title, url, subtitle, badge, highlighted } = parse.data as {
      title: string; url: string; subtitle?: string | null; badge?: string | null; highlighted?: boolean;
    };
    const now = Date.now();
    const id = createId('blk');

    const maxPosRow = db.prepare('SELECT MAX(position) as maxPos FROM blocks WHERE profile_id = ?').get(profile.id) as { maxPos: number | null };
    const nextPos = (maxPosRow && maxPosRow.maxPos !== null) ? maxPosRow.maxPos + 1 : 0;

    db.prepare(`
      INSERT INTO blocks (id, profile_id, type, title, url, subtitle, badge, highlighted, position, created_at, updated_at)
      VALUES (?, ?, 'link', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, profile.id, title, url, subtitle || null, badge || null, highlighted ? 1 : 0, nextPos, now, now);
    invalidatePublicProfileCache(profile.id);

    res.status(201).json({
      success: true,
      block: {
        id,
        type: 'link',
        title,
        url,
        subtitle: subtitle || null,
        badge: badge || null,
        highlighted: Boolean(highlighted),
        position: nextPos,
        createdAt: now
      }
    });
  } catch (err: any) {
    console.error('v1 create block error:', err);
    res.status(500).json({ error: 'Failed to create block via API' });
  }
});

// DELETE /api/v1/blocks/:id
apiV1Router.delete('/v1/blocks/:id', requireApiKey, (req: ApiKeyRequest, res: Response) => {
  try {
    const blockId = req.params.id;
    const profile = req.profile;

    const result = db.prepare('DELETE FROM blocks WHERE id = ? AND profile_id = ?').run(blockId, profile.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Block not found or does not belong to your profile' });
    }
    invalidatePublicProfileCache(profile.id);

    res.json({ success: true, message: 'Block deleted successfully' });
  } catch (err: any) {
    console.error('v1 delete block error:', err);
    res.status(500).json({ error: 'Failed to delete block via API' });
  }
});
