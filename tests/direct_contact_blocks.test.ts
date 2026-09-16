import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { getMailtoHref, getPhoneHref, normalizePhoneNumber } from '../src/utils/contactLinks.js';

describe('phone and direct-contact blocks', () => {
  let token = '';
  let username = '';
  let pageId = '';

  beforeAll(async () => {
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    username = `contact_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({ email: `contact-${unique}@liinx.test`, password: 'ContactPassword2026!', username }).expect(201);
    token = registration.body.token;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    pageId = studio.body.pages.find((page: any) => page.isHome).id;
  });

  it('normalizes international phone numbers and preserves email parameters', async () => {
    expect(normalizePhoneNumber('+966 (50) 123-4567')).toBe('+966501234567');
    expect(getPhoneHref('+966 (50) 123-4567')).toBe('tel:+966501234567');
    expect(getMailtoHref('hello@example.com', 'Arabic سؤال', 'Line one\nLine two')).toContain('subject=Arabic+%D8%B3%D8%A4%D8%A7%D9%84');

    const phone = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'phone', title: 'اتصل بنا / Call us', extra: { contactType: 'phone', phone: '+966 (50) 123-4567', availability: 'Sun–Thu, 9:00–17:00 AST', description: 'Direct creator contact.' } }).expect(201);
    const email = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'phone', title: 'Email us', extra: { contactType: 'email', email: 'hello@example.com', subject: 'Project inquiry', body: 'Hello Liinx', description: 'Send an email directly.' } }).expect(201);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === phone.body.id)).toEqual(expect.objectContaining({ phone: '+966 (50) 123-4567', availability: 'Sun–Thu, 9:00–17:00 AST' }));
    expect(publicProfile.body.blocks.find((block: any) => block.id === email.body.id)).toEqual(expect.objectContaining({ contactType: 'email', email: 'hello@example.com', subject: 'Project inquiry' }));
    await request(app).get(`/r/${phone.body.id}`).expect(302).expect(response => expect(response.headers.location).toBe('tel:+966501234567'));
    await request(app).get(`/r/${email.body.id}`).expect(302).expect(response => expect(response.headers.location).toContain('mailto:hello@example.com?subject=Project+inquiry'));
  });

  it('rejects unsafe or malformed contact values and leaves missing actions unavailable', async () => {
    for (const phone of ['abc<script>', '+123', '+1234567890123456']) {
      await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'phone', title: 'Invalid phone', extra: { phone } }).expect(400);
    }
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'phone', title: 'Unsafe contact', extra: { contactType: 'email', email: 'javascript:alert(1)' } }).expect(400);
    const missing = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'phone', title: 'Contact not configured', extra: { contactType: 'phone', phone: '' } }).expect(201);
    await request(app).get(`/r/${missing.body.id}`).expect(404);
  });
});
