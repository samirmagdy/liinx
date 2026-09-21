import type { ContractBlockType, FormFieldContract } from '../contracts/blocks.js';
import type { SetupProgress } from '../contracts/setup.js';
import type { SystemCapabilities } from '../schemas/capabilities.js';
import type { BrandConfig } from '../config/brand.js';
import type { SubscriptionPlan, BillingInterval } from '../config/plans.js';

export type BlockType = ContractBlockType;

export interface LinkBlock {
  id: string;
  type: 'link';
  title: string;
  url: string | null;
  subtitle?: string;
  icon?: string;
  badge?: string;
  highlighted?: boolean;
  clicks?: number;
  startAt?: number;
  endAt?: number;
  layout?: 'classic' | 'grid';
  animation?: 'none' | 'pulse' | 'bounce' | 'glow';
  extra?: Record<string, unknown>;
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

export interface AdvancedBlock {
  id: string;
  type: Exclude<BlockType, 'booking' | 'link' | 'header' | 'audio' | 'video' | 'folder' | 'newsletter' | 'instagram_grid'>;
  title: string;
  subtitle?: string;
  url?: string;
  extra?: Record<string, unknown>;
  extraData?: Record<string, unknown>;
}

export interface BookingBlock {
  id: string;
  type: 'booking';
  title: string;
  url: string;
}

export type ProfileBlock = {
  revision?: number;
  pageId?: string;
  visible?: boolean;
  sortOrder?: number;
  createdAt?: number;
  updatedAt?: number;
} & (
  | BookingBlock
  | LinkBlock
  | HeaderBlock
  | AudioBlock
  | VideoBlock
  | FolderBlock
  | NewsletterBlock
  | InstagramGridBlock
  | AdvancedBlock
);

export type BlockItem = ProfileBlock;

export interface SocialLink {
  id?: string;
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

export interface CreatorProfile {
  id: string;
  revision?: number;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  category: string;
  /** The discipline chosen at signup, when the account came from the signup form. Drives suggestions. */
  signupIntent?: string | null;
  verified: boolean;
  socials: SocialLink[];
  themeId: string;
  plan?: SubscriptionPlan;
  hideBranding?: boolean;
  gaMeasurementId?: string | null;
  metaPixelId?: string | null;
  customDomain?: string | null;
  customDomainVerified?: boolean;
  customDomainTlsStatus?: 'external_provider_required' | 'unknown';
  customCss?: string | null;
  customFontUrl?: string | null;
  shareTitle?: string | null;
  shareDescription?: string | null;
  shareImageUrl?: string | null;
  footerLogoUrl?: string | null;
  footerLogoLink?: string | null;
  footerLogoAlt?: string | null;
  backgroundMediaUrl?: string | null;
  backgroundMediaType?: 'image' | 'video' | null;
  pageRedirectUrl?: string | null;
  pageRedirectUntil?: number | null;
  customTheme?: ThemeConfig;
  blocks: ProfileBlock[];
  pages?: CreatorPage[];
  /** Studio-only: derived from stored rows, so it is never sent back on a write. */
  setup?: SetupProgress;
  page?: CreatorPage;
  stats?: {
    viewsThisMonth: string;
    ctr: string;
    totalClicks: string;
  };
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

export type {
  SystemCapabilities,
  BrandConfig,
  SubscriptionPlan,
  BillingInterval,
  FormFieldContract
};
