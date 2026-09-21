import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SettingsDomainCard } from '../src/features/builder/components/panels/settings/SettingsDomainCard';
import { DomainOutcome } from '../src/features/builder/components/panels/settings/DomainOutcome';
import { DomainRecordsTable } from '../src/features/builder/components/panels/settings/DomainRecordsTable';
import { DomainSaveFeedback } from '../src/features/builder/components/panels/settings/DomainSaveFeedback';
import { BuilderProvider } from '../src/features/builder/context/BuilderContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { CapabilitiesProvider } from '../src/context/CapabilitiesContext';
import { ProductFeedbackProvider } from '../src/components/ProductFeedback';
import { TEST_CREATOR_PROFILE } from './fixtures/testProfiles';
import { brand } from '../src/config/brand';
import { type DomainFinding } from '../src/features/builder/hooks/useCustomDomainWizard';
import type { CreatorProfile } from '../src/types';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/studio', search: '' },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const HOST = 'links.procreator.test';

const profileWith = (over: Partial<CreatorProfile>): CreatorProfile => ({
  ...TEST_CREATOR_PROFILE,
  id: 'prof_domain_wizard',
  username: 'domainwizard',
  displayName: 'Domain Wizard',
  plan: 'pro',
  customDomain: HOST,
  customDomainVerified: false,
  ...over
});

const renderCard = (profile: CreatorProfile) => renderToString(
  <LanguageProvider>
    <CapabilitiesProvider>
      <ProductFeedbackProvider>
        <BuilderProvider initialProfile={profile}>
          <SettingsDomainCard />
        </BuilderProvider>
      </ProductFeedbackProvider>
    </CapabilitiesProvider>
  </LanguageProvider>
);

const outcome = (finding: DomainFinding | null) => renderToString(
  <LanguageProvider>
    <DomainOutcome host={HOST} finding={finding} isChecking={false} />
  </LanguageProvider>
);

describe('the guided domain wizard', () => {
  it('starts by asking for the address, before any record is shown', () => {
    const html = renderCard(profileWith({ customDomain: null }));
    expect(html).toContain('domain-steps');
    expect(html).toContain('Continue to the DNS record');
    expect(html, 'no record table until there is a host to write it for').not.toContain('domain-records');
  });

  it('shows the exact record with a copy control per field once the address is saved', () => {
    const html = renderCard(profileWith({}));
    expect(html).toContain('domain-records');
    expect(html).toContain(HOST);
    expect(html).toContain(brand.cnameTarget);
    expect(html).toContain('CNAME');
    const copyButtons = html.match(/aria-label="Copy /g) ?? [];
    expect(copyButtons, 'one per field').toHaveLength(3);
  });

  it('waits for DNS while the record has not been confirmed', () => {
    const html = renderCard(profileWith({}));
    expect(html).toContain('Waiting for DNS');
    expect(html).toContain('SETUP REQUIRED');
    expect(html).not.toContain('Connected. Visitors reach your site at');
  });

  it('reports the connected state from the stored verification, not from a guess', () => {
    const html = renderCard(profileWith({ customDomainVerified: true }));
    expect(html).toContain('Connected. Visitors reach your site at');
    expect(html, 'one state, one badge').toContain('DNS VERIFIED');
    expect(html).not.toContain('SETUP REQUIRED');
    expect(html).toContain('Advanced diagnostics');
    expect(html).toContain('never holds the private key');
  });

  it('shows why a rejected address was rejected', () => {
    const html = renderToString(
      <DomainSaveFeedback feedback={{ type: 'error', message: 'The custom domain "links.x.test" is already mapped to another RALOA profile.' }} />
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('already mapped to another RALOA profile');
    expect(renderCard(profileWith({ customDomain: null })), 'the address step owns that notice')
      .toContain('Continue to the DNS record');
  });

  it('keeps the paid gate for a plan that cannot connect a domain', () => {
    const html = renderCard(profileWith({ plan: 'free' }));
    expect(html).toContain('Needs Pro');
    expect(html).not.toContain('domain-records');
  });
});

describe('each DNS outcome names what is actually wrong', () => {
  it('no record at all', () => {
    const html = outcome({ state: 'no-record', foundTargets: [] });
    expect(html).toContain('No CNAME record was found for');
    expect(html).toContain(HOST);
    expect(html).toContain('we will check again automatically');
  });

  it('a record that points somewhere else', () => {
    const html = outcome({ state: 'pointing-elsewhere', foundTargets: ['old-host.example.com'] });
    expect(html).toContain('old-host.example.com');
    expect(html).toContain('Change it to the value shown above');
    expect(html, 'a wrong pointer is not reported as a missing record').not.toContain('No CNAME record was found');
  });

  it('a resolver that could not answer', () => {
    const html = outcome({ state: 'lookup-unavailable', foundTargets: [] });
    expect(html).toContain('We could not read DNS for');
    expect(html, 'our failure must not be described as the creator missing a record')
      .not.toContain('No CNAME record was found');
  });

  it('a confirmed connection', () => {
    const html = outcome({ state: 'verified', foundTargets: [brand.cnameTarget] });
    expect(html).toContain('Connected. Visitors reach your site at');
    expect(html).toContain(HOST);
  });

  it('keeps every Latin value out of the surrounding text direction', () => {
    const html = outcome({ state: 'pointing-elsewhere', foundTargets: ['old-host.example.com'] });
    expect(html).toContain('<bdi');
  });
});

describe('the record table', () => {
  it('labels the three fields a DNS form asks for', () => {
    const html = renderToString(
      <LanguageProvider>
        <DomainRecordsTable
          rows={[
            { label: 'Record type', value: 'CNAME', field: 'type' },
            { label: 'Host record', value: HOST, field: 'host' },
            { label: 'Points to', value: brand.cnameTarget, field: 'target' }
          ]}
          copiedField="host"
          onCopy={() => {}}
        />
      </LanguageProvider>
    );
    ['Record type', 'Host record', 'Points to', HOST, brand.cnameTarget].forEach(text => {
      expect(html, text).toContain(text);
    });
    expect(html).toContain('Copied!');
  });
});
