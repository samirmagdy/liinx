import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { initDatabase } from '../server/db.js';

describe('audio block provider boundaries', () => {
  beforeAll(() => initDatabase());

  it('persists supported provider/direct sources and rejects active schemes', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const username = `audio_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({
      email: `audio_${unique}@liinx.test`,
      password: 'AudioPassword2026!',
      username
    }).expect(201);
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${registration.body.token}`);
    const studio = await auth(request(app).get('/api/studio/profile')).expect(200);
    const home = studio.body.pages.find((page: any) => page.isHome);
    const sources = [
      'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
      'https://music.apple.com/us/album/example/123',
      'https://soundcloud.com/artist/track',
      'https://cdn.example.test/track.mp3?download=1'
    ];

    for (const [index, audioUrl] of sources.entries()) {
      await auth(request(app).post('/api/studio/blocks')).send({
        pageId: home.id,
        type: 'audio',
        title: `Audio ${index + 1}`,
        extra: { artist: 'Draft artist', coverUrl: '', audioUrl }
      }).expect(201);
    }
    await auth(request(app).post('/api/studio/blocks')).send({ pageId: home.id, type: 'audio', title: 'Unsafe', extra: { audioUrl: 'javascript:alert(1)' } }).expect(400);

    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.filter((block: any) => block.type === 'audio').map((block: any) => block.audioUrl)).toEqual(sources);
  });
});
