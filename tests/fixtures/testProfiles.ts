import type { CreatorProfile, ThemeConfig } from '../../src/types';
import { THEMES } from '../../src/config/themes';

export const TEST_THEMES: ThemeConfig[] = THEMES;

export const TEST_CREATOR_PROFILE: CreatorProfile = {
  id: 'prof_fixture_test_01',
  username: 'testfixturecreator',
  displayName: 'Test Fixture Creator',
  bio: 'Standard test fixture profile for automated regression testing',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  category: 'Design & Art',
  verified: true,
  themeId: 'editorial-stone',
  plan: 'studio',
  stats: {
    viewsThisMonth: '10.5K',
    ctr: '15.2%',
    totalClicks: '1.6K'
  },
  socials: [
    { platform: 'instagram', url: 'https://instagram.com/testfixturecreator' },
    { platform: 'twitter', url: 'https://x.com/testfixturecreator' },
    { platform: 'youtube', url: 'https://youtube.com/@testfixturecreator' },
    { platform: 'email', url: 'mailto:fixture@example.com' }
  ],
  pages: [
    {
      id: 'page_fixture_home',
      slug: 'home',
      title: 'Home',
      isHome: true,
      published: true,
      sortOrder: 0,
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    },
    {
      id: 'page_fixture_store',
      slug: 'store',
      title: 'Merch Store',
      isHome: false,
      published: true,
      sortOrder: 1,
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    }
  ],
  blocks: [
    {
      id: 'blk_fixture_link_1',
      type: 'link',
      title: 'Official Portfolio',
      subtitle: 'View our architectural projects',
      url: 'https://example.com/portfolio',
      badge: 'FEATURED',
      highlighted: true,
      clicks: 420
    },
    {
      id: 'blk_fixture_audio_1',
      type: 'audio',
      title: 'Ambient Studio Session',
      artist: 'Fixture Artist',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
      audioUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
      platform: 'spotify'
    },
    {
      id: 'blk_fixture_folder_1',
      type: 'folder',
      title: 'Free Design Resources',
      subtitle: 'Download presets and mockups',
      items: [
        { id: 'f_item_1', title: 'Minimalist Lightroom Presets', url: 'https://example.com/preset1' },
        { id: 'f_item_2', title: 'Studio Tone Curve Curves', url: 'https://example.com/preset2' }
      ]
    },
    {
      id: 'blk_fixture_header_1',
      type: 'header',
      title: 'Events & Appearances'
    }
  ]
};

export const TEST_PROFILES: CreatorProfile[] = [TEST_CREATOR_PROFILE];
