import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import 'dotenv/config';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('Production requires a JWT_SECRET of at least 32 characters.');
}
const JWT_SECRET = process.env.JWT_SECRET || randomBytes(48).toString('hex');

export interface AuthPayload {
  userId: string;
  email: string;
  profileId: string;
  username: string;
  sessionVersion?: number;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signJwt(payload: AuthPayload, options: Pick<SignOptions, 'expiresIn'> = {}): string {
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn: options.expiresIn || '7d' });
}

export function verifyJwt(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded !== 'object' || decoded === null) return null;
    const payload = decoded as Record<string, unknown>;
    if (typeof payload.userId !== 'string' || typeof payload.email !== 'string' || typeof payload.profileId !== 'string' || typeof payload.username !== 'string') return null;
    if (payload.sessionVersion !== undefined && (typeof payload.sessionVersion !== 'number' || !Number.isInteger(payload.sessionVersion))) return null;
    return payload as unknown as AuthPayload;
  } catch (err) {
    return null;
  }
}
