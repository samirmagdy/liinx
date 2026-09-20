export type PublicProfileContentItem = {
  type: 'link' | 'text';
  title: string;
  url?: string;
  subtitle?: string | null;
  body?: string;
};

export type RenderablePublicProfile = {
  username: string;
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  share_title?: string | null;
  share_description?: string | null;
  share_image_url?: string | null;
};

export type PublicProfilePageMetadata = { title?: string | null; description?: string | null };

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character));
}

export function safeJsonForHtml(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function injectNonceIntoHtml(sourceHtml: string, nonce?: string): string {
  if (!nonce) return sourceHtml;
  let html = sourceHtml;
  const nonceGlobalScript = `<script nonce="${escapeHtml(nonce)}">window.__CSP_NONCE__="${escapeHtml(nonce)}";</script>`;
  if (/<head[^>]*>/i.test(html)) html = html.replace(/(<head[^>]*>)/i, `$1${nonceGlobalScript}`);
  else html = `${nonceGlobalScript}${html}`;
  return html.replace(/<script\b(?![^>]*\bnonce=)([^>]*)>/gi, `<script nonce="${escapeHtml(nonce)}"$1>`);
}

function renderProfileMetadata(
  sourceHtml: string,
  profile: RenderablePublicProfile,
  canonical: string,
  page: PublicProfilePageMetadata | undefined,
  nonce: string | undefined,
  isDemo: boolean
): { html: string; title: string; description: string } {
  const title = page?.title || profile.share_title || `${profile.display_name} (@${profile.username}) | LIINX`;
  const description = page?.description || profile.share_description || profile.bio || `Explore ${profile.display_name}'s links, media and updates on Liinx.`;
  const image = profile.share_image_url || profile.avatar_url || '';
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeCanonical = escapeHtml(canonical);
  const structuredData = safeJsonForHtml({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: canonical,
    name: title,
    description,
    ...(image ? { image } : {}),
    mainEntity: { '@type': 'Person', name: profile.display_name, url: canonical, ...(profile.avatar_url ? { image: profile.avatar_url } : {}) }
  });
  const scriptNonce = nonce ? ` nonce="${escapeHtml(nonce)}"` : '';
  const robots = isDemo ? 'noindex, nofollow' : 'index, follow';
  let html = sourceHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/>/i, `<meta name="description" content="${safeDescription}" />`);
  html = html.replace(/<meta name="robots" content="[^"]*"\s*\/>/i, `<meta name="robots" content="${robots}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${safeCanonical}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/i, `<meta property="og:url" content="${safeCanonical}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/>/i, `<meta property="og:title" content="${safeTitle}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/>/i, `<meta property="og:description" content="${safeDescription}" />`);
  html = replaceOptionalMeta(html, 'og:image', image ? escapeHtml(image) : '');
  html = replaceOptionalMeta(html, 'og:image:secure_url', image ? escapeHtml(image) : '');
  html = replaceOptionalMeta(html, 'og:image:alt', image ? escapeHtml(profile.display_name) : '');
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/i, `<meta name="twitter:title" content="${safeTitle}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/i, `<meta name="twitter:description" content="${safeDescription}" />`);
  html = replaceOptionalMeta(html, 'twitter:image', image ? escapeHtml(image) : '');
  html = html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, `<script type="application/ld+json"${scriptNonce}>${structuredData}</script>`);
  return { html, title, description };
}

function replaceOptionalMeta(html: string, property: string, value: string): string {
  const pattern = new RegExp(`<meta (?:property|name)="${property}" content="[^"]*"\\s*\\/>`, 'i');
  return html.replace(pattern, value ? `<meta property="${property}" content="${value}" />` : '');
}

function renderProfileFallback(
  profile: RenderablePublicProfile,
  page: PublicProfilePageMetadata | undefined,
  publicContent: PublicProfileContentItem[],
  isDemo: boolean
): string {
  const links = publicContent.filter(item => item.type === 'link' && item.url)
    .map(link => `<li><a href="${escapeHtml(link.url!)}" rel="noopener noreferrer">${escapeHtml(link.title)}</a>${link.subtitle ? `<p>${escapeHtml(link.subtitle)}</p>` : ''}</li>`).join('');
  const textBlocks = publicContent.filter(item => item.type === 'text')
    .map(item => `<article>${item.title ? `<h2>${escapeHtml(item.title)}</h2>` : ''}${item.body ? `<p>${escapeHtml(item.body).replace(/\r?\n/g, '<br>')}</p>` : ''}</article>`).join('');
  const demoNotice = isDemo ? '<p role="note">Fictional sample profile. Names, metrics, and links are demonstration content, not customer data.</p>' : '';
  const pageTitle = page?.title && page.title !== profile.display_name ? `<h2>${escapeHtml(page.title)}</h2>` : '';
  const bio = profile.bio ? `<p>${escapeHtml(profile.bio)}</p>` : '';
  const pageDescription = page?.description ? `<p>${escapeHtml(page.description)}</p>` : '';
  const linkSection = links ? `<h2>Links</h2><ul>${links}</ul>` : '';
  return `<section id="profile-crawl-content" aria-label="${escapeHtml(profile.display_name)}">${demoNotice}<h1>${escapeHtml(profile.display_name)}</h1>${bio}${pageTitle}${pageDescription}${textBlocks}${linkSection}</section>`;
}

export function renderProfileShellHtml(
  sourceHtml: string,
  profile: RenderablePublicProfile,
  canonical: string,
  page?: PublicProfilePageMetadata,
  nonce?: string,
  publicContent: PublicProfileContentItem[] = [],
  isDemo = false
): string {
  const { html: headHtml } = renderProfileMetadata(sourceHtml, profile, canonical, page, nonce, isDemo);
  const fallback = renderProfileFallback(profile, page, publicContent, isDemo);
  const html = /<\/body>/i.test(headHtml) ? headHtml.replace(/<\/body>/i, `${fallback}</body>`) : `${headHtml}${fallback}`;
  return nonce ? injectNonceIntoHtml(html, nonce) : html;
}
