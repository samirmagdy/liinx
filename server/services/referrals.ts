import { db } from '../db.js';
import { createId } from '../utils/ids.js';

const QUALIFIED_REFERRALS_REQUIRED = 3;
const REFERRAL_PRO_DAYS = 90;

/** Count a creator only after they verify their email. Rewards are account-level entitlements. */
export function qualifyCreatorReferral(referredUserId: string, now = Date.now()): void {
  const referral = db.prepare(`
    SELECT id, inviter_user_id FROM creator_referrals
    WHERE referred_user_id = ? AND qualified_at IS NULL
  `).get(referredUserId) as { id: string; inviter_user_id: string } | undefined;
  if (!referral) return;

  db.transaction(() => {
    db.prepare('UPDATE creator_referrals SET qualified_at = ? WHERE id = ? AND qualified_at IS NULL').run(now, referral.id);
    const inviter = db.prepare('SELECT referral_rewarded_at, referral_pro_until, subscription_plan FROM users WHERE id = ?')
      .get(referral.inviter_user_id) as { referral_rewarded_at: number | null; referral_pro_until: number | null; subscription_plan: string } | undefined;
    const count = db.prepare('SELECT count(*) AS count FROM creator_referrals WHERE inviter_user_id = ? AND qualified_at IS NOT NULL')
      .get(referral.inviter_user_id) as { count: number };
    if (!inviter || inviter.referral_rewarded_at || count.count < QUALIFIED_REFERRALS_REQUIRED) return;

    // Do not override a paid subscription. The reward is a temporary base entitlement
    // for free accounts, kept separate from Stripe's subscription state.
    if (inviter.subscription_plan !== 'free') return;
    const startsAt = Math.max(now, inviter.referral_pro_until || 0);
    const expiresAt = startsAt + REFERRAL_PRO_DAYS * 24 * 60 * 60 * 1000;
    db.prepare('UPDATE users SET referral_pro_until = ?, referral_rewarded_at = ? WHERE id = ? AND referral_rewarded_at IS NULL')
      .run(expiresAt, now, referral.inviter_user_id);
  })();
}

export function recordCreatorReferral(inviterUserId: string, referredUserId: string, now = Date.now()): void {
  if (inviterUserId === referredUserId) return;
  db.prepare(`
    INSERT OR IGNORE INTO creator_referrals (id, inviter_user_id, referred_user_id, created_at)
    VALUES (?, ?, ?, ?)
  `).run(createId('ref'), inviterUserId, referredUserId, now);
}
