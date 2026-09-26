import { Router } from 'express';
import { db } from '../db.js';
import { hashPassword, comparePassword } from '../auth.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  RESERVED_USERNAMES,
  registerSchema,
  loginSchema,
  resetRequestSchema,
  resetConfirmSchema,
  deletionSchema,
  changePasswordSchema,
  updateEmailSchema,
  findSiteTemplate,
  intentStartingCategory,
  SEED_AVATAR_URL, SEED_BIO, SEED_BLOCK_TITLE, SEED_BLOCK_URL, SEED_INSTAGRAM_HOME_URL,
  type SiteTemplate
} from '../../shared/index.js';
import { createId } from '../utils/ids.js';
import { applySiteTemplate, createHomePage, insertBlocks, newBlockId } from '../services/siteComposition.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { cancelStripeSubscription } from '../services/billingCancellation.js';
import { createHash, randomBytes } from 'node:crypto';
import { EmailDeliveryUnavailable, sendTransactionalEmail } from '../services/email.js';
import { storageKeyFromUrl, uploadStorage } from '../services/uploadStorage.js';
import { testOnlySessionToken } from './sessionResponse.js';
import { issueCurrentSession } from '../services/session.js';
import { consumePasswordResetToken } from '../services/passwordReset.js';
import { qualifyCreatorReferral, recordCreatorReferral } from '../services/referrals.js';
import { recordAgencyReferral } from '../services/agencyReferrals.js';
import { getEffectivePlan } from '../accountEntitlements.js';
import { serverMarketingEvent } from '../services/marketingEvents.js';

export const authRouter = Router();

function setSessionCookie(res: any, token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `raloa_session=${encodeURIComponent(token)}; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax${secure}`);
}

// In-memory sliding-window rate limiters for auth
const loginAttempts = new Map<string, number[]>();
const registerAttempts = new Map<string, number[]>();

// Static dummy hash computed once to prevent user enumeration via timing attack
const DUMMY_BCRYPT_HASH = hashPassword('dummy_timing_salt_raloa_2026');

// Purge stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of loginAttempts.entries()) {
    const valid = timestamps.filter(t => now - t < 15 * 60 * 1000);
    if (valid.length === 0) loginAttempts.delete(key);
    else loginAttempts.set(key, valid);
  }
  for (const [key, timestamps] of registerAttempts.entries()) {
    const valid = timestamps.filter(t => now - t < 60 * 60 * 1000);
    if (valid.length === 0) registerAttempts.delete(key);
    else registerAttempts.set(key, valid);
  }
}, 300000).unref();

export function isLoginRateLimited(ip: string, limit = process.env.NODE_ENV === 'test' ? 100 : 10, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const timestamps = (loginAttempts.get(ip) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= limit) return true;
  timestamps.push(now);
  loginAttempts.set(ip, timestamps);
  return false;
}

export function isRegisterRateLimited(ip: string, limit = process.env.NODE_ENV === 'test' ? 100 : 15, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const timestamps = (registerAttempts.get(ip) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= limit) return true;
  timestamps.push(now);
  registerAttempts.set(ip, timestamps);
  return false;
}

export function resetAuthRateLimits() {
  loginAttempts.clear();
  registerAttempts.clear();
}

function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}



function hashAccountToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function accountOrigin(): string {
  return (process.env.APP_ORIGIN || 'http://localhost:3050').replace(/\/$/, '');
}

function transactionalEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_FROM_EMAIL);
}

/**
 * Issues a single-use account token (email verification or password reset).
 *
 * The token is bound to `subjectValue` (the email address being acted on) via a
 * SHA-256 hash stored in `subject_value_hash`. The confirmation handler rejects
 * any token whose bound email no longer matches the account's current email,
 * preventing a credential-swap bypass where an attacker verifies a new email
 * using a token issued for the old one.
 */
