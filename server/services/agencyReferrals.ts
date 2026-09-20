import type Stripe from 'stripe';
import { db } from '../db.js';
import { createId } from '../utils/ids.js';
import { logError } from '../logger.js';

export const AGENCY_REFERRAL_CREDIT_CENTS = 2_900;
export const AGENCY_REFERRAL_CREDIT_CAP = 3;
export const AGENCY_REFERRAL_HOLD_DAYS = 30;
const dayMs = 24 * 60 * 60 * 1000;

export function recordAgencyReferral(inviterUserId: string, referredUserId: string, now = Date.now()): void {
  if (inviterUserId === referredUserId) return;
  db.prepare(`
    INSERT OR IGNORE INTO agency_referrals (id, inviter_user_id, referred_user_id, created_at)
    VALUES (?, ?, ?, ?)
  `).run(createId('aref'), inviterUserId, referredUserId, now);
}

/** An agency referral qualifies only from its first paid Studio subscription invoice. */
export function recordAgencyReferralPayment(referredUserId: string, invoiceId: string, paidAt: number): void {
  db.prepare(`
    UPDATE agency_referrals
    SET paid_invoice_id = ?, paid_at = ?, available_at = ?
    WHERE referred_user_id = ? AND paid_invoice_id IS NULL
  `).run(invoiceId, paidAt, paidAt + AGENCY_REFERRAL_HOLD_DAYS * dayMs, referredUserId);
}

/**
 * Issue pending credits as Stripe customer-balance transactions. Stripe applies
 * negative customer balances automatically to the next finalized invoice.
 * Idempotency keys make retries safe if Stripe succeeds before SQLite is updated.
 */
export async function grantDueAgencyReferralCredits(stripe: Stripe, now = Date.now()): Promise<{ credited: number; waiting: number }> {
  const due = db.prepare(`
    SELECT r.id, r.inviter_user_id, u.stripe_customer_id
    FROM agency_referrals r
    JOIN users u ON u.id = r.inviter_user_id
    JOIN users referred ON referred.id = r.referred_user_id AND referred.email_verified_at IS NOT NULL
    WHERE r.credited_at IS NULL AND r.available_at <= ?
      AND u.subscription_plan = 'studio' AND u.subscription_status IN ('active', 'trialing')
      AND u.stripe_customer_id IS NOT NULL
    ORDER BY r.available_at, r.created_at
  `).all(now) as { id: string; inviter_user_id: string; stripe_customer_id: string }[];
  let credited = 0;
  let waiting = 0;

  for (const referral of due) {
    const earnedInWindow = db.prepare(`
      SELECT count(*) AS count FROM agency_referrals
      WHERE inviter_user_id = ? AND credited_at >= ?
    `).get(referral.inviter_user_id, now - 365 * dayMs) as { count: number };
    if (earnedInWindow.count >= AGENCY_REFERRAL_CREDIT_CAP) { waiting++; continue; }

    try {
      const transaction = await stripe.customers.createBalanceTransaction(
        referral.stripe_customer_id,
        {
          amount: -AGENCY_REFERRAL_CREDIT_CENTS,
          currency: 'usd',
          description: 'Liinx agency referral credit',
          metadata: { referral_id: referral.id, program: 'agency-referral' }
        },
        { idempotencyKey: `liinx-agency-referral-${referral.id}` }
      );
      const result = db.prepare(`
        UPDATE agency_referrals SET stripe_balance_transaction_id = ?, credited_at = ?
        WHERE id = ? AND credited_at IS NULL
      `).run(transaction.id, now, referral.id);
      if (result.changes) credited++;
    } catch (error) {
      logError('Agency referral credit issuance failed', error, { referralId: referral.id });
    }
  }
  return { credited, waiting };
}
