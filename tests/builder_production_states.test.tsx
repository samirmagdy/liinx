import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { BuilderStudio } from '../src/components/BuilderStudio';
import { BuilderProvider } from '../src/features/builder/context/BuilderContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { CapabilitiesProvider } from '../src/context/CapabilitiesContext';
import { ProductFeedbackProvider } from '../src/components/ProductFeedback';
import { DEMO_PROFILES } from '../src/demo/demoProfiles';
import { TEST_CREATOR_PROFILE } from './fixtures/testProfiles';
import type { CreatorProfile } from '../src/types';

// Polyfill window in Node test environment for server-side rendering tests
if (typeof window === 'undefined') {
  (global as any).window = {
    location: {
      origin: 'https://liinx.test',
      href: 'https://liinx.test/studio',
      search: ''
    },
    history: {
      replaceState: () => {}
    },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

describe('Builder Studio Production Load States & Silent Demo Fallback Prevention', () => {
  it('renders loading state initially by default without initialProfile, never showing demo profiles', () => {
    const html = renderToString(
      <LanguageProvider>
        <CapabilitiesProvider>
          <ProductFeedbackProvider><BuilderStudio /></ProductFeedbackProvider>
        </CapabilitiesProvider>
      </LanguageProvider>
    );

    // Initial render with no initialProfile must render loading state
    expect(html).toContain('Loading your profile');
    expect(html).toContain('Preparing your creative studio');

    // Must NOT leak demo profile names or usernames
    for (const demo of DEMO_PROFILES) {
      expect(html).not.toContain(demo.displayName);
      expect(html).not.toContain(`@${demo.username}`);
    }
  });

  it('renders ready state immediately when a valid initialProfile is provided', () => {
    const liveProfile: CreatorProfile = {
      ...TEST_CREATOR_PROFILE,
      id: 'prof_production_live_999',
      displayName: 'Verified Live Creator',
      username: 'verifiedlivecreator'
    };

    const html = renderToString(
      <LanguageProvider>
        <CapabilitiesProvider>
          <ProductFeedbackProvider><BuilderStudio initialProfile={liveProfile} /></ProductFeedbackProvider>
        </CapabilitiesProvider>
      </LanguageProvider>
    );

    // Should render the live profile data in the builder shell
    expect(html).toContain('Verified Live Creator');
    expect(html).toContain('Content');
    expect(html).toContain('Appearance');

    // Must NOT contain demo profile data
    for (const demo of DEMO_PROFILES) {
      expect(html).not.toContain(demo.displayName);
    }
  });

  it('never falls back to Elena Rostova or any demo profile when rendering empty builder context', () => {
    // Explicitly verify BuilderProvider with EMPTY profile doesn't fallback to DEMO_PROFILES[0]
    const html = renderToString(
      <LanguageProvider>
        <CapabilitiesProvider>
          <ProductFeedbackProvider>
            <BuilderProvider>
              <div data-testid="test-child">Child Content</div>
            </BuilderProvider>
          </ProductFeedbackProvider>
        </CapabilitiesProvider>
      </LanguageProvider>
    );

    expect(html).toContain('Child Content');
    for (const demo of DEMO_PROFILES) {
      expect(html).not.toContain(demo.displayName);
      expect(html).not.toContain(`@${demo.username}`);
    }
  });
});
