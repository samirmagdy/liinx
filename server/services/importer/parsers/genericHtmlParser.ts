import { type ImportedProfileData } from '../types.js';

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
