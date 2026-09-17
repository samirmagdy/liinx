import { PricingPlan } from '../types';

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Free',
    tagline: 'A simple place to publish your work and links.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Personalized liinx.app/@username',
      'Links, social icons, and supported blocks',
      'Supported audio and video embeds',
      'Expandable accordion folders',
      'Curated typography & theme studio',
      'Built-in newsletter capture form',
      'Profile QR code with downloadable export',
      'Basic analytics (views & click counts)',
      'Liinx does not process payments'
    ],
    ctaText: 'Start free'
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'More control for growing creator businesses.',
    monthlyPrice: 12,
    yearlyPrice: 120,
    popular: true,
    features: [
      'Everything in Free, plus:',
      'Connect your own custom domain (e.g. links.yourbrand.com)',
      'Multi-profile management (Up to 5 profiles included)',
      'Extract eligible links from supported captions',
      'Custom CSS styling & custom font uploads',
      'Remove Liinx branding on eligible plans',
      'Deep UTM tracking & Google Analytics / Meta Pixel',
      'Scheduling & time-release links',
      'Priority support'
    ],
    ctaText: 'Start free'
  },
  {
    id: 'studio',
    name: 'Studio / Agency',
    tagline: 'Engineered for talent agencies, record labels, and multi-brand rosters.',
    monthlyPrice: 29,
    yearlyPrice: 288,
    features: [
      'Everything in Pro, plus:',
      'Up to 25 managed creator profiles',
      'Page-aware REST API keys for programmatic access'
    ],
    ctaText: 'Contact Studio Team'
  }
];

export const COMPARISON_FEATURES = [
  { feature: 'Clean, Ad-Free Design', liinx: true, linktree: false, beacons: false },
  { feature: 'Custom Domain (e.g. bio.yoursite.com)', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
  { feature: 'Supported Spotify & YouTube embeds', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
  { feature: 'Accordion folders for clean profiles', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
  { feature: 'Instagram caption link extraction when authorized', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
  { feature: 'External checkout and support links', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
  { feature: 'Public page performance depends on content and hosting', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
  { feature: 'Curated design themes', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
  { feature: 'Multiple profiles on eligible plans', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' }
];

export const FAQS = [
  {
    question: 'How is LIINX different from Linktree or generic link-in-bio tools?',
    answer: 'Liinx gives creators one customizable page for links, media, bookings, and newsletters, with layouts that give content more room than a basic list of buttons.'
  },
  {
    question: 'Can I connect my own custom domain?',
    answer: 'Yes. Paid plans support custom domains and subdomains. You must add the required DNS record and configure hosting and TLS.'
  },
  {
    question: 'How does Instagram caption link extraction work?',
    answer: 'When enabled, LIINX connects to your Instagram account and automatically creates clickable links whenever you include a link or mention in your latest Instagram post caption or carousel. Your bio page always stays in sync without manual updates.'
  },
  {
    question: 'Can I easily migrate my links from my existing link-in-bio?',
    answer: 'You can preview publicly available links from supported profiles, select what you want to keep, and import the selection. Some sites may block extraction.'
  },
  {
    question: 'Can I play music and videos directly on my LIINX page?',
    answer: 'Yes! LIINX supports rich interactive embeds for Spotify, Apple Music, SoundCloud, YouTube, TikTok, and Vimeo. Your fans can listen to preview tracks or watch your latest music video without leaving your profile.'
  },
  {
    question: 'Is there a free plan?',
    answer: 'There is a free plan you can use forever. Paid subscriptions on Pro and Studio are managed directly through Stripe.'
  }
];
