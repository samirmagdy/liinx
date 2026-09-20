import { Router, urlencoded, type Request } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import crypto from 'node:crypto';
import { sendTransactionalEmail } from '../services/email.js';
import { escapeHtml } from '../profileHtml.js';

export const newsletterRouter = Router();
newsletterRouter.use(urlencoded({ extended: false, limit: '2kb' }));

const CONSENT_COPY_VERSION = 'newsletter-email-consent-v1';
const CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 10 * 60 * 1000;
const genericConfirmationMessage = 'If this address can be subscribed, we sent an email with a confirmation link. Check your inbox and confirm within 24 hours. / إذا كان هذا البريد قابلاً للاشتراك، فقد أرسلنا رسالة تأكيد. تحقق من صندوق الوارد وأكّد خلال 24 ساعة.';

function publicOrigin(req: Request): string {
  return (process.env.PUBLIC_ORIGIN || process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

function renderConfirmationPage(options: { title: string; body: string; token?: string; unsubscribeUrl?: string }): string {
  const form = options.token ? `<form method="post" action="/api/newsletter/confirm"><input type="hidden" name="token" value="${escapeHtml(options.token)}"><button type="submit">Confirm email / تأكيد البريد الإلكتروني</button></form>` : '';
  const unsubscribe = options.unsubscribeUrl ? `<p><a href="${escapeHtml(options.unsubscribeUrl)}">Unsubscribe / إلغاء الاشتراك</a></p>` : '';
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(options.title)}</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:38rem;margin:12vh auto;padding:0 1.25rem;color:#18181b}main{border:1px solid #e4e4e7;border-radius:1rem;padding:2rem}button{border:0;border-radius:.65rem;background:#18181b;color:#fff;padding:.8rem 1rem;font:inherit;font-weight:650;cursor:pointer}a{color:#18181b}</style><main><h1>${escapeHtml(options.title)}</h1><p>${escapeHtml(options.body)}</p>${form}${unsubscribe}</main></html>`;
}

const subscribeSchema = z.object({
  profileId: z.string().min(1, 'Profile ID is required'),
  blockId: z.string().optional().nullable(),
  email: z.string().email('Please enter a valid email address'),
  consent: z.literal(true, 'Please confirm that you want to receive updates.')
});

// Public: create a time-limited pending record and send only a confirmation email.
newsletterRouter.post('/api/newsletter/subscribe', sharedRateLimit({ name: 'newsletter-subscribe', limit: 10, windowMs: 60 * 60 * 1000 }), async (req, res) => {
  try {
    const parse = subscribeSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { profileId, blockId, email } = parse.data;
    const cleanEmail = email.toLowerCase().trim();
    const now = Date.now();

    // Verify creator exists
    const profile = db.prepare('SELECT id, display_name FROM profiles WHERE id = ?').get(profileId) as any;
    if (!profile) {
      return res.status(404).json({ error: 'Creator profile not found.' });
    }

    if (blockId) {
      const block = db.prepare(`
        SELECT b.id
        FROM blocks b
        INNER JOIN pages p ON p.id = b.page_id AND p.profile_id = b.profile_id
        WHERE b.id = ? AND b.profile_id = ? AND b.type = 'newsletter' AND p.published = 1
          AND (b.start_at IS NULL OR b.start_at <= ?) AND (b.end_at IS NULL OR b.end_at > ?)
      `).get(blockId, profileId, now, now);
      if (!block) return res.status(404).json({ error: 'This newsletter form is unavailable.' });
    }

    const existing = db.prepare('SELECT id FROM newsletter_subscribers WHERE profile_id = ? AND email = ?').get(profileId, cleanEmail);
    if (existing) return res.json({ success: true, message: genericConfirmationMessage });

    const pending = db.prepare(`SELECT id, expires_at AS expiresAt, last_sent_at AS lastSentAt
      FROM newsletter_pending_subscriptions WHERE profile_id = ? AND email = ?`).get(profileId, cleanEmail) as
      { id: string; expiresAt: number; lastSentAt: number } | undefined;
    if (pending && pending.expiresAt > now && now - pending.lastSentAt < RESEND_COOLDOWN_MS) {
      return res.json({ success: true, message: genericConfirmationMessage });
    }

    const id = pending?.id || `pnd_${crypto.randomBytes(12).toString('hex')}`;
    const confirmationToken = crypto.randomBytes(32).toString('base64url');
    const confirmationTokenHash = crypto.createHash('sha256').update(confirmationToken).digest('hex');
    const expiresAt = now + CONFIRMATION_TTL_MS;
    db.prepare(`
      INSERT INTO newsletter_pending_subscriptions (
        id, profile_id, block_id, email, consented_at, consent_copy_version,
        confirmation_token_hash, expires_at, last_sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(profile_id, email) DO UPDATE SET
        block_id = excluded.block_id, consented_at = excluded.consented_at,
        consent_copy_version = excluded.consent_copy_version,
        confirmation_token_hash = excluded.confirmation_token_hash,
        expires_at = excluded.expires_at, last_sent_at = excluded.last_sent_at
    `).run(id, profileId, blockId || null, cleanEmail, now, CONSENT_COPY_VERSION, confirmationTokenHash, expiresAt, now);

    const creatorName = String(profile.display_name).replace(/[\r\n]/g, ' ').slice(0, 100);
    const confirmUrl = `${publicOrigin(req)}/api/newsletter/confirm?token=${encodeURIComponent(confirmationToken)}`;
    try {
      await sendTransactionalEmail({
        to: cleanEmail,
        subject: `Confirm your email for ${creatorName}`,
        text: `You asked to receive email updates from ${creatorName}. Confirm your email by opening this link and pressing Confirm / تأكيد:\n\n${confirmUrl}\n\nThis link expires in 24 hours. You will not be added to the creator's subscriber list unless you confirm. If you did not request this, ignore this email.`
      });
    } catch (emailError) {
      db.prepare('DELETE FROM newsletter_pending_subscriptions WHERE id = ? AND confirmation_token_hash = ?').run(id, confirmationTokenHash);
      if (emailError instanceof Error) console.error('Newsletter confirmation email could not be sent:', emailError.name);
      return res.status(503).json({ error: 'Confirmation email is temporarily unavailable. Please try again later.' });
    }
    return res.status(202).json({ success: true, message: genericConfirmationMessage });
  } catch (err: any) {
    console.error('Newsletter subscribe error:', err);
    res.status(500).json({ error: 'Failed to process newsletter subscription.' });
  }
});

// GET is intentionally read-only: email-security scanners may open links.
newsletterRouter.get('/api/newsletter/confirm', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return res.status(400).type('html').send(renderConfirmationPage({ title: 'Confirm email / تأكيد البريد', body: 'This confirmation link is invalid or expired. / رابط التأكيد غير صالح أو منتهي الصلاحية.' }));
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const pending = db.prepare('SELECT id FROM newsletter_pending_subscriptions WHERE confirmation_token_hash = ? AND expires_at > ?').get(tokenHash, Date.now());
  if (!pending) {
    return res.status(410).type('html').send(renderConfirmationPage({ title: 'Confirmation expired / انتهت صلاحية التأكيد', body: 'Return to the creator page and submit the form again to request a new confirmation email. / عُد إلى صفحة المبدع وأرسل النموذج مجدداً لطلب رسالة تأكيد جديدة.' }));
  }
  return res.type('html').send(renderConfirmationPage({
    title: 'Confirm your subscription / تأكيد اشتراكك',
    body: 'Press the button to confirm that you want email updates from this creator. Your email is not added to the list before confirmation. / اضغط الزر لتأكيد رغبتك في تلقي رسائل البريد من هذا المبدع. لن يُضاف بريدك إلى القائمة قبل التأكيد.',
    token
  }));
});

