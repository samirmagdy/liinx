import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const blocksRouter = Router();

const createBlockSchema = z.object({
  type: z.enum(['link', 'header', 'audio', 'video', 'folder', 'newsletter', 'instagram_grid']),
  title: z.string().min(1, 'Title is required').max(150),
  url: z.string().optional().nullable(),
  subtitle: z.string().max(250).optional().nullable(),
  badge: z.string().max(30).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  highlighted: z.boolean().optional(),
  extra: z.any().optional()
});

const updateBlockSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150).optional(),
  url: z.string().optional().nullable(),
  subtitle: z.string().max(250).optional().nullable(),
  badge: z.string().max(30).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  highlighted: z.boolean().optional(),
  extra: z.any().optional()
});

// Create new block
blocksRouter.post('/studio/blocks', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const parse = createBlockSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { type, title, url, subtitle, badge, icon, highlighted, extra } = parse.data;
    const profileId = req.user!.profileId;
    const now = Date.now();
    const id = 'blk_' + Math.random().toString(36).substring(2, 10);

    // Get current max position
    const maxPosRow = db.prepare('SELECT MAX(position) as maxPos FROM blocks WHERE profile_id = ?').get(profileId) as { maxPos: number | null };
    const nextPos = (maxPosRow && maxPosRow.maxPos !== null) ? maxPosRow.maxPos + 1 : 0;

    db.prepare(`
      INSERT INTO blocks (
        id, profile_id, type, title, url, subtitle, icon, badge, highlighted, position, extra_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      profileId,
      type,
      title,
      url || null,
      subtitle || null,
      icon || null,
      badge || null,
      highlighted ? 1 : 0,
      nextPos,
      extra ? JSON.stringify(extra) : null,
      now,
      now
    );

    res.status(201).json({
      id,
      type,
      title,
      url: url || null,
      subtitle: subtitle || null,
      icon: icon || null,
      badge: badge || null,
      highlighted: Boolean(highlighted),
      position: nextPos,
      clicks: 0,
      ...(extra || {})
    });
  } catch (err: any) {
    console.error('Create block error:', err);
    res.status(500).json({ error: 'Failed to create block.' });
  }
});

// Reorder blocks (must precede parameterized /:id route)
blocksRouter.put('/studio/blocks/reorder', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { blockIds } = req.body;
    if (!Array.isArray(blockIds)) {
      return res.status(400).json({ error: 'blockIds array is required.' });
    }

    const profileId = req.user!.profileId;
    const updatePos = db.prepare('UPDATE blocks SET position = ? WHERE id = ? AND profile_id = ?');

    const reorderTx = db.transaction(() => {
      blockIds.forEach((id: string, index: number) => {
        updatePos.run(index, id, profileId);
      });
    });

    reorderTx();
    res.json({ success: true, message: 'Blocks reordered successfully.' });
  } catch (err: any) {
    console.error('Reorder blocks error:', err);
    res.status(500).json({ error: 'Failed to reorder blocks.' });
  }
});

// Update block
blocksRouter.put('/studio/blocks/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const blockId = req.params.id;
    const profileId = req.user!.profileId;

    // Check ownership
    const existing = db.prepare('SELECT * FROM blocks WHERE id = ? AND profile_id = ?').get(blockId, profileId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Block not found or unauthorized.' });
    }

    const parse = updateBlockSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const now = Date.now();
    const data = parse.data;

    let existingExtra = {};
    if (existing.extra_json) {
      try { existingExtra = JSON.parse(existing.extra_json); } catch (e) {}
    }

    const mergedExtra = data.extra !== undefined ? { ...existingExtra, ...data.extra } : existingExtra;

    db.prepare(`
      UPDATE blocks
      SET title = coalesce(?, title),
          url = ?,
          subtitle = ?,
          badge = ?,
          icon = ?,
          highlighted = ?,
          extra_json = ?,
          updated_at = ?
      WHERE id = ? AND profile_id = ?
    `).run(
      data.title !== undefined ? data.title : existing.title,
      data.url !== undefined ? data.url : existing.url,
      data.subtitle !== undefined ? data.subtitle : existing.subtitle,
      data.badge !== undefined ? data.badge : existing.badge,
      data.icon !== undefined ? data.icon : existing.icon,
      data.highlighted !== undefined ? (data.highlighted ? 1 : 0) : existing.highlighted,
      JSON.stringify(mergedExtra),
      now,
      blockId,
      profileId
    );

    res.json({ success: true, message: 'Block updated successfully.' });
  } catch (err: any) {
    console.error('Update block error:', err);
    res.status(500).json({ error: 'Failed to update block.' });
  }
});

// Delete block
blocksRouter.delete('/studio/blocks/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const blockId = req.params.id;
    const profileId = req.user!.profileId;

    const result = db.prepare('DELETE FROM blocks WHERE id = ? AND profile_id = ?').run(blockId, profileId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Block not found or unauthorized.' });
    }

    res.json({ success: true, message: 'Block deleted successfully.' });
  } catch (err: any) {
    console.error('Delete block error:', err);
    res.status(500).json({ error: 'Failed to delete block.' });
  }
});
