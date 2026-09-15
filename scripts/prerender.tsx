import React from 'react';
import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import fs from 'node:fs';
import path from 'node:path';
import App from '../src/App';
import { pageTitles } from '../src/config/pages';
import { brand } from '../src/config/brand';

const template = fs.readFileSync('dist/index.html', 'utf8');
fs.writeFileSync('dist/shell.html', template);
const origin = process.env.APP_ORIGIN || `https://${brand.domain}`;
for (const [route, titles] of Object.entries(pageTitles)) {
  if (route === '/studio') continue;
  const markup = renderToString(<Router ssrPath={route}><App /></Router>);
  const title = `${titles[0]} | ${brand.productName}`;
  const html = template.replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
    .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${title}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${origin}${route}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${origin}${route}`)
    .replace(/(<meta name="robots" content=")[^"]*/, `$1${['/login', '/register'].includes(route) ? 'noindex, nofollow' : 'index, follow'}`);
  fs.writeFileSync(path.join('dist', route === '/' ? 'index.html' : `${route.slice(1)}.html`), html);
}
console.log('Pre-rendered 10 routes with route-specific titles and canonical URLs.');
