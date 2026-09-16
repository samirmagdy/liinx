import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server/server';
import { bookingUrl } from '../src/utils/booking';

describe('Calendly booking', () => {
  it('accepts official event URLs and rejects unsafe or unrelated URLs', () => {
    expect(bookingUrl('https://calendly.com/studio/consultation?utm_source=bio')).toBe('https://calendly.com/studio/consultation');
    expect(bookingUrl('https://calendly.com/studio')).toBe('https://calendly.com/studio');
    for (const url of ['javascript:alert(1)', 'http://calendly.com/a/b', 'https://calendly.com.evil.test/a/b', 'https://user@calendly.com/a/b', 'https://calendly.com/', 'https://calendly.com/studio/consultation/embed', 'https://example.com/a/b']) expect(bookingUrl(url)).toBeNull();
  });
  it('persists booking blocks, rejects invalid updates, and supports removal', async () => {
    const username = `book_${Date.now()}`;
    const account = await request(app).post('/api/auth/register').send({ username, email: `${username}@test.com`, password: 'Password123!' });
    expect(account.status).toBe(201);
    const auth = `Bearer ${account.body.token}`;
    const created = await request(app).post('/api/studio/blocks').set('Authorization', auth).send({ type: 'booking', title: 'Consultation', url: 'https://calendly.com/studio/consultation' });
    expect(created.status).toBe(201);
    const invalid = await request(app).put(`/api/studio/blocks/${created.body.id}`).set('Authorization', auth).send({ url: 'https://evil.test' });
    expect(invalid.status).toBe(400);
    const publicPage = await request(app).get(`/api/profiles/${username}`);
    expect(publicPage.body.blocks).toContainEqual(expect.objectContaining({ id: created.body.id, type: 'booking', url: 'https://calendly.com/studio/consultation' }));
    expect((await request(app).delete(`/api/studio/blocks/${created.body.id}`).set('Authorization', auth)).status).toBe(200);
  });
});
