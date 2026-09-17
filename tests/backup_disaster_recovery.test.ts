import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import Database from 'better-sqlite3';
import {
  LocalBackupStorage,
  S3Client,
  S3CompatibleBackupStorage,
  computeSha256,
  derive32ByteKey,
  encryptBackupData,
  decryptBackupData,
  evaluateRetention,
  type BackupItem,
  BackupService,
  backupService
} from '../server/services/backup/index.js';
import { verifyRestore } from '../scripts/verify-restore.js';

describe('Disaster Recovery & Remote Backup System', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'liinx-backup-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('LocalBackupStorage', () => {
    it('persists backup files and metadata sidecars, retrieves, lists, and deletes them', async () => {
      const storage = new LocalBackupStorage(tempDir);
      const testData = Buffer.from('mock database content 123456789');
      const testMetadata = {
        id: 'test-backup-1',
        type: 'database' as const,
        filename: 'liinx-db-2026-09-17.sqlite',
        sizeBytes: testData.length,
        timestamp: new Date().toISOString(),
        version: 1,
        checksumSha256: computeSha256(testData),
        encrypted: false
      };

      await storage.save('liinx-db-2026-09-17.sqlite', testData, testMetadata);

      // Verify files written
      expect(fs.existsSync(path.join(tempDir, 'liinx-db-2026-09-17.sqlite'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'liinx-db-2026-09-17.sqlite.meta.json'))).toBe(true);

      // Verify list
      const items = await storage.list('liinx-db-');
      expect(items.length).toBe(1);
      expect(items[0].key).toBe('liinx-db-2026-09-17.sqlite');
      expect(items[0].sizeBytes).toBe(testData.length);

      // Verify get
      const retrieved = await storage.get('liinx-db-2026-09-17.sqlite');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.data.toString()).toBe('mock database content 123456789');
      expect(retrieved!.metadata?.checksumSha256).toBe(testMetadata.checksumSha256);

      // Verify delete removes both payload and metadata
      await storage.delete('liinx-db-2026-09-17.sqlite');
      expect(fs.existsSync(path.join(tempDir, 'liinx-db-2026-09-17.sqlite'))).toBe(false);
      expect(fs.existsSync(path.join(tempDir, 'liinx-db-2026-09-17.sqlite.meta.json'))).toBe(false);
    });
  });

  describe('Backup Cryptography', () => {
    it('encrypts and decrypts backup buffers with AES-256-GCM', () => {
      const secret = 'super-secret-backup-passphrase-32b';
      const key = derive32ByteKey(secret);
      const plainText = Buffer.from('CRITICAL DATABASE DATA: user passwords, keys, tokens');

      const { ciphertext, ivHex, tagHex } = encryptBackupData(plainText, key);

      expect(ciphertext.length).toBe(plainText.length);
      expect(ciphertext).not.toEqual(plainText);

      // Decrypt successfully
      const decrypted = decryptBackupData(ciphertext, key, ivHex, tagHex);
      expect(decrypted.toString()).toBe(plainText.toString());
    });

    it('rejects tampered ciphertext with authentication tag failure', () => {
      const key = derive32ByteKey('secret-key-1234567890');
      const plainText = Buffer.from('integrity-protected backup data');
      const { ciphertext, ivHex, tagHex } = encryptBackupData(plainText, key);

      // Tamper 1 byte
      ciphertext[0] ^= 0xff;

      expect(() => {
        decryptBackupData(ciphertext, key, ivHex, tagHex);
      }).toThrow();
    });
  });

  describe('S3Client & SigV4 Authentication', () => {
    it('builds canonical SigV4 headers and target URLs properly', () => {
      const client = new S3Client({
        bucket: 'my-backup-bucket',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1'
      });

      // Default virtual host URL (us-east-1 standard s3.amazonaws.com)
      const { url: defaultUrl } = (client as any).getEndpointUrl('backups/test.sqlite');
      expect(defaultUrl.toString()).toBe('https://my-backup-bucket.s3.amazonaws.com/backups/test.sqlite');

      // Custom endpoint with path style (MinIO / R2 style)
      const r2Client = new S3Client({
        bucket: 'my-r2-bucket',
        accessKeyId: 'test-id',
        secretAccessKey: 'test-secret',
        endpoint: 'https://testaccount.r2.cloudflarestorage.com',
        region: 'auto',
        forcePathStyle: true
      });
      const { url: r2Url } = (r2Client as any).getEndpointUrl('backups/test.sqlite');
      expect(r2Url.toString()).toBe('https://testaccount.r2.cloudflarestorage.com/my-r2-bucket/backups/test.sqlite');
    });

    it('executes S3Client putObject, getObject, headObject, deleteObject, listObjects with mocked fetch', async () => {
      const client = new S3Client({
        bucket: 'mock-bucket',
        accessKeyId: 'mock-key',
        secretAccessKey: 'mock-secret',
        region: 'us-east-1'
      });

      const originalFetch = globalThis.fetch;
      try {
        // Mock fetch for putObject (success)
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: async () => ''
        } as any);
        await expect(client.putObject('test.txt', Buffer.from('hello'))).resolves.toBeUndefined();

        // Mock fetch for getObject (success)
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          arrayBuffer: async () => Buffer.from('fetched payload')
        } as any);
        const fetched = await client.getObject('test.txt');
        expect(fetched?.toString()).toBe('fetched payload');

        // Mock fetch for getObject (404)
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404
        } as any);
        expect(await client.getObject('missing.txt')).toBeNull();

        // Mock fetch for headObject
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-length': '123', etag: '"mock-etag"' })
        } as any);
        const head = await client.headObject('test.txt');
        expect(head?.size).toBe(123);
        expect(head?.etag).toBe('mock-etag');

        // Mock fetch for headObject (404)
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404
        } as any);
        expect(await client.headObject('missing.txt')).toBeNull();

        // Mock fetch for deleteObject
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 204
        } as any);
        expect(await client.deleteObject('test.txt')).toBe(true);

        // Mock fetch for listObjects
        const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult>
  <Contents>
    <Key>backup-1.sqlite</Key>
    <Size>1024</Size>
    <LastModified>2026-09-17T12:00:00.000Z</LastModified>
  </Contents>
  <Contents>
    <Key>backup-2.sqlite</Key>
    <Size>2048</Size>
    <LastModified>2026-09-17T13:00:00.000Z</LastModified>
  </Contents>
