import { assertSiteTemplateCatalog, type SiteTemplate } from '../contracts/templates.js';

/**
 * Starter sites, not starter colours. Each composition is applied to a real account by
 * server/services/siteComposition.ts, so everything here must be expressible as stored
 * pages and blocks.
 *
 * Placeholder rules, enforced by the contract and by review:
 * - Link blocks carry no URL. An invented destination would send a creator's first visitors
 *   somewhere false, and an empty destination renders as a row waiting to be filled.
 * - No metrics, quotes, prices, dates, handles, or imagery. Those would be fabricated proof.
 */
const SITE_TEMPLATE_CATALOG: SiteTemplate[] = [
  {
    id: 'tmpl-editorial',
    name: 'Minimalist Editorial',
    intent: 'photographer',
    category: 'Design & Art',
    description: 'A quiet layout for photographers, designers, and visual portfolios.',
    themeId: 'editorial-stone',
    profile: { bio: 'Photographer. Add a line about what you shoot and where you work.', shareTitle: 'Add your name', shareDescription: 'Add one sentence visitors see when you share this page.' },
    pages: [
      { slug: 'portfolio', title: 'Portfolio', description: 'Group the series you want clients to open first.' },
      { slug: 'printing', title: 'Printing', description: 'Sales, licensing, or a link to your print store.' }
    ],
    blocks: [
      { type: 'header', title: 'Selected work' },
      { type: 'link', title: 'Book a session', subtitle: 'Add your booking or enquiry link' },
      { type: 'link', title: 'Full portfolio', subtitle: 'Open the Portfolio page, or add your own site', page: 'portfolio' },
      { type: 'link', title: 'Instagram', subtitle: 'Add your profile URL' },
      { type: 'folder', title: 'Series', subtitle: 'Group related projects', page: 'portfolio', extra: { items: [{ title: 'Add a series', url: '' }, { title: 'Add a series', url: '' }, { title: 'Add a series', url: '' }] } },
      { type: 'header', title: 'Prints and licensing', page: 'printing' },
      { type: 'link', title: 'Print enquiries', subtitle: 'Add your store or email', page: 'printing' },
      { type: 'faq', title: 'Working together', page: 'printing', extra: { items: [{ question: 'How long until I receive my photos?', answer: 'Replace this with your turnaround.' }, { question: 'Do you travel for commissions?', answer: 'Replace this with your coverage area.' }] } },
      { type: 'newsletter', title: 'Stay in touch', subtitle: 'New work, open dates', extra: { description: 'Occasional updates. No selling.', buttonText: 'Join the list' } },
      { type: 'spacer', title: 'Breathing room' }
    ]
  },
  {
    id: 'tmpl-dark-sound',
    name: 'Obsidian Studio',
    intent: 'musician',
    category: 'Musicians',
    description: 'High-contrast dark canvas engineered for musicians, sound designers, and tour schedules.',
    themeId: 'obsidian-noir',
    profile: { bio: 'Musician. Say what you make and what is coming next.', shareTitle: 'Add your artist name' },
    pages: [
      { slug: 'releases', title: 'Releases', description: 'Everything you want a listener to press play on.' },
      { slug: 'press', title: 'Press', description: 'For bookers, journalists, and playlist curators.' }
    ],
    blocks: [
      { type: 'header', title: 'New release' },
      { type: 'link', title: 'Pre-save / stream', subtitle: 'Add your distributor link', highlighted: true },
      { type: 'folder', title: 'Listen on', subtitle: 'Spotify, Apple Music, Bandcamp…', extra: { items: [{ title: 'Add a platform', url: '' }, { title: 'Add a platform', url: '' }, { title: 'Add a platform', url: '' }] } },
      { type: 'link', title: 'Watch the video', subtitle: 'Add your video URL', page: 'releases' },
      { type: 'header', title: 'Tour dates', page: 'releases' },
      { type: 'link', title: 'All dates', subtitle: 'Link your booking or ticket page' },
      { type: 'link', title: 'Booking enquiries', subtitle: 'Add your manager email', page: 'press' },
      { type: 'link', title: 'Press kit', subtitle: 'Add a download or page URL', page: 'press' },
      { type: 'newsletter', title: 'Mailing list', extra: { description: 'Release dates and shows, straight to your listeners.', buttonText: 'Sign up' } },
      { type: 'spacer', title: 'Breathing room' }
    ]
  },
  {
    id: 'tmpl-tokyo-brand',
    name: 'Neon Atelier',
    intent: 'business',
    category: 'Brands',
    description: 'A bold layout for product launches, collections, and retail links.',
    themeId: 'tokyo-cyber',
    profile: { bio: 'Add what you sell and who it is for.', shareTitle: 'Add your brand name' },
    pages: [
      { slug: 'shop', title: 'Shop', description: 'Where people buy.' },
      { slug: 'support', title: 'Support', description: 'Answers before they email you.' }
    ],
    blocks: [
      { type: 'header', title: 'Latest drop' },
      { type: 'link', title: 'Shop the collection', subtitle: 'Add your store URL', highlighted: true },
      { type: 'folder', title: 'Categories', extra: { items: [{ title: 'Add a category', url: '' }, { title: 'Add a category', url: '' }] } },
      { type: 'link', title: 'Stockists', subtitle: 'Add a list or map URL', page: 'shop' },
      { type: 'form', title: 'Wholesale enquiries', page: 'shop', extra: { description: 'For shops and buyers.', buttonText: 'Send enquiry', fields: [{ name: 'store', label: 'Store name', type: 'text' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'message', label: 'What are you stocking?', type: 'textarea' }] } },
      { type: 'faq', title: 'Questions', page: 'support', extra: { items: [{ question: 'Where is my order?', answer: 'Replace with your dispatch promise and tracking link.' }, { question: 'What is your returns window?', answer: 'Replace with your policy.' }] } },
      { type: 'link', title: 'Contact support', subtitle: 'Add your support email', page: 'support' },
      { type: 'newsletter', title: 'Collection previews', extra: { description: 'Early access before each drop.', buttonText: 'Join' } }
    ]
  },
  {
    id: 'tmpl-brutalist',
    name: 'Neo Brutalist Mono',
    intent: 'creator',
    category: 'Creators',
    description: 'High-impact tactile 2px borders, monospaced tech typography, and raw authenticity.',
    themeId: 'brutalist-mono',
    profile: { bio: 'Add one line about what you publish and how often.' },
    pages: [{ slug: 'work-with-me', title: 'Work with me', description: 'For brands and collaborators.' }],
    blocks: [
      { type: 'header', title: 'Start here' },
      { type: 'link', title: 'Latest post or video', subtitle: 'Add your newest thing', highlighted: true },
      { type: 'folder', title: 'Elsewhere', extra: { items: [{ title: 'Add a platform', url: '' }, { title: 'Add a platform', url: '' }, { title: 'Add a platform', url: '' }] } },
      { type: 'rich_text', title: 'About', extra: { body: 'Two sentences: what you make, and why someone should care.' } },
      { type: 'link', title: 'Media kit', subtitle: 'Add a download or page URL', page: 'work-with-me' },
      { type: 'form', title: 'Collaboration brief', page: 'work-with-me', extra: { description: 'Tell me about the project.', buttonText: 'Send', fields: [{ name: 'brand', label: 'Brand or person', type: 'text' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'brief', label: 'Brief', type: 'textarea' }] } },
      { type: 'newsletter', title: 'Newsletter', extra: { buttonText: 'Subscribe' } }
    ]
  },
  {
    id: 'tmpl-wellness',
    name: 'Forest Wellness',
    intent: 'coach',
    category: 'Wellness',
    description: 'Organic green gradients and calming depth for fitness coaches, yoga instructors, and wellness brands.',
    themeId: 'forest-canopy',
    profile: { bio: 'Coach or instructor. Say who you help and how.' },
    pages: [
      { slug: 'sessions', title: 'Sessions', description: 'Formats, lengths, and how to book.' },
      { slug: 'about', title: 'About', description: 'Qualifications and the way you work.' }
    ],
    blocks: [
      { type: 'header', title: 'Work with me' },
      { type: 'link', title: 'Book a session', subtitle: 'Add your booking link', highlighted: true },
      { type: 'folder', title: 'Options', page: 'sessions', extra: { items: [{ title: 'Add a format', url: '' }, { title: 'Add a format', url: '' }] } },
      { type: 'link', title: 'Class timetable', subtitle: 'Add a link', page: 'sessions' },
      { type: 'rich_text', title: 'How we work', page: 'about', extra: { body: 'Describe your approach in a short paragraph, then list qualifications.' } },
      { type: 'faq', title: 'Before we start', page: 'about', extra: { items: [{ question: 'Do I need experience?', answer: 'Replace with your answer.' }, { question: 'What should I bring?', answer: 'Replace with your answer.' }] } },
      { type: 'form', title: 'Ask a question', extra: { description: 'Free to ask.', buttonText: 'Send', fields: [{ name: 'name', label: 'Your name', type: 'text' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'message', label: 'Message', type: 'textarea' }] } },
      { type: 'newsletter', title: 'Weekly notes', extra: { buttonText: 'Join' } }
    ]
  },
  {
    id: 'tmpl-podcast',
    name: 'Midnight Broadcast',
    intent: 'creator',
    category: 'Podcasts',
    description: 'Dark slate tones with monospaced typography, built for podcasters, interviewers, and audio creators.',
    themeId: 'midnight-ink',
    profile: { bio: 'Podcast name, host, and what the show is about.' },
    pages: [
      { slug: 'episodes', title: 'Episodes', description: 'The back catalogue that matters.' },
      { slug: 'guests', title: 'Guests & sponsors', description: 'For people who want to be on the show or support it.' }
    ],
    blocks: [
      { type: 'header', title: 'Latest episode' },
      { type: 'link', title: 'Listen now', subtitle: 'Add the episode link', highlighted: true },
      { type: 'folder', title: 'Subscribe on', extra: { items: [{ title: 'Add a platform', url: '' }, { title: 'Add a platform', url: '' }, { title: 'Add a platform', url: '' }] } },
      { type: 'link', title: 'Episode index', subtitle: 'Add a link', page: 'episodes' },
      { type: 'faq', title: 'About the show', page: 'episodes', extra: { items: [{ question: 'How often do episodes land?', answer: 'Replace with your schedule.' }] } },
      { type: 'form', title: 'Pitch a guest', page: 'guests', extra: { description: 'Who should we talk to, and why.', buttonText: 'Send', fields: [{ name: 'name', label: 'Your name', type: 'text' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'pitch', label: 'Pitch', type: 'textarea' }] } },
      { type: 'link', title: 'Sponsor the show', subtitle: 'Add your media kit URL', page: 'guests' },
      { type: 'newsletter', title: 'Show notes', extra: { buttonText: 'Subscribe' } }
    ]
  },
  {
    id: 'tmpl-gaming',
    name: 'Indie Dev Console',
    intent: 'developer',
    category: 'Gaming',
    description: 'Terminal-inspired dark theme for game studios, streamers, and indie developers with press-kit ready layouts.',
    themeId: 'velvet-plum',
    profile: { bio: 'Studio or developer. Name the project and its status.' },
    pages: [
      { slug: 'games', title: 'Games', description: 'What you have built and what is in progress.' },
      { slug: 'press', title: 'Press kit', description: 'Assets and contact for journalists and streamers.' }
    ],
    blocks: [
      { type: 'header', title: 'Now playing' },
      { type: 'link', title: 'Wishlist', subtitle: 'Add your store page', highlighted: true },
      { type: 'link', title: 'Demo', subtitle: 'Add a download or store URL', page: 'games' },
      { type: 'folder', title: 'Follow the build', extra: { items: [{ title: 'Devlog', url: '' }, { title: 'Community', url: '' }] } },
      { type: 'rich_text', title: 'Changelog', page: 'games', extra: { body: 'Post what changed this week, oldest at the bottom.' } },
      { type: 'link', title: 'Press kit', subtitle: 'Add a download URL', page: 'press' },
      { type: 'form', title: 'Business enquiries', page: 'press', extra: { description: 'Publishing, localisation, partnerships.', buttonText: 'Send', fields: [{ name: 'company', label: 'Company', type: 'text' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'message', label: 'Message', type: 'textarea' }] } },
      { type: 'newsletter', title: 'Release alerts', extra: { buttonText: 'Notify me' } }
    ]
  },
  {
    id: 'tmpl-lifestyle',
    name: 'Sahara Journal',
    intent: 'creator',
    category: 'Lifestyle',
    description: 'Warm desert tones, elegant serif accents, and earthy hues for travel bloggers and lifestyle creators.',
    themeId: 'sahara-dune',
    profile: { bio: 'Writer or creator. Say what you document.' },
    pages: [
      { slug: 'journal', title: 'Journal', description: 'Long-form pieces worth reading twice.' },
      { slug: 'guides', title: 'Guides', description: 'The practical stuff people come back for.' }
    ],
    blocks: [
      { type: 'header', title: 'Read this first' },
      { type: 'link', title: 'Latest story', subtitle: 'Add your newest post', highlighted: true },
      { type: 'folder', title: 'Elsewhere', extra: { items: [{ title: 'Add a platform', url: '' }, { title: 'Add a platform', url: '' }] } },
      { type: 'link', title: 'All stories', subtitle: 'Add a link', page: 'journal' },
      { type: 'rich_text', title: 'About', page: 'journal', extra: { body: 'Who you are, where you write from, what to expect.' } },
      { type: 'faq', title: 'Trip questions', page: 'guides', extra: { items: [{ question: 'What gear do you use?', answer: 'Replace with your list.' }, { question: 'Do you take commissions?', answer: 'Replace with your answer.' }] } },
      { type: 'newsletter', title: 'Dispatches', extra: { description: 'One letter a week.', buttonText: 'Subscribe' } },
      { type: 'spacer', title: 'Breathing room' }
    ]
  }
];

/** Validated at module load: a malformed catalog cannot reach a request handler. */
export const SITE_TEMPLATES: SiteTemplate[] = assertSiteTemplateCatalog(SITE_TEMPLATE_CATALOG);

export const SITE_TEMPLATE_IDS = SITE_TEMPLATES.map(template => template.id);

export function findSiteTemplate(id: unknown): SiteTemplate | undefined {
  if (typeof id !== 'string') return undefined;
  return SITE_TEMPLATES.find(template => template.id === id);
}

/** Templates that match the discipline a creator picked while signing up. */
export function siteTemplatesForIntent(intent: unknown): SiteTemplate[] {
  if (typeof intent !== 'string') return [];
  return SITE_TEMPLATES.filter(template => template.intent === intent);
}
