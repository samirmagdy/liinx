import type { CreatorPage } from '../types';

export function buildQrTargetUrl({
  username,
  page,
  platformOrigin,
  customDomain
}: {
  username: string;
  page?: CreatorPage;
  platformOrigin: string;
  customDomain?: string | null;
}): string | null {
  try {
    const customUrl = customDomain ? new URL(`https://${customDomain}`) : null;
    if (customUrl && (!/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(customUrl.hostname) || customUrl.username || customUrl.password)) return null;
    const origin = customUrl ? customUrl.origin : new URL(platformOrigin).origin;
    const pagePath = page && !page.isHome ? `/${encodeURIComponent(page.slug)}` : '';
    return customDomain ? `${origin}${pagePath || '/'}` : `${origin}/@${encodeURIComponent(username)}${pagePath}`;
  } catch {
    return null;
  }
}
