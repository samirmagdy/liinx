import { Router, type Request, type Response } from 'express';
import Stripe from 'stripe';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { paidPlans } from '../../shared/index.js';
import * as Sentry from '@sentry/node';
import { logError } from '../logger.js';
import { hasEntitlement, normalizePlan } from '../entitlements.js';
import { syncAccountPlanToProfiles } from '../accountEntitlements.js';
import { invalidatePublicProfileCache } from './profiles.js';

export const billingRouter = Router();

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function configuredPriceId(plan: 'pro' | 'studio', interval: 'month' | 'year') {
  return process.env[`STRIPE_${plan.toUpperCase()}_${interval.toUpperCase()}_PRICE_ID`]
    || (interval === 'month' ? process.env[`STRIPE_${plan.toUpperCase()}_PRICE_ID`] : undefined);
}

export const stripeClient = stripeKey ? new Stripe(stripeKey) : null;

function stripeReferenceId(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string') return value.id;
  return null;
}

// 1. Check Billing Configuration & Active Subscription
billingRouter.get('/billing/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = db.prepare('SELECT p.id, u.subscription_plan AS plan, u.stripe_customer_id, u.stripe_subscription_id, u.subscription_status FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.id = ?').get(req.user!.profileId) as any;
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      configured: Boolean(stripeKey && stripeWebhookSecret && process.env.APP_ORIGIN),
      plan: profile.plan || 'free',
      hasStripeCustomer: Boolean(profile.stripe_customer_id || db.prepare('SELECT 1 FROM profiles WHERE user_id = ? AND stripe_customer_id IS NOT NULL LIMIT 1').get(req.user!.userId)),
      hasActiveSubscription: Boolean((profile.stripe_subscription_id && ['active', 'trialing', 'past_due'].includes(profile.subscription_status))
        || db.prepare('SELECT 1 FROM profiles WHERE user_id = ? AND stripe_subscription_id IS NOT NULL LIMIT 1').get(req.user!.userId))
    });
  } catch (err: any) {
    console.error('Billing status error:', err);
    res.status(500).json({ error: 'Failed to retrieve billing status' });
  }
});

// 2. Create Real Stripe Checkout Session
billingRouter.post('/billing/create-checkout-session', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { plan, interval = 'month' } = req.body;
    if (!['month', 'year'].includes(interval)) return res.status(400).json({ error: 'Invalid billing interval.' });
    if (!['pro', 'studio'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Choose from "pro" or "studio".' });
    }

    if (!stripeClient || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.APP_ORIGIN) {
      return res.status(503).json({
        error: 'Stripe billing is not configured on this server. Please set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in environment.'
      });
    }

    const profile = db.prepare('SELECT p.*, u.stripe_customer_id AS account_customer_id, u.stripe_subscription_id AS account_subscription_id FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.id = ?').get(req.user!.profileId) as any;
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const origin = process.env.APP_ORIGIN || `${protocol}://${host}`;

    const planConfig = paidPlans[plan as keyof typeof paidPlans];
    const legacySubscription = db.prepare('SELECT stripe_subscription_id FROM profiles WHERE user_id = ? AND stripe_subscription_id IS NOT NULL LIMIT 1').get(req.user!.userId);
    if (profile.account_subscription_id || legacySubscription) return res.status(409).json({ error: 'Manage your existing subscription in the billing portal.' });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      client_reference_id: req.user!.userId,
      customer_email: req.user!.email,
      line_items: [{
        ...(configuredPriceId(plan, interval)
          ? { price: configuredPriceId(plan, interval) }
            : { price_data: {
                currency: 'usd',
                product_data: {
                  name: planConfig.name,
                  description: `${interval === 'year' ? 'Annual' : 'Monthly'} subscription for LIINX ${plan.toUpperCase()} tier.`
                },
                unit_amount: planConfig[interval as 'month' | 'year'],
                recurring: { interval }
              } }),
        quantity: 1
      }],
      metadata: {
        userId: req.user!.userId,
        plan
      },
      subscription_data: {
        metadata: {
          userId: req.user!.userId,
          plan
        }
      },
      success_url: `${origin}/studio?billing=success&session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/pricing?billing=cancelled`
    };

    if (profile.account_customer_id) {
      sessionParams.customer = profile.account_customer_id;
      delete sessionParams.customer_email;
    }

    const session = await stripeClient.checkout.sessions.create(sessionParams);

    res.json({
      url: session.url,
      sessionId: session.id
    });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Unable to start checkout. Please try again.' });
  }
});

