export type BlockType = 
  | 'booking'
  | 'link' 
  | 'header' 
  | 'audio' 
  | 'video' 
  | 'folder' 
  | 'newsletter' 
  | 'instagram_grid'
  | 'rich_text' | 'image' | 'gallery' | 'spacer' | 'carousel' | 'form'
  | 'download' | 'map' | 'faq' | 'testimonials' | 'event' | 'presave'
  | 'phone' | 'product' | 'tips' | 'content_gate';

export interface LinkBlock {
  id: string;
  type: 'link';
  title: string;
  url: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  highlighted?: boolean;
  clicks?: number;
  startAt?: number;
  endAt?: number;
}

export interface HeaderBlock {
  id: string;
  type: 'header';
  title: string;
  subtitle?: string;
}

export interface AudioBlock {
  id: string;
  type: 'audio';
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl?: string;
  platform: 'spotify' | 'soundcloud' | 'apple';
}

export interface VideoBlock {
  id: string;
  type: 'video';
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  platform: 'youtube' | 'vimeo' | 'tiktok';
}

export interface FolderItem {
  id: string;
  title: string;
  url: string;
  subtitle?: string;
}

export interface FolderBlock {
  id: string;
  type: 'folder';
  title: string;
  subtitle?: string;
  items: FolderItem[];
}

export interface NewsletterBlock {
  id: string;
  type: 'newsletter';
  title: string;
  description: string;
  buttonText: string;
}

export interface InstagramGridBlock {
  id: string;
  type: 'instagram_grid';
  title: string;
  handle: string;
  posts: {
    id: string;
    imageUrl: string;
    likes: string;
    linkUrl: string;
  }[];
}

/** Extensible creator blocks. `extra` is persisted JSON and rendered by type. */
export interface AdvancedBlock {
  id: string;
  type: Exclude<BlockType, 'booking' | 'link' | 'header' | 'audio' | 'video' | 'folder' | 'newsletter' | 'instagram_grid'>;
  title: string;
  subtitle?: string;
  url?: string;
  extra?: Record<string, unknown>;
}

export type ProfileBlock = { revision?: number } & (
  | BookingBlock
  | LinkBlock 
  | HeaderBlock 
  | AudioBlock 
  | VideoBlock 
  | FolderBlock 
  | NewsletterBlock
  | InstagramGridBlock
  | AdvancedBlock);

export interface BookingBlock {
  id: string;
  type: 'booking';
  title: string;
  url: string;
}

export interface SocialLink {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'spotify' | 'twitter' | 'github' | 'email' | 'linkedin' | 'phone';
  url: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  bgType: 'solid' | 'gradient' | 'mesh';
  bgColor: string;
  bgGradient?: string;
  textColor: string;
  subtextColor: string;
  cardBg: string;
  cardText: string;
  cardBorder: string;
  cardHover: string;
  cardRadius: 'none' | 'md' | 'xl' | 'full';
  accentColor: string;
  fontFamily: 'sans' | 'display' | 'mono';
  isDark: boolean;
}

export interface CreatorProfile {
  id: string;
  revision?: number;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  category: string;
  verified: boolean;
  socials: SocialLink[];
  themeId: string;
  plan?: 'free' | 'pro' | 'studio';
  hideBranding?: boolean;
  gaMeasurementId?: string | null;
  metaPixelId?: string | null;
  customDomain?: string | null;
  customCss?: string | null;
  customFontUrl?: string | null;
  shareTitle?: string | null;
  shareDescription?: string | null;
  shareImageUrl?: string | null;
  footerLogoUrl?: string | null;
  backgroundMediaUrl?: string | null;
  backgroundMediaType?: 'image' | 'video' | null;
  pageRedirectUrl?: string | null;
  pageRedirectUntil?: number | null;
  customTheme?: ThemeConfig;
  blocks: ProfileBlock[];
  pages?: CreatorPage[];
  page?: CreatorPage;
  stats?: {
    viewsThisMonth: string;
    ctr: string;
    totalClicks: string;
  };
}

export interface CreatorPage {
  id: string;
  revision?: number;
  slug: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  isHome: boolean;
  published: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface TemplateItem {
  id: string;
  name: string;
  category: 'Creators' | 'Musicians' | 'Design & Art' | 'Brands' | 'Podcasts' | 'Gaming' | 'Wellness' | 'Lifestyle';
  description: string;
  profile: CreatorProfile;
  previewColor: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  features: string[];
  ctaText: string;
}
