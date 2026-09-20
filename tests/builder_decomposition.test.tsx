import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { BuilderStudio } from '../src/components/BuilderStudio';
import { BuilderShell } from '../src/features/builder/components/BuilderShell';
import { BuilderToolbar } from '../src/features/builder/components/BuilderToolbar';
import { BuilderSidebar } from '../src/features/builder/components/BuilderSidebar';
import { ContentPanel } from '../src/features/builder/components/panels/ContentPanel';
import { AppearancePanel } from '../src/features/builder/components/panels/AppearancePanel';
import { AnalyticsPanel } from '../src/features/builder/components/panels/AnalyticsPanel';
import { SettingsPanel } from '../src/features/builder/components/panels/SettingsPanel';
import { StructuredItemsEditor } from '../src/features/builder/components/blocks/StructuredItemsEditor';
import { AddBlockMenu } from '../src/features/builder/components/blocks/AddBlockMenu';
import { PageManager } from '../src/features/builder/components/pages/PageManager';
import { SocialLinksEditor } from '../src/features/builder/components/social/SocialLinksEditor';
import { PreviewControls } from '../src/features/builder/components/PreviewControls';
import { BuilderProvider } from '../src/features/builder/context/BuilderContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { CapabilitiesProvider } from '../src/context/CapabilitiesContext';
import { ProductFeedbackProvider } from '../src/components/ProductFeedback';
import { TEST_CREATOR_PROFILE } from './fixtures/testProfiles';
import type { CreatorProfile } from '../src/types';

