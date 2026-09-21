import React from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, ExternalLink, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, useLanguage as useUiLanguage } from '../../context/LanguageContext';
import { UserMenuDropdown } from '../UserMenuDropdown';
import { localizedPath } from '../../utils/languagePaths';

export const NavbarDesktopActions: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { user, logout } = useAuth();
  const { lang, t, isRtl } = useLanguage();
  const [location] = useLocation();

  const languageHref = localizedPath(location, lang === 'en' ? 'ar' : 'en');
  // Inside the studio the toolbar already exposes the handle, the public link and
  // the live-page action, so repeating them in the chrome is duplicated wayfinding.
  const onStudio = location === '/studio' || location.startsWith('/studio/');

  return (
    <div className="hidden xl:flex items-center gap-2.5">
      {/* Language Switcher */}
      <a
        href={languageHref}
        title={lang === 'en' ? 'Switch to Arabic (العربية)' : 'Switch to English'}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-neutral-200 bg-white/50 px-3.5 hover:bg-neutral-200/60 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer"
      >
        <Globe className="w-3.5 h-3.5 text-neutral-500" />
        <span>{lang === 'en' ? 'العربية' : 'English'}</span>
      </a>

      {user ? (
        <div className="flex items-center gap-2">
          {!onStudio && (
            <>
              <Link
                href={`/@${user.username}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-neutral-200 bg-white/50 px-3.5 hover:bg-neutral-200/60 text-xs font-semibold text-neutral-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                <span>{ui("View page")}</span>
              </Link>
              <Link
                href="/studio"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-neutral-900 px-4 text-white text-xs font-semibold hover:bg-black transition-all shadow-xs cursor-pointer"
              >
                <span>{t.nav.studio}</span>
              </Link>
            </>
          )}
          <UserMenuDropdown user={user} onLogout={logout} />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center px-3.5 text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/60 rounded-full transition-colors cursor-pointer"
          >
            {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-4 text-white text-xs font-semibold hover:bg-black transition-all shadow-xs cursor-pointer"
          >
            <span>{lang === 'ar' ? 'أنشئ صفحتك' : 'Create your page'}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      )}
    </div>
  );
};
