import { TemplateItem } from '../types';
import { DEMO_PROFILES } from '../demo/demoProfiles';

export const TEMPLATES: TemplateItem[] = [
  {
    id: 'tmpl-editorial',
    name: 'Minimalist Editorial',
    category: 'Design & Art',
    description: 'A quiet layout for photographers, designers, and visual portfolios.',
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
    description: 'A bold layout for product launches, collections, and retail links.',
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
