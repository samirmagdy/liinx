import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useLanguage, useLanguage as useUiLanguage } from '../context/LanguageContext';
import { 
  ArrowRight, 
  Menu, 
  X, 
  Smartphone, 
  LogOut, 
  Globe,
  ExternalLink,
  Settings
} from 'lucide-react';
import { usePanelMotion } from '../animations/usePanelMotion';
import { brand } from '../config/brand';
import { UserMenuDropdown } from './UserMenuDropdown';
import { localizedPath } from '../utils/languagePaths';

interface NavbarProps {
  activeView?: 'home' | 'builder' | 'templates' | 'pricing' | 'features' | 'about' | 'contact' | 'privacy' | 'terms';
  onSelectView?: (view: any) => void;
  onClaimClick?: (username: string) => void;
}

interface MobileMenuProps {
  user: any;
  lang: string;
  t: any;
  ui: (key: string) => string;
  onClose: () => void;
  onLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ user, lang, t, ui, onClose, onLogout }) => (
  <div id="mobile-navigation" className="xl:hidden border-t border-neutral-200/60 bg-neutral-50 px-4 pt-3 pb-6 space-y-3">
    <div className="grid grid-cols-3 gap-2">
      <Link
        href="/features"
        onClick={onClose}
        className="p-3 rounded-xl bg-white border border-neutral-200 text-center text-xs font-semibold block hover:border-neutral-300"
      >
        {t.nav.features}
      </Link>
      <Link
        href="/templates"
        onClick={onClose}
        className="p-3 rounded-xl bg-white border border-neutral-200 text-center text-xs font-semibold block hover:border-neutral-300"
      >
        {t.nav.templates}
      </Link>
      <Link
        href="/pricing"
        onClick={onClose}
        className="p-3 rounded-xl bg-white border border-neutral-200 text-center text-xs font-semibold block hover:border-neutral-300"
      >
        {t.nav.pricing}
      </Link>
    </div>

    <div className="pt-2">
      {user ? (
        <div className="p-3 bg-white rounded-2xl border border-neutral-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 block">{ui("Logged in")}</span>
              <span className="text-xs font-bold font-mono text-neutral-900">@{user.username}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="text-xs text-rose-600 font-semibold cursor-pointer hover:text-rose-700 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{ui("Log out")}</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-100">
            <Link
              href={`/@${user.username}`}
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-center text-[11px] font-semibold flex flex-col items-center gap-1 hover:bg-neutral-100"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
              <span>{ui("View page")}</span>
            </Link>
            <Link
              href="/studio"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-center text-[11px] font-semibold flex flex-col items-center gap-1 hover:bg-neutral-100"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.nav.studio}</span>
            </Link>
            <Link
              href="/account"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-center text-[11px] font-semibold flex flex-col items-center gap-1 hover:bg-neutral-100"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-500" />
              <span>{ui("Settings")}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/login"
            onClick={onClose}
            className="py-2.5 text-center text-xs font-semibold bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50"
          >
            {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="py-2.5 text-center text-xs font-semibold bg-neutral-900 text-white rounded-xl hover:bg-black"
          >
            {lang === 'ar' ? 'أنشئ صفحتك' : 'Create your page'}
          </Link>
        </div>
      )}
    </div>
  </div>
);

export const Navbar: React.FC<NavbarProps> = ({
  activeView = 'home'
}) => {
  const { tr: ui } = useUiLanguage();
  const { user, logout } = useAuth();
  const { lang, t, isRtl } = useLanguage();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  usePanelMotion(headerRef, mobileMenuOpen, '#mobile-navigation a, #mobile-navigation button');

  const navLinkClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
      active
        ? 'text-neutral-900 bg-neutral-200/80 font-bold'
        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
    }`;

  const languageHref = localizedPath(location, lang === 'en' ? 'ar' : 'en');

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full border-b border-neutral-200/70 bg-neutral-100/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link 
            href="/"
            className="flex items-center gap-2.5 text-start group focus:outline-none focus:ring-2 focus:ring-neutral-900/20 rounded-lg cursor-pointer"
          >
            <div className="flex flex-col group-hover:scale-[1.02] transition-transform">
              <img
                src="/brand/navbar-logo.png"
                alt={brand.productShortName}
                className="h-8 w-auto"
                loading="eager"
                decoding="async"
              />
              <span className="text-[10px] text-neutral-500 font-medium tracking-wide">
                {ui("Design-first mini-sites")}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1">
            <Link href="/features" className={navLinkClass(activeView === 'features')}>
              {t.nav.features}
            </Link>
            <Link href="/templates" className={navLinkClass(activeView === 'templates')}>
              {t.nav.templates}
            </Link>
            <Link href="/pricing" className={navLinkClass(activeView === 'pricing')}>
              {t.nav.pricing}
            </Link>
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="hidden xl:flex items-center gap-2.5">
          {/* Language Switcher */}
          <a
            href={languageHref}
            title={lang === 'en' ? 'Switch to Arabic (العربية)' : 'Switch to English'}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-neutral-200 bg-white/50 hover:bg-neutral-200/60 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            <Globe className="w-3.5 h-3.5 text-neutral-500" />
            <span>{lang === 'en' ? 'العربية' : 'English'}</span>
          </a>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/@${user.username}`}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-neutral-200 bg-white/50 hover:bg-neutral-200/60 text-xs font-semibold text-neutral-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
              >
                <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                <span>{ui("View page")}</span>
              </Link>
              <Link
                href="/studio"
                className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-all shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-1"
              >
                <span>{t.nav.studio}</span>
              </Link>
              <UserMenuDropdown user={user} onLogout={logout} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-9 px-3.5 text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/60 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 cursor-pointer"
              >
                {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-all shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              >
                <span>{lang === 'ar' ? 'أنشئ صفحتك' : 'Create your page'}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          )}
        </div>


        {/* Mobile menu trigger */}
        <div className="flex xl:hidden items-center gap-2">
          <a
            href={languageHref}
            className="p-1.5 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-100"
          >
            {lang === 'en' ? 'عربي' : 'EN'}
          </a>
          {user ? (
            <Link
              href="/studio"
              className="px-3 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              {t.nav.studio}
            </Link>
          ) : (
            <Link
              href="/register"
              className="px-3 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              {lang === 'ar' ? 'أنشئ صفحتك' : 'Create your page'}
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            aria-label={ui("Toggle menu")}
            aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <MobileMenu
          user={user}
          lang={lang}
          t={t}
          ui={ui}
          onClose={() => setMobileMenuOpen(false)}
          onLogout={logout}
        />
      )}
    </header>
  );
};
