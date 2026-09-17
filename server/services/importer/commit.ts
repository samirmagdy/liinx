import { db } from '../../db.js';
import { createId } from '../../utils/ids.js';
import { invalidatePublicProfileCache } from '../../routes/profiles.js';
import { CommitImportedLinksPayload, CommitImportedLinksResult } from './types.js';

export function commitImportedLinks(profileId: string, payload: CommitImportedLinksPayload): CommitImportedLinksResult {
  const { links, pageId, updateProfileInfo, displayName, bio, avatarUrl } = payload;
  const now = Date.now();

  const result = db.transaction(() => {
    const profile = db.prepare('SELECT display_name as displayName FROM profiles WHERE id = ?').get(profileId) as { displayName?: string } | undefined;
    if (!profile) {
      throw new Error('Creator profile not found.');
    }

    let destinationPage = pageId
      ? db.prepare('SELECT id FROM pages WHERE id = ? AND profile_id = ?').get(pageId, profileId) as { id: string } | undefined
      : db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(profileId) as { id: string } | undefined;

    if (pageId && !destinationPage) {
      throw new Error('The selected destination page is unavailable.');
    }

    if (!destinationPage) {
      const homeId = createId('page');
      db.prepare(`
        INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at)
        VALUES (?, ?, 'home', ?, NULL, 0, 1, 1, ?, ?)
      `).run(homeId, profileId, profile.displayName || 'Home', now, now);
      destinationPage = { id: homeId };
    }

    const maxPosRow = db.prepare('SELECT MAX(position) as max_pos FROM blocks WHERE profile_id = ? AND page_id = ?').get(profileId, destinationPage.id) as { max_pos: number | null };
    let currentPos = (maxPosRow?.max_pos ?? -1) + 1;

    const existingUrls = new Set(
      (db.prepare("SELECT url FROM blocks WHERE profile_id = ? AND page_id = ? AND type = 'link' AND url IS NOT NULL").all(profileId, destinationPage.id) as Array<{ url: string }>).map(row => row.url)
    );

    const insertBlock = db.prepare(`
      INSERT INTO blocks (id, profile_id, type, title, url, subtitle, position, page_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let imported = 0;
    let skippedDuplicates = 0;

    for (const item of links) {
      if (existingUrls.has(item.url)) {
        skippedDuplicates++;
        continue;
      }
      const id = createId('blk');
      insertBlock.run(
        id,
        profileId,
        'link',
        item.title,
        item.url,
        item.subtitle || null,
        currentPos++,
        destinationPage.id,
        now,
        now
      );
      existingUrls.add(item.url);
      imported++;
    }

    if (updateProfileInfo) {
      const existingProf = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId) as any;
      if (existingProf) {
        db.prepare(`
          UPDATE profiles 
          SET display_name = COALESCE(?, display_name),
              bio = COALESCE(?, bio),
              avatar_url = COALESCE(?, avatar_url),
              updated_at = ?
          WHERE id = ?
        `).run(
          displayName || null,
          bio || null,
          avatarUrl || null,
          now,
          profileId
        );
      }
    }

    return { imported, skippedDuplicates };
  })();

  invalidatePublicProfileCache(profileId);
  return result;
}
