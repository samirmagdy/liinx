import { CreatorProfile, PricingPlan, TemplateItem, ThemeConfig } from '../types';

export const THEMES: ThemeConfig[] = [
  {
    id: 'editorial-stone',
    name: 'Editorial Stone',
    bgType: 'solid',
    bgColor: '#FAF9F6',
    textColor: '#181817',
    subtextColor: '#71717A',
    cardBg: '#FFFFFF',
    cardText: '#181817',
    cardBorder: '1px solid #E5E5E0',
    cardHover: '#F9FAFA',
    cardRadius: 'xl',
    accentColor: '#B45309',
    fontFamily: 'sans',
    isDark: false,
  },
  {
    id: 'obsidian-noir',
    name: 'Obsidian Noir',
    bgType: 'solid',
    bgColor: '#0F172A',
    textColor: '#E2E8F0',
    subtextColor: '#64748B',
    cardBg: '#1E293B',
    cardText: '#E2E8F0',
    cardBorder: '1px solid #334155',
    cardHover: '#273548',
    cardRadius: 'xl',
    accentColor: '#3B82F6',
    fontFamily: 'sans',
    isDark: true,
  },
  {
    id: 'tokyo-cyber',
    name: 'Tokyo Neon',
    bgType: 'gradient',
    bgColor: '#0A0A15',
    bgGradient: 'linear-gradient(180deg, #0A0A15 0%, #1e2a42 50%, #0f172a 100%)',
    textColor: '#F8FAFC',
    subtextColor: '#94A3B8',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    cardText: '#F8FAFC',
    cardBorder: '1px solid rgba(56, 179, 248, 0.3)',
    cardHover: 'rgba(56, 179, 248, 0.12)',
    cardRadius: 'xl',
    accentColor: '#EC4899',
    fontFamily: 'sans',
    isDark: true,
  },
  {
    id: 'nordic-minimal',
    name: 'Nordic Clean',
    bgType: 'solid',
    bgColor: '#FFFFFF',
    textColor: '#0F172A',
    subtextColor: '#64748B',
    cardBg: '#F8FAFC',
    cardText: '#0F172A',
    cardBorder: '1px solid #E5E5E0',
    cardHover: '#F1F5F9',
    cardRadius: 'xl',
    accentColor: '#3B82F6',
    fontFamily: 'sans',
    isDark: false,
  },
  {
    id: 'sunset-amber',
    name: 'Amber Hour',
    bgType: 'gradient',
    bgColor: '#FFFBEB',
    bgGradient: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)',
    textColor: '#451A03',
    subtextColor: '#78350F',
    cardBg: '#FFFFFF',
    cardText: '#451A03',
    cardBorder: '1px solid rgba(217, 119, 6, 0.25)',
    cardHover: '#FFFBEB',
    cardRadius: 'xl',
    accentColor: '#D97706',
    fontFamily: 'sans',
    isDark: false,
  },
  {
    id: 'velvet-plum',
    name: 'Velvet Atelier',
    bgType: 'solid',
    bgColor: '#1E213B',
    textColor: '#F8FAFC',
    subtextColor: '#C084FC',
    cardBg: '#2D1B43',
    cardText: '#F8FAFC',
    cardBorder: '1px solid #4A2C5A',
    cardHover: '#372440',
    cardRadius: 'xl',
    accentColor: '#D8B4FE',
    fontFamily: 'sans',
    isDark: true,
  },
  {
    id: 'brutalist-mono',
    name: 'Neo Brutalist',
    bgType: 'solid',
    bgColor: '#FAF9F6',
    textColor: '#181817',
    subtextColor: '#6B7280',
    cardBg: '#FFFFFF',
    cardText: '#181817',
    cardBorder: '2px solid #181817',
    cardHover: '#F3F4F6',
    cardRadius: 'none',
    accentColor: '#181817',
    fontFamily: 'sans',
    isDark: false,
  },
  {
    id: 'forest-canopy',
    name: 'Forest Canopy',
    bgType: 'gradient',
    bgColor: '#0B1A14',
    bgGradient: 'linear-gradient(180deg, #0B1A14 0%, #16332e 50%, #102a1e 100%)',
    textColor: '#E8F5E9',
    subtextColor: '#81C784',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    cardText: '#E8F5E9',
    cardBorder: '1px solid rgba(76, 175, 80, 0.3)',
    cardHover: 'rgba(76, 175, 80, 0.12)',
    cardRadius: 'xl',
    accentColor: '#4CAF50',
    fontFamily: 'sans',
    isDark: true,
  },
  {
    id: 'coral-reef',
    name: 'Coral Reef',
    bgType: 'gradient',
    bgColor: '#FFF5F5',
    bgGradient: 'linear-gradient(180deg, #FFF1F2 0%, #FFE4E6 50%, #FECDD3 100%)',
    textColor: '#881337',
    subtextColor: '#BE185D',
    cardBg: '#FFFFFF',
    cardText: '#881337',
    cardBorder: '1px solid rgba(244, 63, 94, 0.2)',
    cardHover: '#FFF1F2',
    cardRadius: 'xl',
    accentColor: '#F43F5E',
    fontFamily: 'sans',
    isDark: false,
  },
  {
    id: 'midnight-ink',
    name: 'Midnight Ink',
    bgType: 'solid',
    bgColor: '#0F172A',
    textColor: '#E2E8F0',
    subtextColor: '#64748B',
    cardBg: '#1E293B',
    cardText: '#E2E8F0',
    cardBorder: '1px solid #334155',
    cardHover: '#273548',
    cardRadius: 'xl',
    accentColor: '#38BDF8',
    fontFamily: 'sans',
    isDark: true,
  },
  {
    id: 'sahara-dune',
    name: 'Sahara Dune',
    bgType: 'gradient',
    bgColor: '#FDFAF5',
    bgGradient: 'linear-gradient(180deg, #FDFAF5 0%, #F5EDE0 50%, #EADBC8 100%)',
    textColor: '#3E2C1C',
    subtextColor: '#8B6914',
    cardBg: '#FFFFFF',
    cardText: '#3E2C1C',
    cardBorder: '1px solid rgba(194, 139, 56, 0.25)',
    cardHover: '#FAF3E6',
    cardRadius: 'xl',
    accentColor: '#C28B38',
    fontFamily: 'sans',
    isDark: false,
  }
];

