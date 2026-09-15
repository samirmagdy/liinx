import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { paidPlans } from '../../src/config/plans.js';

export const billingRouter = Router();

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const stripeClient = stripeKey ? new Stripe(stripeKey) : null;

// Pricing tiers configuration
const PLAN_PRICES: Record<'pro' | 'studio', { amountCents: number; name: string; envPriceId?: string }> = {
  pro: {
    amountCents: 900, // $9.00 / month
    name: 'LIINX Pro Creator',
    envPriceId: process.env.STRIPE_PRO_PRICE_ID
  },
  studio: {
    amountCents: 2900, // $29.00 / month
    name: 'LIINX Studio Agency',
    envPriceId: process.env.STRIPE_STUDIO_PRICE_ID
  }
};

// 1. Check Billing Configuration & Active Subscription
billingRouter.get('/billing/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = db.prepare('SELECT id, plan, stripe_customer_id, stripe_subscription_id FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      configured: Boolean(stripeKey && stripeWebhookSecret && process.env.APP_ORIGIN),
      plan: profile.plan || 'free',
      hasStripeCustomer: Boolean(profile.stripe_customer_id),
      hasActiveSubscription: Boolean(profile.stripe_subscription_id)
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

    const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const origin = process.env.APP_ORIGIN || `${protocol}://${host}`;

    const planConfig = paidPlans[plan as keyof typeof paidPlans];
    if (profile.stripe_subscription_id) return res.status(409).json({ error: 'Manage your existing subscription in the billing portal.' });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      client_reference_id: profile.id,
      customer_email: req.user!.email,
      line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: planConfig.name,
                description: `${interval === 'year' ? 'Annual' : 'Monthly'} subscription for LIINX ${plan.toUpperCase()} tier.`
              },
              unit_amount: planConfig[interval as 'month' | 'year'],
              recurring: { interval }
            },
            quantity: 1
          }],
      metadata: {
        profileId: profile.id,
        plan,
        userId: req.user!.userId
      },
      subscription_data: {
        metadata: {
          profileId: profile.id,
          plan,
          userId: req.user!.userId
        }
      },
      success_url: `${origin}/studio?billing=success&session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/pricing?billing=cancelled`
    };

    if (profile.stripe_customer_id) {
      sessionParams.customer = profile.stripe_customer_id;
      delete sessionParams.customer_email;
    }

    const session = await stripeClient.checkout.sessions.create(sessionParams);

    res.json({
      url: session.url,
      sessionId: session.id
    });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message || 'Failed to create Stripe Checkout session.' });
  }
});

// 3. Customer Billing Portal Session (manage or cancel existing subscription)
billingRouter.post('/billing/create-portal-session', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!stripeClient) {
      return res.status(503).json({ error: 'Stripe billing is not configured.' });
    }

    const profile = db.prepare('SELECT stripe_customer_id FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    if (!profile || !profile.stripe_customer_id) {
      return res.status(400).json({ error: 'No active Stripe customer account found. Please subscribe to a paid plan first.' });
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const origin = process.env.APP_ORIGIN || `${protocol}://${host}`;
    const returnUrl = `${origin}/studio`;

    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl
    });

    res.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('Stripe portal error:', err);
    res.status(500).json({ error: err.message || 'Failed to create billing portal session.' });
  }
});

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
      const stripe = stripeClient || new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', { apiVersion: '2025-02-24.acacia' as any });
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else if (process.env.NODE_ENV === 'test' && req.body && req.body.type) {
      // In automated unit testing where webhooks are simulated
      event = req.body as Stripe.Event;
    } else {
      return res.status(503).json({ error: 'Stripe webhook secret is not configured.' });
    }
  } catch (err: any) {
    console.error('Stripe webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook Signature Verification Failed: ${err.message}` });
  }

  try {
    const now = Date.now();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const profileId = session.client_reference_id || session.metadata?.profileId;
        const plan = session.metadata?.plan || 'pro';
        const customerId = session.customer ? String(session.customer) : null;
        const subscriptionId = session.subscription ? String(session.subscription) : null;

        if (profileId && ['pro', 'studio'].includes(plan) && ['paid', 'no_payment_required'].includes(session.payment_status)) {
          db.prepare(`
            UPDATE profiles 
            SET plan = ?, stripe_customer_id = coalesce(?, stripe_customer_id), stripe_subscription_id = coalesce(?, stripe_subscription_id), updated_at = ?
            WHERE id = ?
          `).run(plan, customerId, subscriptionId, now, profileId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const profileId = sub.metadata?.profileId;
        const customerId = String(sub.customer);
        const targetPlan = sub.metadata?.plan || 'pro';

        const isGoodStanding = ['active', 'trialing'].includes(sub.status);
        const resolvedPlan = isGoodStanding ? targetPlan : 'free';

        if (profileId) {
          db.prepare(`
            UPDATE profiles 
            SET plan = ?, stripe_subscription_id = ?, updated_at = ?
            WHERE id = ?
          `).run(resolvedPlan, sub.id, now, profileId);
        } else if (customerId) {
          db.prepare(`
            UPDATE profiles 
            SET plan = ?, stripe_subscription_id = ?, updated_at = ?
            WHERE stripe_customer_id = ?
          `).run(resolvedPlan, sub.id, now, customerId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = String(sub.customer);
        const profileId = sub.metadata?.profileId;

        if (profileId) {
          db.prepare(`
            UPDATE profiles 
            SET plan = 'free', stripe_subscription_id = null, updated_at = ?
            WHERE id = ?
          `).run(now, profileId);
        } else if (customerId) {
          db.prepare(`
            UPDATE profiles 
            SET plan = 'free', stripe_subscription_id = null, updated_at = ?
            WHERE stripe_customer_id = ?
          `).run(now, customerId);
        }
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Error processing Stripe webhook event:', err);
    res.status(500).json({ error: 'Webhook processing error: ' + err.message });
  }
});
