import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { db, initDatabase } from '../server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const backupsDir = path.join(projectRoot, 'data', 'backups');

export function createDatabaseBackup(maxBackupsToRetain = 10): { backupPath: string; sizeBytes: number; durationMs: number } {
  const startTime = Date.now();

  // Ensure backup directory exists
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // Ensure DB initialized
  initDatabase();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `liinx-backup-${timestamp}.db`;
  const backupPath = path.join(backupsDir, backupFileName);

  console.log(`[Backup] Starting zero-downtime SQLite backup to ${backupFileName}...`);

  // SQLite VACUUM INTO performs a safe, point-in-time snapshot of the live DB and WAL log
  db.prepare('VACUUM INTO ?').run(backupPath);

  // Validate integrity of the newly created backup file
  const backupDb = new Database(backupPath);
  try {
    const integrity = backupDb.pragma('integrity_check') as { integrity_check: string }[];
    if (!integrity || integrity[0]?.integrity_check !== 'ok') {
      throw new Error(`Backup validation failed with integrity check: ${JSON.stringify(integrity)}`);
    }
  } finally {
    backupDb.close();
  }

  const stat = fs.statSync(backupPath);
  const durationMs = Date.now() - startTime;
  console.log(`[Backup] Completed successfully! Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB in ${durationMs}ms`);

  // Rotate old backups (keep newest maxBackupsToRetain)
  try {
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith('liinx-backup-') && f.endsWith('.db'))
      .map(f => ({
        name: f,
        fullPath: path.join(backupsDir, f),
        time: fs.statSync(path.join(backupsDir, f)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > maxBackupsToRetain) {
      const filesToDelete = files.slice(maxBackupsToRetain);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.fullPath);
        console.log(`[Backup Rotation] Pruned old backup: ${file.name}`);
      }
    }
  } catch (err) {
    console.warn('[Backup Rotation] Warning: could not prune older backups:', err);
  }

  return {
    backupPath,
    sizeBytes: stat.size,
    durationMs
  };
}

// If invoked directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    createDatabaseBackup();
    process.exit(0);
  } catch (err) {
    console.error('[Backup Error] Failed to create database backup:', err);
    process.exit(1);
  }
}
