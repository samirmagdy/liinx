import { db } from './db.js';
import { decryptSecret } from './secretStore.js';
import { fetchInstagramMedia, syncMediaToBlocks } from './services/instagramSync.js';
import { log, logError } from './logger.js';

export function startInstagramSyncScheduler() {
  if (process.env.NODE_ENV === 'test' || process.env.INSTAGRAM_AUTO_SYNC_ENABLED === 'false') return;
  const intervalMs = Math.max(5, Number(process.env.INSTAGRAM_SYNC_INTERVAL_MINUTES || 30)) * 60 * 1000;
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
    const rows = db.prepare(`SELECT profile_id, access_token, token_expires_at FROM instagram_sync WHERE auto_sync_enabled = 1`).all() as { profile_id: string; access_token: string; token_expires_at?: number }[];
    for (const row of rows) {
      try {
        if (row.token_expires_at && Date.now() >= row.token_expires_at) {
          db.prepare('UPDATE instagram_sync SET last_sync_error = ?, updated_at = ? WHERE profile_id = ?')
            .run('Instagram access expired. Reconnect your account.', Date.now(), row.profile_id);
          continue;
        }
        const media = await fetchInstagramMedia(decryptSecret(row.access_token));
        syncMediaToBlocks(row.profile_id, media);
      } catch (error) {
        db.prepare('UPDATE instagram_sync SET last_sync_error = ?, updated_at = ? WHERE profile_id = ?')
          .run('Instagram sync failed. Existing content was preserved; please reconnect or retry.', Date.now(), row.profile_id);
        logError('Scheduled Instagram sync failed', error, { profileId: row.profile_id });
      }
    }
    if (rows.length > 0) log('info', 'Scheduled Instagram sync completed', { profiles: rows.length });
    } finally { running = false; }
  };
  const timer = setInterval(() => { void run(); }, intervalMs);
  timer.unref();
}
