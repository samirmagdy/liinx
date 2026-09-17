import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PublicBioView } from '../src/components/PublicBioView';
import { PublicProfileHeader } from '../src/features/public-bio/components/PublicProfileHeader';
import { PublicPageNavigation } from '../src/features/public-bio/components/PublicPageNavigation';
import { PublicProfileFooter } from '../src/features/public-bio/components/PublicProfileFooter';
import { PublicBlockRenderer } from '../src/features/public-bio/components/PublicBlockRenderer';
import { PublicBioShell } from '../src/features/public-bio/components/PublicBioShell';
import { TrackingPixelManager } from '../src/features/public-bio/components/tracking/TrackingPixelManager';
import { AnalyticsTracker } from '../src/features/public-bio/components/tracking/AnalyticsTracker';
import { PrivacyConsentBanner } from '../src/features/public-bio/components/tracking/PrivacyConsentBanner';
import { LinkBlockView } from '../src/features/public-bio/components/blocks/LinkBlockView';
import { HeaderBlockView } from '../src/features/public-bio/components/blocks/HeaderBlockView';
import { FormBlockView } from '../src/features/public-bio/components/blocks/FormBlockView';
import { FaqBlockView } from '../src/features/public-bio/components/blocks/FaqBlockView';
import { AudioBlockView } from '../src/features/public-bio/components/blocks/AudioBlockView';
import { VideoBlockView } from '../src/features/public-bio/components/blocks/VideoBlockView';
import { CarouselBlockView } from '../src/features/public-bio/components/blocks/CarouselBlockView';
import { GalleryBlockView } from '../src/features/public-bio/components/blocks/GalleryBlockView';
import { MapBlockView } from '../src/features/public-bio/components/blocks/MapBlockView';
import { ContentGateBlockView } from '../src/features/public-bio/components/blocks/ContentGateBlockView';
import { LanguageProvider } from '../src/context/LanguageContext';
import { TEST_CREATOR_PROFILE } from './fixtures/testProfiles';
import { resolveTheme } from '../src/utils/colorContrast';
import type { CreatorProfile, ThemeConfig } from '../src/types';

// Polyfill window & location in Node test environment for server-side rendering tests
const mockLocation = {
  pathname: '/@creator_decomp',
  search: '?utm_source=twitter&utm_medium=social',
  href: 'https://liinx.test/@creator_decomp',
  origin: 'https://liinx.test',
  assign: () => {},
  replace: () => {},
  reload: () => {}
};

(globalThis as any).location = mockLocation;
(globalThis as any).window = {
  location: mockLocation,
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  matchMedia: () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {}
  }),
  addEventListener: () => {},
  removeEventListener: () => {}
};

