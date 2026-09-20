import { db } from './db.js';
import { normalizePlan } from './entitlements.js';

/** Only an owning account can grant paid features; profile.plan is never authoritative. */
export function getEffectivePlan(profileId: string): string {
  const row = db.prepare(`
    SELECT p.user_id, u.subscription_plan AS plan, u.referral_pro_until
    FROM profiles p LEFT JOIN users u ON u.id = p.user_id WHERE p.id = ?
  `).get(profileId) as { user_id?: string | null; plan?: string; referral_pro_until?: number | null } | undefined;
  if (!row?.user_id) return 'free';
  const plan = normalizePlan(row.plan);
  return plan === 'free' && (row.referral_pro_until || 0) > Date.now() ? 'pro' : plan;
}

export function syncAccountPlanToProfiles(userId: string, plan: string, now = Date.now()): void {
  db.prepare('UPDATE profiles SET plan = ?, updated_at = ? WHERE user_id = ?').run(normalizePlan(plan), now, userId);
}
