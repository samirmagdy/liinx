import React from 'react';
import {
  Link as LinkIcon,
  Sliders,
  Music,
  Video,
  FolderPlus,
  Mail,
  FileText,
  Image,
  Images,
  GalleryHorizontal,
  Rows3,
  Send,
  Download,
  MapPin,
  HelpCircle,
  MessageSquareQuote,
  Calendar,
  Disc,
  Phone,
  ShoppingBag,
  HeartHandshake,
  Lock
} from 'lucide-react';

export type BlockCategory = 'all' | 'essential' | 'media' | 'engage' | 'commerce';

export interface BlockCatalogItem {
  id: string;
  type: string;
  titleKey: string;
  descKey: string;
  category: 'essential' | 'media' | 'engage' | 'commerce';
  colorClass: string;
  icon: React.ComponentType<{ className?: string }>;
  handlerKey: 'link' | 'header' | 'audio' | 'video' | 'folder' | 'newsletter' | 'advanced';
}

export const BLOCK_CATALOG: BlockCatalogItem[] = [
  // Essential
  {
    id: 'link',
    type: 'link',
    titleKey: 'Custom Link',
    descKey: 'Standard outbound link with thumbnail and badges',
    category: 'essential',
    colorClass: 'text-blue-600 bg-blue-50',
    icon: LinkIcon,
    handlerKey: 'link'
  },
  {
    id: 'header',
    type: 'header',
    titleKey: 'Section Title',
    descKey: 'Divider and section title to organize blocks',
    category: 'essential',
    colorClass: 'text-neutral-700 bg-neutral-100',
    icon: Sliders,
    handlerKey: 'header'
  },
  {
    id: 'folder',
    type: 'folder',
    titleKey: 'Link Folder',
    descKey: 'Collapsible group of links',
    category: 'essential',
    colorClass: 'text-amber-600 bg-amber-50',
    icon: FolderPlus,
    handlerKey: 'folder'
  },
  {
    id: 'rich_text',
    type: 'rich_text',
    titleKey: 'Rich Text',
    descKey: 'Formatted markdown content, notes, or announcements',
    category: 'essential',
    colorClass: 'text-indigo-600 bg-indigo-50',
    icon: FileText,
    handlerKey: 'advanced'
  },
  {
    id: 'spacer',
    type: 'spacer',
    titleKey: 'Spacer',
    descKey: 'Adjustable blank vertical spacing between blocks',
    category: 'essential',
    colorClass: 'text-neutral-500 bg-neutral-100',
    icon: Rows3,
    handlerKey: 'advanced'
  },

  // Media & Audio
  {
    id: 'audio',
    type: 'audio',
    titleKey: 'Audio Track',
    descKey: 'Stream Spotify, Apple Music, SoundCloud, or MP3',
    category: 'media',
    colorClass: 'text-emerald-600 bg-emerald-50',
    icon: Music,
    handlerKey: 'audio'
  },
  {
    id: 'video',
    type: 'video',
    titleKey: 'Video Embed',
    descKey: 'Embedded YouTube, Vimeo, or direct video stream',
    category: 'media',
    colorClass: 'text-red-600 bg-red-50',
    icon: Video,
    handlerKey: 'video'
  },
  {
    id: 'image',
    type: 'image',
    titleKey: 'Image',
    descKey: 'Single responsive visual banner or picture',
    category: 'media',
    colorClass: 'text-cyan-600 bg-cyan-50',
    icon: Image,
    handlerKey: 'advanced'
  },
  {
    id: 'gallery',
    type: 'gallery',
    titleKey: 'Gallery',
    descKey: 'Responsive grid photo gallery',
    category: 'media',
    colorClass: 'text-teal-600 bg-teal-50',
    icon: Images,
    handlerKey: 'advanced'
  },
  {
    id: 'carousel',
    type: 'carousel',
    titleKey: 'Carousel',
    descKey: 'Horizontal swipeable image slider',
    category: 'media',
    colorClass: 'text-sky-600 bg-sky-50',
    icon: GalleryHorizontal,
    handlerKey: 'advanced'
  },

  // Engagement & Community
  {
    id: 'newsletter',
    type: 'newsletter',
    titleKey: 'Newsletter',
    descKey: 'Email collection box with CSV export',
    category: 'engage',
    colorClass: 'text-purple-600 bg-purple-50',
    icon: Mail,
    handlerKey: 'newsletter'
  },
  {
    id: 'form',
    type: 'form',
    titleKey: 'Contact Form',
    descKey: 'Custom interactive submission form with fields',
    category: 'engage',
    colorClass: 'text-violet-600 bg-violet-50',
    icon: Send,
    handlerKey: 'advanced'
  },
  {
    id: 'faq',
    type: 'faq',
    titleKey: 'FAQ',
    descKey: 'Collapsible accordion question and answers',
    category: 'engage',
    colorClass: 'text-orange-600 bg-orange-50',
    icon: HelpCircle,
    handlerKey: 'advanced'
  },
  {
    id: 'testimonials',
    type: 'testimonials',
    titleKey: 'Testimonials',
    descKey: 'Quotes, reviews, and client recommendations',
    category: 'engage',
    colorClass: 'text-pink-600 bg-pink-50',
    icon: MessageSquareQuote,
    handlerKey: 'advanced'
  },
  {
    id: 'map',
    type: 'map',
    titleKey: 'Location',
    descKey: 'Address and quick directions map action',
    category: 'engage',
    colorClass: 'text-emerald-700 bg-emerald-50',
    icon: MapPin,
    handlerKey: 'advanced'
  },
  {
    id: 'content_gate',
    type: 'content_gate',
    titleKey: 'Content Gate',
    descKey: 'Passcode-protected exclusive content',
    category: 'engage',
    colorClass: 'text-amber-700 bg-amber-50',
    icon: Lock,
    handlerKey: 'advanced'
  },

  // Commerce & Scheduling
  {
    id: 'download',
    type: 'download',
    titleKey: 'Download',
    descKey: 'Direct downloadable file asset or lead magnet',
    category: 'commerce',
    colorClass: 'text-blue-700 bg-blue-50',
    icon: Download,
    handlerKey: 'advanced'
  },
  {
    id: 'event',
    type: 'event',
    titleKey: 'Event',
    descKey: 'Date, time, timezone, and ticketing link',
    category: 'commerce',
    colorClass: 'text-rose-600 bg-rose-50',
    icon: Calendar,
    handlerKey: 'advanced'
  },
  {
    id: 'presave',
    type: 'presave',
    titleKey: 'Pre-save',
    descKey: 'Upcoming album or single release announcement',
    category: 'commerce',
    colorClass: 'text-purple-700 bg-purple-50',
    icon: Disc,
    handlerKey: 'advanced'
  },
  {
    id: 'phone',
    type: 'phone',
    titleKey: 'Phone',
    descKey: '1-click telephone call or direct email action',
    category: 'commerce',
    colorClass: 'text-green-600 bg-green-50',
    icon: Phone,
    handlerKey: 'advanced'
  },
  {
    id: 'product',
    type: 'product',
    titleKey: 'Product',
    descKey: 'Product showcase with price and buy link',
    category: 'commerce',
    colorClass: 'text-amber-600 bg-amber-50',
    icon: ShoppingBag,
    handlerKey: 'advanced'
  },
  {
    id: 'tips',
    type: 'tips',
    titleKey: 'Tips',
    descKey: 'Creator support and tipping link',
    category: 'commerce',
    colorClass: 'text-fuchsia-600 bg-fuchsia-50',
    icon: HeartHandshake,
    handlerKey: 'advanced'
  }
];
