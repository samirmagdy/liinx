import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { encryptSecret } from './secretStore.js';

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
      session_version INTEGER NOT NULL DEFAULT 1,
      email_verified_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS account_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      purpose TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_account_tokens_lookup ON account_tokens(user_id, purpose, expires_at);

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
      billing_event_created_at INTEGER,
      hide_branding INTEGER DEFAULT 0,
      ga_measurement_id TEXT,
      meta_pixel_id TEXT,
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
      start_at INTEGER,
      end_at INTEGER,
      extra_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_home INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      UNIQUE (profile_id, slug)
    );

    CREATE INDEX IF NOT EXISTS idx_blocks_profile_pos ON blocks(profile_id, position);
    CREATE INDEX IF NOT EXISTS idx_pages_profile_order ON pages(profile_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

    CREATE TABLE IF NOT EXISTS link_clicks (
      id TEXT PRIMARY KEY,
      block_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      target_url TEXT NOT NULL,
      ip_hash TEXT,
      referrer TEXT,
      user_agent TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      page_id TEXT,
      dedupe_key TEXT,
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
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      page_id TEXT,
      dedupe_key TEXT,
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
      token_issued_at INTEGER,
      auto_sync_enabled INTEGER DEFAULT 1,
      last_synced_at INTEGER,
      last_media_id TEXT,
      last_sync_error TEXT,
      last_sync_attempt_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_insta_profile ON instagram_sync(profile_id);

    CREATE TABLE IF NOT EXISTS instagram_oauth_states (
      state_hash TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_instagram_oauth_expiry ON instagram_oauth_states(expires_at);

    CREATE TABLE IF NOT EXISTS uploaded_files (
      path TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_uploaded_files_owner ON uploaded_files(owner_user_id);
  `);

  try {
    db.exec("ALTER TABLE profiles ADD COLUMN plan TEXT DEFAULT 'free'");
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec("ALTER TABLE profiles ADD COLUMN hide_branding INTEGER DEFAULT 0");
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec("ALTER TABLE blocks ADD COLUMN start_at INTEGER");
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec("ALTER TABLE blocks ADD COLUMN end_at INTEGER");
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec("ALTER TABLE blocks ADD COLUMN page_id TEXT");
  } catch (e) {}
  db.exec("CREATE INDEX IF NOT EXISTS idx_blocks_page_pos ON blocks(page_id, position)");

  try {
    db.exec("ALTER TABLE link_clicks ADD COLUMN utm_source TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE link_clicks ADD COLUMN utm_medium TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE link_clicks ADD COLUMN utm_campaign TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE profile_views ADD COLUMN utm_source TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE profile_views ADD COLUMN utm_medium TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE profile_views ADD COLUMN utm_campaign TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE link_clicks ADD COLUMN page_id TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE link_clicks ADD COLUMN dedupe_key TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE profile_views ADD COLUMN page_id TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE profile_views ADD COLUMN dedupe_key TEXT");
  } catch (e) {}
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_clicks_dedupe ON link_clicks(dedupe_key) WHERE dedupe_key IS NOT NULL');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_views_dedupe ON profile_views(dedupe_key) WHERE dedupe_key IS NOT NULL');

  try {
    db.exec("ALTER TABLE profiles ADD COLUMN ga_measurement_id TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE profiles ADD COLUMN meta_pixel_id TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE profiles ADD COLUMN custom_domain TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE profiles ADD COLUMN custom_css TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE profiles ADD COLUMN custom_font_url TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE profiles ADD COLUMN custom_domain_verified INTEGER DEFAULT 0");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE profiles ADD COLUMN stripe_subscription_id TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE profiles ADD COLUMN billing_event_created_at INTEGER");
  } catch (e) {}

  for (const column of [
    'share_title TEXT', 'share_description TEXT', 'share_image_url TEXT',
    'footer_logo_url TEXT', 'footer_logo_link TEXT', 'footer_logo_alt TEXT', 'background_media_url TEXT', 'background_media_type TEXT',
    'page_redirect_url TEXT', 'page_redirect_until INTEGER'
  ]) {
    try { db.exec(`ALTER TABLE profiles ADD COLUMN ${column}`); } catch (e) {}
  }

  try {
    db.exec("ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE users ADD COLUMN email_verified_at INTEGER");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE newsletter_subscribers ADD COLUMN unsubscribe_token_hash TEXT");
  } catch (e) {}

  for (const column of [
    'token_issued_at INTEGER',
    'last_sync_error TEXT',
    'last_sync_attempt_at INTEGER'
  ]) {
    try { db.exec(`ALTER TABLE instagram_sync ADD COLUMN ${column}`); } catch (e) {}
  }

  // Encrypt legacy Instagram tokens once the integration key is available.
  // Existing v1 ciphertext is left untouched; plaintext remains readable only
  // long enough for this migration to protect it at rest.
  try {
    const legacyTokens = db.prepare("SELECT id, access_token FROM instagram_sync WHERE access_token NOT LIKE 'v1:%'").all() as Array<{ id: string; access_token: string }>;
    const updateToken = db.prepare('UPDATE instagram_sync SET access_token = ?, updated_at = ? WHERE id = ?');
    const now = Date.now();
    const migrateTokens = db.transaction(() => {
      for (const row of legacyTokens) updateToken.run(encryptSecret(row.access_token), now, row.id);
    });
    migrateTokens();
  } catch (e) {
    if (process.env.NODE_ENV === 'production') console.error('Instagram token migration skipped:', e);
  }

  try {
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_custom_domain ON profiles(custom_domain)");
  } catch (e) {}

  // Protect any content-gate blocks created before password hashing was added.
  try {
    const gates = db.prepare("SELECT id, extra_json FROM blocks WHERE type = 'content_gate' AND extra_json IS NOT NULL").all() as Array<{ id: string; extra_json: string }>;
    const updateGate = db.prepare('UPDATE blocks SET extra_json = ?, updated_at = ? WHERE id = ?');
    for (const gate of gates) {
      const extra = JSON.parse(gate.extra_json) as Record<string, unknown>;
      if (typeof extra.password === 'string' && extra.password && !extra.passwordHash) {
        extra.passwordHash = bcrypt.hashSync(extra.password, 12);
        delete extra.password;
        updateGate.run(JSON.stringify(extra), Date.now(), gate.id);
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'production') console.error('Content gate migration failed:', e);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      prefix TEXT NOT NULL,
      name TEXT NOT NULL,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
    CREATE INDEX IF NOT EXISTS idx_api_keys_profile ON api_keys(profile_id);

    CREATE TABLE IF NOT EXISTS api_idempotency_keys (
      request_key TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      response_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (request_key, profile_id),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_api_idempotency_created ON api_idempotency_keys(created_at);

    CREATE TABLE IF NOT EXISTS processed_webhook_events (
      event_id TEXT PRIMARY KEY,
      processed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS newsletter_consents (
      subscriber_id TEXT PRIMARY KEY,
      consented_at INTEGER NOT NULL,
      FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rate_limit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bucket_key TEXT NOT NULL,
      occurred_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rate_limit_bucket_time ON rate_limit_events(bucket_key, occurred_at);

    CREATE TABLE IF NOT EXISTS form_submissions (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      block_id TEXT,
      fields_json TEXT NOT NULL,
      submission_key TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_form_submissions_profile ON form_submissions(profile_id, created_at);
  `);
  try { db.exec('ALTER TABLE api_keys ADD COLUMN expires_at INTEGER'); } catch {}
  db.prepare('UPDATE api_keys SET expires_at = created_at + ? WHERE expires_at IS NULL').run(90 * 24 * 60 * 60 * 1000);
  try { db.exec('ALTER TABLE form_submissions ADD COLUMN submission_key TEXT'); } catch {}
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_form_submissions_idempotency ON form_submissions(block_id, submission_key) WHERE submission_key IS NOT NULL');

  // Every profile has a stable home page. Existing blocks remain visible by
  // assigning them to that page during migration; this is idempotent.
  const ensureHomePages = db.transaction(() => {
    const profiles = db.prepare('SELECT id, display_name FROM profiles').all() as Array<{ id: string; display_name: string }>;
    const findHomes = db.prepare('SELECT id, slug FROM pages WHERE profile_id = ? AND is_home = 1 ORDER BY sort_order ASC, created_at ASC, id ASC');
    const findLegacyHome = db.prepare("SELECT id FROM pages WHERE profile_id = ? AND slug = 'home' ORDER BY sort_order ASC, created_at ASC, id ASC LIMIT 1");
    const insertPage = db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, 'home', ?, NULL, 0, 1, 1, ?, ?)`);
    const assignBlocks = db.prepare('UPDATE blocks SET page_id = ? WHERE profile_id = ? AND page_id IS NULL');
    const moveBlocks = db.prepare('UPDATE blocks SET page_id = ? WHERE profile_id = ? AND page_id = ?');
    const deletePage = db.prepare('DELETE FROM pages WHERE id = ? AND profile_id = ?');
    const promotePage = db.prepare("UPDATE pages SET is_home = 1, sort_order = 0, published = 1, updated_at = ? WHERE id = ? AND profile_id = ?");
    const now = Date.now();
    for (const profile of profiles) {
      const homes = findHomes.all(profile.id) as Array<{ id: string; slug: string }>;
      let home = homes[0];
      if (!home) {
        const legacyHome = findLegacyHome.get(profile.id) as { id: string } | undefined;
        if (legacyHome) {
          promotePage.run(now, legacyHome.id, profile.id);
          home = { id: legacyHome.id, slug: 'home' };
        }
      }
      if (!home) {
        const id = `page_home_${profile.id}`;
        insertPage.run(id, profile.id, profile.display_name || 'Home', now, now);
        home = { id, slug: 'home' };
      }
      for (const duplicate of homes.slice(1)) {
        moveBlocks.run(home.id, profile.id, duplicate.id);
        deletePage.run(duplicate.id, profile.id);
      }
      assignBlocks.run(home.id, profile.id);
    }
  });
  if (process.env.NODE_ENV === 'test' || process.env.SEED_DEMO === 'true') seedDefaultData();
  ensureHomePages();
  runSchemaMigrations();
}

/** Apply data repairs and database guards as named, repeatable migrations. */
export function runSchemaMigrations() {
  const migration = db.transaction(() => {
    // Forward-recovery cleanup for the first invariant draft, which conflicted
    // with the account-deletion cascade. Application routes still protect home
    // pages; profile deletion must be allowed to cascade them.
    db.exec('DROP TRIGGER IF EXISTS trg_pages_home_delete');
    const existing = db.prepare("SELECT 1 FROM schema_migrations WHERE version = '0002_content_ownership_invariants'").get();
    if (existing) return;

    const profiles = db.prepare('SELECT id FROM profiles ORDER BY id').all() as Array<{ id: string }>;
    const homeForProfile = db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1 ORDER BY sort_order ASC, created_at ASC, id ASC LIMIT 1');
    const repairOrphans = db.prepare(`UPDATE blocks SET page_id = ? WHERE profile_id = ? AND (page_id IS NULL OR NOT EXISTS (SELECT 1 FROM pages WHERE pages.id = blocks.page_id AND pages.profile_id = blocks.profile_id))`);
    for (const profile of profiles) {
      const home = homeForProfile.get(profile.id) as { id: string } | undefined;
      if (home) repairOrphans.run(home.id, profile.id);
    }

    const pages = db.prepare('SELECT id, profile_id FROM pages ORDER BY profile_id, sort_order ASC, created_at ASC, id ASC').all() as Array<{ id: string; profile_id: string }>;
    const blocksForPage = db.prepare('SELECT id FROM blocks WHERE profile_id = ? AND page_id = ? ORDER BY position ASC, created_at ASC, id ASC');
    const setPosition = db.prepare('UPDATE blocks SET position = ? WHERE id = ?');
    for (const page of pages) {
      const blocks = blocksForPage.all(page.profile_id, page.id) as Array<{ id: string }>;
      blocks.forEach((block, position) => setPosition.run(position, block.id));
    }

    db.exec(`
      DROP TRIGGER IF EXISTS trg_blocks_page_owner_insert;
      DROP TRIGGER IF EXISTS trg_blocks_page_owner_update;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_blocks_page_position_unique ON blocks(profile_id, page_id, position);
      CREATE TRIGGER IF NOT EXISTS trg_blocks_page_owner_insert
      BEFORE INSERT ON blocks
      WHEN NEW.page_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pages WHERE id = NEW.page_id AND profile_id = NEW.profile_id)
      BEGIN SELECT RAISE(ABORT, 'block page must belong to profile'); END;
      CREATE TRIGGER IF NOT EXISTS trg_blocks_page_owner_update
      BEFORE UPDATE OF profile_id, page_id ON blocks
      WHEN NEW.page_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pages WHERE id = NEW.page_id AND profile_id = NEW.profile_id)
      BEGIN SELECT RAISE(ABORT, 'block page must belong to profile'); END;
      CREATE TRIGGER IF NOT EXISTS trg_blocks_page_assign_insert
      AFTER INSERT ON blocks
      WHEN NEW.page_id IS NULL
      BEGIN UPDATE blocks SET page_id = (SELECT id FROM pages WHERE profile_id = NEW.profile_id AND is_home = 1 LIMIT 1) WHERE id = NEW.id; END;
      CREATE TRIGGER IF NOT EXISTS trg_blocks_page_assign_update
      AFTER UPDATE OF profile_id, page_id ON blocks
      WHEN NEW.page_id IS NULL
      BEGIN UPDATE blocks SET page_id = (SELECT id FROM pages WHERE profile_id = NEW.profile_id AND is_home = 1 LIMIT 1) WHERE id = NEW.id; END;
      CREATE TRIGGER IF NOT EXISTS trg_pages_home_insert
      BEFORE INSERT ON pages
      WHEN NEW.is_home = 1 AND EXISTS (SELECT 1 FROM pages WHERE profile_id = NEW.profile_id AND is_home = 1)
      BEGIN SELECT RAISE(ABORT, 'profile already has a home page'); END;
      CREATE TRIGGER IF NOT EXISTS trg_pages_home_update
      BEFORE UPDATE OF profile_id, is_home ON pages
      WHEN NEW.is_home = 1 AND EXISTS (SELECT 1 FROM pages WHERE profile_id = NEW.profile_id AND is_home = 1 AND id != NEW.id)
      BEGIN SELECT RAISE(ABORT, 'profile already has a home page'); END;
      CREATE TRIGGER IF NOT EXISTS trg_pages_with_blocks_delete
      BEFORE DELETE ON pages
      WHEN EXISTS (SELECT 1 FROM blocks WHERE page_id = OLD.id)
      BEGIN SELECT RAISE(ABORT, 'page with blocks must be reassigned before deletion'); END;
    `);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES ('0002_content_ownership_invariants', ?)").run(Date.now());
  });
  migration();
}

function seedDefaultData() {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) {
    // Keep the deterministic public fixture available for isolated test runs even
    // when another test created users in the same persistent test database.
    if (process.env.NODE_ENV === 'test' && !(db.prepare('SELECT id FROM profiles WHERE username = ?').get('elenarostova'))) {
      const now = Date.now();
      const demoUserId = 'usr_demo_01';
      db.prepare('INSERT OR IGNORE INTO users (id, email, password_hash, session_version, created_at) VALUES (?, ?, ?, 1, ?)').run(demoUserId, 'demo@liinx.co', bcrypt.hashSync('password123', 10), now);
      const owner = db.prepare('SELECT id FROM users WHERE id = ?').get(demoUserId);
      if (owner) {
        db.prepare(`INSERT OR IGNORE INTO profiles (id, user_id, username, display_name, bio, avatar_url, category, verified, theme_id, socials_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run('prf_elena', demoUserId, 'elenarostova', 'Elena Rostova', 'Example profile for local testing.', null, 'Design & Art', 0, 'editorial-stone', '[]', now, now);
      }
    }
    return;
  }

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
