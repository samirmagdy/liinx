import dns from 'node:dns';
import { describe, expect, it, afterEach, vi } from 'vitest';
import request from 'supertest';
import { importFromPublicUrl } from '../server/services/importer.js';
import { app } from '../server/server.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('competitor importer boundaries', () => {
  it('previews a supported public fixture and reports unsupported markup as a warning', async () => {
    vi.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(`
      <html><head><meta property="og:title" content="Public Fixture" /></head>
      <body><a href="https://example.com/work">Work</a><a href="javascript:alert(1)">Unsafe</a></body></html>
    `, { status: 200, headers: { 'content-type': 'text/html' } }));

    const imported = await importFromPublicUrl('https://linktr.ee/public-fixture');
    expect(imported.displayName).toBe('Public Fixture');
    expect(imported.links).toEqual([{ title: 'Work', url: 'https://example.com/work' }]);
    expect(imported.warnings.length).toBeGreaterThan(0);
  });

  it('revalidates every redirect and rejects long, truncated, or unsupported responses', async () => {
    vi.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'https://example.com/private-hop' } }));
    await expect(importFromPublicUrl('https://linktr.ee/redirect')).rejects.toThrow(/unsupported profile host/i);

    globalThis.fetch = vi.fn().mockResolvedValue(new Response('small', { status: 200, headers: { 'content-type': 'text/html', 'content-length': String(3 * 1024 * 1024) } }));
    await expect(importFromPublicUrl('https://linktr.ee/huge')).rejects.toThrow(/too large/i);

    globalThis.fetch = vi.fn().mockResolvedValue(new Response('small', { status: 200, headers: { 'content-type': 'text/html', 'content-length': '100' } }));
    await expect(importFromPublicUrl('https://linktr.ee/truncated')).rejects.toThrow(/truncated/i);

    globalThis.fetch = vi.fn().mockImplementation(() => new Response(null, { status: 302, headers: { location: 'https://linktr.ee/next' } }));
    await expect(importFromPublicUrl('https://linktr.ee/loop')).rejects.toThrow(/too many redirects/i);
    expect(globalThis.fetch).toHaveBeenCalledTimes(6);
  });

  it('does not duplicate imported destinations and appends to the selected owned page', async () => {
    const username = `import_${Date.now()}`;
    const registered = await request(app).post('/api/auth/register').send({ email: `${username}@liinx.test`, password: 'ImporterPassword2026!', username }).expect(201);
    const token = registered.body.token as string;
    const profile = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    const page = (await request(app).post('/api/studio/pages').set('Authorization', `Bearer ${token}`).send({ title: 'Imported page', slug: `imported-${Date.now()}` }).expect(201)).body.page;
    const payload = { pageId: page.id, links: [{ title: 'One', url: 'https://example.com/one' }, { title: 'One duplicate', url: 'https://example.com/one' }] };
    const first = await request(app).post('/api/studio/import/commit').set('Authorization', `Bearer ${token}`).send(payload).expect(200);
    expect(first.body.count).toBe(1);
    expect(first.body.skippedDuplicates).toBe(1);
    const second = await request(app).post('/api/studio/import/commit').set('Authorization', `Bearer ${token}`).send(payload).expect(200);
    expect(second.body.count).toBe(0);
    expect(second.body.skippedDuplicates).toBe(2);
    const reloaded = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(reloaded.body.blocks.filter((block: any) => block.pageId === page.id)).toHaveLength(1);
    expect(profile.body.pages.some((candidate: any) => candidate.id === page.id)).toBe(false);
  });
});
