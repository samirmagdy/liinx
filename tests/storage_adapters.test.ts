import { describe, expect, it, vi } from 'vitest';
import { MemoryObjectStorage } from '../server/infrastructure/memoryObjectStorage.js';
import { S3CompatibleObjectStorage } from '../server/infrastructure/s3ObjectStorage.js';
import { MemoryCacheStore } from '../server/infrastructure/memoryCache.js';

describe('media storage adapter contract', () => {
  it('round-trips metadata and bytes without filesystem or credentials', async () => {
    const storage = new MemoryObjectStorage('https://cdn.test/assets');
    const bytes = Buffer.from('fixture media');
    const stored = await storage.put('file_abc.txt', bytes, {
      mimeType: 'text/plain',
      originalFilename: 'report.csv',
      contentDisposition: 'attachment',
      cacheControl: 'public, max-age=31536000, immutable'
    });
    expect(stored.url).toBe('https://cdn.test/assets/file_abc.txt');
    expect(await storage.exists(stored.key)).toBe(true);
    expect(await storage.get(stored.key)).toEqual(bytes);
    expect(await storage.delete(stored.key)).toBe(true);
    expect(await storage.exists(stored.key)).toBe(false);
    expect(await storage.get('missing.txt')).toBeNull();
    expect(await storage.delete('missing.txt')).toBe(false);
    expect(await storage.healthCheck()).toBe(true);
    expect(() => storage.getUrl('../invalid')).toThrow('Invalid object key.');
  });

  it('expires cache entries and purges expired entries when the cache reaches its limit', () => {
    vi.useFakeTimers();
    const cache = new MemoryCacheStore<string>(100, 1);
    try {
      expect(cache.get('missing')).toBeNull();
      cache.set('prefix:first', 'first', 10);
      expect(cache.get('prefix:first')).toBe('first');
      vi.advanceTimersByTime(11);
      expect(cache.get('prefix:first')).toBeNull();

      cache.set('prefix:old', 'old', 5);
      vi.advanceTimersByTime(6);
      cache.set('other', 'kept');
      expect(cache.get('other')).toBe('kept');

      cache.set('prefix:a', 'a');
      cache.set('prefix:b', 'b');
      cache.deleteByPrefix('prefix:');
      expect(cache.get('prefix:a')).toBeNull();
      expect(cache.get('other')).toBe('kept');
      cache.delete('other');
      cache.clear();
    } finally {
      cache.destroy();
      vi.useRealTimers();
    }
  });

  it('uses server-side S3-compatible requests and preserves object metadata', async () => {
    const objects = new Map<string, Buffer>();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';
      if (method === 'PUT') {
        objects.set(url, Buffer.from(init?.body as Uint8Array));
        return new Response(null, { status: 200 });
      }
      if (method === 'GET') {
        const data = objects.get(url);
        return data ? new Response(new Uint8Array(data), { status: 200 }) : new Response(null, { status: 404 });
      }
      if (method === 'HEAD') {
        const data = objects.get(url);
        return data ? new Response(null, { status: 200, headers: { 'content-length': String(data.length) } }) : new Response(null, { status: 404 });
      }
      if (method === 'DELETE') {
        objects.delete(url);
        return new Response(null, { status: 204 });
      }
      return new Response(null, { status: 405 });
    }) as typeof fetch;

    try {
      const storage = new S3CompatibleObjectStorage({
        bucket: 'liinx-media',
        region: 'auto',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        endpoint: 'https://objects.example.test',
        forcePathStyle: true,
        publicUrl: 'https://cdn.example.test/media',
        keyPrefix: 'media'
      });
      const stored = await storage.put('asset_1.png', Buffer.from('png-fixture'), {
        mimeType: 'image/png',
        originalFilename: 'cover.png',
        contentDisposition: 'inline',
        cacheControl: 'public, max-age=60'
      });
      expect(stored.url).toBe('https://cdn.example.test/media/asset_1.png');
      expect(await storage.exists(stored.key)).toBe(true);
      expect(await storage.get(stored.key)).toEqual(Buffer.from('png-fixture'));
      expect(await storage.delete(stored.key)).toBe(true);
      expect(await storage.exists(stored.key)).toBe(false);
      expect(await storage.healthCheck()).toBe(true);
      expect(() => storage.getUrl('../invalid')).toThrow('Invalid object key.');
      await expect(storage.put('bad/name', Buffer.from('x'), { mimeType: 'text/plain' })).rejects.toThrow('Invalid object key.');

      // Test attachment disposition, default cacheControl, default originalFilename
      const attachmentStored = await storage.put('doc.pdf', Buffer.from('pdf-data'), {
        mimeType: 'application/pdf',
        contentDisposition: 'attachment'
      });
      expect(attachmentStored.url).toBe('https://cdn.example.test/media/doc.pdf');

      // Test storage without publicUrl (falls back to /uploads/...) and with empty prefix
      const storageNoPublic = new S3CompatibleObjectStorage({
        bucket: 'no-public',
        region: 'us-east-1',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        keyPrefix: ''
      });
      expect(storageNoPublic.getUrl('image.png')).toBe('/uploads/image.png');
      expect(await storageNoPublic.healthCheck()).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('validates environment configuration in createS3ObjectStorageFromEnv', async () => {
    const { createS3ObjectStorageFromEnv } = await import('../server/infrastructure/s3ObjectStorage.js');
    const oldEnv = { ...process.env };

    try {
      delete process.env.MEDIA_S3_BUCKET;
      delete process.env.MEDIA_S3_ACCESS_KEY_ID;
      delete process.env.MEDIA_S3_SECRET_ACCESS_KEY;

      expect(() => createS3ObjectStorageFromEnv()).toThrow('MEDIA_S3_BUCKET is required when MEDIA_STORAGE=s3.');

      process.env.MEDIA_S3_BUCKET = 'my-bucket';
      expect(() => createS3ObjectStorageFromEnv()).toThrow('MEDIA_S3_ACCESS_KEY_ID is required when MEDIA_STORAGE=s3.');

      process.env.MEDIA_S3_ACCESS_KEY_ID = 'my-key-id';
      expect(() => createS3ObjectStorageFromEnv()).toThrow('MEDIA_S3_SECRET_ACCESS_KEY is required when MEDIA_STORAGE=s3.');

      process.env.MEDIA_S3_SECRET_ACCESS_KEY = 'my-secret';
      process.env.MEDIA_S3_FORCE_PATH_STYLE = 'true';
      process.env.MEDIA_S3_ENDPOINT = 'https://s3.custom.test';
      process.env.MEDIA_PUBLIC_URL = 'https://cdn.custom.test';

      const s3Storage = createS3ObjectStorageFromEnv();
      expect(s3Storage.provider).toBe('s3');
      expect(s3Storage.getUrl('avatar.jpg')).toBe('https://cdn.custom.test/avatar.jpg');
      expect(await s3Storage.healthCheck()).toBe(true);
    } finally {
      process.env = oldEnv;
    }
  });

  it('exercises LocalFileObjectStorage full lifecycle and error handling', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const { LocalFileObjectStorage } = await import('../server/infrastructure/localStorage.js');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'liinx-local-storage-test-'));

    try {
      const storage = new LocalFileObjectStorage(tempDir, '/custom-uploads');
      expect(storage.provider).toBe('local-fs');

      // Put
      const bytes = Buffer.from('hello-local-file');
      const stored = await storage.put('test-file.txt', bytes, {
        mimeType: 'text/plain'
      });
      expect(stored.url).toBe('/custom-uploads/test-file.txt');
      expect(stored.sizeBytes).toBe(bytes.length);

      // Exists & Get
      expect(await storage.exists('test-file.txt')).toBe(true);
      expect(await storage.exists('non-existent.txt')).toBe(false);
      expect(await storage.get('test-file.txt')).toEqual(bytes);
      expect(await storage.get('non-existent.txt')).toBeNull();

      // GetUrl
      expect(storage.getUrl('test-file.txt')).toBe('/custom-uploads/test-file.txt');

      // HealthCheck
      expect(await storage.healthCheck()).toBe(true);

      // Delete (existing and non-existing idempotent)
      expect(await storage.delete('test-file.txt')).toBe(true);
      expect(await storage.exists('test-file.txt')).toBe(false);
      expect(await storage.delete('test-file.txt')).toBe(true);

      // Invalid key handling
      expect(() => storage.getUrl('../escape.txt')).toThrow('Invalid object key.');
      await expect(storage.put('../escape.txt', bytes, { mimeType: 'text/plain' })).rejects.toThrow('Invalid object key.');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
