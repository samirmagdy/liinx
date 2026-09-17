import { type ImporterProvider } from './types.js';

export const supportedSourceHosts = ['linktr.ee', 'beacons.ai', 'bio.fm'];

export function isSupportedSourceHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().replace(/^www\./, '');
  return supportedSourceHosts.some(host => lower === host || lower.endsWith(`.${host}`));
}

export function normalizeImportUrl(inputUrl: string): string | null {
  const value = inputUrl.trim();
  if (!value) return null;
  const explicitUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
  const candidate = explicitUrl
    ? value
    : /^(?:www\.)?(?:linktr\.ee|beacons\.ai|bio\.fm)\//i.test(value)
      ? `https://${value}`
      : `https://linktr.ee/${value.replace(/^@/, '')}`;
  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.pathname || (!explicitUrl && parsed.pathname === '/')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isSupportedImportUrl(inputUrl: string): boolean {
  try {
    const parsed = new URL(inputUrl);
    return parsed.protocol === 'https:' && isSupportedSourceHost(parsed.hostname);
  } catch {
    return false;
  }
}

export function detectProvider(url: string): ImporterProvider {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'linktr.ee' || host.endsWith('.linktr.ee')) return 'linktree';
    if (host === 'beacons.ai' || host.endsWith('.beacons.ai')) return 'beacons';
    if (host === 'bio.fm' || host.endsWith('.bio.fm')) return 'biofm';
    return 'generic';
  } catch {
    return 'generic';
  }
}
