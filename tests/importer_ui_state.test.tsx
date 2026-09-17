import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { LinktreeImporterModal } from '../src/components/LinktreeImporterModal';
import { LanguageProvider } from '../src/context/LanguageContext';
import { CapabilitiesProvider, CapabilitiesContext, DEFAULT_CAPABILITIES } from '../src/context/CapabilitiesContext';
import type { CreatorPage } from '../src/types';

describe('Importer UI State & Capability Enforcement', () => {
  const dummyPages: CreatorPage[] = [
    {
      id: 'page_home',
      slug: 'home',
      title: 'Home',
      isHome: true,
      published: true,
      sortOrder: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  it('fails closed: default capabilities declare all competitor importers unavailable', () => {
    expect(DEFAULT_CAPABILITIES.importers.linktree).toBe(false);
    expect(DEFAULT_CAPABILITIES.importers.beacons).toBe(false);
    expect(DEFAULT_CAPABILITIES.importers.biofm).toBe(false);
  });

  it('renders honest unavailable state and no doomed form when importers are unavailable', () => {
    const html = renderToString(
      <LanguageProvider>
        <CapabilitiesProvider>
          <LinktreeImporterModal
            isOpen={true}
            onClose={() => {}}
            onImportComplete={() => {}}
            pages={dummyPages}
          />
        </CapabilitiesProvider>
      </LanguageProvider>
    );

    // Honest messaging is present
    expect(html).toContain('Automated import is currently unavailable');
    expect(html).toContain('Direct profile importing is currently paused');
    expect(html).toContain('Add links manually');

    // Doomed input form and scan buttons MUST NOT exist in DOM
    expect(html).not.toContain('placeholder="https://linktr.ee/yourname"');
    expect(html).not.toContain('Scan &amp; Preview Links');
    expect(html).not.toContain('Scan & Preview Links');
  });

  it('renders active scan and preview form when an authorized importer is configured', () => {
    const enabledContext = {
      capabilities: {
        importers: {
          linktree: true,
          beacons: false,
          biofm: false
        },
        instagram: false,
        billing: false
      },
      isLoading: false,
      hasAnyImporter: true,
      isImporterAvailable: (p: 'linktree' | 'beacons' | 'biofm') => p === 'linktree',
      refreshCapabilities: async () => {}
    };

    const html = renderToString(
      <LanguageProvider>
        <CapabilitiesContext.Provider value={enabledContext}>
          <LinktreeImporterModal
            isOpen={true}
            onClose={() => {}}
            onImportComplete={() => {}}
            pages={dummyPages}
          />
        </CapabilitiesContext.Provider>
      </LanguageProvider>
    );

    // Active importer input and button MUST exist
    expect(html).toContain('placeholder="https://linktr.ee/yourname"');
    expect(html).toContain('Scan &amp; Preview Links');

    // Paused warning must NOT be shown
    expect(html).not.toContain('Direct profile importing is currently paused');
    expect(html).not.toContain('Automated import is currently unavailable');
  });
});