async function issueAccountToken(
  userId: string,
  email: string,
  purpose: 'password_reset' | 'email_verification',
  subjectValue: string
): Promise<boolean> {
  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashAccountToken(rawToken);
  const subjectHash = createHash('sha256').update(subjectValue.toLowerCase().trim()).digest('hex');
  const now = Date.now();
  const expiresAt = now + (purpose === 'password_reset' ? 60 : 24 * 60) * 60 * 1000;
  db.transaction(() => {
    db.prepare('DELETE FROM account_tokens WHERE expires_at <= ? OR used_at IS NOT NULL').run(now);
    db.prepare('UPDATE account_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL').run(now, userId, purpose);
    db.prepare('INSERT INTO account_tokens (token_hash, user_id, purpose, subject_value_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(tokenHash, userId, purpose, subjectHash, expiresAt, now);
  })();
  const path = purpose === 'password_reset' ? '/reset-password' : '/verify-email';
  const subject = purpose === 'password_reset' ? 'Reset your RALOA password' : 'Verify your RALOA email address';
  try {
    await sendTransactionalEmail({
      to: email,
      subject,
      text: `Use this one-time RALOA link before it expires: ${accountOrigin()}${path}?token=${encodeURIComponent(rawToken)}`
    });
    return true;
  } catch (error) {
    db.prepare('DELETE FROM account_tokens WHERE token_hash = ?').run(tokenHash);
    if (error instanceof EmailDeliveryUnavailable) return false;
    throw error;
  }
}

authRouter.post('/password-reset/request', sharedRateLimit({ name: 'password-reset', limit: 5, windowMs: 60 * 60 * 1000 }), async (req, res) => {
  const parsed = resetRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!transactionalEmailConfigured()) return res.status(503).json({ error: 'Password reset email is temporarily unavailable. Please try again later.' });
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(parsed.data.email.toLowerCase().trim()) as { id: string; email: string } | undefined;
  if (!user) return res.status(202).json({ message: 'If an account exists, reset instructions will be sent.' });
  try {
    const available = await issueAccountToken(user.id, user.email, 'password_reset', user.email);
    if (!available) return res.status(503).json({ error: 'Password reset email is temporarily unavailable. Please try again later.' });
  } catch (error) {
    console.error('Password reset delivery failed:', error instanceof Error ? error.message : 'unknown provider error');
    return res.status(503).json({ error: 'Password reset email is temporarily unavailable. Please try again later.' });
  }
  return res.status(202).json({ message: 'If an account exists, reset instructions will be sent.' });
});

authRouter.post('/password-reset/confirm', sharedRateLimit({ name: 'password-reset-confirm', limit: 10, windowMs: 60 * 60 * 1000 }), (req, res) => {
  const parsed = resetConfirmSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Use a valid, new password and reset token.' });
  const now = Date.now();
  const tokenHash = hashAccountToken(parsed.data.token);
  const consumed = consumePasswordResetToken(db, tokenHash, now, hashPassword(parsed.data.password));
  if (!consumed) return res.status(400).json({ error: 'This reset link is invalid or expired.' });
  return res.json({ success: true, message: 'Your password was reset. Please sign in again.' });
});

authRouter.post('/email-verification/request', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = db.prepare('SELECT email, email_verified_at FROM users WHERE id = ?').get(req.user!.userId) as { email: string; email_verified_at?: number | null } | undefined;
  if (!user) return res.status(401).json({ error: 'User account not found.' });
  if (user.email_verified_at) return res.json({ verified: true, message: 'This email is already verified.' });
  try {
    const available = await issueAccountToken(req.user!.userId, user.email, 'email_verification', user.email);
    if (!available) return res.status(503).json({ error: 'Email verification is temporarily unavailable. Please try again later.' });
  } catch (error) {
    console.error('Email verification delivery failed:', error instanceof Error ? error.message : 'unknown provider error');
    return res.status(503).json({ error: 'Email verification is temporarily unavailable. Please try again later.' });
  }
  return res.status(202).json({ verified: false, message: 'Verification instructions will be sent.' });
});

