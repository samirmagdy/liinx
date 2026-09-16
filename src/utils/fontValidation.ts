export function isAllowedFontStylesheetUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && (parsed.hostname === 'fonts.googleapis.com' || parsed.hostname.endsWith('.fonts.googleapis.com'));
  } catch {
    return false;
  }
}
