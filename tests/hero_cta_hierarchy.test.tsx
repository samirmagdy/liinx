import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import { Hero } from '../src/components/Hero';
import { PhonePreview } from '../src/components/PhonePreview';
import { LanguageProvider } from '../src/context/LanguageContext';
import { DEMO_PROFILES } from '../src/demo/demoProfiles';
import { THEMES } from '../src/config/themes';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/', pathname: '/', search: '' },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const renderHero = () => renderToString(
  <Router hook={() => ['/', () => {}]}>
    <LanguageProvider>
      <Hero onClaimUsername={() => {}} onOpenStudio={() => {}} />
    </LanguageProvider>
  </Router>
);

/** Focusable controls in the rendered markup, in tab order. */
const focusable = (html: string) => [
  ...html.matchAll(/<(button|a|input|select|textarea)\b([^>]*)>/g)
].map(([, tag, attrs]) => ({
  tag,
  id: /id="([^"]+)"/.exec(attrs)?.[1] ?? '',
  className: /class="([^"]*)"/.exec(attrs)?.[1] ?? ''
}));

const darkFill = /(?:^| )bg-(?:neutral-9\d\d|black)(?: |$)/;

describe('the hero has one dominant action', () => {
  it('paints exactly one filled dark control, and it is the claim button', () => {
    // Everything before the device column is the copy side of the fold; the phone shell is
    // deliberately dark and is not an action.
    const copySide = renderHero().split('data-hero="visual"')[0];
    const dark = focusable(copySide).filter(control => darkFill.test(control.className));
    expect(dark.map(control => control.id), 'a second button competes with the primary CTA').toEqual(['hero-claim-btn']);
  });

  it('keeps the secondary row to plain text links', () => {
    const html = renderHero();
    // The row holds anchors only, so the first closing div ends it.
    const row = /<div data-hero="secondary"[\s\S]*?<\/div>/.exec(html)?.[0];
    expect(row, 'the secondary actions have no data-hero="secondary" row').toBeTruthy();
    const styled = focusable(row!).filter(control => /bg-|border-/.test(control.className));
    expect(styled.map(control => control.className), 'a secondary action is dressed as a button').toEqual([]);
  });

  it('does not let the demo switcher borrow the primary action colour', () => {
    const html = renderHero();
    const controls = /data-hero="controls"[\s\S]*?(?=data-hero="visual")/.exec(html)?.[0] ?? '';
    expect(controls, 'the preview switcher is missing').toBeTruthy();
    expect(controls, 'the segmented control is painted in the CTA colour').not.toMatch(/bg-neutral-900|bg-black/);
  });

  it('leaves no focusable control inside a preview that cannot be used', () => {
    const html = renderToString(
      <LanguageProvider>
        <PhonePreview profile={DEMO_PROFILES[0]} customTheme={THEMES[0]} compact interactive={false} />
      </LanguageProvider>
    );
    expect(html).toContain('9:41');
    expect(html, 'the device chrome is clickable in a non-interactive preview').not.toMatch(/<button[^>]*aria-label="Share bio link"/);
  });

  it('keeps that control live where the preview really is interactive', () => {
    const html = renderToString(
      <LanguageProvider>
        <PhonePreview profile={DEMO_PROFILES[0]} customTheme={THEMES[0]} compact interactive />
      </LanguageProvider>
    );
    expect(html).toMatch(/<button[^>]*aria-label="Share bio link"/);
  });
});
