import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { renderProfileShellHtml, type RenderablePublicProfile } from '../server/profileHtml.js';
import { brand, canonicalOrigin } from '../shared/config/brand';

const rootDir = path.resolve(__dirname, '..');
const CONNECTED_HOST = 'links.creatorbrand.com';

const profile: RenderablePublicProfile = {
  username: 'mariastudio',
  display_name: 'Maria Studio',
  category: 'photographer',
  bio: 'Portrait work.',
  avatar_url: `https://${brand.domain}/uploads/avatar.jpg`,
  share_title: 'Maria Studio',
  share_description: 'Portrait work.',
  share_image_url: `https://${brand.domain}/uploads/share.jpg`
};

/**
 * A stand-in for the shipped head: the three tags a crawler or unfurler reads, carrying
 * placeholder values that must be replaced rather than left behind.
 */
const sourceHtml = `<!doctype html><html><head>
<link rel="canonical" href="https://placeholder.test/" />
<meta property="og:url" content="https://placeholder.test/" />
<script type="application/ld+json">{"@context":"https://schema.org"}</script>
</head><body></body></html>`;

const renderFor = (canonical: string) => renderProfileShellHtml(sourceHtml, profile, canonical, undefined, undefined, [], false);

describe('share metadata follows the host the page was served from', () => {
  it('names the connected domain, and not the product host, on a custom domain', () => {
    const html = renderFor(`https://${CONNECTED_HOST}/`);
    expect(html).toContain(`<link rel="canonical" href="https://${CONNECTED_HOST}/" />`);
    expect(html).toContain(`<meta property="og:url" content="https://${CONNECTED_HOST}/" />`);
    expect(html).toContain(`"url":"https://${CONNECTED_HOST}/"`);
    // Uploaded assets legitimately stay on the product host; the page's own address must not.
    [
      `href="${canonicalOrigin}`,
      `content="${canonicalOrigin}`,
      `"url":"${canonicalOrigin}`
    ].forEach(fragment => {
      expect(html, `share address leaked as ${fragment}`).not.toContain(fragment);
    });
  });

  it('still names the product host on the first-party address', () => {
    const html = renderFor(`${canonicalOrigin}/@mariastudio`);
    expect(html).toContain(`<link rel="canonical" href="${canonicalOrigin}/@mariastudio" />`);
    expect(html).toContain(`<meta property="og:url" content="${canonicalOrigin}/@mariastudio" />`);
  });

  it('builds both public HTML paths from the request, never from a literal', () => {
    const server = fs.readFileSync(path.join(rootDir, 'server', 'server.ts'), 'utf8');
    expect(server, 'the custom-domain route canonicalizes to the serving host')
      .toMatch(/const canonical = `https:\/\/\$\{host\}/);
    expect(server, 'the first-party route canonicalizes through the request origin')
      .toMatch(/const canonical = `\$\{publicOrigin\(req\)\}\/@/);
  });
});
