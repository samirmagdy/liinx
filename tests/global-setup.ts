import { initDatabase } from '../server/db.js';

export async function setup() {
  console.log('[Vitest Global Setup] Pre-initializing SQLite database...');
  initDatabase();
  console.log('[Vitest Global Setup] Database successfully initialized.');
}
