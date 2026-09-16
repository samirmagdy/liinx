import { backupUploads } from '../server/maintenance.js';

try {
  backupUploads();
  process.exit(0);
} catch (error) {
  console.error('[Backup Error] Failed to create upload backup:', error);
  process.exit(1);
}
