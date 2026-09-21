import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_TEMPLATES } from '../shared/index.js';
import { LanguageProvider } from '../src/context/LanguageContext';
import { TemplateCard } from '../src/components/TemplateCard';
import { starterSiteBlocks, starterSitePath } from '../src/utils/starterSites';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/', search: '', pathname: '/' },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const rootDir = path.resolve(__dirname, '..');
const source = (relative: string) => fs.readFileSync(path.join(rootDir, relative), 'utf-8');
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

function renderCard(index: number): string {
  const template = SITE_TEMPLATES[index];
  return renderToString(
    <LanguageProvider>
      <TemplateCard
        template={template}
        loc={{ name: template.name, category: template.category, description: template.description }}
        isHydrated
        isRtl={false}
        useTemplateLabel="Use this template"
        onSelectTemplate={() => {}}
      />
    </LanguageProvider>
  );
}

describe('starter site gallery', () => {
  it('sends the catalog id to the studio, or to signup when nobody is signed in', () => {
    expect(starterSitePath('tmpl-editorial', true)).toBe('/studio?template=tmpl-editorial');
    expect(starterSitePath('tmpl-editorial', false)).toBe('/register?template=tmpl-editorial');
    // The cards and both pages must move the id, never a theme id.
    expect(source('src/components/TemplateCard.tsx')).toContain('onSelectTemplate(template.id)');
    expect(source('src/App.tsx')).toContain('starterSitePath(templateId, Boolean(user))');
  });

  it('previews the composition itself rather than a demo account', () => {
    for (let index = 0; index < SITE_TEMPLATES.length; index += 1) {
      const template = SITE_TEMPLATES[index];
      const html = renderCard(index);
      for (const block of starterSiteBlocks(template).filter(item => item.type !== 'spacer')) {
        expect(html, `${template.id} is missing "${block.title}"`).toContain(escape(block.title));
      }
      expect(html, `${template.id} borrows somebody's photograph`).not.toContain('unsplash');
    }
  });

  it('has no client-side template catalogue left to drift from the server', () => {
    expect(fs.existsSync(path.join(rootDir, 'src/config/templates.ts'))).toBe(false);
    expect(source('src/components/TemplatesSection.tsx')).toContain("from '../../shared/index.js'");
  });
});