// 3. Customer Billing Portal Session (manage or cancel existing subscription)
billingRouter.post('/billing/create-portal-session', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!stripeClient) {
      return res.status(503).json({ error: 'Stripe billing is not configured.' });
    }

    const account = db.prepare(`
      SELECT coalesce(u.stripe_customer_id, (SELECT p.stripe_customer_id FROM profiles p WHERE p.user_id = u.id AND p.stripe_customer_id IS NOT NULL LIMIT 1)) AS stripe_customer_id
      FROM users u WHERE u.id = ?
    `).get(req.user!.userId) as any;
    if (!account || !account.stripe_customer_id) {
      return res.status(400).json({ error: 'No active Stripe customer account found. Please subscribe to a paid plan first.' });
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const origin = process.env.APP_ORIGIN || `${protocol}://${host}`;
    const returnUrl = `${origin}/studio`;

    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: account.stripe_customer_id,
      return_url: returnUrl
    });

    res.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('Stripe portal error:', err);
    res.status(500).json({ error: 'Unable to open billing management. Please try again.' });
  }
});

function resolveBillingUserId(metadataUserId?: string | null, profileId?: string | null, customerId?: string | null): string | null {
  if (metadataUserId && db.prepare('SELECT id FROM users WHERE id = ?').get(metadataUserId)) return metadataUserId;
  if (profileId) {
    const owner = db.prepare('SELECT user_id FROM profiles WHERE id = ?').get(profileId) as { user_id?: string | null } | undefined;
    if (owner?.user_id) return owner.user_id;
  }
  if (customerId) {
    const owner = db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?').get(customerId) as { id: string } | undefined;
    if (owner) return owner.id;
    const legacyOwner = db.prepare('SELECT user_id FROM profiles WHERE stripe_customer_id = ? AND user_id IS NOT NULL LIMIT 1').get(customerId) as { user_id: string } | undefined;
    if (legacyOwner) return legacyOwner.user_id;
  }
  return null;
}

function persistAccountSubscription(userId: string, plan: string, status: string, customerId: string | null, subscriptionId: string | null, eventCreatedAt: number, now: number): void {
  const previous = db.prepare('SELECT stripe_subscription_id FROM users WHERE id = ?').get(userId) as { stripe_subscription_id?: string | null } | undefined;
  const changed = db.prepare(`
    UPDATE users SET subscription_plan = ?, subscription_status = ?,
      stripe_customer_id = coalesce(?, stripe_customer_id), stripe_subscription_id = ?,
      billing_event_created_at = ?
    WHERE id = ? AND coalesce(billing_event_created_at, 0) <= ?
      AND (stripe_subscription_id IS NULL OR stripe_subscription_id = ? OR ? IS NULL)
  `).run(plan, status, customerId, subscriptionId, eventCreatedAt, userId, eventCreatedAt, subscriptionId, subscriptionId);
  if (!changed.changes) return;
  for (const transferredSubscriptionId of new Set([previous?.stripe_subscription_id, subscriptionId].filter((id): id is string => Boolean(id)))) {
    db.prepare('UPDATE profiles SET stripe_customer_id = NULL, stripe_subscription_id = NULL WHERE user_id = ? AND stripe_subscription_id = ?').run(userId, transferredSubscriptionId);
  }
  syncAccountPlanToProfiles(userId, plan, now);
  for (const profile of db.prepare('SELECT id FROM profiles WHERE user_id = ?').all(userId) as { id: string }[]) invalidatePublicProfileCache(profile.id);
}

