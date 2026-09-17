import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db } from '../server/db.js';

function unique(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

async function webhook(id: string, type: string, created: number, object: Record<string, unknown>) {
  return request(app).post('/api/billing/webhook').send({ id, type, created, data: { object } });
}

describe('subscription entitlements', () => {
  it('reconciles per-profile upgrades, cancellation, duplicate delivery, stale events, and payment failure', async () => {
    const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    try {
    const email = `${unique('billing')}@liinx.test`;
    const username = unique('bu').slice(0, 24);
    const registered = await request(app).post('/api/auth/register').send({ email, password: 'Password123!', username });
    expect(registered.status).toBe(201);
    const originalToken = registered.body.token as string;
    const original = db.prepare('SELECT id FROM profiles WHERE username = ?').get(username) as { id: string };

    const upgraded = await webhook(unique('evt_checkout'), 'checkout.session.completed', 100, {
      client_reference_id: original.id,
      customer: 'cus_original',
      subscription: 'sub_original',
      payment_status: 'paid',
      metadata: { profileId: original.id, plan: 'pro' }
    });
    expect(upgraded.status).toBe(200);
    expect((db.prepare('SELECT plan FROM profiles WHERE id = ?').get(original.id) as { plan: string }).plan).toBe('pro');

    const duplicateUsername = `${username.slice(0, 20)}_cp_${randomBytes(2).toString('hex')}`;
    const duplicate = await request(app).post('/api/studio/profiles').set('Authorization', `Bearer ${originalToken}`).send({
      username: duplicateUsername, displayName: 'Copied profile', duplicateProfileId: original.id
    });
    expect(duplicate.status).toBe(201);
    expect(duplicate.body.profile.plan).toBe('pro');
    const duplicateId = duplicate.body.profile.id as string;
    const switched = await request(app).post(`/api/studio/profiles/${duplicateId}/select`).set('Authorization', `Bearer ${originalToken}`);
    expect(switched.status).toBe(200);
    expect((await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${switched.body.token}`)).body.plan).toBe('pro');

    db.prepare('INSERT INTO blocks (id, profile_id, type, title, position, start_at, end_at, page_id, created_at, updated_at) SELECT ?, ?, ?, ?, 1, ?, NULL, id, ?, ? FROM pages WHERE profile_id = ? AND is_home = 1').run(
      unique('scheduled'), original.id, 'link', 'Scheduled link', Date.now() - 1, Date.now(), Date.now(), original.id
    );
    const cancellationEventId = unique('evt_cancel');
    const cancelled = await webhook(cancellationEventId, 'customer.subscription.deleted', 200, {
      id: 'sub_original', customer: 'cus_original', metadata: { profileId: original.id }
    });
    expect(cancelled.status).toBe(200);
    expect((db.prepare('SELECT plan FROM profiles WHERE id = ?').get(original.id) as { plan: string }).plan).toBe('free');
    const publicProfile = await request(app).get(`/api/profiles/${username}`);
    expect(publicProfile.status).toBe(200);
    expect(publicProfile.body.blocks.find((block: any) => block.title === 'Scheduled link').startAt).toBeNull();

    const duplicateDelivery = await webhook(cancellationEventId, 'customer.subscription.deleted', 200, {
      id: 'sub_original', customer: 'cus_original', metadata: { profileId: original.id }
    });
    expect(duplicateDelivery.body.duplicate).toBe(true);
    const stale = await webhook(unique('evt_stale'), 'customer.subscription.updated', 150, {
      id: 'sub_original', customer: 'cus_original', status: 'active', metadata: { profileId: original.id, plan: 'pro' }
    });
    expect(stale.status).toBe(200);
    expect((db.prepare('SELECT plan FROM profiles WHERE id = ?').get(original.id) as { plan: string }).plan).toBe('free');

    db.prepare("UPDATE profiles SET plan = 'studio', stripe_customer_id = 'cus_copy', stripe_subscription_id = 'sub_copy' WHERE id = ?").run(duplicateId);
    const failedPayment = await webhook(unique('evt_failed'), 'invoice.payment_failed', 300, {
      customer: 'cus_copy', subscription: 'sub_copy'
    });
    expect(failedPayment.status).toBe(200);
    expect((db.prepare('SELECT plan, stripe_subscription_id FROM profiles WHERE id = ?').get(duplicateId) as { plan: string; stripe_subscription_id: string | null })).toEqual({ plan: 'free', stripe_subscription_id: null });
    } finally {
      if (originalWebhookSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET; else process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
    }
  });

  it('rejects unauthenticated signed-webhook mode requests and exposes configured plan limits', async () => {
    const original = process.env.NODE_ENV;
    const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.NODE_ENV = 'production';
    process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret || 'whsec_test_secret_for_signed_mode';
    try {
      const response = await request(app).post('/api/billing/webhook').send({ id: 'forged', type: 'customer.subscription.deleted', data: { object: {} } });
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/stripe-signature/i);
    } finally {
      process.env.NODE_ENV = original;
      if (originalWebhookSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET; else process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
    }
    expect((await request(app).get('/api/health')).status).toBe(200);
  });
});
