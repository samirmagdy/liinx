import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { brand } from '../../shared/index.js';

export const referralsRouter = Router();

referralsRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const account = db.prepare(`
    SELECT u.subscription_plan AS plan, u.referral_pro_until AS proUntil, p.username
    FROM users u JOIN profiles p ON p.user_id = u.id
    WHERE u.id = ? ORDER BY p.created_at LIMIT 1
  `).get(req.user!.userId) as { plan: string; proUntil: number | null; username: string } | undefined;
  if (!account) return res.status(404).json({ error: 'Account not found.' });

  const counts = db.prepare(`
    SELECT count(*) AS total, sum(CASE WHEN qualified_at IS NOT NULL THEN 1 ELSE 0 END) AS qualified
    FROM creator_referrals WHERE inviter_user_id = ?
  `).get(req.user!.userId) as { total: number; qualified: number | null };
  const origin = (process.env.APP_ORIGIN || `https://${brand.domain}`).replace(/\/$/, '');
  return res.json({
    referralUrl: `${origin}/?ref=${encodeURIComponent(account.username)}`,
    total: counts.total,
    qualified: counts.qualified || 0,
    required: 3,
    rewardUntil: account.proUntil,
    rewardEligible: account.plan === 'free'
  });
});
