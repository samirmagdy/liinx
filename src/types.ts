export type BlockType = 
  | 'link' 
  | 'header' 
  | 'audio' 
  | 'video' 
  | 'folder' 
  | 'newsletter' 
  | 'instagram_grid';

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

export type ProfileBlock = 
  | LinkBlock 
  | HeaderBlock 
  | AudioBlock 
  | VideoBlock 
  | FolderBlock 
  | NewsletterBlock 
  | InstagramGridBlock;

export interface SocialLink {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'spotify' | 'twitter' | 'github' | 'email' | 'linkedin';
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
  customTheme?: ThemeConfig;
  blocks: ProfileBlock[];
  stats?: {
    viewsThisMonth: string;
    ctr: string;
    totalClicks: string;
  };
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
