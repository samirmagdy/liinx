import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import Database from 'better-sqlite3';
import {
  backupService,
  computeSha256,
  decryptBackupData,
  derive32ByteKey
} from '../server/services/backup/index.js';

export interface RestoreVerificationResult {
  verified: boolean;
  database: {
    verified: boolean;
    backupFile: string;
    integrityCheck: string;
    tableCount: number;
    tables: string[];
    userCount: number;
    profileCount: number;
    blockCount: number;
  };
  uploads?: {
    verified: boolean;
    backupFile: string;
    fileCount: number;
  };
  durationMs: number;
  error?: string;
}

const MANDATORY_TABLES = [
  'profiles',
  'users',
  'blocks',
  'pages',
  'newsletter_subscribers',
  'processed_webhook_events'
];

export async function verifyRestore(options?: {
  dbBackupKey?: string;
  uploadsBackupKey?: string;
  useRemote?: boolean;
}): Promise<RestoreVerificationResult> {
  const startTime = Date.now();
  const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'liinx-restore-verify-'));

  try {
    const storage = (options?.useRemote && backupService.getRemoteStorage())
      ? backupService.getRemoteStorage()!
      : backupService.getLocalStorage();

    // 1. Locate latest or specified DB backup
    let dbKey = options?.dbBackupKey;
    if (!dbKey) {
      const items = await storage.list('liinx-db-');
      if (items.length === 0) {
        throw new Error(`No database backups found in ${storage.name} to verify.`);
      }
      dbKey = items[0].key;
    }

    const dbBackupObj = await storage.get(dbKey);
    if (!dbBackupObj) {
      throw new Error(`Database backup '${dbKey}' could not be retrieved from ${storage.name}.`);
    }

    let rawDbBuffer = dbBackupObj.data;
    const metadata = dbBackupObj.metadata;

    // Verify payload checksum if metadata is available
    if (metadata?.checksumSha256) {
      const calculatedChecksum = computeSha256(rawDbBuffer);
      if (calculatedChecksum !== metadata.checksumSha256) {
        throw new Error(`Checksum mismatch on '${dbKey}': expected ${metadata.checksumSha256}, got ${calculatedChecksum}`);
      }
    }

    // Decrypt if encrypted
    if (dbKey.endsWith('.enc') || metadata?.encrypted) {
      const encSecret = process.env.BACKUP_ENCRYPTION_KEY || process.env.INTEGRATION_ENCRYPTION_KEY;
      if (!encSecret) {
        throw new Error(`Backup '${dbKey}' is encrypted but no BACKUP_ENCRYPTION_KEY or INTEGRATION_ENCRYPTION_KEY was provided.`);
      }
      if (!metadata?.ivHex || !metadata?.tagHex) {
        throw new Error(`Encrypted backup '${dbKey}' is missing IV or authentication tag metadata.`);
      }
      const key = derive32ByteKey(encSecret);
      rawDbBuffer = decryptBackupData(rawDbBuffer, key, metadata.ivHex, metadata.tagHex);
    }

    // Write decrypted DB to sandbox
    const sandboxDbPath = path.join(sandboxDir, 'restored.db');
    fs.writeFileSync(sandboxDbPath, rawDbBuffer);

    // 2. Validate SQLite database integrity and schema
    const testDb = new Database(sandboxDbPath, { readonly: true });
    let integrityCheckStr = 'unknown';
    let tableNames: string[] = [];
    let userCount = 0;
    let profileCount = 0;
    let blockCount = 0;

    try {
      const pragmaRes = testDb.pragma('integrity_check') as { integrity_check: string }[];
      integrityCheckStr = pragmaRes[0]?.integrity_check || 'failed';
      if (integrityCheckStr !== 'ok') {
        throw new Error(`Restored database failed SQLite integrity check: ${integrityCheckStr}`);
      }

      const tables = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
      tableNames = tables.map(t => t.name);

      for (const requiredTable of MANDATORY_TABLES) {
        if (!tableNames.includes(requiredTable)) {
          throw new Error(`Restored database is missing mandatory table: '${requiredTable}'`);
        }
      }

      userCount = (testDb.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
      profileCount = (testDb.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number }).count;
      blockCount = (testDb.prepare('SELECT COUNT(*) as count FROM blocks').get() as { count: number }).count;
    } finally {
      testDb.close();
    }

    const dbResult = {
      verified: true,
      backupFile: dbKey,
      integrityCheck: integrityCheckStr,
      tableCount: tableNames.length,
      tables: tableNames,
      userCount,
      profileCount,
      blockCount
    };

    // 3. Optionally verify latest uploads archive
    let uploadsResult: { verified: boolean; backupFile: string; fileCount: number } | undefined;
    let uploadsKey = options?.uploadsBackupKey;
    if (!uploadsKey) {
      const uploadItems = await storage.list('liinx-uploads-');
      if (uploadItems.length > 0) {
        uploadsKey = uploadItems[0].key;
      }
    }

    if (uploadsKey) {
      const uploadObj = await storage.get(uploadsKey);
      if (uploadObj) {
        let rawUploadBuffer = uploadObj.data;
        const uploadMeta = uploadObj.metadata;

        if (uploadMeta?.checksumSha256) {
          const calcSha = computeSha256(rawUploadBuffer);
          if (calcSha !== uploadMeta.checksumSha256) {
            throw new Error(`Checksum mismatch on '${uploadsKey}'`);
          }
        }

        if (uploadsKey.endsWith('.enc') || uploadMeta?.encrypted) {
          const encSecret = process.env.BACKUP_ENCRYPTION_KEY || process.env.INTEGRATION_ENCRYPTION_KEY;
          if (encSecret && uploadMeta?.ivHex && uploadMeta?.tagHex) {
            const key = derive32ByteKey(encSecret);
            rawUploadBuffer = decryptBackupData(rawUploadBuffer, key, uploadMeta.ivHex, uploadMeta.tagHex);
          }
        }

        const sandboxTarPath = path.join(sandboxDir, 'restored.tar.gz');
        fs.writeFileSync(sandboxTarPath, rawUploadBuffer);

        // Run tar -tzf to test archive integrity and list contents without extracting
        const tarOutput = execFileSync('tar', ['-tzf', sandboxTarPath], { encoding: 'utf-8' });
        const filesInArchive = tarOutput.split('\n').filter(line => line.trim().length > 0);

        uploadsResult = {
          verified: true,
          backupFile: uploadsKey,
          fileCount: filesInArchive.length
        };
      }
    }

    const durationMs = Date.now() - startTime;
    return {
      verified: true,
      database: dbResult,
      uploads: uploadsResult,
      durationMs
    };
  } finally {
    // Safe cleanup of sandbox directory
    try {
      if (fs.existsSync(sandboxDir)) {
        fs.rmSync(sandboxDir, { recursive: true, force: true });
      }
    } catch {
      // ignore cleanup error
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const useRemote = process.argv.includes('--remote');
  console.log(`[Restore Verification] Starting restore drill (${useRemote ? 'REMOTE S3' : 'LOCAL'})...`);

  verifyRestore({ useRemote })
    .then(result => {
      console.log('----------------------------------------------------');
      console.log('RESTORE DRILL RESULT: SUCCESS (100% VERIFIED)');
      console.log('----------------------------------------------------');
      console.log(`Duration: ${result.durationMs}ms`);
      console.log(`Database Backup: ${result.database.backupFile}`);
      console.log(`SQLite Integrity Check: ${result.database.integrityCheck}`);
      console.log(`Tables Verified (${result.database.tableCount}): ${result.database.tables.join(', ')}`);
      console.log(`Row Counts: ${result.database.userCount} users, ${result.database.profileCount} profiles, ${result.database.blockCount} blocks`);
      if (result.uploads) {
        console.log(`Uploads Backup: ${result.uploads.backupFile} (${result.uploads.fileCount} files verified)`);
      }
      console.log('----------------------------------------------------');
      process.exit(0);
    })
    .catch(err => {
      console.error('----------------------------------------------------');
      console.error('RESTORE DRILL RESULT: FAILED');
      console.error('----------------------------------------------------');
      console.error(err);
      process.exit(1);
    });
}
