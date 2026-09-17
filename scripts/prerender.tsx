import React from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import fs from 'node:fs';
import path from 'node:path';
import App from '../src/App';
import { pageTitles, brand } from '../shared/index.js';

const template = fs.readFileSync('dist/index.html', 'utf8');
fs.writeFileSync('dist/shell.html', template);
const origin = process.env.APP_ORIGIN || `https://${brand.domain}`;
for (const [route, titles] of Object.entries(pageTitles)) {
  if (route === '/studio') continue;
  // Wait for lazy marketing components; renderToString emits only the Suspense
  // fallback, leaving the page empty when scripts are unavailable.
  const { prelude } = await prerenderToNodeStream(<Router ssrPath={route}><App /></Router>);
  // Resolve lazy imports first, then serialize the settled tree without streaming
  // reveal scripts (which would leave hidden segments in a no-JS document).
  for await (const _chunk of prelude) { /* drain the completed render */ }
  const markup = renderToString(<Router ssrPath={route}><App /></Router>);
  if (markup.includes('<!--$?-->') || markup.includes('<!--$!-->')) {
    throw new Error(`Prerender did not settle for ${route}`);
  }
  const title = `${titles[0]} | ${brand.productName}`;
  const rootStart = template.indexOf('<div id="root">');
  const bodyEnd = template.indexOf('\n  </body>', rootStart);
  const rootEnd = template.lastIndexOf('</div>', bodyEnd) + '</div>'.length;
  if (rootStart < 0 || bodyEnd < 0 || rootEnd <= rootStart) throw new Error('Unable to locate prerender root shell');
  const html = template.slice(0, rootStart) + `<div id="root">${markup}</div>` + template.slice(rootEnd)
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
    .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${title}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${origin}${route}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${origin}${route}`)
    .replace(/(<meta name="robots" content=")[^"]*/, `$1${['/login', '/register'].includes(route) ? 'noindex, nofollow' : 'index, follow'}`);
  fs.writeFileSync(path.join('dist', route === '/' ? 'index.html' : `${route.slice(1)}.html`), html);
}
console.log('Pre-rendered 10 routes with route-specific titles and canonical URLs.');
