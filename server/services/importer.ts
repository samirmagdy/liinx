/**
 * Imports selected content from supported public Linktree, Beacons, and Bio.fm pages.
 */

export interface ImportedProfileData {
  sourceUrl: string;
  provider: 'linktree' | 'beacons' | 'biofm' | 'generic';
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  links: {
    title: string;
    url: string;
    subtitle?: string;
  }[];
  socials: {
    platform: string;
    url: string;
  }[];
  warnings: string[];
}

export function isImporterProviderConfigured(provider: 'linktree' | 'beacons' | 'biofm'): boolean {
  if (provider === 'linktree') {
    return process.env.LINKTREE_IMPORT_ENABLED === 'true' && Boolean(process.env.LINKTREE_API_KEY);
  }
  if (provider === 'beacons') {
    return process.env.BEACONS_IMPORT_ENABLED === 'true' && Boolean(process.env.BEACONS_API_KEY);
  }
  if (provider === 'biofm') {
    return process.env.BIOFM_IMPORT_ENABLED === 'true' && Boolean(process.env.BIOFM_API_KEY);
  }
  return false;
}

import dns from 'dns';
import net from 'net';

export function isPrivateOrReservedIp(ipStr: string): boolean {
  const ip = ipStr.trim();
  const kind = net.isIP(ip);
  if (!kind) return true; // Not a valid IP -> unsafe

  if (kind === 4) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(n => isNaN(n) || n < 0 || n > 255)) {
      return true;
    }
    const [a, b, c] = parts;
    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;
    // 10.0.0.0/8 (Private RFC1918)
    if (a === 10) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 169.254.0.0/16 (Link Local / Cloud Metadata)
    if (a === 169 && b === 254) return true;
    // 172.16.0.0/12 (Private RFC1918)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (a === 192 && b === 0 && c === 0) return true;
    // 192.0.2.0/24 (TEST-NET-1)
    if (a === 192 && b === 0 && c === 2) return true;
    // 192.88.99.0/24 (6to4 Relay)
    if (a === 192 && b === 88 && c === 99) return true;
    // 192.168.0.0/16 (Private RFC1918)
    if (a === 192 && b === 168) return true;
    // 198.18.0.0/15 (Benchmarking)
    if (a === 198 && (b === 18 || b === 19)) return true;
    // 198.51.100.0/24 (TEST-NET-2)
    if (a === 198 && b === 51 && c === 100) return true;
    // 203.0.113.0/24 (TEST-NET-3)
    if (a === 203 && b === 0 && c === 113) return true;
    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true;
    // 240.0.0.0/4 (Reserved)
    if (a >= 240) return true;

    return false;
  }

  if (kind === 6) {
    const lower = ip.toLowerCase();
    // Unspecified & Loopback
    if (lower === '::' || lower === '0:0:0:0:0:0:0:0' || lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    // Unique Local (fc00::/7 -> starts with fc or fd)
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    // Link Local (fe80::/10)
    if (/^fe[89ab]/i.test(lower)) return true;
    // IPv4-mapped IPv6 (::ffff:127.0.0.1)
    if (lower.startsWith('::ffff:') || lower.includes(':ffff:')) {
      const ipv4Part = lower.split(':').pop();
      if (ipv4Part && net.isIPv4(ipv4Part)) {
        return isPrivateOrReservedIp(ipv4Part);
      }
      return true;
    }
    return false;
  }

  return true;
}

// Anti-SSRF check: block internal IPs, local hostnames, and reserved metadata ranges
export function isSafePublicUrl(inputUrl: string): boolean {
  try {
    const parsed = new URL(inputUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    // Block localhost, local domains, and internal cloud metadata hostnames
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === 'metadata.google.internal' ||
      hostname === '169.254.169.254'
    ) {
      return false;
    }

    // Block encoded integer / octal / hex IPs (e.g. 2130706433, 0x7f000001, 017700000001)
    if (/^\d+$/.test(hostname) || /^0x[0-9a-f]+$/i.test(hostname) || /^0\d+/.test(hostname)) {
      return false;
    }

    // If hostname is directly an IP, validate it
    if (net.isIP(hostname)) {
      return !isPrivateOrReservedIp(hostname);
    }

    return true;
  } catch {
    return false;
  }
}