function reconcileCheckoutSession(session: Stripe.Checkout.Session, eventCreatedAt: number, now: number): void {
  const plan = normalizePlan(session.metadata?.plan);
  const customerId = stripeReferenceId(session.customer);
  const subscriptionId = stripeReferenceId(session.subscription);
  const userId = resolveBillingUserId(session.metadata?.userId, session.metadata?.profileId || session.client_reference_id, customerId);
  if (userId && hasEntitlement(plan, 'customDomain') && ['paid', 'no_payment_required'].includes(session.payment_status || '')) {
    persistAccountSubscription(userId, plan, 'active', customerId, subscriptionId, eventCreatedAt, now);
  }
}

function reconcileSubscription(sub: Stripe.Subscription, eventType: string, eventCreatedAt: number, now: number): void {
  const customerId = stripeReferenceId(sub.customer);
  const userId = resolveBillingUserId(sub.metadata?.userId, sub.metadata?.profileId, customerId);
  if (!userId) return;
  const active = eventType === 'customer.subscription.updated' && ['active', 'trialing'].includes(sub.status);
  const plan = active ? normalizePlan(sub.metadata?.plan) : 'free';
  const status = eventType === 'customer.subscription.deleted' ? 'canceled' : sub.status;
  persistAccountSubscription(userId, plan, status, customerId, active ? sub.id : null, eventCreatedAt, now);
}

function reconcilePaymentFailure(object: any, eventType: string, eventCreatedAt: number, now: number): void {
  const customerId = stripeReferenceId(object.customer);
  const subscriptionId = stripeReferenceId(object.subscription) || (eventType === 'customer.subscription.paused' ? stripeReferenceId(object.id) : null);
  const userId = resolveBillingUserId(object.metadata?.userId, object.metadata?.profileId, customerId);
  const ownsSubscription = userId && subscriptionId && db.prepare('SELECT id FROM users WHERE id = ? AND stripe_subscription_id = ?').get(userId, subscriptionId);
  if (ownsSubscription) persistAccountSubscription(userId!, 'free', 'past_due', customerId, null, eventCreatedAt, now);
}

function processBillingEvent(event: Stripe.Event): void {
  const processEvent = db.transaction(() => {
    const now = Date.now();
    const eventCreatedAt = Number.isFinite(event.created) ? event.created * 1000 : now;
    switch (event.type) {
      case 'checkout.session.completed':
        reconcileCheckoutSession(event.data.object as Stripe.Checkout.Session, eventCreatedAt, now);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        reconcileSubscription(event.data.object as Stripe.Subscription, event.type, eventCreatedAt, now);
        break;
      case 'invoice.payment_failed':
      case 'customer.subscription.paused':
        reconcilePaymentFailure(event.data.object, event.type, eventCreatedAt, now);
        break;
      default:
        break;
    }
    db.prepare('INSERT INTO processed_webhook_events (event_id, processed_at) VALUES (?, ?)').run(event.id, now);
  });
  processEvent();
}

billingRouter.post('/billing/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      if (!sig) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }
      const rawBody = (req as any).rawBody || req.body;
      if (!stripeClient) return res.status(503).json({ error: 'Stripe billing is not configured.' });
      const stripe = stripeClient;
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else if (process.env.NODE_ENV === 'test' && req.body && req.body.type) {
      // In automated unit testing where webhooks are simulated
      event = req.body as Stripe.Event;
    } else {
      return res.status(503).json({ error: 'Stripe webhook secret is not configured.' });
    }
  } catch (err: any) {
    logError('Stripe webhook signature verification failed', err);
    if (process.env.SENTRY_DSN) Sentry.captureException(err);
    return res.status(400).json({ error: 'Webhook signature verification failed. Stripe will retry if appropriate.' });
  }

  try {
    if (!event.id || !event.type || !event.data?.object) return res.status(400).json({ error: 'Invalid Stripe event.' });
    const duplicate = db.prepare('SELECT event_id FROM processed_webhook_events WHERE event_id = ?').get(event.id);
    if (duplicate) return res.json({ received: true, duplicate: true });

    processBillingEvent(event);
    res.json({ received: true });
  } catch (err: any) {
    logError('Stripe webhook event processing failed', err, { eventId: event?.id, eventType: event?.type });
    if (process.env.SENTRY_DSN) Sentry.captureException(err, { tags: { stripe_event_type: event?.type || 'unknown' } });
    res.status(500).json({ error: 'Webhook processing failed. Stripe will retry the event.' });
  }
});
