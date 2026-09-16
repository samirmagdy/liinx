import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';

describe('footer branding separation and entitlement', () => {
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  let token = '';
  let username = '';

  beforeAll(async () => {
    const registered = await request(app).post('/api/auth/register').send({
      email: `footer-${unique}@liinx.test`, password: 'FooterPassword2026!', username: `footer${unique}`.slice(0, 30)
    }).expect(201);
    token = registered.body.token;
    username = registered.body.user.username;
  });

  it('rejects creator logo settings on free and accepts them on paid plans', async () => {
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({
      footerLogoUrl: 'https://cdn.example.test/logo.svg'
    }).expect(403);

    await request(app).put('/api/studio/plan').set('Authorization', `Bearer ${token}`).send({ plan: 'pro' }).expect(200);
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({
      footerLogoUrl: 'https://cdn.example.test/logo.svg',
      footerLogoLink: 'https://creator.example.test',
      footerLogoAlt: 'Creator identity'
    }).expect(200);

    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body).toMatchObject({
      footerLogoUrl: 'https://cdn.example.test/logo.svg',
      footerLogoLink: 'https://creator.example.test',
      footerLogoAlt: 'Creator identity'
    });
  });

  it('keeps the creator logo when platform attribution is hidden and rejects unsafe destinations', async () => {
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({ hideBranding: true }).expect(200);
    const hidden = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(hidden.body.hideBranding).toBe(true);
    expect(hidden.body.footerLogoUrl).toBe('https://cdn.example.test/logo.svg');

    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({
      footerLogoLink: 'javascript:alert(1)'
    }).expect(400);
  });

  it('supports removing the creator logo without creating a platform destination', async () => {
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({
      footerLogoUrl: null, footerLogoLink: null, footerLogoAlt: null, hideBranding: false
    }).expect(200);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.footerLogoUrl).toBeNull();
    expect(publicProfile.body.footerLogoLink).toBeNull();
    expect(publicProfile.body.footerLogoAlt).toBeNull();
    expect(publicProfile.body.hideBranding).toBe(false);
  });
});
