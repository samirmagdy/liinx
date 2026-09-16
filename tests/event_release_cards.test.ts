import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';

describe('event and release-link cards', () => {
  let token = '';
  let username = '';
  let pageId = '';

  beforeAll(async () => {
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    username = `events_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({ email: `events-${unique}@liinx.test`, password: 'EventsPassword2026!', username }).expect(201);
    token = registration.body.token;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    pageId = studio.body.pages.find((page: any) => page.isHome).id;
  });

  it('persists event metadata and redirects through a safe destination', async () => {
    const event = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
      pageId, type: 'event', title: 'ليلة الرياض / Riyadh night', extra: {
        description: 'Doors open at 7 PM.\nالدخول الساعة ٧ مساءً.', date: '12 October 2026', time: '7:00 PM', timezone: 'AST (UTC+3)', location: 'Riyadh Art Hall', artworkUrl: 'https://example.com/event.jpg', url: 'https://tickets.example.test/show'
      }
    }).expect(201);
    const release = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'presave', title: 'New single', extra: { description: 'External release page only.', url: 'https://music.example.test/release' } }).expect(201);

    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(studio.body.blocks.find((block: any) => block.id === event.body.id)).toEqual(expect.objectContaining({ date: '12 October 2026', time: '7:00 PM', timezone: 'AST (UTC+3)', location: 'Riyadh Art Hall' }));
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === release.body.id).description).toBe('External release page only.');
    await request(app).get(`/r/${event.body.id}`).expect(302).expect(response => expect(response.headers.location).toBe('https://tickets.example.test/show'));
    await request(app).get(`/r/${release.body.id}`).expect(302).expect(response => expect(response.headers.location).toBe('https://music.example.test/release'));
  });

  it('rejects unsafe destinations and leaves missing cards non-functional', async () => {
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'event', title: 'Unsafe event', extra: { url: 'javascript:alert(1)' } }).expect(400);
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'presave', title: 'Unconfigured release', extra: { description: 'Not available yet.' } }).expect(201);
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    const missing = studio.body.blocks.find((block: any) => block.title === 'Unconfigured release');
    await request(app).get(`/r/${missing.id}`).expect(404);
  });
});
