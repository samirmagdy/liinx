import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { hashPassword, comparePassword, signJwt } from '../auth.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { RESERVED_USERNAMES } from '../../src/config/brand.js';

export const authRouter = Router();

function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username may only contain lowercase letters, numbers, and underscores')
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required')
});

// Check username availability
authRouter.get('/check-username/:username', (req, res) => {
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
authRouter.post('/register', (req, res) => {
  try {
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
    const userId = 'usr_' + Math.random().toString(36).substring(2, 10);
    const profileId = 'prf_' + Math.random().toString(36).substring(2, 10);
    const passwordHash = hashPassword(password);
    const displayName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);

    const starterSocials = JSON.stringify([
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'email', url: `mailto:${cleanEmail}` }
    ]);

    const starterBlockId = 'blk_' + Math.random().toString(36).substring(2, 10);

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

      // Starter link block
      db.prepare(`
        INSERT INTO blocks (
          id, profile_id, type, title, url, subtitle, badge, highlighted, position, extra_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        starterBlockId,
        profileId,
        'link',
        'My Website',
        'https://liinx.co',
        'Check out my official website',
        'NEW',
        1,
        0,
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
      username: cleanUsername
    });

    res.status(201).json({
      token,
      user: { id: userId, email: cleanEmail, username: cleanUsername },
      profileId
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during registration.' });
  }
});

// Login
authRouter.post('/login', (req, res) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { email, password } = parse.data;
    const cleanEmail = email.toLowerCase().trim();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;
    if (!user || !comparePassword(password, user.password_hash)) {
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
      username: profile.username
    });

    res.json({
      token,
      user: { id: user.id, email: user.email, username: profile.username },
      profileId: profile.id
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
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
authRouter.delete('/account', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const deleteAccountTx = db.transaction(() => {
      // Find all profiles for this user
      const userProfiles = db.prepare('SELECT id FROM profiles WHERE user_id = ?').all(userId) as { id: string }[];
      const profileIds = userProfiles.map(p => p.id);

      if (profileIds.length > 0) {
        for (const pId of profileIds) {
          db.prepare('DELETE FROM link_clicks WHERE profile_id = ?').run(pId);
          db.prepare('DELETE FROM profile_views WHERE profile_id = ?').run(pId);
          db.prepare('DELETE FROM newsletter_subscribers WHERE profile_id = ?').run(pId);
          db.prepare('DELETE FROM instagram_sync WHERE profile_id = ?').run(pId);
          db.prepare('DELETE FROM api_keys WHERE profile_id = ?').run(pId);
          db.prepare('DELETE FROM blocks WHERE profile_id = ?').run(pId);
        }
        db.prepare('DELETE FROM profiles WHERE user_id = ?').run(userId);
      }

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
