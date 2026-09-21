import { db } from '../../db.js';
import { createHomePage, homePageId, insertBlocks, newBlockId, nextBlockPosition, type CompositionBlock } from '../siteComposition.js';
import { invalidatePublicProfileCache } from '../../routes/profiles.js';
import { type CommitImportedLinksPayload, type CommitImportedLinksResult } from './types.js';

export function commitImportedLinks(profileId: string, payload: CommitImportedLinksPayload): CommitImportedLinksResult {
  const { links, pageId, updateProfileInfo, displayName, bio, avatarUrl } = payload;
  const now = Date.now();

  const result = db.transaction(() => {
    const profile = db.prepare('SELECT display_name as displayName FROM profiles WHERE id = ?').get(profileId) as { displayName?: string } | undefined;
    if (!profile) {
      throw new Error('Creator profile not found.');
    }

    const existingHome = homePageId(profileId);
    let destinationPage: { id: string } | undefined = pageId
      ? db.prepare('SELECT id FROM pages WHERE id = ? AND profile_id = ?').get(pageId, profileId) as { id: string } | undefined
      : (existingHome ? { id: existingHome } : undefined);

    if (pageId && !destinationPage) {
      throw new Error('The selected destination page is unavailable.');
    }

    if (!destinationPage) {
      destinationPage = { id: createHomePage(profileId, profile.displayName || 'Home', null, now) };
    }

    let currentPos = nextBlockPosition(profileId, destinationPage.id);

    const existingUrls = new Set(
      (db.prepare("SELECT url FROM blocks WHERE profile_id = ? AND page_id = ? AND type = 'link' AND url IS NOT NULL").all(profileId, destinationPage.id) as Array<{ url: string }>).map(row => row.url)
    );

    const rows: CompositionBlock[] = [];
    let imported = 0;
    let skippedDuplicates = 0;

    for (const item of links) {
      if (existingUrls.has(item.url)) {
        skippedDuplicates++;
        continue;
      }
      rows.push({
        id: newBlockId(), type: 'link', title: item.title, url: item.url, subtitle: item.subtitle || null,
        icon: null, badge: null, highlighted: false, visible: true, position: currentPos++, startAt: null,
        endAt: null, pageId: destinationPage.id, extraJson: null
      });
      existingUrls.add(item.url);
      imported++;
    }
    insertBlocks(profileId, rows, now);

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
