import React, { useState } from 'react';
import { type CreatorProfile, type ThemeConfig } from '../../types';
import { getBorderColor } from '../../utils/colorContrast';
import { LoadingLogo } from '../LoadingLogo';
import { useLanguage as useUiLanguage } from '../../context/LanguageContext';

interface PhoneFooterBrandingProps {
  profile: CreatorProfile;
  theme: ThemeConfig;
}

/** The creator's own footer mark, then the RALOA badge a free plan always shows. */
export const PhoneFooterBranding: React.FC<PhoneFooterBrandingProps> = ({ profile, theme }) => {
  const { tr: ui } = useUiLanguage();
  const [logoFailed, setLogoFailed] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const hidesBranding = Boolean(profile.plan && profile.plan !== 'free' && profile.hideBranding);

  if (!profile.footerLogoUrl && hidesBranding) return null;

  return (
    <>
      {profile.footerLogoUrl && (
        <div className="pt-2 text-center">
          {logoFailed ? (
            <span role="img" aria-label={profile.footerLogoAlt || ui('Creator logo')} className="text-xs font-semibold" dir="auto">
              {profile.footerLogoAlt || ui('Creator logo')}
            </span>
          ) : (
            <>
              {logoLoading && <LoadingLogo loading size="sm" className="mx-auto h-4 max-w-20 object-contain" />}
              <img
                src={profile.footerLogoUrl}
                alt={profile.footerLogoAlt || ui('Creator logo')}
                onLoad={() => setLogoLoading(false)}
                onError={() => { setLogoFailed(true); setLogoLoading(false); }}
                className={`mx-auto h-4 max-w-20 object-contain ${logoLoading ? 'hidden' : 'inline'}`}
              />
            </>
          )}
        </div>
      )}

      {!hidesBranding && (
        <div className="pt-2 pb-6 text-center">
          <a
            href="#builder"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-3 font-mono text-xs tracking-wider transition-opacity hover:opacity-100 dark:border-white/10 dark:bg-neutral-50/5 cursor-pointer"
            style={{ backgroundColor: theme.cardBg, color: theme.cardText, borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.15)') }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{ui('Made with')}{' '}<strong>{ui('RALOA')}</strong></span>
          </a>
        </div>
      )}
    </>
  );
};
