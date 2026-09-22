import { describe, expect, it } from 'vitest';
import React from 'react';
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import { PricingSection } from '../src/components/PricingSection';
import { ReassuranceNote } from '../src/components/ReassuranceNote';
import { LanguageProvider } from '../src/context/LanguageContext';
import { repoRoot } from './helpers/arabicParity';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/pricing', pathname: '/pricing', search: '', hash: '' },
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} })
  };
}

const pricing = (language: 'en' | 'ar') => renderToString(
  <Router hook={() => ['/pricing', () => {}]}>
    <LanguageProvider initialLanguage={language}>
      <PricingSection onSelectPlan={() => {}} headingLevel={1} />
    </LanguageProvider>
  </Router>
);

const note = (language: 'en' | 'ar') => renderToString(
  <Router hook={() => ['/', () => {}]}>
    <LanguageProvider initialLanguage={language}>
      <ReassuranceNote />
    </LanguageProvider>
  </Router>
);

describe('the ask that costs something answers the doubt that stops it', () => {
  it('sits under the pricing plans with the two legal pages linked', () => {
    const html = pricing('en');
    expect(html).toContain('No card to start');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('Privacy Policy');
    expect(html).toContain('Terms of Service');
  });

  it('says the same thing in Arabic, links included', () => {
    const html = pricing('ar');
    expect(html).toContain('لا بطاقة مطلوبة للبدء');
    expect(html).toContain('سياسة الخصوصية');
    expect(html).toContain('شروط الاستخدام');
    expect(html).toContain('تُدار الاشتراكات والإلغاءات عبر Stripe');
  });

  it('is a note that stands on its own wherever it is placed', () => {
    expect(note('en')).toContain('download your data');
    expect(note('ar')).toContain('تنزيل بياناتك');
  });

  it('rides above the button that creates the account', () => {
    const signup = readFileSync(`${repoRoot}/src/features/register/components/SignupStarterSiteStep.tsx`, 'utf8');
    expect(signup).toContain('<ReassuranceNote');
  });

  it('promises nothing the billing path destroys', () => {
    // "Nothing is deleted if you stop paying" is only copy until the write path proves it.
    const billing = readFileSync(`${repoRoot}/server/routes/billing.ts`, 'utf8');
    const entitlements = readFileSync(`${repoRoot}/server/accountEntitlements.ts`, 'utf8');
    expect(`${billing}${entitlements}`).not.toMatch(/DELETE FROM (pages|blocks|profiles|newsletter_subscribers)/i);
  });

  it('upgrades are described by what the plan flags actually switch on', () => {
    const subtitle = pricing('en').match(/Upgrade when you need[^<]*/)?.[0];
    expect(subtitle).toContain('custom domain');
    expect(subtitle).toContain('API access');
    // Analytics are not plan-gated, so the pricing copy may not sell them as an upgrade.
    expect(subtitle).not.toMatch(/analytics/i);
    const entitlements = readFileSync(`${repoRoot}/shared/config/plans.ts`, 'utf8');
    expect(entitlements).not.toMatch(/analytics/i);
  });

  it('does not repeat the claim the note and the plan cards already make', () => {
    const html = pricing('en');
    expect(html.match(/No card to start/g)).toHaveLength(1);
  });
});