const supportedSourceHosts = ['linktr.ee', 'beacons.ai', 'bio.fm'];

function isSupportedSourceHost(hostname: string): boolean {
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

export async function isSafePublicUrlAsync(inputUrl: string): Promise<boolean> {
  if (!isSafePublicUrl(inputUrl)) return false;
  try {
    const parsed = new URL(inputUrl);
    // DNS resolution re-validation to block DNS rebinding attacks
    const addresses = await dns.promises.lookup(parsed.hostname, { all: true });
    if (!addresses || addresses.length === 0) return false;

    for (const addr of addresses) {
      if (isPrivateOrReservedIp(addr.address)) {
        return false;
      }
    }
    return true;
  } catch {
    // If hostname does not resolve, it cannot be safely fetched
    return false;
  }
}

export function parseLinktreeNextData(html: string): Partial<ImportedProfileData> | null {
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!nextDataMatch || !nextDataMatch[1]) return null;

  try {
    const json = JSON.parse(nextDataMatch[1]);
    const pageProps = json?.props?.pageProps;
    if (!pageProps) return null;

    const account = pageProps.account || pageProps.user || {};
    const rawLinks = pageProps.links || [];
    const rawSocials = pageProps.socialLinks || [];

    const links: { title: string; url: string; subtitle?: string }[] = [];
    const warnings: string[] = [];
    for (const item of rawLinks) {
      if (item.url && item.title) {
        links.push({
          title: String(item.title).trim(),
          url: String(item.url).trim(),
          subtitle: item.description || undefined
        });
      } else if (item.url || item.title) {
        warnings.push('Some source links were skipped because they had no usable title or destination.');
      }
    }

    const socials: { platform: string; url: string }[] = [];
    for (const soc of rawSocials) {
      if (soc.url) {
        socials.push({
          platform: String(soc.type || 'website').toLowerCase(),
          url: String(soc.url).trim()
        });
      }
    }

    return {
      displayName: account.pageTitle || account.name || account.username,
      bio: account.description || account.bio,
      avatarUrl: account.profilePictureUrl || account.avatar,
      links,
      socials,
      warnings
    };
  } catch (err) {
    console.error('Failed to parse Linktree __NEXT_DATA__:', err);
    return null;
  }
}

export function parseGenericHtmlBio(html: string, baseUrl: string): Partial<ImportedProfileData> {
  // Extract OpenGraph meta tags
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);

  const displayName = ogTitleMatch ? ogTitleMatch[1].trim() : undefined;
  const bio = ogDescMatch ? ogDescMatch[1].trim() : undefined;
  const avatarUrl = ogImageMatch ? ogImageMatch[1].trim() : undefined;

  // Extract all anchor links: <a href="..." ...>...</a>
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const links: { title: string; url: string; subtitle?: string }[] = [];
  const warnings: string[] = [];
  const seenUrls = new Set<string>();

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1].trim();
    const rawText = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
      if (href) warnings.push('Some source links were skipped because their destination was unsafe or incomplete.');
      continue;
    }

    // Resolve relative URLs
    try {
      href = new URL(href, baseUrl).toString();
    } catch {
      warnings.push('Some source links were skipped because their destination was malformed.');
      continue;
    }

    const lowerHref = href.toLowerCase();
    // Exclude provider administrative links
    if (
      lowerHref.includes('linktr.ee/login') ||
      lowerHref.includes('linktr.ee/register') ||
      lowerHref.includes('beacons.ai/signup') ||
      lowerHref.includes('privacy') ||
      lowerHref.includes('terms') ||
      lowerHref.includes('cookie') ||
      seenUrls.has(href)
    ) {
      continue;
    }

    if (rawText && rawText.length >= 2 && rawText.length <= 120) {
      seenUrls.add(href);
      links.push({
        title: rawText,
        url: href
      });
    } else if (rawText || href) {
      warnings.push('Some source links were skipped because their labels were empty or too long.');
    }
  }

  return {
    displayName,
    bio,
    avatarUrl,
    links,
    socials: [],
    warnings: [...new Set(warnings)]
  };
}

