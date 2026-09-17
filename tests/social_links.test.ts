import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';

describe('social icons and contact links', () => {
  it('persists supported provider, email, and phone links in order', async () => {
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
    const registration = await request(app).post('/api/auth/register').send({
      email: `social-${id}@liinx.test`, password: 'SocialPassword2026!', username: `social${id}`.slice(0, 30)
    }).expect(201);
    const token = registration.body.token as string;
    const username = registration.body.user.username as string;
    const socials = [
      { platform: 'instagram', url: 'https://instagram.com/اسم' },
      { platform: 'youtube', url: 'https://youtu.be/example' },
      { platform: 'email', url: 'mailto:creator@example.com' },
      { platform: 'phone', url: 'tel:+966 50 123 4567' }
    ];
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({ socials }).expect(200);
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(studio.body.socials).toEqual(socials);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.socials).toEqual(socials);

    const reordered = [socials[3], socials[1], socials[0], socials[2]];
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({ socials: reordered }).expect(200);
    const reloaded = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(reloaded.body.socials).toEqual(reordered);
  });

  it.each([
    [{ platform: 'instagram', url: 'javascript:alert(1)' }, 'unsafe protocol'],
    [{ platform: 'instagram', url: 'https://github.com/not-instagram' }, 'provider mismatch'],
    [{ platform: 'email', url: 'https://example.com/contact' }, 'email protocol'],
    [{ platform: 'phone', url: 'mailto:creator@example.com' }, 'phone protocol'],
    [{ platform: 'email', url: 'mailto:not-an-email' }, 'invalid email'],
  ])('rejects %s', async (social) => {
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
    const registration = await request(app).post('/api/auth/register').send({ email: `invalid-social-${id}@liinx.test`, password: 'SocialPassword2026!', username: `invalidsocial${id}`.slice(0, 30) }).expect(201);
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${registration.body.token}`).send({ socials: [social] }).expect(400);
  });

  it('rejects duplicate destinations while preserving the prior saved list', async () => {
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
    const registration = await request(app).post('/api/auth/register').send({ email: `duplicate-social-${id}@liinx.test`, password: 'SocialPassword2026!', username: `duplicatesocial${id}`.slice(0, 30) }).expect(201);
    const token = registration.body.token as string;
    const before = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({ socials: [
      { platform: 'github', url: 'https://github.com/example' },
      { platform: 'github', url: 'https://github.com/example' }
    ] }).expect(400);
    const profile = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(profile.body.socials).toEqual(before.body.socials);
  });

  it('normalizes raw phone and email input correctly', async () => {
    const { normalizeSocialUrl } = await import('../src/features/builder/hooks/useSocialLinks.js');
    expect(normalizeSocialUrl('phone', '+966 50 123 4567')).toBe('tel:+966 50 123 4567');
    expect(normalizeSocialUrl('phone', 'tel:+966 50 123 4567')).toBe('tel:+966 50 123 4567');
    expect(normalizeSocialUrl('phone', '0501234567')).toBe('tel:0501234567');
    expect(normalizeSocialUrl('email', 'creator@example.com')).toBe('mailto:creator@example.com');
    expect(normalizeSocialUrl('email', 'mailto:creator@example.com')).toBe('mailto:creator@example.com');
    expect(normalizeSocialUrl('instagram', 'https://instagram.com/liinx')).toBe('https://instagram.com/liinx');
  });
});
