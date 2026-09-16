/** Only official HTTPS scheduling pages may be embedded. */
export function bookingUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.hostname !== 'calendly.com' || url.port || url.username || url.password) return null;
    // Calendly supports both a profile scheduling page (/user) and a specific
    // event type (/user/event). Keep the host/path contract narrow; query and
    // fragment values are intentionally not forwarded into an embed.
    if (!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?\/?$/.test(url.pathname)) return null;
    return `${url.origin}${url.pathname}`;
  } catch { return null; }
}
