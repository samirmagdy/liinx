import { type CreatorProfile } from '../types/index.js';

export const SYSTEM_DEMO_PROFILES: CreatorProfile[] = [
  {
    id: 'demo-photographer',
    username: 'elenarostova',
    displayName: 'Elena Rostova',
    bio: 'Art Director & Architectural Photographer based in Berlin. Exploring light, concrete, and minimal spaces.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    category: 'Design & Art',
    verified: true,
    themeId: 'editorial-stone',
    stats: {
      viewsThisMonth: '48.2K',
      ctr: '19.4%',
      totalClicks: '9.3K'
    },
    socials: [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'twitter', url: 'https://x.com' },
      { platform: 'youtube', url: 'https://youtube.com' },
      { platform: 'email', url: 'mailto:studio@elena.design' }
    ],
    blocks: [
      {
        id: 'b1',
        type: 'link',
        title: 'New Monograph: "Shadow & Stone"',
        subtitle: 'Limited hardcover edition (Only 200 copies left)',
        url: 'https://example.com/book',
        badge: 'PRE-ORDER',
        highlighted: true,
        clicks: 3410
      },
      {
        id: 'b2',
        type: 'audio',
        title: 'Architectural Echoes (Studio Mix)',
        artist: 'Elena Rostova & Kiasmos',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
        platform: 'spotify'
      },
      {
        id: 'b3',
        type: 'folder',
        title: 'Lightroom Presets & Film LUTs',
        subtitle: '3 curated packs for architectural & editorial tones',
        items: [
          { id: 'f1', title: 'Berlin Brutalism 35mm (.xmp)', url: 'https://example.com/lut1', subtitle: 'High contrast architectural monochrome' },
          { id: 'f2', title: 'Kyoto Golden Hour Film Pack', url: 'https://example.com/lut2', subtitle: 'Warm amber tones and delicate grain' },
          { id: 'f3', title: 'Minimalist Clean Neutral 2025', url: 'https://example.com/lut3', subtitle: 'Subtle desaturation for studio work' }
        ]
      },
      {
        id: 'b4',
        type: 'header',
        title: 'Recent Exhibition & Talks'
      },
      {
        id: 'b5',
        type: 'link',
        title: 'Venice Biennale: Space & Perception',
        subtitle: 'Keynote lecture notes & exhibition photographs',
        url: 'https://example.com/talk',
        clicks: 1890
      },
      {
        id: 'b6',
        type: 'newsletter',
        title: 'The Architectural Eye',
        description: 'Bi-weekly visual journal on spatial design, material honesty, and unseen spaces.',
        buttonText: 'Join the Circle'
      }
    ]
  },
  {
    id: 'demo-musician',
    username: 'marcusvance',
    displayName: 'Marcus Vance',
    bio: 'Electronic Music Producer & Sound Designer. Modular synth recordings, club tracks, and live tour dates.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    category: 'Musicians',
    verified: true,
    themeId: 'tokyo-neon',
    stats: {
      viewsThisMonth: '84.2K',
      ctr: '22.5%',
      totalClicks: '18.9K'
    },
    socials: [
      { platform: 'spotify', url: 'https://spotify.com' },
      { platform: 'youtube', url: 'https://youtube.com' },
      { platform: 'instagram', url: 'https://instagram.com' }
    ],
    blocks: [
      {
        id: 'mv1',
        type: 'audio',
        title: 'Analog Resonance (Live Modular Cut)',
        artist: 'Marcus Vance',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop',
        platform: 'spotify'
      },
      {
        id: 'mv2',
        type: 'link',
        title: 'Fall Tour 2025: Tickets & Venues',
        subtitle: 'Berlin, Amsterdam, London, Tokyo',
        url: 'https://example.com/tour',
        badge: 'LIVE DATES',
        highlighted: true,
        clicks: 7200
      },
      {
        id: 'mv3',
        type: 'folder',
        title: 'Sound Design & Synthesizer Packs',
        subtitle: 'Curated preset libraries and sample stems',
        items: [
          { id: 'mv-f1', title: 'Modular Acid Basslines (.wav)', url: 'https://example.com/pack1', subtitle: 'Raw analogue loops' },
          { id: 'mv-f2', title: 'Cinematic Drones & Reverbs', url: 'https://example.com/pack2', subtitle: 'Atmospheric textures' }
        ]
      }
    ]
  },
  {
    id: 'demo-brand',
    username: 'sarahchen',
    displayName: 'Sarah Chen',
    bio: 'Product Design Lead & Brand Strategist. Crafting high-converting digital interfaces and design systems.',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop',
    category: 'Design & Art',
    verified: true,
    themeId: 'minimal-monochrome',
    stats: {
      viewsThisMonth: '62.1K',
      ctr: '17.8%',
      totalClicks: '11.0K'
    },
    socials: [
      { platform: 'twitter', url: 'https://x.com' },
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'email', url: 'mailto:sarah@example.com' }
    ],
    blocks: [
      {
        id: 'sc1',
        type: 'link',
        title: 'Selected Design Case Studies (2024–2025)',
        subtitle: 'Fintech platforms, SaaS design systems, and mobile apps',
        url: 'https://example.com/work',
        badge: 'PORTFOLIO',
        highlighted: true,
        clicks: 5340
      },
      {
        id: 'sc2',
        type: 'newsletter',
        title: 'Design Craft Weekly',
        description: 'Deep dives into typography, design systems, and interaction aesthetics.',
        buttonText: 'Subscribe Free'
      }
    ]
  }
];

export const SYSTEM_DEMO_USERNAMES = SYSTEM_DEMO_PROFILES.map(p => p.username.toLowerCase());

const DEMO_ALIAS_MAP: Record<string, string> = {
  'photographer': 'elenarostova',
  'musician': 'marcusvance',
  'music': 'marcusvance',
  'business': 'sarahchen',
  'brand': 'sarahchen'
};

export function findSystemDemoProfile(identifier: string): CreatorProfile | undefined {
  const clean = identifier.replace(/^@/, '').replace(/^demo\//, '').toLowerCase().trim();
  const targetUsername = DEMO_ALIAS_MAP[clean] || clean;
  return SYSTEM_DEMO_PROFILES.find(p => p.username.toLowerCase() === targetUsername || p.id === clean);
}
