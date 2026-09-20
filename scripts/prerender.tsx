import React from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import App from '../src/App';
import { pageTitles, pageDescriptions, brand } from '../shared/index.js';
import { localizedPath } from '../src/utils/languagePaths';

const template = fs.readFileSync('dist/index.html', 'utf8');
fs.writeFileSync('dist/shell.html', template);
const origin = process.env.APP_ORIGIN || `https://${brand.domain}`;
const routes = Object.keys(pageTitles).filter(route => route !== '/studio' && route !== '/account');

async function prerenderPage(route: string, language: 'en' | 'ar') {
  const pagePath = localizedPath(route, language);
  const { prelude } = await prerenderToNodeStream(<App initialLanguage={language} initialPath={pagePath} />);
  for await (const _chunk of prelude) { /* drain the completed render */ }
  const markup = renderToString(<App initialLanguage={language} initialPath={pagePath} />);
  if (markup.includes('<!--$?-->') || markup.includes('<!--$!-->')) {
    throw new Error(`Prerender did not settle for ${pagePath}`);
  }

  const languageIndex = language === 'ar' ? 1 : 0;
  const title = `${pageTitles[route][languageIndex]} | ${brand.productName}`;
  const description = pageDescriptions[route]?.[languageIndex] || pageDescriptions['/'][languageIndex];
  const canonical = `${origin}${pagePath}`;
  const englishUrl = `${origin}${localizedPath(route, 'en')}`;
  const arabicUrl = `${origin}${localizedPath(route, 'ar')}`;
  const rootStart = template.indexOf('<div id="root">');
  const bodyEnd = template.indexOf('\n  </body>', rootStart);
  const rootEnd = template.lastIndexOf('</div>', bodyEnd) + '</div>'.length;
  if (rootStart < 0 || bodyEnd < 0 || rootEnd <= rootStart) throw new Error('Unable to locate prerender root shell');

  const alternates = ['/login', '/register'].includes(route) ? '' : [
    `<link rel="alternate" hreflang="en" href="${englishUrl}" />`,
    `<link rel="alternate" hreflang="ar" href="${arabicUrl}" />`,
    `<link rel="alternate" hreflang="x-default" href="${englishUrl}" />`
  ].join('\n    ');
  const html = (template.slice(0, rootStart) + `<div id="root">${markup}</div>` + template.slice(rootEnd))
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
    .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${title}`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${description}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${description}`)
    .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${description}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${canonical}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${canonical}`)
    .replace(/\s*<link rel="alternate" hreflang="(?:en|ar|x-default)" href="[^"]*"\s*\/>/g, '')
    .replace(/(<link rel="canonical" href="[^"]*"\s*\/>)/, `$1${alternates ? `\n    ${alternates}` : ''}`)
    .replace(/(<html lang=")[^"]*(")/, `$1${language}$2${language === 'ar' ? ' dir="rtl"' : ''}`)
    .replace(/(<meta name="robots" content=")[^"]*/, `$1${['/login', '/register'].includes(route) ? 'noindex, nofollow' : 'index, follow'}`);

  const outputPath = language === 'ar'
    ? path.join('dist', 'ar', route === '/' ? 'index.html' : `${route.slice(1)}.html`)
    : path.join('dist', route === '/' ? 'index.html' : `${route.slice(1)}.html`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
}

for (const route of routes) {
  await prerenderPage(route, 'en');
  await prerenderPage(route, 'ar');
}

console.log(`Pre-rendered ${routes.length * 2} English and Arabic routes with localized content, canonical URLs, and hreflang metadata.`);
