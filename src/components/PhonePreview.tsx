import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { type CreatorProfile, type ThemeConfig, type ProfileBlock } from '../types';
import { LoadingLogo } from '../components/LoadingLogo';
import { 
  CheckCircle2, 
  Share2
} from 'lucide-react';
import { getBorderColor, getThemeBackground, resolveTheme } from '../utils/colorContrast';
import { PhoneProfileHeader } from './phone-preview/PhoneProfileHeader';
import { PhoneSocialsRow } from './phone-preview/PhoneSocialsRow';
import { PhoneBlocksList } from './phone-preview/PhoneBlocksList';

interface PhonePreviewProps {
  profile: CreatorProfile;
  customTheme?: ThemeConfig;
  interactive?: boolean;
  onLinkClick?: (block: ProfileBlock) => void;
  scale?: 'normal' | 'compact' | 'responsive' | 'editor';
  compact?: boolean;
  deviceMode?: 'mobile' | 'tablet' | 'desktop';
  highlightedFeatureId?: string | null;
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({
  profile,
  customTheme,
  interactive = true,
  onLinkClick,
  scale = 'normal',
  compact = false,
  deviceMode = 'mobile',
  highlightedFeatureId = null,
}) => {
  const { tr: ui } = useUiLanguage();
  const theme = resolveTheme(profile.themeId, customTheme);
  const themeBackground = getThemeBackground(theme);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);
  const [footerLogoFailed, setFooterLogoFailed] = useState(false);
  const [footerLogoLoading, setFooterLogoLoading] = useState(false);

  const handleShare = async () => {
    try { await navigator.clipboard.writeText(window.location.origin + '/@' + profile.username); }
    catch { return; }
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

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
          className="rounded-[28px] overflow-y-auto no-scrollbar pt-12 pb-8 px-5 transition-colors duration-300 shadow-lg"
          style={{
            ...themeBackground,
            color: theme.textColor,
            fontFamily: theme.fontFamily === 'display' ? 'var(--font-display)' : theme.fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)',
            aspectRatio: '9 / 16',
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
        <div className="flex items-center justify-between text-xs px-2 mb-6 opacity-70">
          <span className="font-mono text-[11px] font-semibold tracking-tight">9:41</span>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleShare}
              aria-label={ui("Share bio link")}
              className="grid min-h-11 min-w-11 place-items-center rounded-full hover:bg-neutral-900/10 dark:hover:bg-neutral-100/10 transition-colors"
              title={ui("Copy bio link")}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Copy Toast inside screen */}
        {copiedNotification && (
          <div role="status" aria-live="polite" className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-neutral-900 text-white text-[11px] px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{ui("Link copied to clipboard")}</span>
          </div>
        )}

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
          highlightedFeatureId={highlightedFeatureId}
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
          highlightedFeatureId={highlightedFeatureId}
          onSubscribeNotice={(msg) => {
            setPreviewNotice(msg);
            setTimeout(() => setPreviewNotice(null), 2500);
          }}
        />

        {profile.footerLogoUrl && (
          <div className="pt-2 text-center">
            {footerLogoFailed ? (
              <span role="img" aria-label={profile.footerLogoAlt || ui('Creator logo')} className="text-xs font-semibold" dir="auto">{profile.footerLogoAlt || ui('Creator logo')}</span>
            ) : (
              <>
                {footerLogoLoading && (
                  <LoadingLogo
                    loading={true}
                    size="sm"
                    className="mx-auto h-4 max-w-20 object-contain"
                  />
                )}
                <img
                  src={profile.footerLogoUrl}
                  alt={profile.footerLogoAlt || ui('Creator logo')}
                  onLoad={() => setFooterLogoLoading(false)}
                  onError={() => {
                    setFooterLogoFailed(true);
                    setFooterLogoLoading(false);
                  }}
                  className={`mx-auto h-4 max-w-20 object-contain ${footerLogoLoading ? 'hidden' : 'inline'}`}
                />
              </>
            )}
          </div>
        )}

        {/* RALOA Branding Footer Badge */}
        {!(profile.plan && profile.plan !== 'free' && profile.hideBranding) && (
          <div className="pt-2 pb-6 text-center">
            <a 
              href="#builder" 
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-3 font-mono text-xs tracking-wider transition-opacity hover:opacity-100 dark:border-white/10 dark:bg-neutral-50/5 cursor-pointer"
              style={{ backgroundColor: theme.cardBg, color: theme.cardText, borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.15)') }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{ui("Made with")}{' '}<strong>{ui("RALOA")}</strong></span>
            </a>
          </div>
        )}
      </>
    );
  }
};
