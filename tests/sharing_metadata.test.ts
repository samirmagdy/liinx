import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, renderProfileShellHtml } from '../server/server.js';

describe('server-rendered sharing metadata', () => {
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  let token = '';
  let username = '';
  let hiddenSlug = '';
  let publishedSlug = '';

  beforeAll(async () => {
    const registered = await request(app).post('/api/auth/register').send({
      email: `metadata-${unique}@liinx.test`, password: 'MetadataPassword2026!', username: `metadata${unique}`.slice(0, 30)
    }).expect(201);
    token = registered.body.token;
    username = registered.body.user.username;
    publishedSlug = `about-${unique}`.replace(/_/g, '-');
    hiddenSlug = `hidden-${unique}`.replace(/_/g, '-');
    await request(app).post('/api/studio/pages').set('Authorization', `Bearer ${token}`).send({ title: 'About “quoted”', slug: publishedSlug, description: 'Public description', published: true }).expect(201);
    await request(app).post('/api/studio/pages').set('Authorization', `Bearer ${token}`).send({ title: 'Private', slug: hiddenSlug, description: 'Do not index', published: false }).expect(201);
  });

  it('renders escaped per-page title, description, canonical, Twitter, and structured data without image defaults', () => {
    const source = '<title>Default</title><meta name="description" content="Default" /><meta name="robots" content="index, follow" /><link rel="canonical" href="https://default.test/" /><meta property="og:url" content="https://default.test/" /><meta property="og:title" content="Default" /><meta property="og:description" content="Default" /><meta property="og:image" content="https://default.test/image.png" /><meta property="og:image:secure_url" content="https://default.test/image.png" /><meta property="og:image:alt" content="Default" /><meta name="twitter:title" content="Default" /><meta name="twitter:description" content="Default" /><meta name="twitter:image" content="https://default.test/image.png" /><script type="application/ld+json">{"generic":true}</script>';
    const html = renderProfileShellHtml(source, {
      username: 'quoted', display_name: 'A <Creator> "Name"', bio: 'Bio', share_title: 'Profile fallback', share_description: 'Fallback', share_image_url: null
    }, 'https://configured.example/@quoted/about', { title: 'Page "Title" </title>', description: 'Description & details' }, undefined, [
      { type: 'link', title: 'Portfolio <work>', url: 'https://example.test/work?x=1&y=2', subtitle: 'Selected projects' },
      { type: 'text', title: 'About', body: 'A creator with <special> interests.' }
    ]);

    expect(html).toContain('<title>Page &quot;Title&quot; &lt;/title&gt;</title>');
    expect(html).toContain('content="Description &amp; details"');
    expect(html).toContain('href="https://configured.example/@quoted/about"');
    expect(html).toContain('name="twitter:title" content="Page &quot;Title&quot; &lt;/title&gt;"');
    expect(html).not.toContain('default.test/image.png');
    expect(html).toContain('"@type":"ProfilePage"');
    expect(html).toContain('\\u003c');
    expect(html).not.toContain('{"generic":true}');
    expect(html).toContain('<section id="profile-crawl-content"');
    expect(html).toContain('<h1>A &lt;Creator&gt; &quot;Name&quot;</h1>');
    expect(html).toContain('href="https://example.test/work?x=1&amp;y=2"');
    expect(html).toContain('Portfolio &lt;work&gt;');
    expect(html).toContain('<h2>About</h2><p>A creator with &lt;special&gt; interests.</p>');
  });

  it('injects CSP nonce into head and ld+json script tags when provided', () => {
    const source = '<!doctype html><html><head><title>Test</title><script type="application/ld+json">{}</script><script src="/main.js"></script></head><body></body></html>';
    const html = renderProfileShellHtml(source, {
      username: 'quoted', display_name: 'Creator', bio: 'Bio'
    }, 'https://configured.example/@quoted', undefined, 'testNonce12345');

    expect(html).toContain('<script nonce="testNonce12345">window.__CSP_NONCE__="testNonce12345";</script>');
    expect(html).toContain('<script type="application/ld+json" nonce="testNonce12345">');
    expect(html).toContain('<script nonce="testNonce12345" src="/main.js"></script>');
  });

  it('marks fictional demo pages noindex and labels their sample content', () => {
    const source = '<title>Default</title><meta name="description" content="Default" /><meta name="robots" content="index, follow" /><link rel="canonical" href="https://default.test/" /><meta property="og:url" content="https://default.test/" /><meta property="og:title" content="Default" /><meta property="og:description" content="Default" /><script type="application/ld+json">{}</script><body></body>';
    const html = renderProfileShellHtml(source, { username: 'sample', display_name: 'Sample creator', bio: 'Sample bio' }, 'https://liinx.app/@sample', undefined, undefined, [], true);
    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).toContain('Fictional sample profile. Names, metrics, and links are demonstration content, not customer data.');
  });

  it('sitemap includes published pages only and unknown profiles are not successful', async () => {
    const sitemap = await request(app).get('/sitemap.xml').expect(200);
    expect(sitemap.text).toContain(`/@${username}/${publishedSlug}`);
    expect(sitemap.text).toContain(`/@${username}`);
    expect(sitemap.text).not.toContain(hiddenSlug);
    await request(app).get(`/api/profiles/${username}?page=${hiddenSlug}`).expect(404);
    await request(app).get('/api/profiles/unknown-metadata-profile').expect(404);
  });
});