describe('PublicBioView Decomposition & Domain Regression Tests', () => {
  const defaultTheme: ThemeConfig = resolveTheme('midnight', undefined);

  const mockProfile: CreatorProfile = {
    ...TEST_CREATOR_PROFILE,
    id: 'prof_public_decomp',
    username: 'creator_decomp',
    displayName: 'Decomp Creator',
    bio: 'Testing modular PublicBioView architecture',
    plan: 'studio',
    themeId: 'midnight',
    socials: [
      { platform: 'instagram', url: 'https://instagram.com/creator_decomp' },
      { platform: 'twitter', url: 'https://x.com/creator_decomp' }
    ],
    pages: [
      {
        id: 'page_main',
        slug: 'home',
        title: 'Home',
        isHome: true,
        published: true,
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'page_music',
        slug: 'music',
        title: 'Music Releases',
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
        title: 'Latest Single',
        url: 'https://music.example.com/single',
        subtitle: 'Listen everywhere'
      },
      {
        id: 'blk_link_grid',
        type: 'link',
        title: 'Merch Shop',
        url: 'https://shop.example.com',
        layout: 'grid',
        animation: 'pulse',
        extra: {
          layout: 'grid',
          animation: 'pulse'
        }
      },
      {
        id: 'blk_header_1',
        type: 'header',
        title: 'Upcoming Shows',
        subtitle: 'World Tour 2026'
      },
      {
        id: 'blk_form_1',
        type: 'form',
        title: 'Contact Booking',
        subtitle: 'Send us your inquiries',
        extra: {
          fields: [
            { name: 'name', label: 'Full Name', required: true },
            { name: 'email', label: 'Email Address', type: 'email', required: true },
            { name: 'message', label: 'Message', type: 'textarea' }
          ],
          consentRequired: true,
          consentText: 'I consent to receive replies.',
          buttonText: 'Submit Inquiry'
        }
      },
      {
        id: 'blk_faq_1',
        type: 'faq',
        title: 'Frequently Asked Questions',
        extra: {
          items: [
            { id: 'q1', question: 'When is the new album out?', answer: 'Fall 2026.' },
            { id: 'q2', question: 'Are VIP tickets available?', answer: 'Yes on our official store.' }
          ]
        }
      },
      {
        id: 'blk_audio_1',
        type: 'audio',
        title: 'Midnight Echoes',
        artist: 'Decomp Creator',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
        audioUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
        platform: 'spotify'
      },
      {
        id: 'blk_video_1',
        type: 'video',
        title: 'Live at Red Rocks',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400',
        platform: 'youtube'
      },
      {
        id: 'blk_carousel_1',
        type: 'carousel',
        title: 'Tour Highlights',
        extra: {
          items: [
            { id: 'c1', imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600', caption: 'Stage entrance' },
            { id: 'c2', imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600', caption: 'Crowd energy' }
          ]
        }
      },
      {
        id: 'blk_map_1',
        type: 'map',
        title: 'Tour Headquarters',
        extra: {
          address: 'Austin, Texas, USA'
        }
      }
    ]
  };

  const renderPublicView = (profile: CreatorProfile = mockProfile, previewOnly = false, customTheme?: ThemeConfig) => {
    return renderToString(
      <LanguageProvider>
        <PublicBioView
          profile={profile}
          previewOnly={previewOnly}
          customTheme={customTheme}
        />
      </LanguageProvider>
    );
  };

  describe('Decomposition and Coordinator Architecture', () => {
    it('renders PublicBioView through coordinator and PublicBioShell cleanly', () => {
      const html = renderPublicView();
      expect(html).toContain('Decomp Creator');
      expect(html).toContain('Testing modular PublicBioView architecture');
      expect(html).toContain('Latest Single');
      expect(html).toContain('Upcoming Shows');
      expect(html).toContain('Made with');
      expect(html).toContain('LIINX');
    });

    it('renders PublicProfileHeader with name, bio, and social channels', () => {
      const html = renderToString(
        <LanguageProvider>
          <PublicProfileHeader profile={mockProfile} theme={defaultTheme} />
        </LanguageProvider>
      );
      expect(html).toContain('Decomp Creator');
      expect(html).toContain('creator_decomp');
      expect(html).toContain('Testing modular PublicBioView architecture');
      expect(html).toContain('instagram.com/creator_decomp');
      expect(html).toContain('x.com/creator_decomp');
    });

    it('renders PublicPageNavigation with multi-page navigation pills', () => {
      const html = renderToString(
        <LanguageProvider>
          <PublicPageNavigation profile={mockProfile} theme={defaultTheme} />
        </LanguageProvider>
      );
      expect(html).toContain('Home');
      expect(html).toContain('Music Releases');
      expect(html).toContain('nav aria-label="Profile pages"');
    });

    it('renders PublicProfileFooter with branding and studio backlink', () => {
      const html = renderToString(
        <LanguageProvider>
          <PublicProfileFooter
            profile={mockProfile}
            theme={defaultTheme}
            footerLogoFailed={false}
            setFooterLogoFailed={() => {}}
          />
        </LanguageProvider>
      );
      expect(html).toContain('Made with');
      expect(html).toContain('LIINX');
    });
  });

  describe('Links and Tracking (Requirement 9.1 & 9.4)', () => {
    it('renders public link blocks with /r/:blockId tracking URL and preserves UTM query params', () => {
      const html = renderToString(
        <LanguageProvider>
          <LinkBlockView
            block={mockProfile.blocks[0] as any}
            theme={defaultTheme}
            previewOnly={false}
          />
        </LanguageProvider>
      );
      expect(html).toContain('href="/r/blk_link_1?utm_source=twitter&amp;utm_medium=social"');
      expect(html).toContain('Latest Single');
      expect(html).toContain('Listen everywhere');
    });

    it('renders grid link layout and animations correctly', () => {
      const html = renderToString(
        <LanguageProvider>
          <LinkBlockView
            block={mockProfile.blocks[1] as any}
            theme={defaultTheme}
            previewOnly={false}
          />
        </LanguageProvider>
      );
      expect(html).toContain('liinx-grid-link');
      expect(html).toContain('liinx-link-animation-pulse');
      expect(html).toContain('Merch Shop');
    });

    it('disables clicking/navigation in previewOnly mode', () => {
      const html = renderToString(
        <LanguageProvider>
          <LinkBlockView
            block={mockProfile.blocks[0] as any}
            theme={defaultTheme}
            previewOnly={true}
          />
        </LanguageProvider>
      );
      // In previewOnly mode, interactive links do not have active tracking redirects
      expect(html).not.toContain('href="/r/blk_link_1');
    });
  });

  describe('Hidden and Scheduled Blocks (Requirement 9.2)', () => {
    it('filters out blocks where startAt is in the future', () => {
      const scheduledProfile: CreatorProfile = {
        ...mockProfile,
        blocks: [
          {
            id: 'blk_active',
            type: 'link',
            title: 'Always Active Link',
            url: 'https://example.com/active'
          },
          {
            id: 'blk_future',
            type: 'link',
            title: 'Future Secret Announcement',
            url: 'https://example.com/future',
            startAt: Date.now() + 1000000
          }
        ]
      };
      const html = renderPublicView(scheduledProfile);
      expect(html).toContain('Always Active Link');
      expect(html).not.toContain('Future Secret Announcement');
    });

    it('filters out blocks where endAt is in the past', () => {
      const expiredProfile: CreatorProfile = {
        ...mockProfile,
        blocks: [
          {
            id: 'blk_active',
            type: 'link',
            title: 'Always Active Link',
            url: 'https://example.com/active'
          },
          {
            id: 'blk_expired',
            type: 'link',
            title: 'Expired Promo Offer',
            url: 'https://example.com/promo',
            endAt: Date.now() - 100000
          }
        ]
      };
      const html = renderPublicView(expiredProfile);
      expect(html).toContain('Always Active Link');
      expect(html).not.toContain('Expired Promo Offer');
    });
  });

  describe('Forms Block (Requirement 9.3)', () => {
    it('renders form with normalized fields, labels, consent, and submit button', () => {
      const html = renderToString(
        <LanguageProvider>
          <FormBlockView
            block={mockProfile.blocks[3] as any}
            profileId={mockProfile.id}
            theme={defaultTheme}
            previewOnly={false}
          />
        </LanguageProvider>
      );
      expect(html).toContain('Contact Booking');
      expect(html).toContain('Send us your inquiries');
      expect(html).toContain('Full Name');
      expect(html).toContain('Email Address');
      expect(html).toContain('Message');
      expect(html).toContain('I consent to receive replies.');
      expect(html).toContain('Submit Inquiry');
    });

    it('renders empty form state gracefully when no fields are configured', () => {
      const emptyFormBlock = {
        id: 'blk_form_empty',
        type: 'form',
        title: 'Incomplete Form',
        extra: { fields: [] }
      };
      const html = renderToString(
        <LanguageProvider>
          <FormBlockView
            block={emptyFormBlock as any}
            profileId={mockProfile.id}
            theme={defaultTheme}
            previewOnly={false}
          />
        </LanguageProvider>
      );
      expect(html).toContain('This form is not available yet.');
    });
  });

  describe('Custom Themes & Styling (Requirement 9.5)', () => {
    it('applies custom theme background and card radius correctly', () => {
      const customTheme: ThemeConfig = {
        id: 'custom_sunset',
        name: 'Sunset Orange',
        bgType: 'solid',
        bgColor: '#ff5500',
        textColor: '#ffffff',
        subtextColor: '#ffccaa',
        cardBg: '#1a1a1a',
        cardText: '#ffffff',
        cardBorder: '1px solid #333333',
        cardHover: '#2a2a2a',
        cardRadius: 'full',
        accentColor: '#ffbb00',
        fontFamily: 'display',
        isDark: true
      };

      const html = renderPublicView(mockProfile, false, customTheme);
      expect(html).toContain('background-color:#ff5500');
      expect(html).toContain('var(--font-display)');
    });

    it('injects creator custom CSS safely', () => {
      const styledProfile: CreatorProfile = {
        ...mockProfile,
        customCss: '.custom-creator-class { color: magenta; }'
      };
      const html = renderPublicView(styledProfile);
      expect(html).toContain('.custom-creator-class { color: magenta; }');
    });
  });

  describe('Embeds and Media Blocks (Requirement 9.6)', () => {
    it('renders AudioBlockView with preview embed', () => {
      const html = renderToString(
        <LanguageProvider>
          <AudioBlockView
            block={mockProfile.blocks[5] as any}
            theme={defaultTheme}
            previewOnly={false}
          />
        </LanguageProvider>
      );
      expect(html).toContain('Midnight Echoes');
      expect(html).toContain('Decomp Creator');
      expect(html).toContain('open.spotify.com');
      expect(html).toContain('Open audio provider');
    });

    it('renders VideoBlockView with video title and provider attribution', () => {
      const html = renderToString(
        <LanguageProvider>
          <VideoBlockView
            block={mockProfile.blocks[6] as any}
            theme={defaultTheme}
            previewOnly={false}
          />
        </LanguageProvider>
      );
      expect(html).toContain('Live at Red Rocks');
      expect(html).toContain('Open video');
      expect(html).toContain('youtube.com');
    });

    it('renders CarouselBlockView with slides and accessibility controls', () => {
      const html = renderToString(
        <LanguageProvider>
          <CarouselBlockView
            block={mockProfile.blocks[7] as any}
            theme={defaultTheme}
            previewOnly={false}
          />
        </LanguageProvider>
      );
      expect(html).toContain('Tour Highlights');
      expect(html).toContain('Stage entrance');
      expect(html).toContain('Previous');
      expect(html).toContain('Next');
      expect(html).toContain('aria-roledescription="carousel"');
    });

    it('renders MapBlockView with search link', () => {
      const html = renderToString(
        <LanguageProvider>
          <MapBlockView
            block={mockProfile.blocks[8] as any}
            theme={defaultTheme}
          />
        </LanguageProvider>
      );
      expect(html).toContain('Tour Headquarters');
      expect(html).toContain('Austin, Texas, USA');
      expect(html).toContain('Get directions');
    });

    it('renders FaqBlockView accordion items correctly', () => {
      const html = renderToString(
        <LanguageProvider>
          <FaqBlockView
            block={mockProfile.blocks[4] as any}
            theme={defaultTheme}
          />
        </LanguageProvider>
      );
      expect(html).toContain('Frequently Asked Questions');
      expect(html).toContain('When is the new album out?');
      expect(html).toContain('Fall 2026.');
      expect(html).toContain('Are VIP tickets available?');
      expect(html).toContain('Yes on our official store.');
    });
  });

  describe('Mobile Behavior and Accessibility (Requirement 9.7)', () => {
    it('handles search input accessibility with scoped page status', () => {
      const html = renderPublicView();
      expect(html).toContain('Search this page');
      expect(html).toContain('Search includes this page only');
    });

    it('renders responsive carousel touch container attributes', () => {
      const html = renderToString(
        <LanguageProvider>
          <CarouselBlockView
            block={mockProfile.blocks[7] as any}
            theme={defaultTheme}
            previewOnly={false}
          />
        </LanguageProvider>
      );
      expect(html).toContain('touch-pan-y');
    });

    it('renders privacy banner when pixels are configured and consent is pending', () => {
      const pixelProfile: CreatorProfile = {
        ...mockProfile,
        gaMeasurementId: 'G-XXXXXXXXXX',
        metaPixelId: '123456789'
      };
      const html = renderToString(
        <LanguageProvider>
          <PrivacyConsentBanner
            profile={pixelProfile}
            analyticsConsent={null}
            previewOnly={false}
            onConsentChange={() => {}}
          />
        </LanguageProvider>
      );
      expect(html).toContain('Privacy controls');
      expect(html).toContain('Allow optional analytics');
      expect(html).toContain('Reject optional analytics');
    });

    it('suppresses privacy banner in previewOnly mode', () => {
      const pixelProfile: CreatorProfile = {
        ...mockProfile,
        gaMeasurementId: 'G-XXXXXXXXXX'
      };
      const html = renderToString(
        <LanguageProvider>
          <PrivacyConsentBanner
            profile={pixelProfile}
            analyticsConsent={null}
            previewOnly={true}
            onConsentChange={() => {}}
          />
        </LanguageProvider>
      );
      expect(html).toBe('');
    });
  });
});