export const DEMO_PROFILES: CreatorProfile[] = [
  {
    id: 'elena-rostova',
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
        title: 'Venice Biennale: Spatial Silence Pavilion',
        subtitle: 'June 14 - October 28, 2025',
        url: 'https://example.com/biennale',
        badge: 'EXHIBITION',
        clicks: 1280
      },
      {
        id: 'b6',
        type: 'newsletter',
        title: 'The Sunday Dispatches',
        description: 'A weekly photo essay on design, light, and urban solitude. Read by 14,000+ creators.',
        buttonText: 'Subscribe Free'
      }
    ]
  },
  {
    id: 'mateo-chen',
    username: 'mateochen',
    displayName: 'Mateo Chen',
    bio: 'Electronic Music Producer & Sound Designer. Modular synth recordings and cinematic ambient soundscapes.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    category: 'Musicians',
    verified: true,
    themeId: 'obsidian-noir',
    stats: {
      viewsThisMonth: '92.6K',
      ctr: '24.1%',
      totalClicks: '22.3K'
    },
    socials: [
      { platform: 'spotify', url: 'https://spotify.com' },
      { platform: 'youtube', url: 'https://youtube.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'instagram', url: 'https://instagram.com' }
    ],
    blocks: [
      {
        id: 'mc1',
        type: 'audio',
        title: 'Midnight Transmission (Original Mix)',
        artist: 'Mateo Chen',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop',
        platform: 'spotify'
      },
      {
        id: 'mc2',
        type: 'link',
        title: 'World Tour 2025: Berlin, Tokyo, London, NYC',
        subtitle: 'Tickets selling fast for ADE and Sonar',
        url: 'https://example.com/tour',
        badge: 'TICKETS',
        highlighted: true,
        clicks: 8430
      },
      {
        id: 'mc3',
        type: 'video',
        title: 'Live Modular Session from Swiss Alps Studio',
        videoUrl: 'https://www.youtube.com',
        thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400&auto=format&fit=crop',
        platform: 'youtube'
      },
      {
        id: 'mc4',
        type: 'link',
        title: 'Free Sample Pack: "Analogue Resonances"',
        subtitle: '150+ royalty-free wav samples recorded on Moog Sub 37',
        url: 'https://example.com/samples',
        clicks: 4210
      },
      {
        id: 'mc5',
        type: 'newsletter',
        title: 'Secret Sound Club VIP',
        description: 'Get unreleased WIP demos and early ticket access before public announcements.',
        buttonText: 'Join the Club'
      }
    ]
  },
  {
    id: 'studio-noir',
    username: 'studionoir',
    displayName: 'STUDIO NOIR',
    bio: 'Independent fashion atelier crafting genderless silhouettes from regenerative textiles. Paris / Tokyo.',
    avatarUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop',
    category: 'Brands',
    verified: true,
    themeId: 'tokyo-cyber',
    stats: {
      viewsThisMonth: '114.5K',
      ctr: '18.7%',
      totalClicks: '21.4K'
    },
    socials: [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'email', url: 'mailto:contact@studionoir.co' }
    ],
    blocks: [
      {
        id: 'sn1',
        type: 'link',
        title: 'FW25 Capsule: "Construct 04"',
        subtitle: 'Worldwide express shipping available now',
        url: 'https://example.com/shop',
        badge: 'NEW DROP',
        highlighted: true,
        clicks: 12900
      },
      {
        id: 'sn2',
        type: 'instagram_grid',
        title: 'Campaign Visuals & Community',
        handle: '@studionoir',
        posts: [
          { id: 'p1', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=300&auto=format&fit=crop', likes: '4.8k', linkUrl: 'https://instagram.com' },
          { id: 'p2', imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=300&auto=format&fit=crop', likes: '6.2k', linkUrl: 'https://instagram.com' },
          { id: 'p3', imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=300&auto=format&fit=crop', likes: '3.1k', linkUrl: 'https://instagram.com' },
          { id: 'p4', imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=300&auto=format&fit=crop', likes: '8.9k', linkUrl: 'https://instagram.com' }
        ]
      },
      {
        id: 'sn3',
        type: 'link',
        title: 'Stockists & Flagship Showroom in Le Marais',
        subtitle: '12 Rue de Turenne, 75004 Paris',
        url: 'https://example.com/visit',
        clicks: 3100
      },
      {
        id: 'sn4',
        type: 'newsletter',
        title: 'Private Client Registry',
        description: 'First access to archived sample sales and Paris Fashion Week presentations.',
        buttonText: 'Request Invitation'
      }
    ]
  },
  {
    id: 'aris-thorne',
    username: 'draristhorne',
    displayName: 'Dr. Aris Thorne',
    bio: 'Spatial computing researcher & Founder of Synthetica Studio. Writing on algorithmic typography and modern architecture.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
    category: 'Creators',
    verified: true,
    themeId: 'brutalist-mono',
    stats: {
      viewsThisMonth: '67.1K',
      ctr: '22.8%',
      totalClicks: '15.3K'
    },
    socials: [
      { platform: 'twitter', url: 'https://x.com' },
      { platform: 'github', url: 'https://github.com' },
      { platform: 'linkedin', url: 'https://linkedin.com' },
      { platform: 'youtube', url: 'https://youtube.com' }
    ],
    blocks: [
      {
        id: 'at1',
        type: 'link',
        title: 'Read: "The Alignment Frontier: Post-LLM Intelligence"',
        subtitle: 'Published in Stanford Artificial Intelligence Review',
        url: 'https://example.com/paper',
        badge: 'ESSAY',
        highlighted: true,
        clicks: 9400
      },
      {
        id: 'at2',
        type: 'folder',
        title: 'Open Source Repositories & Weights',
        subtitle: 'Autonomous agents and evaluation benchmarks',
        items: [
          { id: 'rf1', title: 'Synthetica Core Engine (v2.4)', url: 'https://github.com', subtitle: 'Fast asynchronous inference orchestration' },
          { id: 'rf2', title: 'Cognitive Safety Benchmark Dataset', url: 'https://github.com', subtitle: '10,000 adversarial prompts for red-teaming' }
        ]
      },
      {
        id: 'at3',
        type: 'link',
        title: 'Book a Keynote Speech (Q3/Q4 2025)',
        subtitle: 'Inquiries via United Talent Agency',
        url: 'https://example.com/booking',
        clicks: 1840
      },
      {
        id: 'at4',
        type: 'newsletter',
        title: 'The Algorithmic Humanist',
        description: 'Bi-weekly deep dives into artificial cognition. Zero sponsored noise.',
        buttonText: 'Read Free'
      }
    ]
  },
  // ─── New Profile: Wellness & Fitness Coach ─────────────────────────────
  {
    id: 'kaia-monroe',
    username: 'kaiamonroe',
    displayName: 'Kaia Monroe',
    bio: 'Certified Wellness Coach & NASM-CPT. Evidence-based movement, breathwork, and mindful nutrition for high-performers.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
    category: 'Wellness',
    verified: true,
    themeId: 'forest-canopy',
    stats: {
      viewsThisMonth: '73.8K',
      ctr: '21.2%',
      totalClicks: '15.6K'
    },
    socials: [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'youtube', url: 'https://youtube.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'email', url: 'mailto:hello@kaiamonroe.com' }
    ],
    blocks: [
      {
        id: 'km1',
        type: 'link',
        title: '8-Week Body Recomposition Program',
        subtitle: 'Home & gym variations included — 12,000+ members enrolled',
        url: 'https://example.com/program',
        badge: 'BESTSELLER',
        highlighted: true,
        clicks: 7820
      },
      {
        id: 'km2',
        type: 'video',
        title: '15-Min Morning Mobility Flow (No Equipment)',
        videoUrl: 'https://www.youtube.com',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=400&auto=format&fit=crop',
        platform: 'youtube'
      },
      {
        id: 'km3',
        type: 'folder',
        title: 'Free Guides & Downloads',
        subtitle: 'Meal plans, workout templates, and habit trackers',
        items: [
          { id: 'km-f1', title: 'High-Protein Meal Prep Guide (PDF)', url: 'https://example.com/mealprep', subtitle: '7-day macro-balanced meal plan' },
          { id: 'km-f2', title: 'Progressive Overload Tracker Spreadsheet', url: 'https://example.com/tracker', subtitle: 'Google Sheets auto-calculating template' },
          { id: 'km-f3', title: 'Breathwork Basics: 4-7-8 Technique Guide', url: 'https://example.com/breathwork', subtitle: 'Illustrated step-by-step PDF' }
        ]
      },
      {
        id: 'km4',
        type: 'header',
        title: 'Coaching & Community'
      },
      {
        id: 'km5',
        type: 'link',
        title: 'Book 1:1 Coaching (Limited Availability)',
        subtitle: 'Personalized programming, nutrition, and weekly check-ins',
        url: 'https://example.com/coaching',
        badge: '3 SPOTS LEFT',
        clicks: 2140
      },
      {
        id: 'km6',
        type: 'newsletter',
        title: 'The Grounded Newsletter',
        description: 'Weekly evidence-based wellness tips, workout ideas, and mindset strategies. Join 22,000+ readers.',
        buttonText: 'Subscribe Free'
      }
    ]
  },
  // ─── New Profile: Podcast Host ─────────────────────────────────────────
  {
    id: 'milo-abate',
    username: 'miloabate',
    displayName: 'Milo Abate',
    bio: 'Host of "The Long View" — a weekly deep-dive podcast on culture, technology, and the human condition. 2M+ downloads.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
    category: 'Podcasts',
    verified: true,
    themeId: 'midnight-ink',
    stats: {
      viewsThisMonth: '156.3K',
      ctr: '26.7%',
      totalClicks: '41.7K'
    },
    socials: [
      { platform: 'spotify', url: 'https://spotify.com' },
      { platform: 'twitter', url: 'https://x.com' },
      { platform: 'youtube', url: 'https://youtube.com' },
      { platform: 'instagram', url: 'https://instagram.com' }
    ],
    blocks: [
      {
        id: 'ma1',
        type: 'audio',
        title: 'Ep. 247: "Why We Forgot How to Be Bored"',
        artist: 'The Long View with Milo Abate',
        coverUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=300&auto=format&fit=crop',
        platform: 'spotify'
      },
      {
        id: 'ma2',
        type: 'link',
        title: 'Listen on Apple Podcasts',
        subtitle: '#4 in Technology • 2.1M+ total downloads',
        url: 'https://example.com/apple-podcasts',
        badge: 'TOP 5',
        highlighted: true,
        clicks: 18400
      },
      {
        id: 'ma3',
        type: 'link',
        title: 'Listen on Spotify',
        subtitle: 'New episodes every Tuesday morning',
        url: 'https://example.com/spotify',
        clicks: 12700
      },
      {
        id: 'ma4',
        type: 'video',
        title: 'Full Video Episode: Naval Ravikant on Wealth & Leverage',
        videoUrl: 'https://www.youtube.com',
        thumbnailUrl: 'https://images.unsplash.com/photo-1519337265831-281ec6cc8514?q=80&w=400&auto=format&fit=crop',
        platform: 'youtube'
      },
      {
        id: 'ma5',
        type: 'folder',
        title: 'Recommended Reading List',
        subtitle: 'Books referenced on the show (affiliate-free)',
        items: [
          { id: 'ma-f1', title: 'Antifragile — Nassim Nicholas Taleb', url: 'https://example.com/book1', subtitle: 'Discussed in Ep. 12, 89, 201' },
          { id: 'ma-f2', title: 'The Master and His Emissary — Iain McGilchrist', url: 'https://example.com/book2', subtitle: 'Discussed in Ep. 134' },
          { id: 'ma-f3', title: 'Finite and Infinite Games — James Carse', url: 'https://example.com/book3', subtitle: 'Discussed in Ep. 56, 178' }
        ]
      },
      {
        id: 'ma6',
        type: 'newsletter',
        title: 'The Long View Letters',
        description: 'Curated show notes, guest recommendations, and original essays every Friday. Read by 65,000+ subscribers.',
        buttonText: 'Read the Archive'
      }
    ]
  },
  // ─── New Profile: Indie Game Developer / Studio ────────────────────────
  {
    id: 'pixel-forge',
    username: 'pixelforge',
    displayName: 'Pixel Forge Studios',
    bio: 'Award-winning indie game studio crafting narrative-driven pixel art RPGs. Creators of "Hollow Circuit" and "Ashborne".',
    avatarUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop',
    category: 'Gaming',
    verified: true,
    themeId: 'midnight-ink',
    stats: {
      viewsThisMonth: '201.4K',
      ctr: '28.3%',
      totalClicks: '57.0K'
    },
    socials: [
      { platform: 'twitter', url: 'https://x.com' },
      { platform: 'youtube', url: 'https://youtube.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'github', url: 'https://github.com' }
    ],
    blocks: [
      {
        id: 'pf1',
        type: 'link',
        title: 'Hollow Circuit — Wishlist on Steam',
        subtitle: 'A cyberpunk pixel art RPG about AI consciousness',
        url: 'https://example.com/steam',
        badge: 'COMING 2026',
        highlighted: true,
        clicks: 34200
      },
      {
        id: 'pf2',
        type: 'video',
        title: 'Hollow Circuit — Official Reveal Trailer',
        videoUrl: 'https://www.youtube.com',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=400&auto=format&fit=crop',
        platform: 'youtube'
      },
      {
        id: 'pf3',
        type: 'link',
        title: 'Play "Ashborne" — Free on Itch.io',
        subtitle: 'Award-winning 2024 IGF finalist (20+ hour campaign)',
        url: 'https://example.com/ashborne',
        badge: 'FREE',
        clicks: 15800
      },
      {
        id: 'pf4',
        type: 'folder',
        title: 'Press Kit & Dev Resources',
        subtitle: 'Assets for journalists, streamers, and content creators',
        items: [
          { id: 'pf-f1', title: 'Press Kit (Screenshots, Logos, Fact Sheet)', url: 'https://example.com/presskit', subtitle: 'Hi-res assets ready for publication' },
          { id: 'pf-f2', title: 'Streamer/YouTuber Early Access Keys', url: 'https://example.com/keys', subtitle: 'Request a free review key' },
          { id: 'pf-f3', title: 'Official Soundtrack (Bandcamp)', url: 'https://example.com/ost', subtitle: '42-track chiptune + orchestral hybrid OST' }
        ]
      },
      {
        id: 'pf5',
        type: 'newsletter',
        title: 'Pixel Forge Devlog',
        description: 'Behind-the-scenes development updates, pixel art breakdowns, and exclusive early previews every other week.',
        buttonText: 'Follow the Journey'
      }
    ]
  },
  // ─── New Profile: Lifestyle & Travel Blogger ──────────────────────────
  {
    id: 'amara-osei',
    username: 'amaraosei',
    displayName: 'Amara Osei',
    bio: 'Travel storyteller & slow-living advocate. Documenting intentional journeys through West Africa, Southern Europe, and Southeast Asia.',
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop',
    category: 'Lifestyle',
    verified: true,
    themeId: 'sahara-dune',
    stats: {
      viewsThisMonth: '88.9K',
      ctr: '20.5%',
      totalClicks: '18.2K'
    },
    socials: [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'youtube', url: 'https://youtube.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'twitter', url: 'https://x.com' }
    ],
    blocks: [
      {
        id: 'ao1',
        type: 'link',
        title: 'Read My New Book: "Slow Roads, Rich Days"',
        subtitle: 'A visual memoir on slow travel through 14 countries',
        url: 'https://example.com/book',
        badge: 'NEW RELEASE',
        highlighted: true,
        clicks: 6420
      },
      {
        id: 'ao2',
        type: 'video',
        title: 'A Week in Accra — Food, Markets & Hidden Courtyards',
        videoUrl: 'https://www.youtube.com',
        thumbnailUrl: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?q=80&w=400&auto=format&fit=crop',
        platform: 'youtube'
      },
      {
        id: 'ao3',
        type: 'instagram_grid',
        title: 'Latest Travels & Moments',
        handle: '@amaraosei',
        posts: [
          { id: 'ao-p1', imageUrl: 'https://images.unsplash.com/photo-1504681869696-d977211a5f4c?q=80&w=300&auto=format&fit=crop', likes: '12.3k', linkUrl: 'https://instagram.com' },
          { id: 'ao-p2', imageUrl: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=300&auto=format&fit=crop', likes: '8.1k', linkUrl: 'https://instagram.com' },
          { id: 'ao-p3', imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=300&auto=format&fit=crop', likes: '15.7k', linkUrl: 'https://instagram.com' },
          { id: 'ao-p4', imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=300&auto=format&fit=crop', likes: '9.4k', linkUrl: 'https://instagram.com' }
        ]
      },
      {
        id: 'ao4',
        type: 'folder',
        title: 'Travel Guides & Packing Lists',
        subtitle: 'Free downloadable itineraries and checklists',
        items: [
          { id: 'ao-f1', title: 'West Africa 3-Week Itinerary (Ghana, Senegal, Benin)', url: 'https://example.com/westafrica', subtitle: 'Budget, routes, and cultural tips' },
          { id: 'ao-f2', title: 'Carry-On Only Packing List (Tropical)', url: 'https://example.com/packing', subtitle: 'My minimalist packing system' },
          { id: 'ao-f3', title: 'Portugal Slow Travel Guide — Algarve to Porto', url: 'https://example.com/portugal', subtitle: '10-day road trip with hidden gems' }
        ]
      },
      {
        id: 'ao5',
        type: 'link',
        title: 'Collaborate With Me — Brand Partnerships',
        subtitle: 'Media kit and partnership inquiries',
        url: 'https://example.com/collab',
        clicks: 1830
      },
      {
        id: 'ao6',
        type: 'newsletter',
        title: 'The Slow Dispatch',
        description: 'A bi-weekly letter on intentional travel, cultural immersion, and living with less. 35,000+ readers.',
        buttonText: 'Join the Journey'
      }
    ]
  }
];

export const TEMPLATES: TemplateItem[] = [
  {
    id: 'tmpl-editorial',
    name: 'Minimalist Editorial',
    category: 'Design & Art',
    description: 'Generous typography, delicate borders, and museum-grade whitespace for photographers and stylists.',
    profile: DEMO_PROFILES[0],
    previewColor: '#FAF7F2'
  },
  {
    id: 'tmpl-dark-sound',
    name: 'Obsidian Studio',
    category: 'Musicians',
    description: 'High-contrast dark canvas engineered for musicians, sound designers, and tour schedules.',
    profile: DEMO_PROFILES[1],
    previewColor: '#0C0D0E'
  },
  {
    id: 'tmpl-tokyo-brand',
    name: 'Neon Atelier',
    category: 'Brands',
    description: 'Electric accents, capsule drops, and Instagram synchronization for modern apparel and retail.',
    profile: DEMO_PROFILES[2],
    previewColor: '#151128'
  },
  {
    id: 'tmpl-brutalist',
    name: 'Neo Brutalist Mono',
    category: 'Creators',
    description: 'High-impact tactile 2px borders, monospaced tech typography, and raw authenticity.',
    profile: DEMO_PROFILES[3],
    previewColor: '#F5F5F0'
  },
  {
    id: 'tmpl-wellness',
    name: 'Forest Wellness',
    category: 'Wellness',
    description: 'Organic green gradients and calming depth for fitness coaches, yoga instructors, and wellness brands.',
    profile: DEMO_PROFILES[4],
    previewColor: '#0B1A14'
  },
  {
    id: 'tmpl-podcast',
    name: 'Midnight Broadcast',
    category: 'Podcasts',
    description: 'Dark slate tones with monospaced typography, built for podcasters, interviewers, and audio creators.',
    profile: DEMO_PROFILES[5],
    previewColor: '#0F172A'
  },
  {
    id: 'tmpl-gaming',
    name: 'Indie Dev Console',
    category: 'Gaming',
    description: 'Terminal-inspired dark theme for game studios, streamers, and indie developers with press-kit ready layouts.',
    profile: DEMO_PROFILES[6],
    previewColor: '#0F172A'
  },
  {
    id: 'tmpl-lifestyle',
    name: 'Sahara Journal',
    category: 'Lifestyle',
    description: 'Warm desert tones, elegant serif accents, and earthy hues for travel bloggers and lifestyle creators.',
    profile: DEMO_PROFILES[7],
    previewColor: '#FDFAF5'
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Everything creators need to look world-class.',
    monthlyPrice: 5,
    yearlyPrice: 48, // $4/mo billed annually
    features: [
      'Personalized liinx.co/@username',
      'Unlimited link blocks & social icons',
      'Audio & Video auto-embeds (Spotify, YouTube)',
      'Expandable accordion folders',
      'Curated typography & theme studio',
      'Built-in newsletter capture form',
      'Dynamic QR codes with logo export',
      'Basic analytics (views & click counts)',
      'Zero platform transaction fees'
    ],
    ctaText: 'Start 14-Day Free Trial'
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'The gold standard for established creators & independent studios.',
    monthlyPrice: 12,
    yearlyPrice: 120, // $10/mo billed annually
    popular: true,
    features: [
      'Everything in Starter, plus:',
      'Connect your own custom domain (e.g. links.yourbrand.com)',
      'Multi-profile management (Up to 5 profiles included)',
      'Instagram auto-sync from post captions',
      'Custom CSS styling & custom font uploads',
      'Zero LIINX branding badge (100% white-label)',
      'Deep UTM tracking & Google Analytics / Meta Pixel',
      'Scheduling & time-release links',
      'Priority 24/7 creator concierge support'
    ],
    ctaText: 'Start 14-Day Free Trial'
  },
  {
    id: 'studio',
    name: 'Studio / Agency',
    tagline: 'Engineered for talent agencies, record labels, and multi-brand rosters.',
    monthlyPrice: 29,
    yearlyPrice: 288, // $24/mo billed annually
    features: [
      'Everything in Pro, plus:',
      'Up to 25 managed creator profiles',
      'Team collaboration & client view permissions',
      'Public REST API access for automated link sync',
      'Custom favicons & open graph social cards per link',
      'Consolidated agency billing & invoice exports',
      'Dedicated account manager & migration assistance'
    ],
    ctaText: 'Contact Studio Team'
  }
];

export const COMPARISON_FEATURES = [
  { feature: 'Clean, Ad-Free Design', liinx: true, linktree: false, beacons: false },
  { feature: 'Custom Domain (e.g. bio.yoursite.com)', liinx: true, linktree: 'Paid $24+/mo', beacons: 'Paid' },
  { feature: 'Embedded Spotify & YouTube Media', liinx: true, linktree: true, beacons: true },
  { feature: 'Accordion Folders for Clean Profiles', liinx: true, linktree: false, beacons: false },
  { feature: 'Instagram Caption Auto-Sync', liinx: true, linktree: false, beacons: false },
  { feature: 'Zero Commission on Sales/Donations', liinx: true, linktree: 'Takes 0.5-9%', beacons: 'Takes 9%' },
  { feature: 'Sub-100ms Ultra-Fast Page Load', liinx: true, linktree: false, beacons: false },
  { feature: 'Bespoke Curated Design Themes', liinx: true, linktree: 'Generic templates', beacons: 'Limited' },
  { feature: 'Multi-Profile Management (One Login)', liinx: true, linktree: 'Enterprise only', beacons: false }
];

export const FAQS = [
  {
    question: 'How is LIINX different from Linktree or generic link-in-bio tools?',
    answer: 'LIINX is engineered specifically for design-conscious creators, artists, and independent brands. Unlike older tools that clutter your page with corporate branding, ads, and generic plastic buttons, LIINX delivers an editorial-grade experience with bespoke typography, media embeds that feel native, accordion folders to reduce scrolling friction, and custom domain support at a fraction of the cost.'
  },
  {
    question: 'Can I connect my own custom domain?',
    answer: 'Yes! On our Pro and Studio plans, you can map any custom domain or subdomain (such as links.yourdomain.com or bio.yourname.studio) with automated zero-configuration SSL certificates.'
  },
  {
    question: 'How does the Instagram Auto-Sync feature work?',
    answer: 'When enabled, LIINX connects to your Instagram account and automatically creates clickable links whenever you include a link or mention in your latest Instagram post caption or carousel. Your bio page always stays in sync without manual updates.'
  },
  {
    question: 'Can I easily migrate my links from my existing link-in-bio?',
    answer: 'Absolutely. You can import your links directly from Linktree, Beacons, or Bio.fm in less than 60 seconds using our one-click importer in the Studio Builder.'
  },
  {
    question: 'Can I play music and videos directly on my LIINX page?',
    answer: 'Yes! LIINX supports rich interactive embeds for Spotify, Apple Music, SoundCloud, YouTube, TikTok, and Vimeo. Your fans can listen to preview tracks or watch your latest music video without leaving your profile.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'There is a free plan you can use forever. Paid subscriptions on Pro and Studio are managed directly through Stripe.'
  }
];
