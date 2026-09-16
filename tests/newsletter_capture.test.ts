import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

describe('Newsletter capture and subscriber management', () => {
  const suffix = Date.now();
  const ownerEmail = `newsletter_owner_${suffix}@liinx.test`;
  const secondEmail = `newsletter_second_${suffix}@liinx.test`;
  let ownerProfileId = '';
  let ownerToken = '';
  let secondProfileId = '';
  let newsletterBlockId = '';

  beforeAll(async () => {
    initDatabase();
    const owner = await request(app).post('/api/auth/register').send({
      email: ownerEmail, password: 'NewsletterPass2026!', username: `nls1_${suffix}`
    });
    ownerProfileId = owner.body.profileId;
    ownerToken = owner.body.token;
    const second = await request(app).post('/api/auth/register').send({
      email: secondEmail, password: 'NewsletterPass2026!', username: `nls2_${suffix}`
    });
    secondProfileId = second.body.profileId;

    const page = db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(ownerProfileId) as { id: string };
    const position = (db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM blocks WHERE profile_id = ? AND page_id = ?').get(ownerProfileId, page.id) as { next: number }).next;
    newsletterBlockId = `blk_newsletter_${suffix}`;
    db.prepare(`
      INSERT INTO blocks (id, profile_id, type, title, position, page_id, created_at, updated_at)
      VALUES (?, ?, 'newsletter', 'Updates', ?, ?, ?, ?)
    `).run(newsletterBlockId, ownerProfileId, position, page.id, Date.now(), Date.now());
  });

  it('requires consent, validates email, and rejects a foreign or unavailable form', async () => {
    await request(app).post('/api/newsletter/subscribe').send({
      profileId: ownerProfileId, blockId: newsletterBlockId, email: `valid_${suffix}@example.com`, consent: false
    }).expect(400);
    await request(app).post('/api/newsletter/subscribe').send({
      profileId: ownerProfileId, blockId: newsletterBlockId, email: 'not-an-email', consent: true
    }).expect(400);
    await request(app).post('/api/newsletter/subscribe').send({
      profileId: secondProfileId, blockId: newsletterBlockId, email: `foreign_${suffix}@example.com`, consent: true
    }).expect(404);
  });

  it('stores consent atomically and deduplicates case-insensitive retries', async () => {
    const email = `Retry_${suffix}@Example.com`;
    const first = await request(app).post('/api/newsletter/subscribe').send({
      profileId: ownerProfileId, blockId: newsletterBlockId, email, consent: true
    }).expect(201);
    expect(first.body.message).not.toMatch(/email|sent|confirmation/i);
    const duplicate = await request(app).post('/api/newsletter/subscribe').send({
      profileId: ownerProfileId, blockId: newsletterBlockId, email: email.toLowerCase(), consent: true
    }).expect(200);
    expect(duplicate.body.message).toMatch(/already subscribed/i);
    expect(db.prepare('SELECT COUNT(*) AS count FROM newsletter_subscribers WHERE profile_id = ? AND email = ?').get(ownerProfileId, email.toLowerCase())).toEqual({ count: 1 });
    const subscriber = db.prepare('SELECT id FROM newsletter_subscribers WHERE profile_id = ? AND email = ?').get(ownerProfileId, email.toLowerCase()) as { id: string };
    expect(db.prepare('SELECT subscriber_id FROM newsletter_consents WHERE subscriber_id = ?').get(subscriber.id)).toEqual({ subscriber_id: subscriber.id });
  });

  it('supports one-use unauthenticated unsubscribe tokens and rejects token abuse', async () => {
    const response = await request(app).post('/api/newsletter/subscribe').send({
      profileId: ownerProfileId, email: `unsubscribe_${suffix}@example.com`, consent: true
    }).expect(201);
    const token = new URL(response.body.unsubscribeUrl).searchParams.get('token');
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    await request(app).get(`/api/newsletter/unsubscribe?token=${token}`).expect(200);
    await request(app).get(`/api/newsletter/unsubscribe?token=${token}`).expect(404);
    await request(app).get('/api/newsletter/unsubscribe?token=bad').expect(400);
    await request(app).get(`/api/newsletter/unsubscribe?token=${'a'.repeat(201)}`).expect(400);
  });

  it('exports only the active profile and neutralizes spreadsheet formulas', async () => {
    await request(app).post('/api/newsletter/subscribe').send({
      profileId: ownerProfileId, email: `+sheet_${suffix}@example.com`, consent: true
    }).expect(201);
    await request(app).post('/api/newsletter/subscribe').send({
      profileId: secondProfileId, email: `other_${suffix}@example.com`, consent: true
    }).expect(201);
    const response = await request(app).get('/api/studio/subscribers/export').set('Authorization', `Bearer ${ownerToken}`).expect(200);
    expect(response.headers['cache-control']).toMatch(/no-store/);
    expect(response.text).toContain("'+sheet_");
    expect(response.text).not.toContain(`other_${suffix}@example.com`);

    const list = await request(app).get('/api/studio/subscribers').set('Authorization', `Bearer ${ownerToken}`).expect(200);
    const sheetSubscriber = list.body.subscribers.find((subscriber: { email: string }) => subscriber.email === `+sheet_${suffix}@example.com`);
    expect(sheetSubscriber).toBeDefined();
    await request(app).delete(`/api/studio/subscribers/${sheetSubscriber.id}`).set('Authorization', `Bearer ${ownerToken}`).expect(200);
    const afterDelete = await request(app).get('/api/studio/subscribers').set('Authorization', `Bearer ${ownerToken}`).expect(200);
    expect(afterDelete.body.subscribers.some((subscriber: { email: string }) => subscriber.email === `+sheet_${suffix}@example.com`)).toBe(false);
  });
});