authRouter.post('/email-verification/confirm', sharedRateLimit({ name: 'email-verification-confirm', limit: 10, windowMs: 60 * 60 * 1000 }), (req, res) => {
  const tokenValue = typeof req.body?.token === 'string' ? req.body.token : '';
  if (tokenValue.length < 32 || tokenValue.length > 200) return res.status(400).json({ error: 'This verification link is invalid or expired.' });
  const now = Date.now();
  const tokenHash = hashAccountToken(tokenValue);
  const token = db.prepare(
    'SELECT user_id, subject_value_hash FROM account_tokens WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?'
  ).get(tokenHash, 'email_verification', now) as { user_id: string; subject_value_hash: string | null } | undefined;
  if (!token) return res.status(400).json({ error: 'This verification link is invalid or expired.' });

  // Enforce email snapshot binding: the token must have been issued for the
  // account's *current* email address. This prevents an attacker from using a
  // verification token that was sent to an old email to verify a newly-changed
  // email that was never actually sent a verification message.
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(token.user_id) as { email: string } | undefined;
  if (!user) return res.status(400).json({ error: 'This verification link is invalid or expired.' });
  const currentEmailHash = createHash('sha256').update(user.email.toLowerCase().trim()).digest('hex');
  if (!token.subject_value_hash || token.subject_value_hash !== currentEmailHash) {
    return res.status(400).json({ error: 'This verification link is invalid or expired.' });
  }

  db.transaction(() => {
    db.prepare('UPDATE users SET email_verified_at = ? WHERE id = ?').run(now, token.user_id);
    db.prepare('UPDATE account_tokens SET used_at = ? WHERE token_hash = ?').run(now, tokenHash);
  })();
  qualifyCreatorReferral(token.user_id, now);
  return res.json({ success: true, verified: true });
});

// Check username availability
authRouter.get('/check-username/:username', sharedRateLimit({ name: 'username-check', limit: 60, windowMs: 60 * 60 * 1000 }), (req, res) => {
  const cleanUsername = req.params.username.toLowerCase().trim();
  if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
    return res.json({ available: false, reason: 'Invalid format (3-30 lowercase characters)' });
  }

  if (RESERVED_USERNAMES.includes(cleanUsername as any)) {
    return res.json({ available: false, reason: 'This username is reserved by the system' });
  }

  const existing = db.prepare('SELECT id FROM profiles WHERE username = ?').get(cleanUsername);
  res.json({ available: !existing, username: cleanUsername });
});

function registrationReferrerId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const username = value.toLowerCase().trim().replace(/[^a-z0-9_]/g, '').slice(0, 30);
  if (!username) return undefined;
  return (db.prepare('SELECT user_id FROM profiles WHERE username = ? AND user_id IS NOT NULL').get(username) as { user_id: string } | undefined)?.user_id;
}

