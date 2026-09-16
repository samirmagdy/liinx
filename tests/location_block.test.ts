import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { initDatabase } from '../server/db.js';
import { getGoogleMapsSearchUrl } from '../src/utils/mapLinks.js';

describe('location block directions', () => {
  beforeAll(() => initDatabase());

  it('round-trips Arabic and English addresses and builds encoded Maps search URLs', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const username = `location_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({
      email: `location_${unique}@liinx.test`,
      password: 'LocationPassword2026!',
      username
    }).expect(201);
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${registration.body.token}`);
    const studio = await auth(request(app).get('/api/studio/profile')).expect(200);
    const home = studio.body.pages.find((page: any) => page.isHome);
    const addresses = ['King Fahd Road, Riyadh', 'شارع التحلية، الرياض'];
    const ids: string[] = [];
    for (const location of addresses) {
      const created = await auth(request(app).post('/api/studio/blocks')).send({ pageId: home.id, type: 'map', title: 'Visit us', extra: { location } }).expect(201);
      ids.push(created.body.id);
    }
    await auth(request(app).post('/api/studio/blocks')).send({ pageId: home.id, type: 'map', title: 'Too long', extra: { location: 'x'.repeat(301) } }).expect(400);

    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(ids.map(id => publicProfile.body.blocks.find((block: any) => block.id === id).location)).toEqual(addresses);
    for (const location of addresses) {
      const parsed = new URL(getGoogleMapsSearchUrl(location)!);
      expect(parsed.origin + parsed.pathname).toBe('https://www.google.com/maps/search/');
      expect(parsed.searchParams.get('api')).toBe('1');
      expect(parsed.searchParams.get('query')).toBe(location);
    }
    expect(getGoogleMapsSearchUrl('   ')).toBeNull();
    expect(getGoogleMapsSearchUrl(null)).toBeNull();
  });
});
