import { type CreatorProfile, type ThemeConfig } from '../../../types';

export type BuilderTab = 'content' | 'appearance' | 'settings' | 'analytics';

export type BuilderLoadState = 'loading' | 'empty' | 'ready' | 'error';

export type PreviewDevice = 'mobile' | 'tablet' | 'desktop';

export type StructuredEditorKind = 'gallery' | 'carousel' | 'faq' | 'testimonials' | 'form';

export interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  totalClicks: number;
  ctr: string;
  topLinks: { id: string; title: string; url: string; clicks: number; percentage: number }[];
  dailyTimeline: { date: string; views: number; clicks: number }[];
  topReferrers: { referrer: string; count: number }[];
  topUtmCampaigns?: { campaign: string; source: string; medium: string; count: number }[];
}

export interface SubscriberItem {
  id: string;
  email: string;
  subscribedAt: string;
}

export interface InstagramStatus {
  connected: boolean;
  configured: boolean;
  username?: string;
  autoSyncEnabled?: boolean;
  lastSyncedAt?: number;
  syncedLinksCount?: number;
  tokenExpiresAt?: number;
  needsReconnect?: boolean;
  lastSyncError?: string;
  accountRequirement?: string;
}

export interface ProfileSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  plan: string;
}

export interface ApiKeyItem {
  id: string;
  prefix: string;
  name: string;
  createdAt: number;
  expiresAt?: number | null;
}

export interface FormSubmissionItem {
  id: string;
  blockId: string;
  formTitle: string;
  fieldLabels: Record<string, string>;
  fields: Record<string, string>;
  createdAt: number;
}

export interface BuilderStudioProps {
  initialProfile?: CreatorProfile;
  onViewFullscreen: (profile: CreatorProfile, theme: ThemeConfig) => void;
}
