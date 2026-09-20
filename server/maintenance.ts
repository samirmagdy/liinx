import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { db } from './db.js';
import { log, logError } from './logger.js';
import { getUploadBackupRetentionCount } from './services/backup/retention.js';
import { stripeClient } from './routes/billing.js';
import { grantDueAgencyReferralCredits } from './services/agencyReferrals.js';

const dayMs = 24 * 60 * 60 * 1000;

/** Removes only high-cardinality telemetry and deduplication records past retention. */
export function runRetentionCleanup() {
  const analyticsDays = Math.max(1, Number(process.env.ANALYTICS_RETENTION_DAYS || 90));
  const webhookDays = Math.max(7, Number(process.env.WEBHOOK_EVENT_RETENTION_DAYS || 30));
  const now = Date.now();
  const analyticsCutoff = now - analyticsDays * dayMs;
  const webhookCutoff = now - webhookDays * dayMs;
  const result = db.transaction(() => {
    const views = db.prepare('DELETE FROM profile_views WHERE created_at < ?').run(analyticsCutoff).changes;
    const clicks = db.prepare('DELETE FROM link_clicks WHERE created_at < ?').run(analyticsCutoff).changes;
    const webhooks = db.prepare('DELETE FROM processed_webhook_events WHERE processed_at < ?').run(webhookCutoff).changes;
    return { views, clicks, webhooks };
  })();
  log('info', 'Retention cleanup completed', { ...result, analyticsRetentionDays: analyticsDays, webhookRetentionDays: webhookDays });
  return result;
}

export function startMaintenanceScheduler() {
  if (process.env.NODE_ENV === 'test' || process.env.MAINTENANCE_ENABLED === 'false') return;
  const grantReferralCredits = async () => {
    if (!stripeClient) return;
    const result = await grantDueAgencyReferralCredits(stripeClient);
    if (result.credited || result.waiting) log('info', 'Agency referral credit sweep completed', result);
  };
  void grantReferralCredits().catch(error => logError('Agency referral credit sweep failed', error));
  const interval = setInterval(() => {
    try { runRetentionCleanup(); } catch (error) { logError('Retention cleanup failed', error); }
    void grantReferralCredits().catch(error => logError('Agency referral credit sweep failed', error));
  }, 24 * 60 * 60 * 1000);
  interval.unref();
}

/** Creates a compressed, restorable snapshot of uploaded media for operator-run backups. */
export function backupUploads(): { archivePath: string; sizeBytes: number } {
  const uploadsDir = path.resolve(process.env.UPLOADS_DIR || 'public/uploads');
  const backupDir = path.resolve(process.env.UPLOAD_BACKUP_DIR || 'data/backups/uploads');
  fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archivePath = path.join(backupDir, `liinx-uploads-${timestamp}.tar.gz`);
  // Keep this operation explicit and shell-free so filenames cannot become commands.
  execFileSync('tar', ['-czf', archivePath, '-C', uploadsDir, '.'], { stdio: 'pipe' });
  const sizeBytes = fs.statSync(archivePath).size;
  log('info', 'Upload backup completed', { archivePath, sizeBytes });
  const retentionCount = getUploadBackupRetentionCount();
  const backups = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('liinx-uploads-') && file.endsWith('.tar.gz'))
    .map(file => ({ file, mtime: fs.statSync(path.join(backupDir, file)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  for (const stale of backups.slice(retentionCount)) {
    fs.unlinkSync(path.join(backupDir, stale.file));
    log('info', 'Deleted upload backup by count retention policy', {
      archivePath: path.join(backupDir, stale.file),
      reason: `older than configured UPLOAD_BACKUP_RETENTION_COUNT=${retentionCount}`
    });
  }
  return { archivePath, sizeBytes };
}
