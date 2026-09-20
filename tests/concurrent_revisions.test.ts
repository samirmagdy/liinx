import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db } from '../server/db.js';

function unique(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

describe('editor optimistic revisions', () => {
  it('rejects stale profile and block writes instead of overwriting newer data', async () => {
    const email = `${unique('revision')}@raloa.test`;
    const username = unique('revision_user').slice(0, 30);
    const registered = await request(app).post('/api/auth/register').send({ email, password: 'Password123!', username });
    const token = registered.body.token as string;
    const initial = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`);
    const profileRevision = initial.body.revision as number;

    const firstProfileWrite = await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({
      displayName: 'First tab wins', revision: profileRevision
    });
    expect(firstProfileWrite.status).toBe(200);
    const staleProfileWrite = await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({
      displayName: 'Stale tab must not overwrite', revision: profileRevision
    });
    expect(staleProfileWrite.status).toBe(409);
    expect((db.prepare('SELECT display_name FROM profiles WHERE username = ?').get(username) as { display_name: string }).display_name).toBe('First tab wins');

    const block = initial.body.blocks[0];
    const firstBlockWrite = await request(app).put(`/api/studio/blocks/${block.id}`).set('Authorization', `Bearer ${token}`).send({
      title: 'First block tab', revision: block.revision
    });
    expect(firstBlockWrite.status).toBe(200);
    const staleBlockWrite = await request(app).put(`/api/studio/blocks/${block.id}`).set('Authorization', `Bearer ${token}`).send({
      title: 'Stale block tab', revision: block.revision
    });
    expect(staleBlockWrite.status).toBe(409);
    expect((db.prepare('SELECT title FROM blocks WHERE id = ?').get(block.id) as { title: string }).title).toBe('First block tab');

    const page = initial.body.pages.find((candidate: any) => candidate.isHome);
    const firstPageWrite = await request(app).put(`/api/studio/pages/${page.id}`).set('Authorization', `Bearer ${token}`).send({
      title: 'First page tab', revision: page.revision
    });
    expect(firstPageWrite.status).toBe(200);
    const stalePageWrite = await request(app).put(`/api/studio/pages/${page.id}`).set('Authorization', `Bearer ${token}`).send({
      title: 'Stale page tab', revision: page.revision
    });
    expect(stalePageWrite.status).toBe(409);
    expect((db.prepare('SELECT title FROM pages WHERE id = ?').get(page.id) as { title: string }).title).toBe('First page tab');
  });
});
