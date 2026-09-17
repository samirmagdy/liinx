/** Runtime-safe URL and protocol validation for untrusted payloads. */
export function hasAllowedUrlProtocol(value: unknown, protocols: readonly string[]): boolean {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export const isHttpUrl = (value: unknown): boolean => hasAllowedUrlProtocol(value, ['http:', 'https:']);
export const isSafeLinkUrl = (value: unknown): boolean => hasAllowedUrlProtocol(value, ['http:', 'https:', 'mailto:', 'tel:']);

/** Only official HTTPS scheduling pages may be embedded. */
export function bookingUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.hostname !== 'calendly.com' || url.port || url.username || url.password) return null;
    // Calendly supports both a profile scheduling page (/user) and a specific event type (/user/event)
    if (!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?\/?$/.test(url.pathname)) return null;
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

export function normalizePhoneNumber(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (!/^[+0-9][0-9 ()-]*$/.test(input)) return null;
  const digits = input.replace(/\D/g, '');
  if (digits.length < 4 || digits.length > 15) return null;
  return `${input.startsWith('+') ? '+' : ''}${digits}`;
}

export function getPhoneHref(value: unknown): string | null {
  const normalized = normalizePhoneNumber(value);
  return normalized ? `tel:${normalized}` : null;
}

export function getMailtoHref(email: unknown, subject?: unknown, body?: unknown): string | null {
  if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return null;
  const params = new URLSearchParams();
  if (typeof subject === 'string' && subject) params.set('subject', subject);
  if (typeof body === 'string' && body) params.set('body', body);
  const query = params.toString();
  return `mailto:${email.trim()}${query ? `?${query}` : ''}`;
}
