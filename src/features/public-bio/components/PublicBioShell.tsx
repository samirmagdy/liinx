import React, { useState } from 'react';
import { type CreatorProfile, type ThemeConfig } from '../../../types';
import { QrCodeModal } from '../../../components/QrCodeModal';
import { isArabicText, buildShellStyle } from '../utils/publicBio.utils';
import { useAnalyticsConsent, usePageSearch, useVisibleBlocks } from '../hooks/usePublicBioState';
import { useBackgroundMedia } from '../hooks/useBackgroundMedia';
import { useBlockPlayback } from '../hooks/useBlockPlayback';
import { PublicBioBackdrop } from './PublicBioBackdrop';
import { PublicBioHeader } from './PublicBioHeader';
import { PublicBioMain } from './PublicBioMain';
import { PublicBioTracking } from './PublicBioTracking';
import { StickyAudioBarContainer } from './StickyAudioBar';

interface PublicBioShellProps {
  profile: CreatorProfile;
  theme: ThemeConfig;
  previewOnly?: boolean;
  customDomain?: string;
  onBackToStudio?: () => void;
  onOpenQr?: () => void;
  reducedMotion: boolean;
  footerLogoFailed: boolean;
  setFooterLogoFailed: (failed: boolean) => void;
}

export const PublicBioShell: React.FC<PublicBioShellProps> = ({
  profile,
  theme,
  previewOnly = false,
  customDomain,
  onBackToStudio,
  onOpenQr,
  reducedMotion,
  footerLogoFailed,
  setFooterLogoFailed
}) => {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [renderNow, setRenderNow] = useState(() => Date.now());
  const { pageSearch, setPageSearch } = usePageSearch(profile);
  const { analyticsConsent, updateAnalyticsConsent } = useAnalyticsConsent(previewOnly);

  const backgroundMedia = useBackgroundMedia(profile);

  const { availableBlocks, visibleBlocks, hasGridLink, normalizedQuery } = useVisibleBlocks(
    profile,
    pageSearch,
    renderNow
  );
  const playback = useBlockPlayback(availableBlocks);

  const isProfileRtl = isArabicText(profile.displayName) || isArabicText(profile.bio);

  return (
    <div
      id="public-bio-view"
      data-theme-shape={theme.shapeStyle || 'soft'}
      data-theme-shadow={theme.shadow || 'sm'}
      className="min-h-screen w-full transition-colors duration-300 relative selection:bg-black selection:text-white"
      style={buildShellStyle(theme, {
        hasBackgroundMedia: backgroundMedia.hasMedia,
        backgroundMediaType: profile.backgroundMediaType,
        backgroundMediaHref: backgroundMedia.href
      })}
    >
      <PublicBioBackdrop profile={profile} media={backgroundMedia} reducedMotion={reducedMotion} />

      <PublicBioHeader
        theme={theme}
        onBackToStudio={onBackToStudio}
        onOpenQr={onOpenQr}
        setQrModalOpen={setQrModalOpen}
      />

      <PublicBioMain
        profile={profile}
        theme={theme}
        previewOnly={previewOnly}
        customDomain={customDomain}
        isRtl={isProfileRtl}
        pageSearch={pageSearch}
        setPageSearch={setPageSearch}
        visibleBlocks={visibleBlocks}
        normalizedQuery={normalizedQuery}
        hasGridLink={hasGridLink}
        playback={playback}
        footerLogoFailed={footerLogoFailed}
        setFooterLogoFailed={setFooterLogoFailed}
        onBackToStudio={onBackToStudio}
      />

      {/* Floating Sticky Audio Bar */}
      <StickyAudioBarContainer
        activeBlock={playback.activePlayingBlock as any}
        theme={theme}
        playingAudioId={playback.playingAudioId}
        setPlayingAudioId={playback.setPlayingAudioId}
      />

      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        username={profile.username}
        displayName={profile.displayName}
        pages={profile.pages}
        currentPageSlug={profile.page?.isHome ? 'home' : profile.page?.slug}
        customDomain={customDomain}
      />

      <PublicBioTracking
        profile={profile}
        previewOnly={previewOnly}
        analyticsConsent={analyticsConsent}
        updateAnalyticsConsent={updateAnalyticsConsent}
        renderNow={renderNow}
        onBoundaryRefresh={setRenderNow}
      />
    </div>
  );
};
