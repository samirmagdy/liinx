import { fileURLToPath } from 'node:url';
import { backupService } from '../server/services/backup/index.js';

export async function createUploadsBackup(): Promise<{ archivePath: string; sizeBytes: number; durationMs: number }> {
  const result = await backupService.backupUploads();
  return {
    archivePath: result.localPath,
    sizeBytes: result.sizeBytes,
    durationMs: result.durationMs
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createUploadsBackup()
    .then(res => {
      console.log(`[Backup] Uploads backup finished: ${res.archivePath} (${(res.sizeBytes / 1024 / 1024).toFixed(2)} MB in ${res.durationMs}ms)`);
      process.exit(0);
    })
    .catch(err => {
      console.error('[Backup Error] Failed to create upload backup:', err);
      process.exit(1);
    });
}
