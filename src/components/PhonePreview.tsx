import React, { useState } from 'react';
import { type CreatorProfile, type ThemeConfig, type ProfileBlock } from '../types';
import { getThemeBackground, resolveTheme } from '../utils/colorContrast';
import { PhoneProfileHeader } from './phone-preview/PhoneProfileHeader';
import { PhoneSocialsRow } from './phone-preview/PhoneSocialsRow';
import { PhoneBlocksList } from './phone-preview/PhoneBlocksList';
import { PhoneFooterBranding } from './phone-preview/PhoneFooterBranding';
import { PhoneStatusBar } from './phone-preview/PhoneStatusBar';

interface PhonePreviewProps {
  profile: CreatorProfile;
  customTheme?: ThemeConfig;
  interactive?: boolean;
  onLinkClick?: (block: ProfileBlock) => void;
  scale?: 'normal' | 'compact' | 'responsive' | 'editor';
  compact?: boolean;
  /** Render only the profile content when another device shell already owns the screen surface. */
  bare?: boolean;
  /** Hide the footer badge when the preview is rendered inside another link or card. */
  showBranding?: boolean;
  deviceMode?: 'mobile' | 'tablet' | 'desktop';
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({
  profile,
  customTheme,
  interactive = true,
  onLinkClick,
  scale = 'normal',
  compact = false,
  bare = false,
  showBranding = true,
  deviceMode = 'mobile',
}) => {
  const theme = resolveTheme(profile.themeId, customTheme);
  const themeBackground = getThemeBackground(theme);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);

  const isArabicText = (text?: string) => /[\u0600-\u06FF]/.test(text || '');
  const isProfileRtl = isArabicText(profile.displayName) || isArabicText(profile.bio);

  const scaleClass =
    deviceMode === 'desktop' ? 'max-w-[620px]' :
    deviceMode === 'tablet' ? 'max-w-[500px]' :
    scale === 'compact' ? 'max-w-[340px]' :
    scale === 'editor' ? 'max-w-[320px]' :
    'max-w-[380px]';

  return (
    <div className={`relative mx-auto w-full select-none ${scaleClass}`} dir={isProfileRtl ? 'rtl' : 'ltr'}>
      {compact ? (
        <div
          dir={isProfileRtl ? 'rtl' : 'ltr'}
          className={bare ? 'w-full' : 'rounded-[28px] overflow-y-auto no-scrollbar pt-12 pb-8 px-5 transition-colors duration-300 shadow-lg'}
          style={{
            ...(bare ? {} : themeBackground),
            color: theme.textColor,
            fontFamily: theme.fontFamily === 'display' ? 'var(--font-display)' : theme.fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)',
            ...(bare ? {} : { aspectRatio: '9 / 16' }),
          }}
        >
          {renderProfileContent()}
        </div>
      ) : (
        <div className="phone-shell relative rounded-[44px] p-3 shadow-lg ring-2 ring-black/10 bg-neutral-900 border border-neutral-800">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-neutral-800 rounded-full z-30" />

          <div 
            dir={isProfileRtl ? 'rtl' : 'ltr'}
            className="relative w-full h-[660px] rounded-[36px] overflow-y-auto no-scrollbar pt-12 pb-8 px-5 transition-colors duration-300"
            style={{
              ...themeBackground,
              color: theme.textColor,
              fontFamily: theme.fontFamily === 'display' ? 'var(--font-display)' : theme.fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)'
            }}>
            {renderProfileContent()}
          </div>
        </div>
      )}

      {/* Device Home Indicator Bar (editor mode only) */}
      {!compact && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 bg-neutral-900/30 rounded-full pointer-events-none" />
      )}
    </div>
  );

  function renderProfileContent() {
    return (
      <>
        {/* Top Bar inside Screen */}
        <PhoneStatusBar interactive={interactive} username={profile.username} />

        {/* Preview Notice Toast */}
        {previewNotice && (
          <div role="status" aria-live="polite" className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-[90%] bg-neutral-900 text-white text-[11px] px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in text-center">
            <span>{previewNotice}</span>
          </div>
        )}

        {/* Header Profile Section */}
        <PhoneProfileHeader
          profile={profile}
          theme={theme}
        />

        {/* Social Icons Row */}
        <PhoneSocialsRow
          socials={profile.socials}
          theme={theme}
        />

        {/* Profile Blocks */}
        <PhoneBlocksList
          blocks={profile.blocks}
          theme={theme}
          interactive={interactive}
          onLinkClick={onLinkClick}
          profileId={profile.id}
          onSubscribeNotice={(msg) => {
            setPreviewNotice(msg);
            setTimeout(() => setPreviewNotice(null), 2500);
          }}
        />

        {showBranding && <PhoneFooterBranding profile={profile} theme={theme} />}
      </>
    );
  }
};