export async function importFromPublicUrl(inputUrl: string): Promise<ImportedProfileData> {
  const cleanUrl = normalizeImportUrl(inputUrl);
  if (!cleanUrl) throw new Error('Only public Linktree, Beacons, or Bio.fm profile URLs are supported.');

  // Linktree and Beacons currently prohibit automated extraction in their
  // public terms. No authorized provider API/export is configured in Liinx,
  // so never fetch these pages from production. The parser functions above
  // remain available for a future permitted export/API adapter.
  if (!isSafePublicUrl(cleanUrl)) throw new Error('Invalid or non-public profile URL provided.');
  if (!isSupportedImportUrl(cleanUrl)) throw new Error('Only public Linktree, Beacons, or Bio.fm profile URLs are supported.');
  throw new Error('Import is unavailable until an authorized provider API or export is configured.');

  let currentUrl = cleanUrl;
  let redirects = 0;
  let res: Response;

  while (true) {
    if (!isSupportedImportUrl(currentUrl) || !isSafePublicUrl(currentUrl) || !(await isSafePublicUrlAsync(currentUrl))) {
      throw new Error('Invalid or non-public profile URL provided.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      res = await fetch(currentUrl, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'LIINX public-profile importer/1.0',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') throw new Error('The source profile timed out. Please try again.');
      throw new Error('The source profile could not be reached. Please try again.');
    } finally {
      clearTimeout(timeout);
    }

    if (res.status >= 300 && res.status < 400) {
      redirects++;
      if (redirects > 5) {
        throw new Error('Too many redirects encountered while importing profile.');
      }
      const location = res.headers.get('location');
      if (!location) {
        throw new Error('Redirect response missing Location header.');
      }
      const resolved = new URL(location, currentUrl).toString();
      if (!isSupportedImportUrl(resolved)) throw new Error('The source redirected to an unsupported profile host.');
      currentUrl = resolved;
      continue;
    }

    break;
  }

  let provider: ImportedProfileData['provider'] = 'generic';
  if (currentUrl.includes('linktr.ee')) provider = 'linktree';
  else if (currentUrl.includes('beacons.ai')) provider = 'beacons';
  else if (currentUrl.includes('bio.fm')) provider = 'biofm';

  if (!res.ok) {
    throw new Error(`Failed to access ${provider} profile: HTTP ${res.status}`);
  }

  const maxBytes = 2 * 1024 * 1024;
  const contentLength = Number(res.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) throw new Error('The source profile is too large to import safely.');
  const contentType = (res.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase();
  if (contentType && !['text/html', 'application/xhtml+xml'].includes(contentType)) throw new Error('The source did not return an HTML profile page.');
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  if (!res.body) throw new Error('The source profile returned no readable body.');
  const reader = res.body.getReader();
  const bodyTimeout = setTimeout(() => reader.cancel().catch(() => undefined), 10000);
  try {
    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') throw new Error('The source profile timed out. Please try again.');
        throw error;
      }
      if (chunk.done) break;
      totalBytes += chunk.value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new Error('The source profile is too large to import safely.');
      }
      chunks.push(chunk.value);
    }
  } finally {
    clearTimeout(bodyTimeout);
    reader.releaseLock();
  }
  if (contentLength > 0 && totalBytes < contentLength) throw new Error('The source profile response was truncated.');
  const html = new TextDecoder().decode(Buffer.concat(chunks.map(chunk => Buffer.from(chunk))));

  // Try Next.js embedded data first
  const parsedNext = parseLinktreeNextData(html);
  if (parsedNext && parsedNext.links && parsedNext.links.length > 0) {
    return {
      sourceUrl: cleanUrl,
      provider,
      displayName: parsedNext.displayName,
      bio: parsedNext.bio,
      avatarUrl: parsedNext.avatarUrl,
      links: parsedNext.links,
      socials: parsedNext.socials || [],
      warnings: parsedNext.warnings || []
    };
  }

  // Fallback to DOM / OpenGraph parser
  const generic = parseGenericHtmlBio(html, cleanUrl);
  return {
    sourceUrl: cleanUrl,
    provider,
    displayName: generic.displayName,
    bio: generic.bio,
    avatarUrl: generic.avatarUrl,
    links: generic.links || [],
    socials: generic.socials || [],
    warnings: generic.warnings || []
  };
}