function createRegisteredAccount(input: {
  userId: string; profileId: string; username: string; email: string; passwordHash: string;
  inviterId?: string; agencyInviterId?: string; now: number; template?: SiteTemplate; intent?: string;
}): void {
  const { userId, profileId, username, email, passwordHash, inviterId, agencyInviterId, now, template, intent } = input;
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  // A starter site is only allowed to promise what it can deliver, so a template account starts
  // with the one social that is genuinely known at signup and no photo of a stranger.
  const starterSocials = JSON.stringify(template
    ? [{ platform: 'email', url: `mailto:${email}` }]
    : [
      { platform: 'instagram', url: SEED_INSTAGRAM_HOME_URL },
      { platform: 'email', url: `mailto:${email}` }
    ]);
  const starterAvatar = template ? null : SEED_AVATAR_URL;
  // A starter site carries its own category; an account that skips one is filed under the discipline its owner declared.
  const category = template?.category || intentStartingCategory(intent) || 'Creator';
  db.transaction(() => {
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(userId, email, passwordHash, now);
    if (inviterId) recordCreatorReferral(inviterId, userId, now);
    if (agencyInviterId) recordAgencyReferral(agencyInviterId, userId, now);
    db.prepare(`INSERT INTO profiles (
      id, user_id, username, display_name, bio, avatar_url, category, verified, theme_id, socials_json, signup_intent, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(profileId, userId, username, displayName, template ? '' : SEED_BIO,
        starterAvatar,
        category, 0, template?.themeId || 'editorial-stone', starterSocials, template?.intent || intent || null, now, now);
    const homePageId = createHomePage(profileId, displayName, null, now);
    if (template) {
      applySiteTemplate(profileId, template, 'append');
      return;
    }
    insertBlocks(profileId, [{
      id: newBlockId(), type: 'link', title: SEED_BLOCK_TITLE, url: SEED_BLOCK_URL,
      subtitle: 'Check out my official website', icon: null, badge: 'NEW', highlighted: true, visible: true,
      position: 0, startAt: null, endAt: null, pageId: homePageId, extraJson: null
    }], now);
  })();
}

// Register new user & creator profile
authRouter.post('/register', sharedRateLimit({ name: 'register', limit: 15, windowMs: 60 * 60 * 1000 }), (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    if (isRegisterRateLimited(ip)) {
      return res.status(429).json({ error: 'Too many account registrations from this network. Please try again later.' });
    }

    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { email, password, username } = parse.data;
    const template = parse.data.templateId ? findSiteTemplate(parse.data.templateId) : undefined;
    if (parse.data.templateId && !template) {
      return res.status(400).json({ error: 'That starter site does not exist. Choose another or continue without one.' });
    }
    const inviterId = registrationReferrerId(req.body?.referral);
    const agencyInviterId = registrationReferrerId(req.body?.agencyReferral);
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    // Check reserved usernames
    if (RESERVED_USERNAMES.includes(cleanUsername as any)) {
      return res.status(400).json({ error: 'This username is reserved and cannot be claimed.' });
    }

    // Check existing email
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Check existing username
    const existingProfile = db.prepare('SELECT id FROM profiles WHERE username = ?').get(cleanUsername);
    if (existingProfile) {
      return res.status(409).json({ error: 'This username is already taken. Please choose another.' });
    }

    const now = Date.now();
    const userId = createId('usr');
    const profileId = createId('prf');
    const passwordHash = hashPassword(password);
    createRegisteredAccount({ userId, profileId, username: cleanUsername, email: cleanEmail, passwordHash, inviterId, agencyInviterId, now, template, intent: parse.data.intent });

    const token = issueCurrentSession(userId, profileId, cleanUsername, cleanEmail);
    setSessionCookie(res, token);
    serverMarketingEvent('signup_completed', '/register', 'en', userId, { hasTemplate: Boolean(template) });

    res.status(201).json({
      ...testOnlySessionToken(token),
      user: { id: userId, email: cleanEmail, username: cleanUsername },
      profileId
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during registration.' });
  }
});

// Login
authRouter.post('/login', sharedRateLimit({ name: 'login', limit: 20, windowMs: 15 * 60 * 1000 }), (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    if (isLoginRateLimited(ip)) {
      return res.status(429).json({ error: 'Too many login attempts. Please try again in 15 minutes.' });
    }

    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { email, password } = parse.data;
    const cleanEmail = email.toLowerCase().trim();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;
    
    // Constant-time check: if user not found, compare with dummy hash to prevent user enumeration via timing
    const targetHash = user ? user.password_hash : DUMMY_BCRYPT_HASH;
    const isMatch = comparePassword(password, targetHash);

    if (!user || !isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id) as any;
    if (!profile) {
      return res.status(404).json({ error: 'Associated profile not found.' });
    }

    const token = issueCurrentSession(user.id, profile.id, profile.username, user.email);
    setSessionCookie(res, token);

    res.json({
      ...testOnlySessionToken(token),
      user: { id: user.id, email: user.email, username: profile.username },
      profileId: profile.id
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
});

authRouter.post('/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  db.prepare('UPDATE users SET session_version = session_version + 1 WHERE id = ?').run(req.user!.userId);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `raloa_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`);
  res.json({ success: true });
});

// Get current authenticated user and profile
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const blocks = db.prepare('SELECT * FROM blocks WHERE profile_id = ? ORDER BY position ASC').all(profile.id);

    res.json({
      user: {
        id: req.user!.userId,
        email: req.user!.email,
        username: req.user!.username
      },
      profile: {
        ...profile,
        plan: getEffectivePlan(profile.id),
        verified: Boolean(profile.verified),
        socials: safeJsonParse(profile.socials_json, []),
        customTheme: safeJsonParse(profile.custom_theme_json, null),
        blocks: blocks.map((b: any) => ({
          ...b,
          highlighted: Boolean(b.highlighted),
          extra: safeJsonParse(b.extra_json, null)
        }))
      }
    });
  } catch (err: any) {
    console.error('Auth /me error:', err);
    res.status(500).json({ error: 'Failed to retrieve authenticated session.' });
  }
});

// Change password
authRouter.post('/change-password', requireAuth, sharedRateLimit({ name: 'change-password', limit: 10, windowMs: 15 * 60 * 1000 }), (req: AuthenticatedRequest, res) => {
  try {
    const parse = changePasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const userId = req.user!.userId;
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as any;
    if (!user || !comparePassword(parse.data.currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newHash = hashPassword(parse.data.newPassword);
    db.prepare('UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?').run(newHash, userId);

    const token = issueCurrentSession(userId, req.user!.profileId, req.user!.username, req.user!.email);
    setSessionCookie(res, token);

    res.json({ success: true, message: 'Password updated successfully.', ...testOnlySessionToken(token) });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

// Update email address
authRouter.post('/update-email', requireAuth, sharedRateLimit({ name: 'update-email', limit: 5, windowMs: 60 * 60 * 1000 }), (req: AuthenticatedRequest, res) => {
  try {
    const parse = updateEmailSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const userId = req.user!.userId;
    const cleanEmail = parse.data.email.toLowerCase().trim();

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as any;
    if (!user || !comparePassword(parse.data.password, user.password_hash)) {
      return res.status(401).json({ error: 'Password is incorrect.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(cleanEmail, userId);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const now = Date.now();
    db.transaction(() => {
      db.prepare('UPDATE users SET email = ?, email_verified_at = NULL, session_version = session_version + 1 WHERE id = ?').run(cleanEmail, userId);
      // Invalidate any pending tokens bound to the old credential. This is
      // defence-in-depth alongside the subject_value_hash check in the confirm
      // handler: even a token issued before this fix deploys cannot be replayed.
      db.prepare(
        "UPDATE account_tokens SET used_at = ? WHERE user_id = ? AND purpose IN ('email_verification', 'password_reset') AND used_at IS NULL"
      ).run(now, userId);
    })();

    const token = issueCurrentSession(userId, req.user!.profileId, req.user!.username, cleanEmail);
    setSessionCookie(res, token);

    res.json({ success: true, email: cleanEmail, message: 'Email address updated successfully.', ...testOnlySessionToken(token) });
  } catch (err: any) {
    console.error('Update email error:', err);
    res.status(500).json({ error: 'Failed to update email address.' });
  }
});

// Export complete account data (GDPR / Data Portability)
authRouter.get('/export-data', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = db.prepare('SELECT id, email, created_at, email_verified_at FROM users WHERE id = ?').get(userId) as any;
    const profiles = db.prepare('SELECT * FROM profiles WHERE user_id = ?').all(userId) as any[];

    const fullExport: any = {
      account: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        emailVerifiedAt: user.email_verified_at
      },
      exportedAt: Date.now(),
      profiles: profiles.map((p: any) => {
        const pages = db.prepare('SELECT * FROM pages WHERE profile_id = ?').all(p.id);
        const blocks = db.prepare('SELECT * FROM blocks WHERE profile_id = ?').all(p.id);
        const subscribers = db.prepare(`SELECT s.email, s.created_at, c.consented_at, c.confirmed_at,
          c.consent_method, c.consent_copy_version
          FROM newsletter_subscribers s LEFT JOIN newsletter_consents c ON c.subscriber_id = s.id
          WHERE s.profile_id = ?`).all(p.id);
        const forms = db.prepare('SELECT form_title, field_labels_json, fields_json, created_at FROM form_submissions WHERE profile_id = ?').all(p.id);
        return {
          ...p,
          pages,
          blocks,
          subscribers,
          formSubmissions: forms
        };
      })
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="raloa-data-export-${req.user!.username}-${Date.now()}.json"`);
    res.json(fullExport);
  } catch (err: any) {
    console.error('Data export error:', err);
    res.status(500).json({ error: 'Failed to generate account data export.' });
  }
});

