import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { signJwt } from '../server/auth.js';

/**
 * The gallery is only honest if the server, not the page, decides who appears in it.
 * Every case below asks the endpoint a question and answers it from stored rows.
 */
describe('made-with-RALOA gallery consent', () => {
  const suffix = Date.now();
  const makeAccount = (tag: string) => {
    const userId = `usr_sc_${tag}_${suffix}`;
    const profileId = `prf_sc_${tag}_${suffix}`;
    const username = `sc${tag}${suffix}`;
    const now = Date.now();
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(userId, `${username}@raloa.test`, 'hashed', now);
    db.prepare('INSERT INTO profiles (id, user_id, username, display_name, bio, theme_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(profileId, userId, username, `Showcase ${tag}`, `Bio for ${tag}`, 'editorial-stone', now, now);
    const pageId = `page_sc_${tag}_${suffix}`;
    db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at)
      VALUES (?, ?, 'home', 'Home', NULL, 0, 1, 1, ?, ?)`)
      .run(pageId, profileId, now, now);
    db.prepare(`INSERT INTO blocks (id, profile_id, page_id, type, title, url, position, visible, created_at, updated_at)
      VALUES (?, ?, ?, 'link', 'Portfolio', 'https://example.com', 0, 1, ?, ?)`)
      .run(`blk_sc_${tag}_${suffix}`, profileId, pageId, now, now);
    return { userId, profileId, username, pageId, token: signJwt({ userId, email: `${username}@raloa.test`, profileId, username }) };
  };

  let optedIn: ReturnType<typeof makeAccount>;
  let quiet: ReturnType<typeof makeAccount>;

  beforeAll(() => {
    initDatabase();
    optedIn = makeAccount('on');
    quiet = makeAccount('off');
  });

  const toggle = (token: string, body: Record<string, unknown>) =>
    request(app).put('/api/studio/profile/showcase').set('Authorization', `Bearer ${token}`).send(body);

  const flagOf = (profileId: string) =>
    (db.prepare('SELECT showcase_opt_in FROM profiles WHERE id = ?').get(profileId) as { showcase_opt_in: number }).showcase_opt_in;

  const listedUsernames = async () => {
    const response = await request(app).get('/api/showcase');
    expect(response.status).toBe(200);
    return (response.body.profiles as { username: string }[]).map(entry => entry.username);
  };

  it('keeps every profile out of the gallery until its owner opts in', async () => {
    expect(flagOf(quiet.profileId)).toBe(0);
    const listed = await listedUsernames();
    expect(listed).not.toContain(quiet.username);
    expect(listed).not.toContain(optedIn.username);
  });

  it('stores the opt-in on the profile row, not in a browser flag', async () => {
    const response = await toggle(optedIn.token, { optedIn: true });
    expect(response.status).toBe(200);
    expect(response.body.showcaseOptIn).toBe(true);
    expect(flagOf(optedIn.profileId)).toBe(1);
    expect(await listedUsernames()).toContain(optedIn.username);
  });

  it('lets the owner take the same page back out again', async () => {
    await toggle(optedIn.token, { optedIn: true });
    const response = await toggle(optedIn.token, { optedIn: false });
    expect(response.body.showcaseOptIn).toBe(false);
    expect(flagOf(optedIn.profileId)).toBe(0);
    expect(await listedUsernames()).not.toContain(optedIn.username);
    await toggle(optedIn.token, { optedIn: true });
  });

  it('refuses to write another profile with someone else token', async () => {
    await toggle(optedIn.token, { optedIn: false });
    const attempted = await toggle(quiet.token, { optedIn: true, profileId: optedIn.profileId, username: optedIn.username });
    expect(attempted.status).toBe(400);
    expect(flagOf(optedIn.profileId), 'a stranger moved another profile flag').toBe(0);
    expect(flagOf(quiet.profileId), 'a refused request wrote nothing').toBe(0);
    const own = await toggle(quiet.token, { optedIn: true });
    expect(own.status).toBe(200);
    expect(flagOf(quiet.profileId)).toBe(1);
    expect(flagOf(optedIn.profileId)).toBe(0);
    await toggle(quiet.token, { optedIn: false });
  });

  it('requires a session to change consent', async () => {
    const response = await request(app).put('/api/studio/profile/showcase').send({ optedIn: true });
    expect(response.status).toBe(401);
  });

  it('hides an opted-in page that is not published', async () => {
    await toggle(optedIn.token, { optedIn: true });
    db.prepare('UPDATE pages SET published = 0 WHERE id = ?').run(optedIn.pageId);
    expect(await listedUsernames()).not.toContain(optedIn.username);
    db.prepare('UPDATE pages SET published = 1 WHERE id = ?').run(optedIn.pageId);
    expect(await listedUsernames()).toContain(optedIn.username);
  });

  it('publishes nothing on the way in', async () => {
    await toggle(quiet.token, { optedIn: false });
    await toggle(quiet.token, { optedIn: true });
    const page = db.prepare('SELECT published FROM pages WHERE id = ?').get(quiet.pageId) as { published: number };
    expect(page.published).toBe(1);
    await toggle(quiet.token, { optedIn: false });
    db.prepare('UPDATE pages SET published = 0 WHERE id = ?').run(quiet.pageId);
    await toggle(quiet.token, { optedIn: true });
    const after = db.prepare('SELECT published FROM pages WHERE id = ?').get(quiet.pageId) as { published: number };
    expect(after.published).toBe(0);
    expect(await listedUsernames()).not.toContain(quiet.username);
    db.prepare('UPDATE pages SET published = 1 WHERE id = ?').run(quiet.pageId);
    await toggle(quiet.token, { optedIn: false });
  });

  it('sends the public page fields and nothing private', async () => {
    await toggle(optedIn.token, { optedIn: true });
    db.prepare('UPDATE users SET subscription_plan = ? WHERE id = ?').run('pro', optedIn.userId);
    db.prepare('UPDATE profiles SET stripe_customer_id = ?, ga_measurement_id = ?, custom_css = ? WHERE id = ?')
      .run('cus_secret_value', 'G-SECRETID', 'body{display:none}', optedIn.profileId);
    const response = await request(app).get('/api/showcase');
    expect(response.status).toBe(200);
    const entry = (response.body.profiles as any[]).find(item => item.username === optedIn.username);
    expect(entry, 'opted-in profile missing from the gallery').toBeTruthy();
    expect(entry.displayName).toBe(`Showcase on`);
    expect(entry.bio).toBe('Bio for on');
    expect(entry.url).toBe(`/@${optedIn.username}`);
    expect(entry.blocks.length).toBeGreaterThan(0);
    const wire = JSON.stringify(response.body);
    for (const secret of ['raloa.test', 'cus_secret_value', 'G-SECRETID', 'password_hash', 'stripe', 'ga_measurement_id', 'gaMeasurementId']) {
      expect(wire, `gallery payload leaks ${secret}`).not.toContain(secret);
    }
    db.prepare('UPDATE profiles SET stripe_customer_id = NULL, ga_measurement_id = NULL, custom_css = NULL WHERE id = ?').run(optedIn.profileId);
    db.prepare("UPDATE users SET subscription_plan = 'free' WHERE id = ?").run(optedIn.userId);
  });

  it('tells the studio what the server already decided', async () => {
    await toggle(optedIn.token, { optedIn: true });
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${optedIn.token}`);
    expect(studio.status).toBe(200);
    expect(studio.body.showcaseOptIn).toBe(true);
    const other = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${quiet.token}`);
    expect(other.body.showcaseOptIn).toBe(false);
  });

  it('caps how many pages it hands out', async () => {
    const extra = Array.from({ length: 14 }, (_, index) => makeAccount(`cap${index}`));
    for (const account of extra) await toggle(account.token, { optedIn: true });
    const response = await request(app).get('/api/showcase');
    expect(response.body.profiles.length).toBeLessThanOrEqual(12);
    for (const account of extra) {
      db.prepare('DELETE FROM blocks WHERE profile_id = ?').run(account.profileId);
      db.prepare('DELETE FROM pages WHERE profile_id = ?').run(account.profileId);
      db.prepare('DELETE FROM profiles WHERE id = ?').run(account.profileId);
      db.prepare('DELETE FROM users WHERE id = ?').run(account.userId);
    }
  });
});
