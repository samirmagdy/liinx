import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

describe('profile duplication', () => {
  beforeAll(() => initDatabase());

  it('copies pages, design, blocks, and internal references without private state', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const registration = await request(app).post('/api/auth/register').send({
      email: `duplicate-${unique}@liinx.test`,
      password: 'ProfileDuplicationPassword2026!',
      username: `duplicate${unique}`.slice(0, 30)
    }).expect(201);
    const sourceId = registration.body.profileId as string;
    db.prepare("UPDATE users SET subscription_plan = 'studio' WHERE id = (SELECT user_id FROM profiles WHERE id = ?)").run(sourceId);
    const token = registration.body.token as string;
    const sourceUsername = registration.body.user.username as string;
    const now = Date.now();

    db.prepare(`UPDATE profiles SET plan = 'studio', bio = ?, theme_id = ?, custom_theme_json = ?, socials_json = ?, custom_css = ?, custom_font_url = ?, footer_logo_url = ?, background_media_url = ?, background_media_type = ?, share_title = ?, share_description = ?, share_image_url = ?, stripe_customer_id = ?, stripe_subscription_id = ?, ga_measurement_id = ?, meta_pixel_id = ?, custom_domain = ?, custom_domain_verified = 1, page_redirect_url = ? WHERE id = ?`).run(
      'Source bio', 'noir', JSON.stringify({ accentColor: '#123456' }), JSON.stringify([{ platform: 'email', url: 'mailto:source@example.test' }]), '.source { color: red; }', 'https://fonts.example.test/source.css', 'https://example.test/footer.png', 'https://example.test/background.jpg', 'image', 'Source share', 'Source description', 'https://example.test/share.png', 'cus_private', 'sub_private', 'G-PRIVATE', '123456', `${sourceUsername}.example.test`, 'https://example.test/redirect', sourceId
    );

    const sourceProfile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(sourceId) as any;
    const home = db.prepare('SELECT * FROM pages WHERE profile_id = ? AND is_home = 1').get(sourceId) as any;
    const aboutId = `page_dup_about_${unique}`;
    db.prepare('INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, ?)').run(aboutId, sourceId, `about-${unique.replace('_', '-')}`, 'About', 'About page', 1, now, now);
    const blockRows = [
      ['link', 'Website', '/r/placeholder', null],
      ['rich_text', 'Story', null, JSON.stringify({ body: 'Source story' })],
      ['image', 'Portrait', null, JSON.stringify({ imageUrl: 'https://example.test/image.jpg' })],
      ['content_gate', 'Private', null, JSON.stringify({ body: 'Secret body', password: 'do-not-copy', passwordHash: 'hash-do-not-copy' })]
    ];
    const sourceBlockIds: string[] = [];
    for (const [type, title, url, extra] of blockRows) {
      const id = `blk_dup_${unique}_${sourceBlockIds.length}`;
      sourceBlockIds.push(id);
      db.prepare('INSERT INTO blocks (id, profile_id, type, title, url, position, page_id, extra_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, sourceId, type, title, url, sourceBlockIds.length - 1, aboutId, extra, now, now);
    }
    db.prepare('UPDATE blocks SET url = ? WHERE id = ?').run(`/r/${sourceBlockIds[0]}`, sourceBlockIds[0]);
    db.prepare('INSERT INTO form_submissions (id, profile_id, block_id, fields_json, created_at) VALUES (?, ?, ?, ?, ?)').run(`submission_${unique}`, sourceId, sourceBlockIds[1], '{}', now);
    db.prepare('INSERT INTO instagram_sync (id, profile_id, access_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(`sync_${unique}`, sourceId, 'secret-token', now, now);

    db.exec(`CREATE TRIGGER duplicate_failure_probe BEFORE INSERT ON blocks WHEN NEW.profile_id != '${sourceId}' BEGIN SELECT RAISE(ABORT, 'forced duplication failure'); END`);
    await request(app).post('/api/studio/profiles').set('Authorization', `Bearer ${token}`).send({
      username: `failedcopy${unique}`.slice(0, 30), displayName: 'Should Roll Back', duplicateProfileId: sourceId
    }).expect(500);
    expect(db.prepare('SELECT COUNT(*) as count FROM profiles WHERE username = ?').get(`failedcopy${unique}`.slice(0, 30))).toEqual({ count: 0 });
    db.exec('DROP TRIGGER duplicate_failure_probe');

    const duplicate = await request(app).post('/api/studio/profiles').set('Authorization', `Bearer ${token}`).send({
      username: `copy${unique}`.slice(0, 30), displayName: 'Copied Source', duplicateProfileId: sourceId
    }).expect(201);
    const copiedId = duplicate.body.profile.id as string;
    expect(copiedId).not.toBe(sourceId);

    const copied = db.prepare('SELECT * FROM profiles WHERE id = ?').get(copiedId) as any;
    expect(copied.bio).toBe(sourceProfile.bio);
    expect(copied.custom_theme_json).toBe(sourceProfile.custom_theme_json);
    expect(copied.socials_json).toBe(sourceProfile.socials_json);
    expect(copied.custom_domain).toBeNull();
    expect(copied.stripe_customer_id).toBeNull();
    expect(copied.stripe_subscription_id).toBeNull();
    expect(copied.ga_measurement_id).toBeNull();
    expect(copied.meta_pixel_id).toBeNull();
    expect(copied.page_redirect_url).toBeNull();
    expect(db.prepare('SELECT COUNT(*) as count FROM form_submissions WHERE profile_id = ?').get(copiedId)).toEqual({ count: 0 });
    expect(db.prepare('SELECT COUNT(*) as count FROM instagram_sync WHERE profile_id = ?').get(copiedId)).toEqual({ count: 0 });

    const copiedPages = db.prepare('SELECT * FROM pages WHERE profile_id = ? ORDER BY sort_order').all(copiedId) as any[];
    expect(copiedPages.map(page => page.id)).not.toEqual(expect.arrayContaining([home.id, aboutId]));
    expect(copiedPages.map(page => [page.slug, page.title, page.description, page.published])).toEqual([
      ['home', home.title, home.description, 1],
      [`about-${unique.replace('_', '-')}`, 'About', 'About page', 1]
    ]);
    const copiedBlocks = db.prepare('SELECT * FROM blocks WHERE profile_id = ? AND page_id = ? ORDER BY position').all(copiedId, copiedPages[1].id) as any[];
    expect(copiedBlocks).toHaveLength(blockRows.length);
    expect(copiedBlocks.every(block => !sourceBlockIds.includes(block.id))).toBe(true);
    expect(copiedBlocks.find(block => block.type === 'link').url).toMatch(new RegExp(`^/r/${copiedBlocks.find(block => block.type === 'link').id}$`));
    const copiedGate = copiedBlocks.find(block => block.type === 'content_gate');
    expect(copiedGate.extra_json).not.toContain('do-not-copy');
    expect(copiedGate.extra_json).not.toContain('hash-do-not-copy');

    await request(app).put(`/api/studio/blocks/${copiedBlocks[0].id}`).set('Authorization', `Bearer ${duplicate.body.token}`).send({ title: 'Independent copy' }).expect(200);
    expect((db.prepare('SELECT title FROM blocks WHERE id = ?').get(sourceBlockIds[0]) as any).title).toBe('Website');
  });
});