// Delete account & all associated data permanently (GDPR / Privacy compliance)
authRouter.delete('/account', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const confirmation = deletionSchema.safeParse(req.body);
    if (!confirmation.success) return res.status(400).json({ error: 'Enter your current password and type DELETE to permanently delete this account.' });
    const userId = req.user!.userId;
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as { password_hash: string } | undefined;
    if (!user || !comparePassword(confirmation.data.password, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    const subscriptions = db.prepare(`
      SELECT stripe_subscription_id FROM users WHERE id = ? AND stripe_subscription_id IS NOT NULL
      UNION
      SELECT stripe_subscription_id FROM profiles WHERE user_id = ? AND stripe_subscription_id IS NOT NULL
    `).all(userId, userId) as { stripe_subscription_id: string }[];
    // Cancel provider subscriptions first. If Stripe is unavailable, retain the
    // account so the operation can be retried instead of deleting local state.
    for (const subscription of subscriptions) await cancelStripeSubscription(subscription.stripe_subscription_id);
    const uploadRows = db.prepare('SELECT path FROM uploaded_files WHERE owner_user_id = ?').all(userId) as { path: string }[];
    const uploadPaths = new Set(uploadRows.map(row => row.path));

    // Remove media before deleting its ownership rows. A provider failure must
    // leave the account intact so deletion can be retried honestly.
    for (const uploadPath of uploadPaths) {
      const key = storageKeyFromUrl(uploadPath);
      if (key && !(await uploadStorage.delete(key))) {
        return res.status(503).json({ error: 'Account deletion is temporarily unavailable because uploaded media could not be removed. Please retry.' });
      }
    }

    const deleteAccountTx = db.transaction(() => {
      // Find all profiles for this user
      const userProfiles = db.prepare('SELECT id FROM profiles WHERE user_id = ?').all(userId) as { id: string }[];
      const profileIds = userProfiles.map(p => p.id);

      if (profileIds.length > 0) {
        for (const pId of profileIds) {
          db.prepare('DELETE FROM link_clicks WHERE profile_id = ?').run(pId);
          db.prepare('DELETE FROM profile_views WHERE profile_id = ?').run(pId);
          db.prepare('DELETE FROM newsletter_subscribers WHERE profile_id = ?').run(pId);
          db.prepare('DELETE FROM form_submissions WHERE profile_id = ?').run(pId);
          db.prepare('DELETE FROM instagram_sync WHERE profile_id = ?').run(pId);
          db.prepare('DELETE FROM api_keys WHERE profile_id = ?').run(pId);
          db.prepare('DELETE FROM blocks WHERE profile_id = ?').run(pId);
        }
        db.prepare('DELETE FROM uploaded_files WHERE owner_user_id = ?').run(userId);
        db.prepare('DELETE FROM pages WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = ?)').run(userId);
        db.prepare('DELETE FROM profiles WHERE user_id = ?').run(userId);
      }

      db.prepare('DELETE FROM account_tokens WHERE user_id = ?').run(userId);
      // Delete user
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });

    deleteAccountTx();

    res.json({ success: true, message: 'Your account and all associated profile data have been permanently deleted.' });
  } catch (err: any) {
    console.error('Account deletion error:', err);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});
