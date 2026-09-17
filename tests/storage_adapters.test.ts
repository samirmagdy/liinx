import { describe, expect, it } from 'vitest';
import { MemoryObjectStorage } from '../server/infrastructure/memoryObjectStorage.js';
import { S3CompatibleObjectStorage } from '../server/infrastructure/s3ObjectStorage.js';

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
        return data ? new Response(data, { status: 200 }) : new Response(null, { status: 404 });
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
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
