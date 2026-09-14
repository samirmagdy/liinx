import { CreatorProfile, PricingPlan, TemplateItem, ThemeConfig } from '../types';

export const THEMES: ThemeConfig[] = [
  {
    id: 'editorial-stone',
    name: 'Editorial Stone',
    bgType: 'solid',
    bgColor: '#FAF7F2',
    textColor: '#191817',
    subtextColor: '#706D67',
    cardBg: '#FFFFFF',
    cardText: '#191817',
    cardBorder: '1px solid #E5DFD5',
    cardHover: '#F4EFE6',
    cardRadius: 'xl',
    accentColor: '#B45309',
    fontFamily: 'display',
    isDark: false,
  },
  {
    id: 'obsidian-noir',
    name: 'Obsidian Noir',
    bgType: 'solid',
    bgColor: '#0C0D0E',
    textColor: '#F5F5F7',
    subtextColor: '#8E8E93',
    cardBg: '#18191B',
    cardText: '#F5F5F7',
    cardBorder: '1px solid #282A2E',
    cardHover: '#232528',
    cardRadius: 'xl',
    accentColor: '#3B82F6',
    fontFamily: 'sans',
    isDark: true,
  },
  {
    id: 'tokyo-cyber',
    name: 'Tokyo Neon',
    bgType: 'gradient',
    bgColor: '#090A10',
    bgGradient: 'linear-gradient(180deg, #090A10 0%, #151128 50%, #0D1117 100%)',
    textColor: '#F8FAFC',
    subtextColor: '#94A3B8',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    cardText: '#F8FAFC',
    cardBorder: '1px solid rgba(236, 72, 153, 0.3)',
    cardHover: 'rgba(236, 72, 153, 0.12)',
    cardRadius: 'full',
    accentColor: '#EC4899',
    fontFamily: 'display',
    isDark: true,
  },
  {
    id: 'nordic-minimal',
    name: 'Nordic Clean',
    bgType: 'solid',
    bgColor: '#FFFFFF',
    textColor: '#09090B',
    subtextColor: '#71717A',
    cardBg: '#F4F4F5',
    cardText: '#09090B',
    cardBorder: '1px solid transparent',
    cardHover: '#E4E4E7',
    cardRadius: 'md',
    accentColor: '#18181B',
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
    cardRadius: 'full',
    accentColor: '#D97706',
    fontFamily: 'sans',
    isDark: false,
  },
  {
    id: 'velvet-plum',
    name: 'Velvet Atelier',
    bgType: 'solid',
    bgColor: '#1A121E',
    textColor: '#FAF5FF',
    subtextColor: '#C084FC',
    cardBg: '#2A1D31',
    cardText: '#FAF5FF',
    cardBorder: '1px solid #462A53',
    cardHover: '#372440',
    cardRadius: 'xl',
    accentColor: '#D8B4FE',
    fontFamily: 'display',
    isDark: true,
  },
  {
    id: 'brutalist-mono',
    name: 'Neo Brutalist',
    bgType: 'solid',
    bgColor: '#F5F5F0',
    textColor: '#000000',
    subtextColor: '#444444',
    cardBg: '#FFFFFF',
    cardText: '#000000',
    cardBorder: '2px solid #000000',
    cardHover: '#FFE066',
    cardRadius: 'none',
    accentColor: '#000000',
    fontFamily: 'mono',
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
    answer: 'Yes, both Starter and Pro plans come with a full 14-day free trial. You can build and customize your profile completely for free before deciding.'
  }
];

export const TESTIMONIALS = [
  {
    quote: "Switching from Linktree to LIINX immediately doubled our release click-through rate. The clean editorial design looks like a bespoke mini-website rather than a generic link list.",
    author: "Elena Rostova",
    role: "Architectural Photographer",
    handle: "@elenarostova",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    metric: "+124% Link Clicks"
  },
  {
    quote: "Being able to embed full Spotify preview tracks and YouTube releases inside an accordion folder changed everything. Fans actually stay on our page.",
    author: "Mateo Chen",
    role: "Electronic Producer & DJ",
    handle: "@mateochen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    metric: "450k+ Monthly Plays"
  },
  {
    quote: "As a fashion atelier, brand perception is everything. LIINX is the only platform whose aesthetics match our brand guidelines. Having our custom domain connected took 2 minutes.",
    author: "Studio Noir Team",
    role: "Paris & Tokyo Atelier",
    handle: "@studionoir",
    avatar: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=150&auto=format&fit=crop",
    metric: "Zero Aesthetic Compromise"
  }
];