newsletterRouter.post('/api/newsletter/confirm', sharedRateLimit({ name: 'newsletter-confirm', limit: 20, windowMs: 60 * 60 * 1000 }), (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return res.status(400).type('html').send(renderConfirmationPage({ title: 'Confirmation failed / تعذر التأكيد', body: 'This confirmation link is invalid or expired. / رابط التأكيد غير صالح أو منتهي الصلاحية.' }));
  }
  const now = Date.now();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const pending = db.prepare(`SELECT id, profile_id AS profileId, block_id AS blockId, email,
    consented_at AS consentedAt, consent_copy_version AS consentCopyVersion
    FROM newsletter_pending_subscriptions WHERE confirmation_token_hash = ? AND expires_at > ?`).get(tokenHash, now) as {
      id: string; profileId: string; blockId: string | null; email: string; consentedAt: number; consentCopyVersion: string;
    } | undefined;
  if (!pending) {
    return res.status(410).type('html').send(renderConfirmationPage({ title: 'Confirmation expired / انتهت صلاحية التأكيد', body: 'Return to the creator page and submit the form again to request a new confirmation email. / عُد إلى صفحة المبدع وأرسل النموذج مجدداً لطلب رسالة تأكيد جديدة.' }));
  }

  const subscriberId = `sub_${crypto.randomBytes(12).toString('hex')}`;
  const unsubscribeToken = crypto.randomBytes(24).toString('base64url');
  const unsubscribeTokenHash = crypto.createHash('sha256').update(unsubscribeToken).digest('hex');
  const confirmSubscription = db.transaction(() => {
    db.prepare(`INSERT INTO newsletter_subscribers (id, profile_id, block_id, email, created_at, unsubscribe_token_hash)
      VALUES (?, ?, ?, ?, ?, ?)`).run(subscriberId, pending.profileId, pending.blockId, pending.email, now, unsubscribeTokenHash);
    db.prepare(`INSERT INTO newsletter_consents (subscriber_id, consented_at, confirmed_at, consent_method, consent_copy_version)
      VALUES (?, ?, ?, 'double_opt_in', ?)`).run(subscriberId, pending.consentedAt, now, pending.consentCopyVersion);
    db.prepare('INSERT INTO newsletter_unsubscribe_tokens (token_hash, subscriber_id, created_at) VALUES (?, ?, ?)')
      .run(unsubscribeTokenHash, subscriberId, now);
    db.prepare('DELETE FROM newsletter_pending_subscriptions WHERE id = ?').run(pending.id);
  });
  try {
    confirmSubscription();
  } catch (error: any) {
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      db.prepare('DELETE FROM newsletter_pending_subscriptions WHERE id = ?').run(pending.id);
      return res.type('html').send(renderConfirmationPage({ title: 'Already subscribed / مشترك بالفعل', body: 'This email is already confirmed for the creator’s updates. / تم تأكيد هذا البريد الإلكتروني لتلقي تحديثات المبدع.' }));
    }
    console.error('Newsletter confirmation could not be saved:', error?.name || 'unknown error');
    return res.status(500).type('html').send(renderConfirmationPage({ title: 'Confirmation failed / تعذر التأكيد', body: 'Please try again later. / يرجى المحاولة لاحقاً.' }));
  }

  const unsubscribeUrl = `${publicOrigin(req)}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  return res.type('html').send(renderConfirmationPage({
    title: 'Subscription confirmed / تم تأكيد الاشتراك',
    body: 'Your email is now on the creator’s subscriber list. / تمت إضافة بريدك الإلكتروني إلى قائمة المشتركين لدى المبدع.',
    unsubscribeUrl
  }));
});

newsletterRouter.get('/api/newsletter/unsubscribe', (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) return res.status(400).send('A valid unsubscribe link is required.');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const result = db.prepare(`DELETE FROM newsletter_subscribers WHERE unsubscribe_token_hash = ?
    OR id IN (SELECT subscriber_id FROM newsletter_unsubscribe_tokens WHERE token_hash = ?)`)
    .run(tokenHash, tokenHash);
  res.setHeader('Cache-Control', 'no-store');
  if (result.changes === 0) return res.status(404).send('This unsubscribe link is invalid or has already been used.');
  return res.status(200).send('You have been unsubscribed successfully.');
});

// Authenticated: Get subscriber list for studio
newsletterRouter.get('/api/studio/subscribers', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.user!.profileId;
    const subscribers = db.prepare(`
      SELECT s.id, s.email, s.created_at, c.consented_at, c.confirmed_at, c.consent_method, c.consent_copy_version
      FROM newsletter_subscribers s
      LEFT JOIN newsletter_consents c ON c.subscriber_id = s.id
      WHERE s.profile_id = ?
      ORDER BY s.created_at DESC
    `).all(profileId) as any[];

    res.json({
      count: subscribers.length,
      subscribers: subscribers.map(s => ({
        id: s.id,
        email: s.email,
        subscribedAt: new Date(s.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        consentedAt: s.consented_at ? new Date(s.consented_at).toISOString() : null,
        confirmedAt: s.confirmed_at ? new Date(s.confirmed_at).toISOString() : null,
        consentMethod: s.consent_method || 'legacy_unknown',
        consentCopyVersion: s.consent_copy_version || 'legacy-unknown'
      }))
    });
  } catch (err: any) {
    console.error('Fetch subscribers error:', err);
    res.status(500).json({ error: 'Failed to retrieve subscribers.' });
  }
});

// Authenticated: Export subscribers as CSV
newsletterRouter.get('/api/studio/subscribers/export', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.user!.profileId;
    const subscribers = db.prepare(`
      SELECT s.email, s.created_at, c.consented_at, c.confirmed_at, c.consent_method, c.consent_copy_version
      FROM newsletter_subscribers s
      LEFT JOIN newsletter_consents c ON c.subscriber_id = s.id
      WHERE s.profile_id = ?
      ORDER BY s.created_at DESC
    `).all(profileId) as any[];

    const headers = ['Email', 'Subscribed At', 'Consent Given At (UTC)', 'Confirmed At (UTC)', 'Consent Method', 'Consent Copy Version'];
    const rows = subscribers.map(s => [
      s.email,
      new Date(s.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      s.consented_at ? new Date(s.consented_at).toISOString() : '',
      s.confirmed_at ? new Date(s.confirmed_at).toISOString() : '',
      s.consent_method || 'legacy_unknown',
      s.consent_copy_version || 'legacy-unknown'
    ]);

    const escapeCsvCell = (value: unknown) => {
      let cell = String(value ?? '');
      if (/^[=+\-@]/.test(cell)) cell = `'${cell}`;
      return `"${cell.replace(/"/g, '""')}"`;
    };
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsvCell).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
    res.setHeader('Cache-Control', 'no-store');
    res.send(csvContent);
  } catch (err: any) {
    console.error('Export subscribers error:', err);
    res.status(500).json({ error: 'Failed to export subscribers.' });
  }
});

newsletterRouter.delete('/api/studio/subscribers/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM newsletter_subscribers
      WHERE id = ? AND profile_id = ?
    `).run(req.params.id, req.user!.profileId);
    if (result.changes === 0) return res.status(404).json({ error: 'Subscriber not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete subscriber error:', err);
    res.status(500).json({ error: 'Failed to remove subscriber.' });
  }
});
