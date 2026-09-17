import { type ObjectStorage } from '../infrastructure/interfaces.js';
import { LocalFileObjectStorage } from '../infrastructure/localStorage.js';
import { createS3ObjectStorageFromEnv } from '../infrastructure/s3ObjectStorage.js';

const provider = (process.env.MEDIA_STORAGE || (process.env.NODE_ENV === 'production' && process.env.MEDIA_S3_BUCKET ? 's3' : 'local')).toLowerCase();

if (provider !== 'local' && provider !== 's3') {
  throw new Error(`Unsupported MEDIA_STORAGE provider: ${provider}. Use local or s3.`);
}

export const uploadStorage: ObjectStorage = provider === 's3'
  ? createS3ObjectStorageFromEnv()
  : new LocalFileObjectStorage();

export const uploadStorageProvider = uploadStorage.provider;

export function storageKeyFromUrl(value: string): string | null {
  try {
    const path = value.startsWith('/') ? value : new URL(value).pathname;
    const match = path.match(/^\/uploads\/([A-Za-z0-9][A-Za-z0-9._-]*)$/);
    if (match?.[1]) return match[1];
    const publicBase = process.env.MEDIA_PUBLIC_URL ? new URL(process.env.MEDIA_PUBLIC_URL) : null;
    if (publicBase && !value.startsWith('/') && new URL(value).origin === publicBase.origin && path.startsWith(`${publicBase.pathname.replace(/\/$/, '')}/`)) {
      const candidate = decodeURIComponent(path.slice(publicBase.pathname.replace(/\/$/, '').length + 1));
      return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(candidate) ? candidate : null;
    }
    return null;
  } catch { return null; }
}
