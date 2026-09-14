import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.resolve(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'liinx.db');
export const db = new Database(dbPath);

// Enable WAL mode, concurrency busy timeout, and memory cache tuning
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000'); // 64MB memory page cache

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      bio TEXT,
      avatar_url TEXT,
      category TEXT DEFAULT 'Creator',
      verified INTEGER DEFAULT 0,
      theme_id TEXT DEFAULT 'editorial-stone',
      plan TEXT DEFAULT 'free',
      custom_theme_json TEXT,
      socials_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      subtitle TEXT,
      icon TEXT,
      badge TEXT,
      highlighted INTEGER DEFAULT 0,
      position INTEGER NOT NULL,
      extra_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_blocks_profile_pos ON blocks(profile_id, position);
    CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

    CREATE TABLE IF NOT EXISTS link_clicks (
      id TEXT PRIMARY KEY,
      block_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      target_url TEXT NOT NULL,
      ip_hash TEXT,
      referrer TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_clicks_profile_time ON link_clicks(profile_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_clicks_block ON link_clicks(block_id);

    CREATE TABLE IF NOT EXISTS profile_views (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      ip_hash TEXT,
      referrer TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_views_profile_time ON profile_views(profile_id, created_at);

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      block_id TEXT,
      email TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_unique ON newsletter_subscribers(profile_id, email);

    CREATE TABLE IF NOT EXISTS instagram_sync (
      id TEXT PRIMARY KEY,
      profile_id TEXT UNIQUE NOT NULL,
      instagram_user_id TEXT,
      instagram_username TEXT,
      access_token TEXT NOT NULL,
      token_type TEXT DEFAULT 'bearer',
      token_expires_at INTEGER,
      auto_sync_enabled INTEGER DEFAULT 1,
      last_synced_at INTEGER,
      last_media_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_insta_profile ON instagram_sync(profile_id);
  `);

  try {
    db.exec("ALTER TABLE profiles ADD COLUMN plan TEXT DEFAULT 'free'");
  } catch (e) {
    // Column already exists
  }

  seedDefaultData();
}

function seedDefaultData() {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) return;

  const now = Date.now();
  const passwordHash = bcrypt.hashSync('password123', 10);

  // Default Demo User
  const demoUserId = 'usr_demo_01';
  db.prepare(`
    INSERT INTO users (id, email, password_hash, created_at)
    VALUES (?, ?, ?, ?)
  `).run(demoUserId, 'demo@liinx.co', passwordHash, now);

  // Elena Profile
  const elenaProfileId = 'prf_elena';
  const elenaSocials = JSON.stringify([
    { platform: 'instagram', url: 'https://instagram.com' },
    { platform: 'twitter', url: 'https://x.com' },
    { platform: 'youtube', url: 'https://youtube.com' },
    { platform: 'email', url: 'mailto:studio@elena.design' }
  ]);

  db.prepare(`
    INSERT INTO profiles (
      id, user_id, username, display_name, bio, avatar_url, category, verified, theme_id, socials_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    elenaProfileId,
    demoUserId,
    'elenarostova',
    'Elena Rostova',
    'Art Director & Architectural Photographer based in Berlin. Exploring light, concrete, and minimal spaces.',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    'Design & Art',
    1,
    'editorial-stone',
    elenaSocials,
    now,
    now
  );

  const elenaBlocks = [
    {
      id: 'blk_elena_1',
      profile_id: elenaProfileId,
      type: 'link',
      title: 'Monograph: Shadows of Brutalism',
      url: 'https://amazon.com',
      subtitle: 'Hardcover edition published by Steidl, 2025',
      badge: 'NEW',
      highlighted: 1,
      position: 0,
      extra_json: null
    },
    {
      id: 'blk_elena_2',
      profile_id: elenaProfileId,
      type: 'link',
      title: 'Limited Fine Art Prints',
      url: 'https://shop.elena.design',
      subtitle: 'Archival pigment prints on Hahnemühle paper',
      badge: 'SHOP',
      highlighted: 0,
      position: 1,
      extra_json: null
    },
    {
      id: 'blk_elena_3',
      profile_id: elenaProfileId,
      type: 'header',
      title: 'Selected Curations',
      url: null,
      subtitle: 'Projects & Publications',
      badge: null,
      highlighted: 0,
      position: 2,
      extra_json: null
    },
    {
      id: 'blk_elena_4',
      profile_id: elenaProfileId,
      type: 'newsletter',
      title: 'Monthly Visual Dispatch',
      url: null,
      subtitle: null,
      badge: null,
      highlighted: 0,
      position: 3,
      extra_json: JSON.stringify({
        description: 'Short essays on architectural composition, lighting techniques, and private gallery open calls.',
        buttonText: 'Join 14,000+ Readers'
      })
    },
    {
      id: 'blk_elena_5',
      profile_id: elenaProfileId,
      type: 'video',
      title: 'Behind the Scenes: Bauhaus Archive',
      url: 'https://youtube.com',
      subtitle: null,
      badge: null,
      highlighted: 0,
      position: 4,
      extra_json: JSON.stringify({
        videoUrl: 'https://youtube.com',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop',
        platform: 'youtube'
      })
    }
  ];

  const insertBlock = db.prepare(`
    INSERT INTO blocks (
      id, profile_id, type, title, url, subtitle, badge, highlighted, position, extra_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const blk of elenaBlocks) {
    insertBlock.run(
      blk.id,
      blk.profile_id,
      blk.type,
      blk.title,
      blk.url,
      blk.subtitle,
      blk.badge,
      blk.highlighted,
      blk.position,
      blk.extra_json,
      now,
      now
    );
  }

  // Alex Rivera Profile
  const alexProfileId = 'prf_alex';
  const alexSocials = JSON.stringify([
    { platform: 'spotify', url: 'https://open.spotify.com' },
    { platform: 'youtube', url: 'https://youtube.com' },
    { platform: 'instagram', url: 'https://instagram.com' }
  ]);

  db.prepare(`
    INSERT INTO profiles (
      id, user_id, username, display_name, bio, avatar_url, category, verified, theme_id, socials_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    alexProfileId,
    null,
    'alexrivera',
    'Alex Rivera',
    'Electronic producer & modular synthesizer sound designer. New ambient record "Subterfuge" out now on Ghostly Intl.',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop',
    'Musicians',
    1,
    'obsidian-noir',
    alexSocials,
    now,
    now
  );

  const alexBlocks = [
    {
      id: 'blk_alex_1',
      profile_id: alexProfileId,
      type: 'audio',
      title: 'Subterfuge (Original Mix)',
      url: 'https://spotify.com',
      subtitle: null,
      badge: 'OUT NOW',
      highlighted: 1,
      position: 0,
      extra_json: JSON.stringify({
        artist: 'Alex Rivera • Ghostly International',
        coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
        audioUrl: 'https://spotify.com',
        platform: 'spotify'
      })
    },
    {
      id: 'blk_alex_2',
      profile_id: alexProfileId,
      type: 'link',
      title: 'European Tour Tickets',
      url: 'https://residentadvisor.net',
      subtitle: 'London, Berlin, Amsterdam, Paris',
      badge: 'SELLING FAST',
      highlighted: 0,
      position: 1,
      extra_json: null
    },
    {
      id: 'blk_alex_3',
      profile_id: alexProfileId,
      type: 'link',
      title: 'Custom Eurorack Sample Pack Vol. 4',
      url: 'https://gumroad.com',
      subtitle: '2.4GB of analog modular percussion & bass loops',
      badge: 'PRO',
      highlighted: 0,
      position: 2,
      extra_json: null
    }
  ];

  for (const blk of alexBlocks) {
    insertBlock.run(
      blk.id,
      blk.profile_id,
      blk.type,
      blk.title,
      blk.url,
      blk.subtitle,
      blk.badge,
      blk.highlighted,
      blk.position,
      blk.extra_json,
      now,
      now
    );
  }

  // Seed realistic historical views and clicks for analytics demonstration
  const insertView = db.prepare(`
    INSERT INTO profile_views (id, profile_id, ip_hash, referrer, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertClick = db.prepare(`
    INSERT INTO link_clicks (id, block_id, profile_id, target_url, ip_hash, referrer, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const dayMs = 24 * 60 * 60 * 1000;
  for (let day = 6; day >= 0; day--) {
    const dayTimestamp = now - day * dayMs;
    const viewsCount = 15 + Math.floor(Math.random() * 20);
    const clicksCount = Math.floor(viewsCount * 0.35);

    for (let v = 0; v < viewsCount; v++) {
      insertView.run(
        `vw_${day}_${v}`,
        elenaProfileId,
        'hash_' + (v % 5),
        v % 2 === 0 ? 'https://instagram.com' : 'https://x.com',
        'Mozilla/5.0 (iPhone)',
        dayTimestamp + v * 60000
      );
    }

    for (let c = 0; c < clicksCount; c++) {
      const blk = elenaBlocks[c % 2];
      insertClick.run(
        `clk_${day}_${c}`,
        blk.id,
        elenaProfileId,
        blk.url || 'https://example.com',
        'hash_' + (c % 5),
        'https://instagram.com',
        'Mozilla/5.0 (iPhone)',
        dayTimestamp + c * 120000
      );
    }
  }
}
