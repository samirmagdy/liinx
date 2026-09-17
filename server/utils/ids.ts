import { randomUUID } from 'node:crypto';

export const REQUEST_ID_REGEX = /^[A-Za-z0-9._-]{1,64}$/;

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function normalizeRequestId(rawHeader: unknown): string {
  if (typeof rawHeader === 'string') {
    const trimmed = rawHeader.trim();
    if (REQUEST_ID_REGEX.test(trimmed)) {
      return trimmed;
    }
  } else if (Array.isArray(rawHeader) && rawHeader.length > 0 && typeof rawHeader[0] === 'string') {
    const trimmed = rawHeader[0].trim();
    if (REQUEST_ID_REGEX.test(trimmed)) {
      return trimmed;
    }
  }
  return createId('req');
}
