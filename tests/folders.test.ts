import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { flushAnalyticsBuffers } from '../server/routes/analytics.js';

describe('folder content groups', () => {
  let token = '';
  let username = '';
  let folderId = '';
  let pageId = '';
  const items = [
    { id: 'folder-first', title: 'First link', url: 'https://example.com/first', subtitle: 'A' },
    { id: 'folder-second', title: 'Second link', url: 'https://example.com/second', subtitle: 'B' },
    { id: 'folder-third', title: 'Third link', url: 'https://example.com/third', subtitle: 'C' }
  ];

  beforeAll(async () => {
    initDatabase();
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    username = `folder_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({
      email: `folder-${unique}@raloa.test`, password: 'FolderPassword2026!', username
    }).expect(201);
    token = registration.body.token;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    pageId = studio.body.pages.find((page: any) => page.isHome).id;
  });

  it('persists ordered one-level items and attributes clicks to the folder', async () => {
    const created = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
      pageId, type: 'folder', title: 'Resources', subtitle: 'Useful links', extra: { items }
    }).expect(201);
    folderId = created.body.id;
    const reversed = [items[2], items[1], items[0]];
    await request(app).put(`/api/studio/blocks/${folderId}`).set('Authorization', `Bearer ${token}`).send({ extra: { items: reversed } }).expect(200);
    const reloaded = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(reloaded.body.blocks.find((block: any) => block.id === folderId).items.map((item: any) => item.id)).toEqual(['folder-third', 'folder-second', 'folder-first']);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === folderId)).toMatchObject({ title: 'Resources', subtitle: 'Useful links' });
    expect(publicProfile.body.blocks.find((block: any) => block.id === folderId).items.map((item: any) => item.id)).toEqual(['folder-third', 'folder-second', 'folder-first']);
    await request(app).get(`/r/${folderId}?item=folder-second`).expect(302).expect(response => expect(response.headers.location).toBe('https://example.com/second'));
    flushAnalyticsBuffers();
    expect((db.prepare('SELECT COUNT(*) AS count FROM link_clicks WHERE block_id = ? AND target_url = ?').get(folderId, 'https://example.com/second') as any).count).toBe(1);
  });

  it('supports empty and incomplete items without claiming they work', async () => {
    const response = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
      pageId, type: 'folder', title: 'Empty folder', extra: { items: [{ id: 'empty-item', title: 'Add a destination', url: '' }] }
    }).expect(201);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    const folder = publicProfile.body.blocks.find((block: any) => block.id === response.body.id);
    expect(folder.items).toHaveLength(1);
    await request(app).get(`/r/${response.body.id}?item=empty-item`).expect(404);
  });

  it('rejects nested folders, unsafe destinations, and oversized item content', async () => {
    const cases = [
      { items: [{ id: 'nested', title: 'Nested', url: 'https://example.com', items: [] }] },
      { items: [{ id: 'unsafe', title: 'Unsafe', url: 'javascript:alert(1)' }] },
      { items: [{ id: 'long', title: 'x'.repeat(151), url: 'https://example.com' }] }
    ];
    for (const extra of cases) {
      await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'folder', title: 'Invalid folder', extra }).expect(400);
    }
  });
});
