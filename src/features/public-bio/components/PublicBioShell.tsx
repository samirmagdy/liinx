import React, { useState, useEffect } from 'react';
import { CreatorProfile, ThemeConfig } from '../../../types';
import { getAccessibleTextColor, getBorderColor, getThemeBackground } from '../../../utils/colorContrast';
import { matchesPublicPageSearch } from '../../../utils/publicSearch';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { QrCodeModal } from '../../../components/QrCodeModal';
import { safePublicHref, isArabicText } from '../utils/publicBio.utils';
import { PublicBioHeader } from './PublicBioHeader';
import { PublicProfileHeader } from './PublicProfileHeader';
import { PublicPageNavigation } from './PublicPageNavigation';
import { PublicProfileFooter } from './PublicProfileFooter';
import { PublicBlockRenderer } from './PublicBlockRenderer';
import { TrackingPixelManager } from './tracking/TrackingPixelManager';
import { AnalyticsTracker } from './tracking/AnalyticsTracker';
import { PrivacyConsentBanner } from './tracking/PrivacyConsentBanner';

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
  const { tr: ui } = useUiLanguage();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [pageSearch, setPageSearch] = useState('');
  const [renderNow, setRenderNow] = useState(() => Date.now());
  const [analyticsConsent, setAnalyticsConsent] = useState<'granted' | 'denied' | null>(null);

  // Audio, Video, and Folder state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [activeEmbeddedAudioId, setActiveEmbeddedAudioId] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ b3: true });

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Search reset when page changes
  useEffect(() => {
    setPageSearch('');
  }, [profile.id, profile.page?.id]);

  // Read saved analytics consent from localStorage
  useEffect(() => {
    if (previewOnly || typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('liinx_analytics_consent');
    if (saved === 'granted' || saved === 'denied') setAnalyticsConsent(saved);
  }, [previewOnly]);

  const updateAnalyticsConsent = (value: 'granted' | 'denied') => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('liinx_analytics_consent', value);
    }
    setAnalyticsConsent(value);
  };

  const themeBackground = getThemeBackground(theme);
  const backgroundMediaHref = safePublicHref(profile.backgroundMediaUrl);
  const hasBackgroundMedia = Boolean(
    backgroundMediaHref &&
      (profile.backgroundMediaType === 'image' || profile.backgroundMediaType === 'video')
  );

  const isProfileRtl = isArabicText(profile.displayName) || isArabicText(profile.bio);

  const normalizedQuery = pageSearch.trim();
  const availableBlocks = (Array.isArray(profile.blocks) ? profile.blocks : []).filter(
    block =>
      (block.startAt == null || block.startAt <= renderNow) &&
      (block.endAt == null || block.endAt > renderNow)
  );
  const visibleBlocks = availableBlocks.filter(block =>
    matchesPublicPageSearch(block as unknown as Record<string, unknown>, normalizedQuery)
  );

  const hasGridLink = profile.blocks.some(
    block =>
      block.type === 'link' &&
      ((block as any).layout === 'grid' || (block as any).extra?.layout === 'grid')
  );

  return (
    <div
      id="public-bio-view"
      className="min-h-screen w-full transition-colors duration-300 relative selection:bg-black selection:text-white"
      style={{
        ...themeBackground,
        backgroundImage:
          hasBackgroundMedia && profile.backgroundMediaType === 'image'
            ? `url(${backgroundMediaHref})`
            : themeBackground.backgroundImage,
        backgroundSize: hasBackgroundMedia && profile.backgroundMediaType === 'image' ? 'cover' : undefined,
        backgroundPosition:
          hasBackgroundMedia && profile.backgroundMediaType === 'image' ? 'center center' : undefined,
        backgroundAttachment:
          hasBackgroundMedia && profile.backgroundMediaType === 'image' ? 'scroll' : undefined,
        color: theme.textColor,
        fontFamily:
          theme.fontFamily === 'display'
            ? 'var(--font-display)'
            : theme.fontFamily === 'mono'
            ? 'var(--font-mono)'
            : 'var(--font-sans)'
      }}
    >
      {hasBackgroundMedia && profile.backgroundMediaType === 'video' && !reducedMotion && (
        <video
          className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover"
          src={backgroundMediaHref || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      )}
      {hasBackgroundMedia && (
        <div className="pointer-events-none fixed inset-0 z-0 bg-black/15" aria-hidden="true" />
      )}

      {profile.customCss && <style dangerouslySetInnerHTML={{ __html: profile.customCss }} />}

      <PublicBioHeader
        theme={theme}
        onBackToStudio={onBackToStudio}
        onOpenQr={onOpenQr}
        setQrModalOpen={setQrModalOpen}
      />

      {/* Main Centered Bio Column */}
      <main
        dir={isProfileRtl ? 'rtl' : 'ltr'}
        className="relative z-10 max-w-xl mx-auto px-4 py-12 sm:py-16"
        onClickCapture={
          previewOnly
            ? event => {
                event.preventDefault();
                event.stopPropagation();
              }
            : undefined
        }
        onSubmitCapture={
          previewOnly
            ? event => {
                event.preventDefault();
                event.stopPropagation();
              }
            : undefined
        }
      >
        <PublicProfileHeader profile={profile} theme={theme} />
        <PublicPageNavigation profile={profile} theme={theme} customDomain={customDomain} />

        {/* Content Blocks Search */}
        <label
          className="mb-5 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,.15)'),
            color: theme.cardText
          }}
        >
          <span aria-hidden="true">⌕</span>
          <input
            value={pageSearch}
            onChange={event => setPageSearch(event.target.value)}
            placeholder={ui('Search this page')}
            aria-label={ui('Search this page')}
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
          <span className="sr-only" role="status">
            {ui('Search includes this page only')}
          </span>
        </label>

        <div
          className={`mb-14 ${
            hasGridLink
              ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:sm:col-span-2 [&>.liinx-grid-link]:sm:col-span-1'
              : 'space-y-4'
          }`}
        >
          {normalizedQuery && visibleBlocks.length === 0 ? (
            <p
              role="status"
              className="rounded-xl border px-4 py-5 text-center text-sm"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,.15)'),
                color: theme.subtextColor
              }}
            >
              {ui('No matching content on this page.')}
            </p>
          ) : (
            visibleBlocks.map((block, blockIndex) => (
              <PublicBlockRenderer
                key={block.id}
                block={block}
                profileId={profile.id}
                theme={theme}
                previewOnly={previewOnly}
                blockIndex={blockIndex}
                blockCount={visibleBlocks.length}
                playingAudioId={playingAudioId}
                setPlayingAudioId={setPlayingAudioId}
                activeEmbeddedAudioId={activeEmbeddedAudioId}
                setActiveEmbeddedAudioId={setActiveEmbeddedAudioId}
                activeVideoId={activeVideoId}
                setActiveVideoId={setActiveVideoId}
                openFolders={openFolders}
                onToggleFolder={toggleFolder}
              />
            ))
          )}
        </div>

        <PublicProfileFooter
          profile={profile}
          theme={theme}
          footerLogoFailed={footerLogoFailed}
          setFooterLogoFailed={setFooterLogoFailed}
          onBackToStudio={onBackToStudio}
        />
      </main>

      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        username={profile.username}
        displayName={profile.displayName}
        pages={profile.pages}
        currentPageSlug={profile.page?.isHome ? 'home' : profile.page?.slug}
        customDomain={customDomain}
      />

      <PrivacyConsentBanner
        profile={profile}
        analyticsConsent={analyticsConsent}
        previewOnly={previewOnly}
        onConsentChange={updateAnalyticsConsent}
      />

      <TrackingPixelManager
        profile={profile}
        analyticsConsent={analyticsConsent}
        previewOnly={previewOnly}
      />

      <AnalyticsTracker
        profile={profile}
        previewOnly={previewOnly}
        onBoundaryRefresh={setRenderNow}
        renderNow={renderNow}
      />
    </div>
  );
};