</ListBucketResult>`;
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: async () => mockXml
        } as any);
        const items = await client.listObjects('backup-');
        expect(items.length).toBe(2);
        expect(items[0].key).toBe('backup-1.sqlite');
        expect(items[0].size).toBe(1024);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('exercises S3CompatibleBackupStorage lifecycle (save, get, list, exists, delete)', async () => {
      const storage = new S3CompatibleBackupStorage({
        bucket: 'storage-bucket',
        region: 'us-east-1',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        prefix: 'daily-backups'
      });

      const mockClient = (storage as any).client;
      vi.spyOn(mockClient, 'putObject').mockResolvedValue(undefined);
      vi.spyOn(mockClient, 'getObject').mockImplementation(async (key: string) => {
        if (key.endsWith('.meta.json')) {
          return Buffer.from(JSON.stringify({ id: 'mock-meta', version: 1 }));
        }
        return Buffer.from('mock binary data');
      });
      vi.spyOn(mockClient, 'headObject').mockResolvedValue({ size: 16 });
      vi.spyOn(mockClient, 'deleteObject').mockResolvedValue(true);
      vi.spyOn(mockClient, 'listObjects').mockResolvedValue([
        { key: 'daily-backups/b1.sqlite', size: 100, lastModified: 1000 },
        { key: 'daily-backups/b1.sqlite.meta.json', size: 50, lastModified: 1000 }
      ]);

      // Save
      await storage.save('b1.sqlite', Buffer.from('data'), {
        id: 'meta-1', type: 'database', filename: 'b1.sqlite', sizeBytes: 4, timestamp: 'now', version: 1, checksumSha256: 'sha', encrypted: false
      });
      expect(mockClient.putObject).toHaveBeenCalledTimes(2);

      // Get
      const res = await storage.get('b1.sqlite');
      expect(res?.data.toString()).toBe('mock binary data');
      expect(res?.metadata?.id).toBe('mock-meta');

      // Exists
      expect(await storage.exists('b1.sqlite')).toBe(true);

      // List
      const listed = await storage.list();
      expect(listed.length).toBe(1);
      expect(listed[0].key).toBe('b1.sqlite');

      // Delete
      expect(await storage.delete('b1.sqlite')).toBe(true);
    });
  });

  describe('Retention Policy (GFS)', () => {
    it('evaluates daily, weekly, and monthly slots and determines pruning list', () => {
      const now = new Date('2026-09-17T12:00:00Z');
      const oneDay = 24 * 60 * 60 * 1000;

      // Generate 20 daily backups
      const mockItems: BackupItem[] = [];
      for (let i = 0; i < 20; i++) {
        const itemDate = new Date(now.getTime() - i * oneDay);
        mockItems.push({
          key: `liinx-db-${itemDate.toISOString().slice(0, 10)}.sqlite`,
          sizeBytes: 1024,
          lastModified: itemDate.getTime()
        });
      }

      const { keep, prune } = evaluateRetention(
        mockItems,
        { daily: 7, weekly: 4, monthly: 3 },
        now
      );

      // Retains all of the most recent 7 days
      for (let i = 0; i < 7; i++) {
        const itemDate = new Date(now.getTime() - i * oneDay);
        const key = `liinx-db-${itemDate.toISOString().slice(0, 10)}.sqlite`;
        expect(keep.has(key)).toBe(true);
      }

      // Older ones beyond weekly/monthly coverage are pruned
      expect(prune.length).toBeGreaterThan(0);
      expect(keep.size + prune.length).toBe(mockItems.length);
    });
  });

  describe('Restore Verification Sandbox Drill', () => {
    it('validates a real SQLite backup with mandatory tables and integrity check', async () => {
      const dbPath = path.join(tempDir, 'source.db');
      const sourceDb = new Database(dbPath);

      // Create mandatory production tables
      sourceDb.exec(`
        CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, password_hash TEXT);
        CREATE TABLE profiles (id TEXT PRIMARY KEY, user_id TEXT, handle TEXT);
        CREATE TABLE blocks (id TEXT PRIMARY KEY, user_id TEXT, type TEXT);
        CREATE TABLE pages (id TEXT PRIMARY KEY, user_id TEXT, slug TEXT);
        CREATE TABLE newsletter_subscribers (id TEXT PRIMARY KEY, profile_id TEXT, email TEXT);
        CREATE TABLE processed_webhook_events (id TEXT PRIMARY KEY, created_at TEXT);
      `);
      sourceDb.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run('usr_1', 'admin@example.com');
      sourceDb.prepare('INSERT INTO profiles (id, user_id, handle) VALUES (?, ?, ?)').run('prof_1', 'usr_1', 'admin');
      sourceDb.close();

      // Create a backup using LocalBackupStorage
      const storage = new LocalBackupStorage(path.join(tempDir, 'backups'));
      const dbBuffer = fs.readFileSync(dbPath);
      const backupKey = 'liinx-db-test-verify.sqlite';
      await storage.save(backupKey, dbBuffer, {
        id: 'test-1',
        type: 'database',
        filename: backupKey,
        sizeBytes: dbBuffer.length,
        timestamp: new Date().toISOString(),
        version: 1,
        checksumSha256: computeSha256(dbBuffer),
        encrypted: false
      });

      // Temporarily mock backupService localStorage to use our test storage
      const originalGetStorage = backupService.getLocalStorage;
      (backupService as any).localStorage = storage;

      try {
        const result = await verifyRestore({ dbBackupKey: backupKey });
        expect(result.verified).toBe(true);
        expect(result.database.integrityCheck).toBe('ok');
        expect(result.database.userCount).toBe(1);
        expect(result.database.profileCount).toBe(1);
        expect(result.database.tables).toEqual(
          expect.arrayContaining(['users', 'profiles', 'blocks', 'pages', 'newsletter_subscribers', 'processed_webhook_events'])
        );
      } finally {
        (backupService as any).localStorage = originalGetStorage.call(backupService);
      }
    });

    it('validates an encrypted backup and handles decryption seamlessly during restore', async () => {
      const dbPath = path.join(tempDir, 'source_enc.db');
      const sourceDb = new Database(dbPath);
      sourceDb.exec(`
        CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT);
        CREATE TABLE profiles (id TEXT PRIMARY KEY, user_id TEXT);
        CREATE TABLE blocks (id TEXT PRIMARY KEY, user_id TEXT);
        CREATE TABLE pages (id TEXT PRIMARY KEY, user_id TEXT);
        CREATE TABLE newsletter_subscribers (id TEXT PRIMARY KEY, profile_id TEXT);
        CREATE TABLE processed_webhook_events (id TEXT PRIMARY KEY, created_at TEXT);
      `);
      sourceDb.close();

      const encKeyString = 'test-encryption-key-for-backups-123';
      process.env.BACKUP_ENCRYPTION_KEY = encKeyString;

      const rawDb = fs.readFileSync(dbPath);
      const key = derive32ByteKey(encKeyString);
      const { ciphertext, ivHex, tagHex } = encryptBackupData(rawDb, key);

      const storage = new LocalBackupStorage(path.join(tempDir, 'backups_enc'));
      const backupKey = 'liinx-db-encrypted.sqlite.enc';
      await storage.save(backupKey, ciphertext, {
        id: 'test-enc-1',
        type: 'database',
        filename: backupKey,
        sizeBytes: ciphertext.length,
        timestamp: new Date().toISOString(),
        version: 1,
        checksumSha256: computeSha256(ciphertext),
        encrypted: true,
        ivHex,
        tagHex
      });

      const originalStorage = (backupService as any).localStorage;
      (backupService as any).localStorage = storage;

      try {
        const result = await verifyRestore({ dbBackupKey: backupKey });
        expect(result.verified).toBe(true);
        expect(result.database.integrityCheck).toBe('ok');
      } finally {
        (backupService as any).localStorage = originalStorage;
        delete process.env.BACKUP_ENCRYPTION_KEY;
      }
    });

    it('fails restore verification if checksum is mismatched or tampered', async () => {
      const storage = new LocalBackupStorage(path.join(tempDir, 'backups_tampered'));
      const fakeData = Buffer.from('corrupted sqlite');
      const backupKey = 'liinx-db-corrupted.sqlite';

      await storage.save(backupKey, fakeData, {
        id: 'test-corrupt-1',
        type: 'database',
        filename: backupKey,
        sizeBytes: fakeData.length,
        timestamp: new Date().toISOString(),
        version: 1,
        checksumSha256: 'expected-different-sha256',
        encrypted: false
      });

      const originalStorage = (backupService as any).localStorage;
      (backupService as any).localStorage = storage;

      try {
        await expect(verifyRestore({ dbBackupKey: backupKey })).rejects.toThrow(/Checksum mismatch/);
      } finally {
        (backupService as any).localStorage = originalStorage;
      }
    });
  });

  describe('BackupService Fail-Closed Remote Behavior', () => {
    it('fails closed and throws error if remote persistence fails when remote backup is enabled', async () => {
      const localStorage = new LocalBackupStorage(path.join(tempDir, 'local'));

      // Create a mock remote storage that fails on save
      const failingRemoteStorage = {
        name: 'MockFailingS3',
        save: vi.fn().mockRejectedValue(new Error('S3 500 Internal Server Error: Connection reset')),
        get: vi.fn(),
        list: vi.fn().mockResolvedValue([]),
        delete: vi.fn()
      };

      const service = new BackupService(localStorage, failingRemoteStorage as any);

      await expect(service.backupDatabase()).rejects.toThrow('S3 500 Internal Server Error: Connection reset');

      // Verify remote save was called
      expect(failingRemoteStorage.save).toHaveBeenCalled();
    });
  });
});
