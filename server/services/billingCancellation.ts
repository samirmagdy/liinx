import Stripe from 'stripe';

/** Idempotently cancel one recurring subscription before local account deletion. */
export async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe billing is not configured; account deletion is temporarily unavailable.');
  const stripe = new Stripe(key);
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.status !== 'canceled') await stripe.subscriptions.cancel(subscriptionId);
}
