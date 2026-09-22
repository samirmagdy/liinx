import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import { StickyMobileCta } from '../src/components/StickyMobileCta';
import { LanguageProvider } from '../src/context/LanguageContext';
import { runtimeTranslations } from '../src/config/runtimeTranslations';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/', pathname: '/', search: '' },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const render = () => renderToString(
  <Router hook={() => ['/', () => {}]}>
    <LanguageProvider>
      <StickyMobileCta />
    </LanguageProvider>
  </Router>
);

describe('the mobile conversion bar', () => {
  it('offers the same action the hero offers, and only on small screens', () => {
    const html = render();
    expect(html).toContain('Create your page');
    expect(html).toContain('/register');
    expect(html).toMatch(/lg:hidden/);
  });

  it('starts out of the way until the hero has left the screen', () => {
    const html = render();
    // Server render has no scroll position, so the bar must begin hidden rather than flash in.
    expect(html).toMatch(/translate-y-full/);
    expect(html).toMatch(/aria-hidden="true"/);
  });

  it('is translated, not silently fallen back to English', () => {
    expect(runtimeTranslations['Create your page']).toBe('أنشئ صفحتك');
  });
});