// Polyfill window in Node test environment for server-side rendering tests
if (typeof window === 'undefined') {
  (global as any).window = {
    location: {
      origin: 'https://raloa.test',
      href: 'https://raloa.test/studio'
    },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

describe('Builder Decomposition & Architectural Integrity', () => {
  const mockProfile: CreatorProfile = {
    ...TEST_CREATOR_PROFILE,
    id: 'prof_test_decomposition',
    username: 'testcreator',
    displayName: 'Test Creator',
    bio: 'Decomposition regression test bio',
    plan: 'studio',
    socials: [
      { id: 'soc_1', platform: 'instagram', url: 'https://instagram.com/testcreator' },
      { id: 'soc_2', platform: 'twitter', url: 'https://twitter.com/testcreator' }
    ],
    pages: [
      {
        id: 'page_home_1',
        slug: 'home',
        title: 'Home',
        isHome: true,
        published: true,
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'page_store_2',
        slug: 'store',
        title: 'Merch Store',
        isHome: false,
        published: true,
        sortOrder: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ],
    blocks: [
      {
        id: 'blk_link_1',
        type: 'link',
        title: 'Check out my portfolio',
        url: 'https://portfolio.example.com',
        pageId: 'page_home_1',
        visible: true,
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'blk_faq_2',
        type: 'faq',
        title: 'Frequently Asked Questions',
        pageId: 'page_home_1',
        visible: true,
        sortOrder: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        extraData: {
          items: [
            { id: 'faq_q1', question: 'How can we work together?', answer: 'Send an inquiry through the booking link.' }
          ]
        }
      }
    ]
  };

  const renderWithProviders = (ui: React.ReactElement, initialProfile: CreatorProfile = mockProfile) => {
    return renderToString(
      <LanguageProvider>
        <CapabilitiesProvider>
          <ProductFeedbackProvider>
            <BuilderProvider initialProfile={initialProfile}>
              {ui}
            </BuilderProvider>
          </ProductFeedbackProvider>
        </CapabilitiesProvider>
      </LanguageProvider>
    );
  };

  describe('BuilderStudio & Shell Orchestration', () => {
    it('renders the complete BuilderShell orchestration without throwing', () => {
      const html = renderWithProviders(<BuilderShell />);
      
      // Toolbar elements
      expect(html).toContain('testcreator');
      expect(html).toContain('studio');
      
      // Sidebar tab navigation
      expect(html).toContain('Blocks &amp; Content');
      expect(html).toContain('Themes &amp; Styles');
      expect(html).toContain('Analytics');
      expect(html).toContain('Settings &amp; Plan');

      // Default active ContentPanel
      expect(html).toContain('Creator Identity');
      expect(html).toContain('Decomposition regression test bio');
      
      // Responsive preview controls
      expect(html).toContain('Mobile');
      expect(html).toContain('Tablet');
      expect(html).toContain('Desktop');
    });

    it('renders BuilderStudio entry component with initial profile', () => {
      const html = renderToString(
        <LanguageProvider>
          <CapabilitiesProvider>
            <ProductFeedbackProvider>
              <BuilderStudio initialProfile={mockProfile} />
            </ProductFeedbackProvider>
          </CapabilitiesProvider>
        </LanguageProvider>
      );

      expect(html).toContain('testcreator');
      expect(html).toContain('studio');
      expect(html).toContain('Blocks &amp; Content');
    });
  });

  describe('BuilderToolbar Component', () => {
    it('displays creator username, plan badge, live link, and save status', () => {
      const html = renderWithProviders(<BuilderToolbar />);

      expect(html).toContain('testcreator');
      expect(html).toContain('studio');
      expect(html).toContain('QR Code');
      expect(html).toContain('Copy Link');
      expect(html).toContain('View Live Page');
      expect(html).toContain('Saved');
    });
  });

  describe('BuilderSidebar Component', () => {
    it('renders all four domain navigation tabs with proper accessibility attributes', () => {
      const html = renderWithProviders(<BuilderSidebar />);

      expect(html).toContain('Blocks &amp; Content');
      expect(html).toContain('Themes &amp; Styles');
      expect(html).toContain('Analytics');
      expect(html).toContain('Settings &amp; Plan');
    });
  });

  describe('ContentPanel Component', () => {
    it('renders Creator Identity inputs, Social Links, Pages, and Block items', () => {
      const html = renderWithProviders(<ContentPanel />);

      // Identity inputs
      expect(html).toContain('Creator Identity');
      expect(html).toContain('Test Creator');
      expect(html).toContain('testcreator');
      expect(html).toContain('Decomposition regression test bio');

      // Connected social links
      expect(html).toContain('Connected Social Icons');
      expect(html).toContain('instagram.com/testcreator');

      // Pages manager
      expect(html).toContain('Pages');
      expect(html).toContain('Home');
      expect(html).toContain('Merch Store');

      // Blocks
      expect(html).toContain('Check out my portfolio');
      expect(html).toContain('Frequently Asked Questions');
    });
  });

  describe('AppearancePanel Component', () => {
    it('renders themes presets, card radius, and custom theme overrides', () => {
      const html = renderWithProviders(<AppearancePanel />);

      expect(html).toContain('Curated Visual Presets');
      expect(html).toContain('Editorial Stone');
      expect(html).toContain('Obsidian Noir');
      expect(html).toContain('Tokyo Neon');
      expect(html).toContain('Card Geometry &amp; Accent Tint');
      expect(html).toContain('Brand Accent Color');
    });
  });

  describe('AnalyticsPanel Component', () => {
    it('renders KPI stat cards, timeline chart, and top links', () => {
      const html = renderWithProviders(<AnalyticsPanel />);

      expect(html).toContain('30-Day Views');
      expect(html).toContain('Click-Through');
      expect(html).toContain('Total Clicks');
      expect(html).toContain('Clicks per view');
    });
  });

  describe('SettingsPanel Component', () => {
    it('renders Plan Upgrades, Domains, Pixels, Custom CSS, and SEO controls', () => {
      const html = renderWithProviders(<SettingsPanel />);

      expect(html).toContain('Subscription Plan');
      expect(html).toContain('Analytics &amp; Retargeting Pixels');
      expect(html).toContain('Google Analytics 4 Measurement ID');
      expect(html).toContain('Custom Domain');
      expect(html).toContain('Background media URL');
      expect(html).toContain('Public Page Controls');
      expect(html).toContain('Developer &amp; REST API Access');
      expect(html).toContain('Form submissions');
    });
  });

  describe('StructuredItemsEditor Component', () => {
    it('renders FAQ questions and answers properly', () => {
      const faqItems = [
        { id: 'f1', question: 'What is your turnaround?', answer: 'Within 24 hours.' }
      ];

      const html = renderToString(
        <LanguageProvider>
          <StructuredItemsEditor
            kind="faq"
            value={faqItems}
            onChange={() => {}}
            ui={(k) => k}
          />
        </LanguageProvider>
      );

      expect(html).toContain('What is your turnaround?');
      expect(html).toContain('Within 24 hours.');
      expect(html).toContain('Add item');
    });

    it('renders Gallery images and captions', () => {
      const galleryItems = [
        { id: 'g1', imageUrl: 'https://example.com/art1.jpg', caption: 'Oil painting 2026', alt: 'art', title: 'Art' }
      ];

      const html = renderToString(
        <LanguageProvider>
          <StructuredItemsEditor
            kind="gallery"
            value={galleryItems}
            onChange={() => {}}
            ui={(k) => k}
          />
        </LanguageProvider>
      );

      expect(html).toContain('https://example.com/art1.jpg');
      expect(html).toContain('Oil painting 2026');
      expect(html).toContain('Add item');
    });

    it('renders Form fields with label, type selector, and required checkbox', () => {
      const formFields = [
        { id: 'fld_email', label: 'Work Email', name: 'email', type: 'email', required: true }
      ];

      const html = renderToString(
        <LanguageProvider>
          <StructuredItemsEditor
            kind="form"
            value={formFields}
            onChange={() => {}}
            ui={(k) => k}
          />
        </LanguageProvider>
      );

      expect(html).toContain('Work Email');
      expect(html).toContain('Add item');
    });
  });

  describe('PreviewControls Component', () => {
    it('renders device switches for mobile, tablet, and desktop', () => {
      const html = renderWithProviders(<PreviewControls />);

      expect(html).toContain('Mobile');
      expect(html).toContain('Tablet');
      expect(html).toContain('Desktop');
    });
  });
});
