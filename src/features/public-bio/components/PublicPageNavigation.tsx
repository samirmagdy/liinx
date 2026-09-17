import React from 'react';
import { CreatorProfile, ThemeConfig } from '../../../types';
import { getBorderColor } from '../../../utils/colorContrast';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';

interface PublicPageNavigationProps {
  profile: CreatorProfile;
  theme: ThemeConfig;
  customDomain?: string;
}

export const PublicPageNavigation: React.FC<PublicPageNavigationProps> = ({
  profile,
  theme,
  customDomain
}) => {
  const { tr: ui } = useUiLanguage();
  const publishedPages = Array.isArray(profile.pages)
    ? profile.pages.filter(page => page.published)
    : [];

  if (publishedPages.length <= 1) {
    return null;
  }

  return (
    <nav aria-label={ui('Profile pages')} className="mt-4 flex max-w-full flex-wrap justify-center gap-2">
      {publishedPages.map(page => {
        const href = customDomain
          ? `${page.isHome ? '/' : `/${page.slug}`}`
          : `/@${profile.username}${page.isHome ? '' : `/${page.slug}`}`;
        const active = profile.page?.id === page.id;
        return (
          <a
            key={page.id}
            href={href}
            aria-current={active ? 'page' : undefined}
            className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: active ? theme.cardText : theme.cardBg,
              color: active ? theme.cardBg : theme.cardText,
              borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,.15)')
            }}
          >
            {page.title}
          </a>
        );
      })}
    </nav>
  );
};
