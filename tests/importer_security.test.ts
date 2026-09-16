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
  it('does not fetch a provider page without an authorized access method', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(importFromPublicUrl('https://linktr.ee/public-fixture')).rejects.toThrow(/authorized provider API or export/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects private and unsupported hosts before any network request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(importFromPublicUrl('http://127.0.0.1:8080/profile')).rejects.toThrow(/invalid or non-public/i);
    await expect(importFromPublicUrl('https://example.com/profile')).rejects.toThrow(/supported/i);
    expect(fetchSpy).not.toHaveBeenCalled();
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
