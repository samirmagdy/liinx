import { db } from './db.js';
import { normalizePlan } from './entitlements.js';

/** Only an owning account can grant paid features; profile.plan is never authoritative. */
export function getEffectivePlan(profileId: string): string {
  const row = db.prepare(`
    SELECT p.user_id, u.subscription_plan AS plan
    FROM profiles p LEFT JOIN users u ON u.id = p.user_id WHERE p.id = ?
  `).get(profileId) as { user_id?: string | null; plan?: string } | undefined;
  return row?.user_id ? normalizePlan(row.plan) : 'free';
}

export function syncAccountPlanToProfiles(userId: string, plan: string, now = Date.now()): void {
  db.prepare('UPDATE profiles SET plan = ?, updated_at = ? WHERE user_id = ?').run(normalizePlan(plan), now, userId);
}
