import crypto from 'node:crypto';

function getKey(): Buffer {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY || (process.env.NODE_ENV === 'production' ? '' : process.env.JWT_SECRET);
  if (!raw) throw new Error('INTEGRATION_ENCRYPTION_KEY is required for integrations.');
  const key = Buffer.from(raw, /^[0-9a-f]{64}$/i.test(raw) ? 'hex' : 'base64');
  if (key.length !== 32) throw new Error('INTEGRATION_ENCRYPTION_KEY must decode to exactly 32 bytes.');
  return key;
}

export function encryptSecret(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${body.toString('base64')}`;
}

export function decryptSecret(value: string): string {
  if (!value.startsWith('v1:')) return value;
  const [, iv, tag, body] = value.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(body, 'base64')), decipher.final()]).toString('utf8');
}
