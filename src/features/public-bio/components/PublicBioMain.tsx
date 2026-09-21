import React from 'react';
import { type CreatorProfile, type ProfileBlock, type ThemeConfig } from '../../../types';
import type { BlockPlayback } from '../hooks/useBlockPlayback';
import { PublicProfileHeader } from './PublicProfileHeader';
import { PublicPageNavigation } from './PublicPageNavigation';
import { PublicSearchInput } from './PublicSearchInput';
import { PublicBlocksList } from './PublicBlocksList';
import { PublicProfileFooter } from './PublicProfileFooter';

interface PublicBioMainProps {
  profile: CreatorProfile;
  theme: ThemeConfig;
  previewOnly: boolean;
  customDomain?: string;
  isRtl: boolean;
  pageSearch: string;
  setPageSearch: (value: string) => void;
  visibleBlocks: ProfileBlock[];
  normalizedQuery: string;
  hasGridLink: boolean;
  playback: BlockPlayback;
  footerLogoFailed: boolean;
  setFooterLogoFailed: (failed: boolean) => void;
  onBackToStudio?: () => void;
}

const suppress = (event: { preventDefault(): void; stopPropagation(): void }) => {
  event.preventDefault();
  event.stopPropagation();
};

export const PublicBioMain: React.FC<PublicBioMainProps> = ({
  profile,
  theme,
  previewOnly,
  customDomain,
  isRtl,
  pageSearch,
  setPageSearch,
  visibleBlocks,
  normalizedQuery,
  hasGridLink,
  playback,
  footerLogoFailed,
  setFooterLogoFailed,
  onBackToStudio
}) => (
  <main
    id="main-content"
    tabIndex={-1}
    dir={isRtl ? 'rtl' : 'ltr'}
    className="relative z-10 max-w-xl mx-auto px-4 py-12 sm:py-16"
    onClickCapture={previewOnly ? suppress : undefined}
    onSubmitCapture={previewOnly ? suppress : undefined}
  >
    <PublicProfileHeader profile={profile} theme={theme} />
    <PublicPageNavigation profile={profile} theme={theme} customDomain={customDomain} />
    <PublicSearchInput theme={theme} value={pageSearch} onChange={setPageSearch} />
    <PublicBlocksList
      blocks={visibleBlocks}
      profileId={profile.id}
      theme={theme}
      previewOnly={previewOnly}
      normalizedQuery={normalizedQuery}
      hasGridLink={hasGridLink}
      playback={playback}
    />
    <PublicProfileFooter
      profile={profile}
      theme={theme}
      footerLogoFailed={footerLogoFailed}
      setFooterLogoFailed={setFooterLogoFailed}
      onBackToStudio={onBackToStudio}
    />
  </main>
);
