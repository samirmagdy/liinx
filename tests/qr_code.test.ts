import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildQrTargetUrl } from '../src/utils/qr';
import { app } from '../server/server';

describe('QR public target construction', () => {
  const home = { id: 'home', slug: 'home', title: 'Home', sortOrder: 0, isHome: true, published: true };
  const about = { id: 'about', slug: 'about-us', title: 'About', sortOrder: 1, isHome: false, published: true };

  it('targets platform Home and published subpages without a third-party redirect', () => {
    expect(buildQrTargetUrl({ username: 'creator', page: home, platformOrigin: 'https://liinx.example' })).toBe('https://liinx.example/@creator');
    expect(buildQrTargetUrl({ username: 'creator', page: about, platformOrigin: 'https://liinx.example' })).toBe('https://liinx.example/@creator/about-us');
  });

  it('targets the verified custom domain root instead of adding a platform username path', () => {
    expect(buildQrTargetUrl({ username: 'creator', page: home, platformOrigin: 'https://liinx.example', customDomain: 'creator.example' })).toBe('https://creator.example/');
    expect(buildQrTargetUrl({ username: 'creator', page: about, platformOrigin: 'https://liinx.example', customDomain: 'creator.example' })).toBe('https://creator.example/about-us');
  });

  it('rejects malformed origins rather than producing a misleading QR target', () => {
    expect(buildQrTargetUrl({ username: 'creator', page: home, platformOrigin: 'not a url' })).toBeNull();
    expect(buildQrTargetUrl({ username: 'creator', page: home, platformOrigin: 'https://liinx.example', customDomain: 'javascript:alert(1)' })).toBeNull();
    expect(buildQrTargetUrl({ username: 'creator', page: home, platformOrigin: 'https://liinx.example', customDomain: 'user:pass@domain.com' })).toBeNull();
    expect(buildQrTargetUrl({ username: 'creator', page: undefined, platformOrigin: 'https://liinx.example' })).toBe('https://liinx.example/@creator');
    expect(buildQrTargetUrl({ username: 'creator', page: undefined, platformOrigin: 'https://liinx.example', customDomain: 'creator.example' })).toBe('https://creator.example/');
  });

  it('allows the existing QR provider only for the explicit download connection', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers['content-security-policy']).toContain('connect-src');
    expect(response.headers['content-security-policy']).toContain('https://api.qrserver.com');
  });
});
