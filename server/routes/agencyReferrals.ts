import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { brand } from '../../shared/index.js';
import { stripeClient } from './billing.js';
import { AGENCY_REFERRAL_CREDIT_CAP, AGENCY_REFERRAL_CREDIT_CENTS } from '../services/agencyReferrals.js';

export const agencyReferralsRouter = Router();
const yearMs = 365 * 24 * 60 * 60 * 1000;

agencyReferralsRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const account = db.prepare(`
    SELECT u.subscription_plan AS plan, u.subscription_status AS subscriptionStatus,
      u.stripe_customer_id AS stripeCustomerId, p.username
    FROM users u JOIN profiles p ON p.user_id = u.id
    WHERE u.id = ? ORDER BY p.created_at LIMIT 1
  `).get(req.user!.userId) as { plan: string; subscriptionStatus: string; stripeCustomerId: string | null; username: string } | undefined;
  if (!account) return res.status(404).json({ error: 'Account not found.' });

  const now = Date.now();
  const counts = db.prepare(`
    SELECT count(*) AS referred,
      sum(CASE WHEN paid_invoice_id IS NOT NULL AND credited_at IS NULL THEN 1 ELSE 0 END) AS pending,
      sum(CASE WHEN credited_at >= ? THEN 1 ELSE 0 END) AS creditedThisYear
    FROM agency_referrals WHERE inviter_user_id = ?
  `).get(now - yearMs, req.user!.userId) as { referred: number; pending: number | null; creditedThisYear: number | null };

  const byStage = db.prepare(`
    SELECT sum(CASE WHEN paid_invoice_id IS NULL THEN 1 ELSE 0 END) AS awaitingStudioPayment,
      sum(CASE WHEN paid_invoice_id IS NOT NULL AND available_at > ? THEN 1 ELSE 0 END) AS coolingOff
    FROM agency_referrals WHERE inviter_user_id = ? AND credited_at IS NULL
  `).get(now, req.user!.userId) as { awaitingStudioPayment: number | null; coolingOff: number | null };

  let availableCreditCents = 0;
  if (stripeClient && account.stripeCustomerId) {
    try {
      const customer = await stripeClient.customers.retrieve(account.stripeCustomerId);
      if ('balance' in customer) availableCreditCents = Math.max(0, -customer.balance);
    } catch {
      return res.status(503).json({ error: 'Could not retrieve your Stripe credit balance.' });
    }
  }

  const origin = (process.env.APP_ORIGIN || `https://${brand.domain}`).replace(/\/$/, '');
  return res.json({
    referralUrl: `${origin}/?agency_ref=${encodeURIComponent(account.username)}`,
    referred: counts.referred,
    pending: counts.pending || 0,
    awaitingStudioPayment: byStage.awaitingStudioPayment || 0,
    coolingOff: byStage.coolingOff || 0,
    creditedThisYear: counts.creditedThisYear || 0,
    cap: AGENCY_REFERRAL_CREDIT_CAP,
    creditCents: AGENCY_REFERRAL_CREDIT_CENTS,
    creditCurrency: 'USD',
    availableCreditCents,
    requiresStudio: !(account.plan === 'studio' && ['active', 'trialing'].includes(account.subscriptionStatus)),
    stripeConfigured: Boolean(stripeClient && account.stripeCustomerId)
  });
});
