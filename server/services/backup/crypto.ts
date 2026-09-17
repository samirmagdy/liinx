import crypto from 'node:crypto';
import fs from 'node:fs';

export function computeSha256(data: Buffer | string): string {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

export function computeFileSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return computeSha256(fileBuffer);
}

export function derive32ByteKey(secret: string): Buffer {
  const trimmed = secret.trim();
  // 64-char hex string
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }
  // 32-byte base64 string
  try {
    const b64Buf = Buffer.from(trimmed, 'base64');
    if (b64Buf.length === 32) return b64Buf;
  } catch {
    // Fall through to hash derivation
  }
  // Generic passphrase -> SHA-256 derived key
  return crypto.createHash('sha256').update(trimmed).digest();
}

export interface EncryptedPayload {
  ciphertext: Buffer;
  ivHex: string;
  tagHex: string;
}

export function encryptBackupData(data: Buffer, key: Buffer): EncryptedPayload {
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext,
    ivHex: iv.toString('hex'),
    tagHex: tag.toString('hex')
  };
}

export function decryptBackupData(ciphertext: Buffer, key: Buffer, ivHex: string, tagHex: string): Buffer {
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
