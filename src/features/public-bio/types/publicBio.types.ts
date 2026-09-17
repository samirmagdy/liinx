import { type CreatorProfile, type ThemeConfig, type BlockItem } from '../../../types';

export interface PublicBioViewProps {
  previewOnly?: boolean;
  profile?: CreatorProfile;
  username?: string;
  pageSlug?: string;
  customDomain?: string;
  customTheme?: ThemeConfig;
  onBackToStudio?: () => void;
  onOpenQr?: () => void;
}

export interface BlockViewProps<T = BlockItem> {
  block: T;
  profileId: string;
  theme: ThemeConfig;
  previewOnly?: boolean;
  translate?: (value: string) => string;
  blockIndex?: number;
  blockCount?: number;
}
