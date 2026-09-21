import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { type CreatorProfile, type ThemeConfig } from '../../types';
import { brand } from '../../config/brand';
import { getAccessibleTextColor } from '../../utils/colorContrast';
import { avatarInitials } from '../../utils/avatarInitials';
import { useLanguage as useUiLanguage } from '../../context/LanguageContext';

interface PhoneProfileHeaderProps {
  profile: CreatorProfile;
  theme: ThemeConfig;
  highlightedFeatureId?: string | null;
}

export const PhoneProfileHeader: React.FC<PhoneProfileHeaderProps> = ({
  profile,
  theme,
  highlightedFeatureId,
}) => {
  const { tr: ui } = useUiLanguage();

  return (
    <div className="flex flex-col items-center text-center mb-6">
      <div className="relative mb-3">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            width={80}
            height={80}
            loading="lazy"
            decoding="async"
            className="w-20 h-20 rounded-full object-cover shadow-sm ring-2 ring-white/20"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-20 w-20 place-items-center rounded-full text-2xl font-bold shadow-sm ring-2 ring-white/20"
            style={{ backgroundColor: theme.cardBg, color: theme.cardText }}
          >
            {avatarInitials(profile.displayName)}
          </div>
        )}
        {profile.verified && (
          <div
            className="absolute bottom-0 end-0 p-1 rounded-full text-white shadow-sm"
            style={{ backgroundColor: theme.accentColor, color: getAccessibleTextColor(theme.accentColor) }}
            title={ui('Verified Creator')}
          >
            <CheckCircle2 className="w-3.5 h-3.5 fill-current" style={{ color: getAccessibleTextColor(theme.accentColor) }} />
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold tracking-tight mb-1 flex items-center justify-center gap-1.5 text-balance">
        <span>{profile.displayName}</span>
      </h2>

      {profile.username && (
        <p
          data-feature="domain"
          className={`text-[11px] font-mono mb-2.5 px-2.5 py-1 rounded-full transition-all duration-300 ${
            highlightedFeatureId === 'domain'
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500 font-bold scale-105 shadow-sm'
              : ''
          }`}
          style={{ color: highlightedFeatureId === 'domain' ? undefined : theme.subtextColor }}
        >
          {brand.domain}/@{profile.username}
        </p>
      )}

      {profile.bio && (
        <p
          className="text-xs max-w-[280px] leading-relaxed mb-4 text-pretty"
          style={{ color: theme.subtextColor }}
        >
          {profile.bio}
        </p>
      )}
    </div>
  );
};
