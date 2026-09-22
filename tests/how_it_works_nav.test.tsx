import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import { NavbarBrandLinks } from '../src/components/navbar/NavbarBrandLinks';
import { NavbarMobileMenu } from '../src/components/navbar/NavbarMobileMenu';
import { HowItWorksSection } from '../src/components/HowItWorksSection';
import { HOW_IT_WORKS_ANCHOR } from '../src/hooks/useHashScroll';
import { LanguageProvider } from '../src/context/LanguageContext';
import { translations } from '../src/config/i18n';
import { DEMO_PROFILES } from '../src/demo/demoProfiles';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/', pathname: '/', search: '', hash: '' },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const render = (node: React.ReactNode, language: 'en' | 'ar' = 'en') => renderToString(
  <Router hook={() => ['/', () => {}]}>
    <LanguageProvider initialLanguage={language}>{node}</LanguageProvider>
  </Router>
);

const anchors = (html: string) => [...html.matchAll(/<a [^>]*href="([^"]+)"/g)].map(match => match[1]);

// The router prefixes its base, so /ar renders the same link as /ar/#how-it-works.
const reachesSection = (html: string) => anchors(html).some(href => href.endsWith(`#${HOW_IT_WORKS_ANCHOR}`));

const mobileMenu = () => (
  <NavbarMobileMenu
    user={null}
    lang="en"
    t={translations.en}
    ui={(key: string) => key}
    onClose={() => {}}
    onLogout={() => {}}
  />
);

describe('the how-it-works section and the nav that reaches it', () => {
  it('names the anchor the nav points at', () => {
    expect(render(<HowItWorksSection />)).toContain(`id="${HOW_IT_WORKS_ANCHOR}"`);
  });

  it('gives exactly three steps', () => {
    expect(render(<HowItWorksSection />).match(/<li/g)).toHaveLength(3);
  });

  it('sends every step somewhere that resolves to a page in this app', () => {
    const destinations = anchors(render(<HowItWorksSection />));
    expect(destinations).toEqual(expect.arrayContaining(['/templates', '/studio']));
    // The third step is a live page, so the handle has to be one the server actually serves.
    const live = destinations.find(href => href.startsWith('/@'));
    expect(live).toBeTruthy();
    expect(DEMO_PROFILES.map(profile => `/@${profile.username}`)).toContain(live);
  });

  it('says what happens at each step instead of naming a feature', () => {
    const html = render(<HowItWorksSection />);
    expect(html).toContain('Three steps, and the page is live');
    expect(html).toContain('Swap the placeholders for your own');
    expect(html).toContain('Put the address where people look');
  });

  it('offers the section from the desktop nav and the mobile menu', () => {
    expect(reachesSection(render(<NavbarBrandLinks activeView="home" />))).toBe(true);
    expect(reachesSection(render(mobileMenu()))).toBe(true);
  });

  it('carries the same anchor and copy into Arabic', () => {
    const arabicNav = render(<NavbarBrandLinks activeView="home" />, 'ar');
    expect(reachesSection(arabicNav)).toBe(true);
    expect(arabicNav).toContain('كيف يعمل');
    expect(render(<HowItWorksSection />, 'ar')).toContain('ثلاث خطوات وتصبح الصفحة منشورة');
  });
});
