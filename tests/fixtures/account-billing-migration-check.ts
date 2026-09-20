import Database from 'better-sqlite3';

const databasePath = process.env.DATABASE_PATH;
if (!databasePath) throw new Error('DATABASE_PATH is required');

const legacy = new Database(databasePath);
legacy.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE profiles (
    id TEXT PRIMARY KEY, user_id TEXT, username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL, plan TEXT DEFAULT 'free', billing_event_created_at INTEGER,
    stripe_customer_id TEXT, stripe_subscription_id TEXT,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  );
`);
legacy.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
  .run('legacy-user', 'legacy-billing@example.test', 'hash', Date.now());
legacy.prepare(`INSERT INTO profiles (id, user_id, username, display_name, plan, billing_event_created_at, stripe_customer_id, stripe_subscription_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run('legacy-profile-a', 'legacy-user', 'legacy-a', 'Legacy A', 'studio', 500, 'cus_legacy', 'sub_legacy', Date.now(), Date.now());
legacy.prepare(`INSERT INTO profiles (id, user_id, username, display_name, plan, created_at, updated_at)
  VALUES (?, ?, ?, ?, 'studio', ?, ?)`)
  .run('legacy-profile-b', 'legacy-user', 'legacy-b', 'Legacy B', Date.now(), Date.now());
legacy.close();

const { initDatabase, db } = await import('../../server/db.js');
initDatabase();
const { getEffectivePlan } = await import('../../server/accountEntitlements.js');
const account = db.prepare('SELECT subscription_plan, stripe_customer_id, stripe_subscription_id FROM users WHERE id = ?').get('legacy-user') as {
  subscription_plan: string; stripe_customer_id: string | null; stripe_subscription_id: string | null;
};
const profiles = db.prepare('SELECT id, plan, stripe_subscription_id FROM profiles WHERE user_id = ? ORDER BY id').all('legacy-user') as {
  id: string; plan: string; stripe_subscription_id: string | null;
}[];
db.prepare("UPDATE users SET subscription_plan = 'free' WHERE id = ?").run('legacy-user');
console.log(JSON.stringify({
  accountPlan: account.subscription_plan,
  accountCustomer: account.stripe_customer_id,
  accountSubscription: account.stripe_subscription_id,
  profilePlans: profiles.map(profile => profile.plan),
  profileSubscriptionIds: profiles.map(profile => profile.stripe_subscription_id),
  staleProfilePlan: getEffectivePlan('legacy-profile-b')
}));
