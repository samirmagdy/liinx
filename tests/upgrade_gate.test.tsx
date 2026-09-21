import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { BuilderProvider } from '../src/features/builder/context/BuilderContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { CapabilitiesProvider } from '../src/context/CapabilitiesContext';
import { ProductFeedbackProvider } from '../src/components/ProductFeedback';
import { SettingsDomainCard } from '../src/features/builder/components/panels/settings/SettingsDomainCard';
import { SettingsAdvancedSection } from '../src/features/builder/components/panels/settings/SettingsAdvancedSection';
import { SettingsBillingSection } from '../src/features/builder/components/panels/settings/SettingsBillingSection';
import { paidPlans } from '../shared/config/plans';
import { TEST_CREATOR_PROFILE } from './fixtures/testProfiles';
import type { CreatorProfile } from '../src/types';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/studio' },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const planProfile = (plan: CreatorProfile['plan']): CreatorProfile => ({
  ...TEST_CREATOR_PROFILE,
  id: `prof_plan_${plan}`,
  username: `plantee${plan}`,
  plan
});

const render = (element: React.ReactElement, plan: CreatorProfile['plan'] = 'free') => renderToString(
  <LanguageProvider>
    <CapabilitiesProvider>
      <ProductFeedbackProvider>
        <BuilderProvider initialProfile={planProfile(plan)} onViewFullscreen={() => {}}>
          {element}
        </BuilderProvider>
      </ProductFeedbackProvider>
    </CapabilitiesProvider>
  </LanguageProvider>
);

describe('Locked affordances ask for the upgrade instead of shrugging', () => {
  it('renders the domain lock as a button that names the plan it needs', () => {
    const html = render(<SettingsDomainCard />);
    expect(html).toMatch(/<button[^>]*>[^<]*Needs Pro/);
    expect(html).not.toContain('PRO / STUDIO');
  });

  it('locks custom CSS behind the same actionable control', () => {
    const html = render(<SettingsAdvancedSection />);
    expect(html).toMatch(/<button[^>]*>[^<]*Needs Pro/);
    expect(html).toContain('disabled=""');
  });

  it('says nothing about upgrading when the plan already covers the control', () => {
    const html = render(<SettingsDomainCard />, 'pro');
    expect(html).not.toContain('Needs Pro');
  });

  /** The editor keeps one plan row; the paywall wall of three cards is gone. */
  it('states the current plan once and prices both upgrades from the shared table', () => {
    const html = render(<SettingsBillingSection />);
    expect(html).toContain('Current plan:');
    expect(html).toContain(`Pro · $${paidPlans.pro.month / 100}/mo`);
    expect(html).toContain(`Studio · $${paidPlans.studio.month / 100}/mo`);
    expect(html).not.toContain('Select Pro');
    expect(html).toContain('Custom domain');
  });

  it('offers one management action, not a sales pitch, once the account already pays', () => {
    const html = render(<SettingsBillingSection />, 'studio');
    expect(html).toContain('Manage subscription');
    expect(html).not.toContain('Upgrade to');
  });
});
