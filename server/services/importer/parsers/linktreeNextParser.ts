import { ImportedProfileData } from '../types.js';

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
