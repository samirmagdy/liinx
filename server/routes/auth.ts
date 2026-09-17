import { Router } from 'express';
import { db } from '../db.js';
import { hashPassword, comparePassword, signJwt } from '../auth.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  RESERVED_USERNAMES,
  brand,
  registerSchema,
  loginSchema,
  resetRequestSchema,
  resetConfirmSchema,
  deletionSchema
} from '../../shared/index.js';
import { createId } from '../utils/ids.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { cancelStripeSubscription } from '../services/billingCancellation.js';
import { createHash, randomBytes } from 'node:crypto';
import { EmailDeliveryUnavailable, sendTransactionalEmail } from '../services/email.js';
import { storageKeyFromUrl, uploadStorage } from '../services/uploadStorage.js';
import { testOnlySessionToken } from './sessionResponse.js';

export const authRouter = Router();

function setSessionCookie(res: any, token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `liinx_session=${encodeURIComponent(token)}; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax${secure}`);
}

// In-memory sliding-window rate limiters for auth
const loginAttempts = new Map<string, number[]>();
const registerAttempts = new Map<string, number[]>();

// Static dummy hash computed once to prevent user enumeration via timing attack
const DUMMY_BCRYPT_HASH = hashPassword('dummy_timing_salt_liinx_2026');

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

async function issueAccountToken(userId: string, email: string, purpose: 'password_reset' | 'email_verification'): Promise<boolean> {
  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashAccountToken(rawToken);
  const now = Date.now();
  const expiresAt = now + (purpose === 'password_reset' ? 60 : 24 * 60) * 60 * 1000;
  db.transaction(() => {
    db.prepare('DELETE FROM account_tokens WHERE expires_at <= ? OR used_at IS NOT NULL').run(now);
    db.prepare('UPDATE account_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL').run(now, userId, purpose);
    db.prepare('INSERT INTO account_tokens (token_hash, user_id, purpose, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(tokenHash, userId, purpose, expiresAt, now);
  })();
  const path = purpose === 'password_reset' ? '/reset-password' : '/verify-email';
  const subject = purpose === 'password_reset' ? 'Reset your LIINX password' : 'Verify your LIINX email address';
  try {
    await sendTransactionalEmail({
      to: email,
      subject,
      text: `Use this one-time LIINX link before it expires: ${accountOrigin()}${path}?token=${encodeURIComponent(rawToken)}`
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
    const available = await issueAccountToken(user.id, user.email, 'password_reset');
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
  const token = db.prepare('SELECT user_id FROM account_tokens WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?').get(tokenHash, 'password_reset', now) as { user_id: string } | undefined;
  if (!token) return res.status(400).json({ error: 'This reset link is invalid or expired.' });
  db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?').run(hashPassword(parsed.data.password), token.user_id);
    db.prepare('UPDATE account_tokens SET used_at = ? WHERE token_hash = ?').run(now, tokenHash);
  })();
  return res.json({ success: true, message: 'Your password was reset. Please sign in again.' });
});

authRouter.post('/email-verification/request', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = db.prepare('SELECT email, email_verified_at FROM users WHERE id = ?').get(req.user!.userId) as { email: string; email_verified_at?: number | null } | undefined;
  if (!user) return res.status(401).json({ error: 'User account not found.' });
  if (user.email_verified_at) return res.json({ verified: true, message: 'This email is already verified.' });
  try {
    const available = await issueAccountToken(req.user!.userId, user.email, 'email_verification');
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
  const token = db.prepare('SELECT user_id FROM account_tokens WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?').get(tokenHash, 'email_verification', now) as { user_id: string } | undefined;
  if (!token) return res.status(400).json({ error: 'This verification link is invalid or expired.' });
  db.transaction(() => {
    db.prepare('UPDATE users SET email_verified_at = ? WHERE id = ?').run(now, token.user_id);
    db.prepare('UPDATE account_tokens SET used_at = ? WHERE token_hash = ?').run(now, tokenHash);
  })();
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
    const displayName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);

    const starterSocials = JSON.stringify([
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'email', url: `mailto:${cleanEmail}` }
    ]);

    const starterBlockId = createId('blk');

    // Transaction for atomic registration
    const registerTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, created_at)
        VALUES (?, ?, ?, ?)
      `).run(userId, cleanEmail, passwordHash, now);

      db.prepare(`
        INSERT INTO profiles (
          id, user_id, username, display_name, bio, avatar_url, category, verified, theme_id, socials_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        profileId,
        userId,
        cleanUsername,
        displayName,
        'Welcome to my links! Tap below to explore my latest updates.',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
        'Creator',
        0,
        'editorial-stone',
        starterSocials,
        now,
        now
      );

      const homePageId = createId('page');
      db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, 'home', ?, NULL, 0, 1, 1, ?, ?)`)
        .run(homePageId, profileId, displayName, now, now);

      // Starter link block
      db.prepare(`
        INSERT INTO blocks (
          id, profile_id, type, title, url, subtitle, badge, highlighted, position, page_id, extra_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        starterBlockId,
        profileId,
        'link',
        'My Website',
        `https://${brand.domain}`,
        'Check out my official website',
        'NEW',
        1,
        0,
        homePageId,
        null,
        now,
        now
      );
    });

    registerTx();

    const token = signJwt({
      userId,
      email: cleanEmail,
      profileId,
      username: cleanUsername,
      sessionVersion: 1
    });
    setSessionCookie(res, token);

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

    const token = signJwt({
      userId: user.id,
      email: user.email,
      profileId: profile.id,
      username: profile.username,
      sessionVersion: Number(user.session_version || 1)
    });
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
  res.setHeader('Set-Cookie', `liinx_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`);
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

// Delete account & all associated data permanently (GDPR / Privacy compliance)
authRouter.delete('/account', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const confirmation = deletionSchema.safeParse(req.body);
    if (!confirmation.success) return res.status(400).json({ error: 'Type DELETE in the confirmation field to permanently delete this account.' });
    const userId = req.user!.userId;
    const subscriptions = db.prepare('SELECT stripe_subscription_id FROM profiles WHERE user_id = ? AND stripe_subscription_id IS NOT NULL').all(userId) as { stripe_subscription_id: string }[];
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
