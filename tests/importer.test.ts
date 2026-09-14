import { describe, it, expect } from 'vitest';
import { 
  isSafePublicUrl, 
  parseLinktreeNextData, 
  parseGenericHtmlBio 
} from '../server/services/importer';

describe('Public Bio Importer Service (0% Fake Implementation)', () => {
  it('blocks private IPs, localhost, and SSRF attempts', () => {
    expect(isSafePublicUrl('http://localhost:3000')).toBe(false);
    expect(isSafePublicUrl('http://127.0.0.1:8080')).toBe(false);
    expect(isSafePublicUrl('http://192.168.1.1')).toBe(false);
    expect(isSafePublicUrl('http://10.0.0.1')).toBe(false);
    expect(isSafePublicUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isSafePublicUrl('ftp://example.com')).toBe(false);

    expect(isSafePublicUrl('https://linktr.ee/elenarostova')).toBe(true);
    expect(isSafePublicUrl('https://beacons.ai/alex')).toBe(true);
  });

  it('correctly extracts links, socials, and account data from Linktree Next.js JSON', () => {
    const mockNextData = {
      props: {
        pageProps: {
          account: {
            username: 'alexstudio',
            pageTitle: 'Alex Studio Design',
            description: 'Minimalist designer based in Tokyo',
            profilePictureUrl: 'https://cdn.example.com/avatar.jpg'
          },
          links: [
            { id: '1', title: 'Portfolio Website', url: 'https://alex.studio', description: 'Selected 2025 works' },
            { id: '2', title: 'Buy My Presets', url: 'https://gumroad.com/l/presets', description: 'Lightroom packs' }
          ],
          socialLinks: [
            { type: 'instagram', url: 'https://instagram.com/alex' },
            { type: 'twitter', url: 'https://x.com/alex' }
          ]
        }
      }
    };

    const mockHtml = `<html><head></head><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(mockNextData)}</script></body></html>`;

    const parsed = parseLinktreeNextData(mockHtml);
    expect(parsed).not.toBeNull();
    expect(parsed?.displayName).toBe('Alex Studio Design');
    expect(parsed?.bio).toBe('Minimalist designer based in Tokyo');
    expect(parsed?.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
    expect(parsed?.links).toHaveLength(2);
    expect(parsed?.links[0].title).toBe('Portfolio Website');
    expect(parsed?.links[0].url).toBe('https://alex.studio');
    expect(parsed?.links[1].title).toBe('Buy My Presets');
    expect(parsed?.socials).toHaveLength(2);
    expect(parsed?.socials[0].platform).toBe('instagram');
  });

  it('falls back to OpenGraph and HTML parsing when Next data is not present', () => {
    const mockHtml = `
      <html>
        <head>
          <meta property="og:title" content="Creative Director Bio" />
          <meta property="og:description" content="Visual artist and typography curator" />
          <meta property="og:image" content="https://example.com/og.jpg" />
        </head>
        <body>
          <a href="https://behance.net/sample">Behance Portfolio</a>
          <a href="https://spotify.com/artist/123">Listen on Spotify</a>
          <a href="https://linktr.ee/login">Login to Linktree</a>
        </body>
      </html>
    `;

    const parsed = parseGenericHtmlBio(mockHtml, 'https://example.com/profile');
    expect(parsed.displayName).toBe('Creative Director Bio');
    expect(parsed.bio).toBe('Visual artist and typography curator');
    expect(parsed.avatarUrl).toBe('https://example.com/og.jpg');
    expect(parsed.links).toHaveLength(2);
    expect(parsed.links[0].title).toBe('Behance Portfolio');
    expect(parsed.links[1].title).toBe('Listen on Spotify');
    // Administrative login link should be filtered out
    expect(parsed.links.some(l => l.url.includes('login'))).toBe(false);
  });
});
