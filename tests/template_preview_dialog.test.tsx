import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import { SITE_TEMPLATES } from '../shared/index.js';
import { TemplateCard } from '../src/components/TemplateCard';
import { TemplatePreviewDialog } from '../src/components/TemplatePreviewDialog';
import { LanguageProvider } from '../src/context/LanguageContext';
import { starterSiteBlocks } from '../src/utils/starterSites';
import { runtimeTranslations } from '../src/config/runtimeTranslations';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/templates', pathname: '/templates', search: '' },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const template = SITE_TEMPLATES.find(item => (item.pages || []).length > 0) || SITE_TEMPLATES[0];
const loc = { name: template.name, category: template.category, description: template.description };
const homeBlocks = starterSiteBlocks(template, 'home');
const subPage = template.pages![0];
const subBlocks = starterSiteBlocks(template, subPage.slug);

const renderDialog = () => renderToString(
  <Router hook={() => ['/templates', () => {}]}>
    <LanguageProvider>
      <TemplatePreviewDialog template={template} loc={loc} useLabel="Use this template" onClose={() => {}} onUse={() => {}} />
    </LanguageProvider>
  </Router>
);

describe('the full-screen template preview', () => {
  it('is a real dialog with a name', () => {
    const html = renderDialog();
    expect(html).toMatch(/<dialog[^>]*aria-label="/);
    expect(html).toContain(template.name);
  });

  it('shows the blocks of the page it is on, and not the blocks of another', () => {
    const html = renderDialog();
    // A spacer is deliberately blank, so it cannot be named on screen.
    homeBlocks.filter(block => block.type !== 'spacer').forEach(block => {
      expect(html, `missing home block ${block.title}`).toContain(block.title);
    });
    const onlyElsewhere = subBlocks.filter(block => !homeBlocks.some(home => home.title === block.title));
    expect(onlyElsewhere.length, 'the sub page has no distinct blocks to prove scoping with').toBeGreaterThan(0);
    onlyElsewhere.forEach(block => expect(html, `${block.title} belongs to ${subPage.slug}`).not.toContain(block.title));
  });

  it('lets the visitor move between the pages the template creates', () => {
    const html = renderDialog();
    [template.name, subPage.title].forEach(title => expect(html).toContain(title));
  });

  it('still offers the conversion from inside the preview', () => {
    const html = renderDialog();
    expect(html).toContain('Use this template');
    expect(html).toMatch(/aria-label="Close preview"|Close preview/);
  });

  it('is reachable from every card, next to the existing action', () => {
    const html = renderToString(
      <Router hook={() => ['/templates', () => {}]}>
        <LanguageProvider>
          <TemplateCard
            template={template}
            loc={loc}
            isHydrated
            isRtl={false}
            useTemplateLabel="Use this template"
            onSelectTemplate={() => {}}
          />
        </LanguageProvider>
      </Router>
    );
    expect(html).toContain('Use this template');
    expect(html).toMatch(/Preview/);
  });

  it('has Arabic for the words it adds', () => {
    ['Preview', 'Close preview', 'Full-screen preview'].forEach(literal => {
      expect(runtimeTranslations[literal], `untranslated: ${literal}`).toBeTruthy();
    });
  });
});
