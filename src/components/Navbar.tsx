import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useLanguage, useLanguage as useUiLanguage } from '../context/LanguageContext';
import { 
  ArrowRight, 
  Menu, 
  X, 
  Smartphone, 
  LogOut, 
  Check, 
  Globe,
  ExternalLink,
  Settings
} from 'lucide-react';
import { usePanelMotion } from '../animations/usePanelMotion';
import { brand } from '../config/brand';
import { LoadingLogo } from '../components/LoadingLogo';
import { UserMenuDropdown } from './UserMenuDropdown';

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
    <div className="grid grid-cols-2 gap-2">
      <Link
        href="/"
        onClick={onClose}
        className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-left text-xs font-semibold block"
      >
        {lang === 'ar' ? 'الرئيسية' : 'Overview'}
      </Link>
      <Link
        href="/features"
        onClick={onClose}
        className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-left text-xs font-semibold block"
      >
        {t.nav.features}
      </Link>
      <Link
        href="/templates"
        onClick={onClose}
        className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-left text-xs font-semibold block"
      >
        {t.nav.templates}
      </Link>
      <Link
        href="/pricing"
        onClick={onClose}
        className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-left text-xs font-semibold block"
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
              <span>{ui("View Live Bio")}</span>
            </Link>
            <Link
              href="/studio"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-center text-[11px] font-semibold flex flex-col items-center gap-1 hover:bg-neutral-100"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-600" />
              <span>{ui("Studio Builder")}</span>
            </Link>
            <Link
              href="/studio?tab=settings"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-center text-[11px] font-semibold flex flex-col items-center gap-1 hover:bg-neutral-100"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-500" />
              <span>{ui("Account Settings")}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/login"
            onClick={onClose}
            className="py-2.5 text-center text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl"
          >
            {t.nav.login}
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="py-2.5 text-center text-xs font-semibold bg-neutral-900 text-white rounded-xl"
          >
            {t.nav.register}
          </Link>
        </div>
      )}
    </div>
  </div>
);

export const Navbar: React.FC<NavbarProps> = ({
  activeView = 'home',
  onClaimClick
}) => {
  const { tr: ui } = useUiLanguage();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { lang, setLanguage, t, isRtl } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  usePanelMotion(headerRef, mobileMenuOpen, '#mobile-navigation a, #mobile-navigation button');
  const [quickHandle, setQuickHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState<'idle' | 'available'>('idle');

  const handleHandleChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setQuickHandle(clean);
    setHandleStatus('idle');
  };

  useEffect(() => {
    let active = true;
    if (quickHandle.length < 3) return;
    const timer = setTimeout(() => {
      api.auth.checkUsername(quickHandle).then(result => {
        if (active) setHandleStatus(result.available ? 'available' : 'idle');
      }).catch(() => { if (active) setHandleStatus('idle'); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [quickHandle]);

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickHandle) {
      if (onClaimClick) {
        onClaimClick(quickHandle);
      } else {
        setLocation(`/register?username=${quickHandle}`);
      }
    } else {
      setLocation('/register');
    }
  };

  const navLinkClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
      active
        ? 'text-neutral-900 bg-neutral-100 font-bold'
        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
    }`;

  const toggleLanguage = () => {
    setLanguage(lang === 'en' ? 'ar' : 'en');
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full border-b border-neutral-200/70 bg-neutral-100/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-7">
          <Link 
            href="/"
            className="flex items-center gap-2.5 text-left group focus:outline-none focus:ring-2 focus:ring-neutral-900/20 rounded-lg cursor-pointer"
          >
            <LoadingLogo loading={false} className="relative w-9 h-9 rounded-xl bg-neutral-50 text-neutral-900 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform" />
            
            <div className="flex flex-col">
              <span className="font-brand font-extrabold text-lg tracking-tight text-neutral-900 leading-none">
                {brand.productShortName}
              </span>
              <span className="text-[10px] text-neutral-500 font-medium tracking-wide">
                {ui("Micro-site builder")}</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1">
            <Link href="/" className={navLinkClass(activeView === 'home')}>
              {lang === 'ar' ? 'الرئيسية' : 'Overview'}
            </Link>
            <Link href="/features" className={navLinkClass(activeView === 'features')}>
              {t.nav.features}
            </Link>
            <Link href="/templates" className={navLinkClass(activeView === 'templates')}>
              {t.nav.templates}
            </Link>
            <Link href="/pricing" className={navLinkClass(activeView === 'pricing')}>
              {t.nav.pricing}
            </Link>
            <Link href="/studio" className={`flex items-center gap-1.5 ${navLinkClass(activeView === 'builder')}`}>
              <Smartphone className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.nav.studio}</span>
            </Link>
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="hidden xl:flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            title={lang === 'en' ? 'Switch to Arabic (العربية)' : 'Switch to English'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-neutral-500" />
            <span>{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* Quick claim handle if not logged in */}
          {!user && (
            <form onSubmit={handleClaim} className="relative flex items-center">
              <div className="flex items-center bg-neutral-50 border border-neutral-300 rounded-full pl-3 pr-1.5 py-1 text-xs shadow-xs focus-within:ring-2 focus-within:ring-neutral-900/20 focus-within:border-neutral-900 transition-colors">
                <span className="text-neutral-500 font-mono text-[11px] select-none pr-0.5">liinx.app/@</span>
                <input
                  id="navbar-quick-handle"
                  name="quickHandle"
                  autoComplete="username"
                  aria-label={t.hero.claimPlaceholder} dir="ltr"
                  type="text"
                  value={quickHandle}
                  onChange={(e) => handleHandleChange(e.target.value)}
                  placeholder={t.hero.claimPlaceholder}
                  className="w-24 outline-none font-mono text-xs text-neutral-900 bg-transparent"
                  spellCheck={false}
                />
                {handleStatus === 'available' && (
                  <span className="mr-1 text-emerald-600 flex items-center" title={ui("Available")}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <button
                  type="submit"
                  className="bg-neutral-900 hover:bg-neutral-800 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                >
                  <span>{lang === 'ar' ? 'احجز' : 'Claim'}</span>
                  <ArrowRight className={`w-2.5 h-2.5 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </form>
          )}

          {user ? (
            <UserMenuDropdown user={user} onLogout={logout} />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 cursor-pointer"
              >
                {t.nav.login}
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              >
                <span>{t.nav.register}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex xl:hidden items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="p-1.5 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-100"
          >
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
          <Link
            href="/studio"
            className="px-3 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          >
            {t.nav.studio}
          </Link>
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
