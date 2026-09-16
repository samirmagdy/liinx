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
