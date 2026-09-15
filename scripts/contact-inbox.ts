import { db } from '../server/db.js';
// Operator-only local command. No public endpoint exposes customer messages.
const exists = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'contact_messages'").get();
if (!exists) console.log('No contact messages have been submitted.');
else console.log(JSON.stringify(db.prepare('SELECT id, name, email, message, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 100').all(), null, 2));
