import React from 'react';
import { Link } from 'wouter';
import { HOW_IT_WORKS_ANCHOR, scrollWithinPage } from '../../hooks/useHashScroll';
import { NavbarMobileAccount } from './NavbarMobileAccount';

interface NavbarMobileMenuProps {
  user: any;
  t: any;
  ui: (key: string) => string;
  onClose: () => void;
  onLogout: () => void;
}

export const NavbarMobileMenu: React.FC<NavbarMobileMenuProps> = ({ user, t, ui, onClose, onLogout }) => (
  <div id="mobile-navigation" className="xl:hidden border-t border-neutral-200/60 bg-neutral-50 px-4 pt-3 pb-6 space-y-3">
    <div className="grid grid-cols-2 gap-2">
      <Link
        href="/#how-it-works"
        onClick={(event) => {
          scrollWithinPage(event, HOW_IT_WORKS_ANCHOR);
          onClose();
        }}
        className="p-3 rounded-xl bg-white border border-neutral-200 text-center text-xs font-semibold block hover:border-neutral-300"
      >
        {ui('How it works')}
      </Link>
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
        <NavbarMobileAccount user={user} t={t} ui={ui} onClose={onClose} onLogout={onLogout} />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/login"
            onClick={onClose}
            className="py-2.5 text-center text-xs font-semibold bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50"
          >
            {ui('Sign in')}
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="py-2.5 text-center text-xs font-semibold bg-neutral-900 text-white rounded-xl hover:bg-black"
          >
            {ui('Create your page')}
          </Link>
        </div>
      )}
    </div>
  </div>
);
