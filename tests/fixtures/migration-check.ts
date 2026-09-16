import fs from 'node:fs';
import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_PATH;
if (!dbPath) throw new Error('DATABASE_PATH is required');

if (process.env.MIGRATION_MODE === 'legacy') {
  const legacy = new Database(dbPath);
  legacy.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE profiles (id TEXT PRIMARY KEY, user_id TEXT, username TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, bio TEXT, avatar_url TEXT, category TEXT, verified INTEGER, theme_id TEXT, socials_json TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE pages (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, slug TEXT NOT NULL, title TEXT NOT NULL, description TEXT, sort_order INTEGER NOT NULL DEFAULT 0, is_home INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE blocks (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, url TEXT, subtitle TEXT, icon TEXT, badge TEXT, highlighted INTEGER DEFAULT 0, position INTEGER NOT NULL, extra_json TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  `);
  const now = Date.now();
  legacy.prepare('INSERT INTO users VALUES (?, ?, ?, ?)').run('u1', 'legacy@example.test', 'hash', now);
  legacy.prepare('INSERT INTO profiles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run('p1', 'u1', 'legacy-one', 'Legacy One', 'preserve me', null, 'Creator', 0, 'editorial-stone', '[]', now, now);
  legacy.prepare('INSERT INTO profiles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run('p2', 'u1', 'legacy-two', 'Legacy Two', '', null, 'Creator', 0, 'editorial-stone', '[]', now, now);
  const page = legacy.prepare('INSERT INTO pages VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  page.run('h1', 'p1', 'home', 'Home', null, 0, 1, 1, now, now);
  page.run('h2', 'p1', 'legacy-home', 'Duplicate Home', null, 1, 1, 1, now + 1, now + 1);
  page.run('p2-home', 'p2', 'home', 'Home', null, 0, 1, 1, now, now);
  const block = legacy.prepare('INSERT INTO blocks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  block.run('b1', 'p1', 'link', 'Keep me', 'https://example.com', null, null, null, 0, 9, null, now, now);
  block.run('b2', 'p1', 'link', 'Orphan page', 'https://example.com/orphan', null, null, null, 0, 2, null, now, now);
  block.run('b3', 'p1', 'link', 'Cross profile', 'https://example.com/cross', null, null, null, 0, 1, null, now, now);
  legacy.close();
  fs.copyFileSync(dbPath, `${dbPath}.snapshot`);
}

const { initDatabase, db } = await import('../../server/db.js');
initDatabase();
initDatabase();

const homes = db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').all('p1') as Array<{ id: string }>;
const blocks = db.prepare('SELECT id, page_id, position FROM blocks WHERE profile_id = ? ORDER BY position').all('p1') as Array<{ id: string; page_id: string; position: number }>;
const migration = db.prepare("SELECT COUNT(*) as count FROM schema_migrations WHERE version = '0002_content_ownership_invariants'").get() as { count: number };
const uniqueSlug = db.prepare('SELECT COUNT(*) as count FROM pages WHERE profile_id = ? AND slug = ?').get('p1', 'home') as { count: number };
let duplicateHomeRejected = false;
if (process.env.MIGRATION_MODE === 'legacy') {
  try { db.prepare('INSERT INTO pages (id, profile_id, slug, title, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('h3', 'p1', 'home-2', 'Second home', 2, 1, 1, Date.now(), Date.now()); } catch { duplicateHomeRejected = true; }
}
const valid = process.env.MIGRATION_MODE === 'fresh'
  ? homes.length === 0 && blocks.length === 0
  : homes.length === 1 && uniqueSlug.count === 1 && blocks.length === 3 && blocks.every(block => block.page_id === homes[0].id && block.position === blocks.indexOf(block));
if (!valid || migration.count !== 1) {
  throw new Error('migration invariants failed');
}
if (process.env.MIGRATION_MODE === 'legacy' && !fs.existsSync(`${dbPath}.snapshot`)) throw new Error('legacy snapshot missing');
if (process.env.MIGRATION_MODE === 'legacy' && !duplicateHomeRejected) throw new Error('duplicate home was accepted');
console.log(JSON.stringify({ homes: homes.length, blocks: blocks.length, migrationRows: migration.count, snapshot: fs.existsSync(`${dbPath}.snapshot`), duplicateHomeRejected }));
db.close();
