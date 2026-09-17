import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { db, initDatabase } from '../../db.js';
import { log, logError } from '../../logger.js';
import { createId } from '../../utils/ids.js';
import {
  type BackupMetadata,
  type BackupResult,
  type BackupStorage,
  type S3Config
} from './types.js';
import { computeSha256, derive32ByteKey, encryptBackupData } from './crypto.js';
import { LocalBackupStorage } from './localStorage.js';
import { S3CompatibleBackupStorage } from './s3Storage.js';
import { evaluateRetention, getRetentionConfig } from './retention.js';

export class BackupService {
  private readonly localStorage: LocalBackupStorage;
  private readonly remoteStorage?: S3CompatibleBackupStorage;
  private readonly encryptionKey?: Buffer;

  constructor(customLocalStorage?: LocalBackupStorage, customRemoteStorage?: S3CompatibleBackupStorage) {
    this.localStorage = customLocalStorage || new LocalBackupStorage();

    // 1. Configure remote S3 storage if configured in environment
    if (customRemoteStorage) {
      this.remoteStorage = customRemoteStorage;
    } else {
      const bucket = process.env.BACKUP_S3_BUCKET;
      const accessKeyId = process.env.BACKUP_S3_ACCESS_KEY_ID;
      const secretAccessKey = process.env.BACKUP_S3_SECRET_ACCESS_KEY;

      if ((process.env.BACKUP_STORAGE === 's3' || bucket) && bucket && accessKeyId && secretAccessKey) {
        const s3Config: S3Config = {
          bucket,
          accessKeyId,
          secretAccessKey,
          region: process.env.BACKUP_S3_REGION || 'us-east-1',
          endpoint: process.env.BACKUP_S3_ENDPOINT,
          prefix: process.env.BACKUP_S3_PREFIX || 'liinx-backups',
          forcePathStyle: process.env.BACKUP_S3_FORCE_PATH_STYLE === 'true'
        };
        this.remoteStorage = new S3CompatibleBackupStorage(s3Config);
      }
    }

    // 2. Configure backup encryption key if provided
    const encSecret = process.env.BACKUP_ENCRYPTION_KEY || process.env.INTEGRATION_ENCRYPTION_KEY;
    if (encSecret && encSecret.length >= 16) {
      this.encryptionKey = derive32ByteKey(encSecret);
    }
  }

  isRemoteEnabled(): boolean {
    return Boolean(this.remoteStorage);
  }

  isEncryptionEnabled(): boolean {
    return Boolean(this.encryptionKey);
  }

