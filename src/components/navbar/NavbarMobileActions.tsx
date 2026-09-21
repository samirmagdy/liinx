import React from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, useLanguage as useUiLanguage } from '../../context/LanguageContext';
import { localizedPath } from '../../utils/languagePaths';

interface NavbarMobileActionsProps {
  open: boolean;
  onToggle: () => void;
}

export const NavbarMobileActions: React.FC<NavbarMobileActionsProps> = ({ open, onToggle }) => {
  const { tr: ui } = useUiLanguage();
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [location] = useLocation();

  const languageHref = localizedPath(location, lang === 'en' ? 'ar' : 'en');
  const onStudio = location === '/studio' || location.startsWith('/studio/');

  return (
    <div className="flex xl:hidden items-center gap-2">
      <a
        href={languageHref}
        aria-label={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
        className="inline-flex min-h-11 items-center rounded-full border border-neutral-200 bg-white/50 px-3.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200/60"
      >
        {lang === 'en' ? 'العربية' : 'English'}
      </a>
      {user ? (
        !onStudio && (
          <Link
            href="/studio"
            className="hidden sm:inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-neutral-900 px-3.5 text-xs font-semibold text-white"
          >
            {t.nav.studio}
          </Link>
        )
      ) : (
        /* Below sm this CTA duplicates the one inside the mobile menu panel. */
        <Link
          href="/register"
          className="hidden sm:inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-neutral-900 px-3.5 text-xs font-semibold text-white"
        >
          {lang === 'ar' ? 'أنشئ صفحتك' : 'Create your page'}
        </Link>
      )}
      <button
        onClick={onToggle}
        className="grid min-h-11 min-w-11 place-items-center rounded-lg text-neutral-700 hover:bg-neutral-100"
        aria-label={ui("Toggle menu")}
        aria-expanded={open} aria-controls="mobile-navigation"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
    </div>
  );
};
