import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import { Hero } from '../src/components/Hero';
import { LanguageProvider } from '../src/context/LanguageContext';
import { repoRoot } from './helpers/arabicParity';

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

const heroCopy = (lang: 'en' | 'ar') => {
  const source = fs.readFileSync(path.join(repoRoot, 'src', 'config', 'i18n.ts'), 'utf8');
  const match = new RegExp(`^ {2}${lang}: \\{`, 'm').exec(source);
  if (!match) throw new Error(`no ${lang} translations block`);
  const nextLanguage = new RegExp('^ {2}ar: \\{', 'm').exec(source.slice(match.index + 3));
  const block = source.slice(match.index, match.index + 3 + (nextLanguage ? nextLanguage.index : source.length));
  const hero = /hero: \{([\s\S]*?)\n {4}\},/.exec(block);
  if (!hero) throw new Error(`no ${lang} hero block`);
  return hero[1];
};

const subheadline = (lang: 'en' | 'ar') => {
  const match = /subheadline: `([^`]*)`|subheadline: '([^']*)'/.exec(heroCopy(lang));
  if (!match) throw new Error(`no ${lang} subheadline`);
  return (match[1] ?? match[2]).trim();
};

const wordCount = (text: string) => text.split(/\s+/).length;

describe('the hero answers three questions and stops', () => {
  it('lets a visitor claim a handle', () => {
    const html = renderHero();
    expect(html).toContain('hero-claim-input');
  });

  it('puts a real page on screen as the proof', () => {
    const html = renderHero();
    expect(html).toContain('data-hero-preview');
  });

  it('keeps feature detail out of the first screen', () => {
    const html = renderHero();
    ['Inline Audio Player', 'Direct Scheduling', 'Accordion Folders', 'Custom Domain & CNAME']
      .forEach(badge => expect(html, badge).not.toContain(badge));
  });

  it('keeps pricing guarantees out of the first screen', () => {
    const html = renderHero();
    expect(html).not.toContain('Start with a free account');
    expect(html).not.toContain('No RALOA fee on external sales or bookings');
  });

  it('says why it is better in one sentence rather than a list of features', () => {
    const words = wordCount(subheadline('en'));
    expect(words, `subheadline is ${words} words`).toBeLessThanOrEqual(18);
  });

  it('gives Arabic the same one-sentence promise', () => {
    const text = subheadline('ar');
    expect(text, 'Arabic subheadline is untranslated').not.toBe(subheadline('en'));
    expect(/[A-Za-z]{3,}/.test(text), `Arabic subheadline still carries English: ${text}`).toBe(false);
    expect(wordCount(text), 'Arabic subheadline is as long as the old one').toBeLessThanOrEqual(18);
  });

  it('leaves no hero copy behind that nothing renders', () => {
    const dead = ['claimButton', 'noCreditCard', 'customDomainIncluded', 'zeroCommission', 'microProof1', 'microProof2'];
    (['en', 'ar'] as const).forEach(lang => {
      const hero = heroCopy(lang);
      dead.forEach(key => expect(hero, `hero.${key} is dead copy`).not.toContain(`${key}:`));
    });
  });
});
