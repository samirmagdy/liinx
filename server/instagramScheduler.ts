import { db } from './db.js';
import { decryptSecret } from './secretStore.js';
import { fetchInstagramMedia, syncMediaToBlocks } from './services/instagramSync.js';
import { log, logError } from './logger.js';

export function startInstagramSyncScheduler() {
  if (process.env.NODE_ENV === 'test' || process.env.INSTAGRAM_AUTO_SYNC_ENABLED === 'false') return;
  const intervalMs = Math.max(5, Number(process.env.INSTAGRAM_SYNC_INTERVAL_MINUTES || 30)) * 60 * 1000;
  const run = async () => {
    const rows = db.prepare(`SELECT profile_id, access_token FROM instagram_sync WHERE auto_sync_enabled = 1`).all() as { profile_id: string; access_token: string }[];
    for (const row of rows) {
      try {
        const media = await fetchInstagramMedia(decryptSecret(row.access_token));
        if (media.length > 0) syncMediaToBlocks(row.profile_id, media);
      } catch (error) {
        logError('Scheduled Instagram sync failed', error, { profileId: row.profile_id });
      }
    }
    if (rows.length > 0) log('info', 'Scheduled Instagram sync completed', { profiles: rows.length });
  };
  const timer = setInterval(() => { void run(); }, intervalMs);
  timer.unref();
}
