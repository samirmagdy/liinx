import { db } from '../db.js';
import { createId } from '../utils/ids.js';
import { invalidatePublicProfileCache } from '../routes/profiles.js';

export interface ExtractedLink {
  url: string;
  title: string;
  snippet?: string;
}

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  permalink?: string;
  media_type?: string;
  timestamp?: string;
}

/**
 * Extracts, cleans, and derives contextual titles for URLs found inside an Instagram caption.
 */
export function extractLinksFromCaption(caption: string): ExtractedLink[] {
  if (!caption || typeof caption !== 'string') return [];

  const urlRegex = /(https?:\/\/[^\s<>"'{}|\\^`]+|www\.[^\s<>"'{}|\\^`]+)/gi;
  const matches = caption.match(urlRegex) || [];
  const results: ExtractedLink[] = [];
  const seenUrls = new Set<string>();

  for (const rawMatch of matches) {
    // Strip trailing punctuation often attached in social media text (e.g. "Visit https://link.com/!")
    let cleanedUrl = rawMatch.replace(/[.,!?:;)\]}>]+$/, '');
    if (cleanedUrl.toLowerCase().startsWith('www.')) {
      cleanedUrl = `https://${cleanedUrl}`;
    }

    // Scheme validation & security check
    try {
      const parsed = new URL(cleanedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        continue;
      }
      // Avoid localhost/private network targeting
      if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)) {
        continue;
      }
    } catch {
      continue;
    }

    const normalizedUrl = cleanedUrl.trim();
    if (seenUrls.has(normalizedUrl.toLowerCase())) continue;
    seenUrls.add(normalizedUrl.toLowerCase());

    // Extract human-friendly title from preceding caption text
    const title = deriveTitleFromContext(caption, rawMatch, normalizedUrl);

    // Get a brief snippet around the URL
    const snippetIndex = caption.indexOf(rawMatch);
    const start = Math.max(0, snippetIndex - 30);
    const end = Math.min(caption.length, snippetIndex + rawMatch.length + 30);
    const snippet = caption.substring(start, end).replace(/\n/g, ' ').trim();

    results.push({
      url: normalizedUrl,
      title,
      snippet: snippet.length > 80 ? `${snippet.substring(0, 80)}...` : snippet
    });
  }

  return results;
}

/**
 * Derives a readable button title from the text preceding the link in the caption.
 */
