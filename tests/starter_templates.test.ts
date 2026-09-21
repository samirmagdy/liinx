import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { app } from '../server/server.js';
import { SITE_TEMPLATES, findSiteTemplate } from '../shared/index.js';

function unique(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

async function creator(prefix: string) {
  const username = unique(prefix).replace(/[^a-z0-9_]/g, '').slice(0, 30);
  const response = await request(app).post('/api/auth/register').send({
    email: `${username}@raloa.test`, password: 'StarterSitePassword2026!', username
  }).expect(201);
  return { token: response.body.token as string, username };
}

function auth(token: string, method: 'get' | 'post' | 'put', path: string) {
  return request(app)[method](path).set('Authorization', `Bearer ${token}`);
}

async function studio(token: string) {
  return (await auth(token, 'get', '/api/studio/profile').expect(200)).body as any;
}

function apply(token: string, templateId: string, body: Record<string, unknown> = {}) {
  return auth(token, 'post', `/api/studio/templates/${templateId}/apply`).send(body);
}

const EDITORIAL = 'tmpl-editorial';

describe('starter sites', () => {
  it('writes a real page tree, not just a colour scheme', async () => {
    const { token } = await creator('start');
    const template = findSiteTemplate(EDITORIAL)!;
    const response = await apply(token, EDITORIAL).expect(200);
    expect(response.body.applied).toMatchObject({ templateId: EDITORIAL, mode: 'append', blocksAdded: template.blocks.length });

    const profile = await studio(token);
    expect(profile.themeId).toBe(template.themeId);
    const slugs = profile.pages.map((page: any) => page.slug);
    expect(slugs).toEqual(expect.arrayContaining(['home', ...(template.pages || []).map(page => page.slug)]));

    const titlesByPage = new Map<string, string[]>();
    for (const page of profile.pages) titlesByPage.set(page.slug, []);
    for (const block of profile.blocks) {
      const page = profile.pages.find((row: any) => row.id === block.pageId);
      titlesByPage.get(page.slug)?.push(block.title);
    }
    for (const block of template.blocks) {
      const slug = block.page || 'home';
      expect(titlesByPage.get(slug), `${block.title} belongs on ${slug}`).toContain(block.title);
    }
  });

  it('applies the template palette by dropping stale custom theme overrides', async () => {
    const { token } = await creator('starttheme');
    await auth(token, 'put', '/api/studio/profile').send({ customTheme: { bgColor: '#111111', textColor: '#eeeeee' } }).expect(200);
    expect((await studio(token)).customTheme).toBeTruthy();

    await apply(token, EDITORIAL).expect(200);
    const profile = await studio(token);
    expect(profile.customTheme).toBeNull();
    expect(profile.themeId).toBe(findSiteTemplate(EDITORIAL)!.themeId);
  });

  it('shows the applied composition to visitors, including the template pages', async () => {
    const { token, username } = await creator('startpub');
    await apply(token, EDITORIAL).expect(200);

    const home = (await request(app).get(`/api/profiles/${username}`).expect(200)).body;
    expect(home.themeId).toBe(findSiteTemplate(EDITORIAL)!.themeId);
    expect(home.blocks.map((block: any) => block.title)).toContain('Book a session');

    const portfolio = (await request(app).get(`/api/profiles/${username}?page=portfolio`).expect(200)).body;
    expect(portfolio.page.slug).toBe('portfolio');
    expect(portfolio.blocks.map((block: any) => block.title)).toContain('Full portfolio');
  });

  it('never sends a first visitor to an invented destination', async () => {
    const { token } = await creator('starturl');
    await apply(token, 'tmpl-dark-sound').expect(200);
    const applied = SITE_TEMPLATES.find(template => template.id === 'tmpl-dark-sound')!;
    const profile = await studio(token);
    const titles = applied.blocks.map(block => block.title);
    for (const block of profile.blocks.filter((row: any) => titles.includes(row.title))) {
      if (block.type !== 'link') continue;
      expect(block.url, `${block.title} should ship without a destination`).toBeFalsy();
    }
  });

  it('keeps an creator\'s own work when appending and removes it only on replace', async () => {
    const { token, username } = await creator('startappend');
    const before = await studio(token);
    const home = before.pages.find((page: any) => page.isHome);
    const ownPage = (await auth(token, 'post', '/api/studio/pages').send({ slug: 'my-shop', title: 'My Shop' }).expect(201)).body.page as any;
    const ownBlock = (await auth(token, 'post', '/api/studio/blocks')
      .send({ pageId: home.id, type: 'link', title: 'My own link', url: 'https://raloa.app' }).expect(201)).body as any;

    await apply(token, EDITORIAL).expect(200);
    const appended = await studio(token);
    expect(appended.pages.map((page: any) => page.slug)).toContain('my-shop');
    expect(appended.blocks.map((block: any) => block.id)).toContain(ownBlock.id);

    await apply(token, 'tmpl-podcast', { mode: 'replace' }).expect(200);
    const replaced = await studio(token);
    expect(replaced.pages.map((page: any) => page.slug)).not.toContain('my-shop');
    expect(replaced.blocks.map((block: any) => block.id)).not.toContain(ownBlock.id);
    expect(replaced.pages.some((page: any) => page.isHome)).toBe(true);
    const podcast = findSiteTemplate('tmpl-podcast')!;
    expect(replaced.blocks.filter((block: any) => podcast.blocks.some(entry => entry.title === block.title))).toHaveLength(podcast.blocks.length);
    expect(replaced.blocks.every((block: any) => replaced.pages.some((page: any) => page.id === block.pageId))).toBe(true);
    expect(before.blocks.length).toBeGreaterThan(0);

    // Catalog array order is the order the visitor sees on the page.
    const publicHome = (await request(app).get(`/api/profiles/${username}`).expect(200)).body;
    expect(publicHome.blocks.map((block: any) => block.title)).toEqual(podcast.blocks.filter(block => !block.page).map(block => block.title));
    const publicEditions = (await request(app).get(`/api/profiles/${username}?page=${podcast.pages![0].slug}`).expect(200)).body;
    expect(publicEditions.blocks.map((block: any) => block.title)).toEqual(podcast.blocks.filter(block => block.page === podcast.pages![0].slug).map(block => block.title));
  });

  it('reuses a page whose slug already exists instead of failing on the unique slug', async () => {
    const { token } = await creator('starttwice');
    await apply(token, EDITORIAL).expect(200);
    const first = await studio(token);
    const second = await apply(token, EDITORIAL).expect(200);
    expect(second.body.applied.pagesAdded).toBe(0);

    const after = await studio(token);
    expect(after.pages.map((page: any) => page.slug).sort()).toEqual(first.pages.map((page: any) => page.slug).sort());
    expect(after.blocks.length).toBe(first.blocks.length + findSiteTemplate(EDITORIAL)!.blocks.length);
    expect(after.blocks.map((block: any) => block.id)).toHaveLength(new Set(after.blocks.map((block: any) => block.id)).size);
  });

  it('fills identity copy on a blank account and leaves a written bio alone', async () => {
    const { token } = await creator('startbio');
    await auth(token, 'put', '/api/studio/profile').send({ bio: 'My own words' }).expect(200);
    await apply(token, EDITORIAL).expect(200);
    expect((await studio(token)).bio).toBe('My own words');

    const fresh = await creator('startbio2');
    // Registration pre-writes a placeholder bio, so this models the account that cleared it.
    await auth(fresh.token, 'put', '/api/studio/profile').send({ bio: '' }).expect(200);
    await apply(fresh.token, EDITORIAL).expect(200);
    expect((await studio(fresh.token)).bio).toBe(findSiteTemplate(EDITORIAL)!.profile?.bio);
  });

  it('rejects unknown starter sites, stray body keys, and anonymous callers', async () => {
    const { token } = await creator('startguards');
    expect((await apply(token, 'tmpl-does-not-exist').expect(400)).body.error).toMatch(/starter site/i);
    expect((await apply(token, EDITORIAL, { mode: 'overwrite' }).expect(400)).body.error).toBeTruthy();
    expect((await apply(token, EDITORIAL, { themeId: 'obsidian-noir' }).expect(400)).body.error).toBeTruthy();
    await request(app).post(`/api/studio/templates/${EDITORIAL}/apply`).send({}).expect(401);

    const untouched = await studio(token);
    expect(untouched.blocks.some((block: any) => block.title === 'Book a session')).toBe(false);
  });
});
