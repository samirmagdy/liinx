import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, useLanguage as useUiLanguage } from '../context/LanguageContext';
import { usePanelMotion } from '../animations/usePanelMotion';
import { NavbarBrandLinks } from './navbar/NavbarBrandLinks';
import { NavbarDesktopActions } from './navbar/NavbarDesktopActions';
import { NavbarMobileActions } from './navbar/NavbarMobileActions';
import { NavbarMobileMenu } from './navbar/NavbarMobileMenu';

interface NavbarProps {
  activeView?: 'home' | 'builder' | 'templates' | 'pricing' | 'features' | 'about' | 'contact' | 'privacy' | 'terms';
  onSelectView?: (view: any) => void;
  onClaimClick?: (username: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView = 'home'
}) => {
  const { tr: ui } = useUiLanguage();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  usePanelMotion(headerRef, mobileMenuOpen, '#mobile-navigation a, #mobile-navigation button');

  return (
    <header ref={headerRef} className="raloa-navbar sticky top-0 z-50 w-full border-b border-neutral-200/70 bg-neutral-100/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <NavbarBrandLinks activeView={activeView} />

        <NavbarDesktopActions />

        <NavbarMobileActions open={mobileMenuOpen} onToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <NavbarMobileMenu
          user={user}
          t={t}
          ui={ui}
          onClose={() => setMobileMenuOpen(false)}
          onLogout={logout}
        />
      )}
    </header>
  );
};