function deriveTitleFromContext(fullCaption: string, targetMatch: string, normalizedUrl: string): string {
  const lines = fullCaption.split(/\r?\n/);
  let relevantLine = '';

  for (const line of lines) {
    if (line.includes(targetMatch)) {
      relevantLine = line;
      break;
    }
  }

  if (relevantLine) {
    const textBefore = relevantLine.substring(0, relevantLine.indexOf(targetMatch)).trim();

    // 1. If textBefore has a phrase ending before ':' or '-', extract it (e.g. "Tickets on sale now:")
    const colonPhrase = textBefore.match(/(?:[.!?;]|^)\s*([A-Za-z0-9][A-Za-z0-9\s—–'-]{2,40})[:\s-]*$/);
    if (colonPhrase && colonPhrase[1]) {
      const candidate = colonPhrase[1].trim();
      if (candidate.length >= 3 && candidate.length <= 40) {
        return candidate;
      }
    }

    // 2. Common call-to-action prefixes
    const ctaMatch = textBefore.match(/(?:check out|link(?:\s+in\s+bio)?|pre-?order|tickets?|buy|listen(?:\s+here)?|stream|read(?:\s+more)?|rsvp|shop|new(?:\s+drop)?|visit)[:\s-]+(.+)$/i) ||
                     textBefore.match(/([A-Z0-9][a-zA-Z0-9\s—–'-]{3,35})[:\s-]*$/);

    if (ctaMatch && ctaMatch[1] && ctaMatch[1].trim().length >= 3) {
      const candidate = ctaMatch[1].trim().replace(/^[:\s-]+|[:\s-]+$/g, '');
      if (candidate.length <= 40) {
        return candidate;
      }
    } else if (textBefore.length >= 3 && textBefore.length <= 35) {
      const candidate = textBefore.replace(/^[•\s\->:]+|[:\s-]+$/g, '').trim();
      if (candidate.length >= 3) {
        return candidate;
      }
    }
  }

  // Fallback: derive title from hostname/path
  try {
    const parsed = new URL(normalizedUrl);
    const host = parsed.hostname.replace(/^www\./, '');
    const pathPart = parsed.pathname.replace(/^\/|\/$/g, '');
    if (pathPart && pathPart.length <= 25) {
      return `${host}/${pathPart}`;
    }
    return `Visit ${host}`;
  } catch {
    return 'Instagram Post Link';
  }
}

/**
 * Fetches recent media from the Meta Instagram Graph API.
 */
export async function fetchInstagramMedia(accessToken: string): Promise<InstagramMediaItem[]> {
  const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${encodeURIComponent(accessToken)}`;
  
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMsg = `Instagram API error: HTTP ${response.status}`;
    try {
      const json = JSON.parse(errorBody);
      if (json.error?.message) {
        errorMsg = `Instagram: ${json.error.message}`;
      }
    } catch {
      // Use default errorMsg
    }
    throw new Error(errorMsg);
  }

  const data = await response.json() as { data?: InstagramMediaItem[] };
  return data.data || [];
}

/**
 * Synchronizes Instagram media items into real LinkBlock database rows for a profile.
 */
export function syncMediaToBlocks(profileId: string, mediaItems: InstagramMediaItem[]) {
  // 1. Fetch existing URLs to avoid duplicate blocks
  const existingBlocks = db.prepare(
    'SELECT url FROM blocks WHERE profile_id = ? AND url IS NOT NULL'
  ).all(profileId) as Array<{ url: string }>;

  const existingUrls = new Set(existingBlocks.map(b => b.url.toLowerCase()));

  // 2. Fetch min position to insert new synced links at top of profile
  const minPosRow = db.prepare(
    'SELECT MIN(position) as minPos FROM blocks WHERE profile_id = ?'
  ).get(profileId) as { minPos: number | null };

  let currentPos = minPosRow && minPosRow.minPos !== null ? minPosRow.minPos - 1 : 0;

  const createdLinks: Array<{ id: string; title: string; url: string }> = [];
  let latestMediaId: string | null = null;

  const insertBlockStmt = db.prepare(`
    INSERT INTO blocks (
      id, profile_id, type, title, url, subtitle, icon, badge, highlighted, position, created_at, updated_at
    ) VALUES (?, ?, 'link', ?, ?, ?, NULL, 'INSTAGRAM', 0, ?, ?, ?)
  `);

  const runSyncTransaction = db.transaction(() => {
    for (const media of mediaItems) {
      if (!latestMediaId && media.id) {
        latestMediaId = media.id;
      }

      if (!media.caption) continue;

      const links = extractLinksFromCaption(media.caption);
      for (const link of links) {
        if (existingUrls.has(link.url.toLowerCase())) {
          continue; // Skip duplicate link
        }

        const blockId = createId('blk_insta');
        const now = Date.now();
        const subtitle = link.snippet || 'Auto-synced from Instagram post';

        insertBlockStmt.run(
          blockId,
          profileId,
          link.title,
          link.url,
          subtitle,
          currentPos,
          now,
          now
        );

        existingUrls.add(link.url.toLowerCase());
        createdLinks.push({ id: blockId, title: link.title, url: link.url });
        currentPos -= 1; // Decrement so next link is higher or sequential
      }
    }

    // 3. Update sync status metadata in instagram_sync
    const now = Date.now();
    if (latestMediaId) {
      db.prepare(`
        UPDATE instagram_sync 
        SET last_synced_at = ?, last_media_id = ?, updated_at = ?
        WHERE profile_id = ?
      `).run(now, latestMediaId, now, profileId);
    } else {
      db.prepare(`
        UPDATE instagram_sync 
        SET last_synced_at = ?, updated_at = ?
        WHERE profile_id = ?
      `).run(now, now, profileId);
    }
  });

  runSyncTransaction();
  invalidatePublicProfileCache(profileId);

  return {
    mediaProcessed: mediaItems.length,
    linksCreated: createdLinks,
    totalCreated: createdLinks.length
  };
}
