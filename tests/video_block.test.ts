import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { initDatabase } from '../server/db.js';

describe('video block URL contract', () => {
  beforeAll(() => initDatabase());

  it('round-trips supported provider and direct-media URLs without accepting active schemes', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const username = `video_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({
      email: `video_${unique}@liinx.test`,
      password: 'VideoPassword2026!',
      username
    }).expect(201);
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${registration.body.token}`);
    const home = (await auth(request(app).get('/api/studio/profile')).expect(200)).body.pages.find((page: any) => page.isHome);

    const urls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://vimeo.com/76979871',
      'https://cdn.example.test/video.mp4?download=1'
    ];
    const ids = [] as string[];
    for (const [index, videoUrl] of urls.entries()) {
      const response = await auth(request(app).post('/api/studio/blocks')).send({
        pageId: home.id,
        type: 'video',
        title: `Video ${index + 1}`,
        extra: { videoUrl, thumbnailUrl: '', platform: index === 1 ? 'vimeo' : 'youtube' }
      }).expect(201);
      ids.push(response.body.id);
    }

    await auth(request(app).post('/api/studio/blocks')).send({ pageId: home.id, type: 'video', title: 'Unsafe', extra: { videoUrl: 'javascript:alert(1)' } }).expect(400);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(ids.map(id => publicProfile.body.blocks.find((block: any) => block.id === id).videoUrl)).toEqual(urls);
  });
});
