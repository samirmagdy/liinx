import React from 'react';
import { useLocation } from 'wouter';
import { type CreatorProfile, type ThemeConfig } from '../../../types';
import { LoadingLogo } from '../../../components/LoadingLogo';
import { getBorderColor } from '../../../utils/colorContrast';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { safePublicHref } from '../utils/publicBio.utils';

interface PublicProfileFooterProps {
  profile: CreatorProfile;
  theme: ThemeConfig;
  footerLogoFailed: boolean;
  setFooterLogoFailed: (failed: boolean) => void;
  footerLogoLoading: boolean;
  setFooterLogoLoading: (loading: boolean) => void;
  onBackToStudio?: () => void;
}

export const PublicProfileFooter: React.FC<PublicProfileFooterProps> = ({
  profile,
  theme,
  footerLogoFailed,
  setFooterLogoFailed,
  footerLogoLoading,
  setFooterLogoLoading,
  onBackToStudio
}) => {
  const { tr: ui } = useUiLanguage();
  const [, setLocation] = useLocation();

  if (profile.plan && profile.plan !== 'free' && profile.hideBranding && !profile.footerLogoUrl) {
    return null;
  }

  return (
    <div className="text-center pt-4 pb-12">
      {profile.footerLogoUrl ? (
        (() => {
          const logoLabel = profile.footerLogoAlt?.trim() || `${profile.displayName} logo`;
          const logoContent = footerLogoFailed ? (
            <span role="img" aria-label={logoLabel} className="text-xs font-semibold">
              {logoLabel}
            </span>
          ) : (
            <>
              {footerLogoLoading && (
                <LoadingLogo
                  loading={true}
                  size="sm"
                  className="h-4 max-w-20 object-contain"
                />
              )}
              <img
                src={profile.footerLogoUrl}
                alt={logoLabel}
                onLoad={() => setFooterLogoLoading(false)}
                onError={() => {
                  setFooterLogoFailed(true);
                  setFooterLogoLoading(false);
                }}
                className={`h-4 max-w-20 object-contain ${footerLogoLoading ? 'hidden' : 'inline'}`}
              />
            </>
          );
          const logo = (
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-xs"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.15)')
              }}
            >
              {logoContent}
            </span>
          );
          const href = safePublicHref(profile.footerLogoLink);
          return href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={logoLabel}
              className="inline-flex rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
            >
              {logo}
            </a>
          ) : (
            logo
          );
        })()
      ) : (
        <button
          onClick={onBackToStudio ? onBackToStudio : () => setLocation('/')}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-opacity hover:opacity-100 bg-neutral-100/5 dark:bg-neutral-900/5 border border-neutral-200 dark:border-neutral-800 shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          style={{
            backgroundColor: theme.cardBg,
            color: theme.cardText,
            borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.15)')
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            {ui('Made with')}{' '}
            <strong>{ui('LIINX')}</strong>
          </span>
        </button>
      )}
    </div>
  );
};
