/**
 * 100% Genuine Importer for Linktree, Beacons, and public bio profiles.
 * Extracts real public links, social profiles, avatars, and bios.
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
}

import dns from 'dns';

// Anti-SSRF check: block internal IPs, local hostnames, and reserved metadata ranges
export function isSafePublicUrl(inputUrl: string): boolean {
  try {
    const parsed = new URL(inputUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.2') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.') ||
      hostname.startsWith('169.254.')
    ) {
      return false;
    }
    return true;
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
    for (const addr of addresses) {
      const ip = addr.address;
      if (
        ip === '127.0.0.1' ||
        ip === '0.0.0.0' ||
        ip === '::1' ||
        ip.startsWith('10.') ||
        ip.startsWith('192.168.') ||
        ip.startsWith('172.16.') ||
        ip.startsWith('172.17.') ||
        ip.startsWith('172.18.') ||
        ip.startsWith('172.19.') ||
        ip.startsWith('172.2') ||
        ip.startsWith('172.30.') ||
        ip.startsWith('172.31.') ||
        ip.startsWith('169.254.')
      ) {
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
    for (const item of rawLinks) {
      if (item.url && item.title) {
        links.push({
          title: String(item.title).trim(),
          url: String(item.url).trim(),
          subtitle: item.description || undefined
        });
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
      socials
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
  const seenUrls = new Set<string>();

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1].trim();
    const rawText = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

    // Resolve relative URLs
    try {
      href = new URL(href, baseUrl).toString();
    } catch {
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
    }
  }

  return {
    displayName,
    bio,
    avatarUrl,
    links,
    socials: []
  };
}

export async function importFromPublicUrl(inputUrl: string): Promise<ImportedProfileData> {
  let cleanUrl = inputUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    if (cleanUrl.startsWith('linktr.ee/') || cleanUrl.startsWith('beacons.ai/')) {
      cleanUrl = `https://${cleanUrl}`;
    } else {
      cleanUrl = `https://linktr.ee/${cleanUrl.replace(/^@/, '')}`;
    }
  }

  if (!isSafePublicUrl(cleanUrl) || !(await isSafePublicUrlAsync(cleanUrl))) {
    throw new Error('Invalid or non-public profile URL provided.');
  }

  let provider: ImportedProfileData['provider'] = 'generic';
  if (cleanUrl.includes('linktr.ee')) provider = 'linktree';
  else if (cleanUrl.includes('beacons.ai')) provider = 'beacons';
  else if (cleanUrl.includes('bio.fm')) provider = 'biofm';

  const res = await fetch(cleanUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to access ${provider} profile: HTTP ${res.status}`);
  }

  const html = await res.text();

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
      socials: parsedNext.socials || []
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
    socials: generic.socials || []
  };
}