  /**
   * Performs a zero-downtime, point-in-time SQLite backup via VACUUM INTO,
   * validates SQLite integrity check, computes SHA-256, optionally encrypts,
   * stores locally, mirrors to remote storage if enabled, verifies remote integrity,
   * and prunes older backups per retention policy.
   */
  async backupDatabase(): Promise<BackupResult> {
    const startTime = Date.now();
    initDatabase();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempDbFileName = `liinx-db-${timestamp}.tmp.db`;
    const tempDbPath = path.join(this.localStorage.getDirectory(), tempDbFileName);

    try {
      // 1. SQLite point-in-time atomic snapshot via VACUUM INTO
      db.prepare('VACUUM INTO ?').run(tempDbPath);

      // 2. Validate integrity check of newly snapshotted DB
      const checkDb = new Database(tempDbPath, { readonly: true });
      try {
        const integrity = checkDb.pragma('integrity_check') as { integrity_check: string }[];
        if (!integrity || integrity[0]?.integrity_check !== 'ok') {
          throw new Error(`Database backup integrity check failed: ${JSON.stringify(integrity)}`);
        }
      } finally {
        checkDb.close();
      }

      // 3. Read raw database snapshot and compute checksum
      const rawData = await fs.promises.readFile(tempDbPath);
      const rawChecksum = computeSha256(rawData);

      // 4. Handle optional encryption
      let finalData = rawData;
      let finalChecksum = rawChecksum;
      let isEncrypted = false;
      let ivHex: string | undefined;
      let tagHex: string | undefined;
      let filename = `liinx-db-${timestamp}.db`;

      if (this.encryptionKey) {
        const encrypted = encryptBackupData(rawData, this.encryptionKey);
        finalData = encrypted.ciphertext;
        finalChecksum = computeSha256(finalData);
        isEncrypted = true;
        ivHex = encrypted.ivHex;
        tagHex = encrypted.tagHex;
        filename = `${filename}.enc`;
      }

      const metadata: BackupMetadata = {
        id: createId('bkp_db'),
        type: 'database',
        filename,
        timestamp,
        sizeBytes: finalData.length,
        checksumSha256: finalChecksum,
        encrypted: isEncrypted,
        ivHex,
        tagHex,
        version: 1
      };

      // 5. Save to local storage
      await this.localStorage.save(filename, finalData, metadata);
      const destinations = ['local'];

      // 6. Save to remote S3 storage if configured
      let remoteKey: string | undefined;
      if (this.remoteStorage) {
        await this.remoteStorage.save(filename, finalData, metadata);

        // Verification of remote persistence: confirm object exists and length matches
        const remoteExists = await this.remoteStorage.exists(filename);
        if (!remoteExists) {
          throw new Error(`Remote backup verification failed: '${filename}' was not found in remote bucket after upload.`);
        }
        destinations.push(this.remoteStorage.name);
        remoteKey = filename;

        // Prune stale remote backups per retention policy
        await this.pruneStorage(this.remoteStorage, 'liinx-db-');
      }

      // 7. Prune stale local backups per retention policy
      await this.pruneStorage(this.localStorage, 'liinx-db-');

      const durationMs = Date.now() - startTime;
      const result: BackupResult = {
        type: 'database',
        localPath: path.join(this.localStorage.getDirectory(), filename),
        remoteKey,
        sizeBytes: finalData.length,
        checksumSha256: finalChecksum,
        encrypted: isEncrypted,
        durationMs,
        destinations
      };

      // Only emit success log AFTER remote upload & verification have succeeded!
      log('info', 'Database backup completed successfully', {
        filename,
        sizeBytes: finalData.length,
        checksumSha256: finalChecksum,
        encrypted: isEncrypted,
        destinations,
        durationMs
      });

      return result;
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempDbPath)) {
        await fs.promises.unlink(tempDbPath).catch(() => {});
      }
    }
  }

  /**
   * Creates a compressed tar.gz archive of uploaded media, computes checksum,
   * optionally encrypts, stores locally, mirrors to remote storage if enabled,
   * verifies remote integrity, and prunes older backups.
   */
  async backupUploads(): Promise<BackupResult> {
    const startTime = Date.now();
    const uploadsDir = path.resolve(process.env.UPLOADS_DIR || 'public/uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempArchivePath = path.join(this.localStorage.getDirectory(), `liinx-uploads-${timestamp}.tmp.tar.gz`);

    try {
      // 1. Create shell-safe tar.gz archive
      execFileSync('tar', ['-czf', tempArchivePath, '-C', uploadsDir, '.'], { stdio: 'pipe' });

      // 2. Read archive buffer
      const rawData = await fs.promises.readFile(tempArchivePath);
      const rawChecksum = computeSha256(rawData);

      // 3. Handle optional encryption
      let finalData = rawData;
      let finalChecksum = rawChecksum;
      let isEncrypted = false;
      let ivHex: string | undefined;
      let tagHex: string | undefined;
      let filename = `liinx-uploads-${timestamp}.tar.gz`;

      if (this.encryptionKey) {
        const encrypted = encryptBackupData(rawData, this.encryptionKey);
        finalData = encrypted.ciphertext;
        finalChecksum = computeSha256(finalData);
        isEncrypted = true;
        ivHex = encrypted.ivHex;
        tagHex = encrypted.tagHex;
        filename = `${filename}.enc`;
      }

      const metadata: BackupMetadata = {
        id: createId('bkp_up'),
        type: 'uploads',
        filename,
        timestamp,
        sizeBytes: finalData.length,
        checksumSha256: finalChecksum,
        encrypted: isEncrypted,
        ivHex,
        tagHex,
        version: 1
      };

      // 4. Save to local storage
      await this.localStorage.save(filename, finalData, metadata);
      const destinations = ['local'];

      // 5. Save to remote S3 storage if configured
      let remoteKey: string | undefined;
      if (this.remoteStorage) {
        await this.remoteStorage.save(filename, finalData, metadata);

        // Verification of remote persistence
        const remoteExists = await this.remoteStorage.exists(filename);
        if (!remoteExists) {
          throw new Error(`Remote upload backup verification failed: '${filename}' was not found in remote bucket.`);
        }
        destinations.push(this.remoteStorage.name);
        remoteKey = filename;

        // Prune stale remote backups per retention policy
        await this.pruneStorage(this.remoteStorage, 'liinx-uploads-');
      }

      // 6. Prune stale local backups per retention policy
      await this.pruneStorage(this.localStorage, 'liinx-uploads-');

      const durationMs = Date.now() - startTime;
      const result: BackupResult = {
        type: 'uploads',
        localPath: path.join(this.localStorage.getDirectory(), filename),
        remoteKey,
        sizeBytes: finalData.length,
        checksumSha256: finalChecksum,
        encrypted: isEncrypted,
        durationMs,
        destinations
      };

      log('info', 'Uploads backup completed successfully', {
        filename,
        sizeBytes: finalData.length,
        checksumSha256: finalChecksum,
        encrypted: isEncrypted,
        destinations,
        durationMs
      });

      return result;
    } finally {
      if (fs.existsSync(tempArchivePath)) {
        await fs.promises.unlink(tempArchivePath).catch(() => {});
      }
    }
  }

  private async pruneStorage(storage: BackupStorage, prefix: string): Promise<void> {
    try {
      const items = await storage.list(prefix);
      const retentionConfig = getRetentionConfig();
      const { prune } = evaluateRetention(items, retentionConfig);

      for (const key of prune) {
        await storage.delete(key);
      }
    } catch (err) {
      logError(`Failed to prune old backups in storage '${storage.name}'`, err);
    }
  }

  getLocalStorage(): LocalBackupStorage {
    return this.localStorage;
  }

  getRemoteStorage(): S3CompatibleBackupStorage | undefined {
    return this.remoteStorage;
  }
}

export const backupService = new BackupService();
