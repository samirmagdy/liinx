import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { type CreatorProfile, type ThemeConfig } from '../../../types';
import { brand } from '../../../config/brand';
import { getAccessibleTextColor, getBorderColor } from '../../../utils/colorContrast';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { safePublicHref } from '../utils/publicBio.utils';
import { renderSocialIcon } from '../utils/socialIcons';
import { DemoProfileNotice } from './DemoProfileNotice';

interface PublicProfileHeaderProps {
  profile: CreatorProfile;
  theme: ThemeConfig;
}

export const PublicProfileHeader: React.FC<PublicProfileHeaderProps> = ({ profile, theme }) => {
  const { tr: ui } = useUiLanguage();

  return (
    <div className="flex flex-col items-center text-center mb-8">
      <DemoProfileNotice username={profile.username} />
      <div className="relative mb-4">
        <img
          src={profile.avatarUrl}
          alt={profile.displayName}
          onError={event => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/favicon.svg';
          }}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-md ring-4 ring-white/20"
          referrerPolicy="no-referrer"
        />
        {profile.verified && (
          <div
            className="absolute bottom-1 end-1 p-1.5 rounded-full text-white shadow-md"
            style={{ backgroundColor: theme.accentColor, color: getAccessibleTextColor(theme.accentColor) }}
            title={ui('Verified Profile')}
          >
            <CheckCircle2
              className="w-4 h-4 fill-current"
              style={{ color: getAccessibleTextColor(theme.accentColor) }}
            />
          </div>
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 flex items-center justify-center gap-2">
        <span>{profile.displayName}</span>
      </h1>

      <p className="text-xs sm:text-sm font-mono mb-3" style={{ color: theme.subtextColor }}>
        {brand.domain}/@{profile.username}
      </p>

      <p className="text-sm max-w-md leading-relaxed mb-6" style={{ color: theme.subtextColor }}>
        {profile.bio}
      </p>

      {/* Socials Row */}
      {Array.isArray(profile.socials) && profile.socials.length > 0 && (
        <div className="flex items-center justify-center gap-2.5 mb-2 flex-wrap">
          {profile.socials.map((social, idx) => (
            <a
              key={idx}
              href={safePublicHref(social.url) || '#'}
              target={/^(https?:)/i.test(social.url) ? '_blank' : undefined}
              rel={/^(https?:)/i.test(social.url) ? 'noreferrer' : undefined}
              aria-label={`${social.platform} link`}
              dir="ltr"
              className="p-2.5 rounded-full transition-transform duration-200 hover:scale-110 active:scale-95 border shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.1)'),
                color: theme.cardText
              }}
              title={social.platform}
            >
              {renderSocialIcon(social.platform)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
