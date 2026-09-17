import { fileURLToPath } from 'node:url';
import { backupService } from '../server/services/backup/index.js';

export async function createDatabaseBackup(_maxBackupsToRetain?: number): Promise<{ backupPath: string; sizeBytes: number; durationMs: number }> {
  const result = await backupService.backupDatabase();
  return {
    backupPath: result.localPath,
    sizeBytes: result.sizeBytes,
    durationMs: result.durationMs
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createDatabaseBackup()
    .then(res => {
      console.log(`[Backup] Database backup finished: ${res.backupPath} (${(res.sizeBytes / 1024 / 1024).toFixed(2)} MB in ${res.durationMs}ms)`);
      process.exit(0);
    })
    .catch(err => {
      console.error('[Backup Error] Failed to create database backup:', err);
      process.exit(1);
    });
}
