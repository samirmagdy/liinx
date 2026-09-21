import React from 'react';
import { Link } from 'wouter';
import { ExternalLink, LogOut, Settings, Smartphone } from 'lucide-react';

interface NavbarMobileMenuProps {
  user: any;
  lang: string;
  t: any;
  ui: (key: string) => string;
  onClose: () => void;
  onLogout: () => void;
}

export const NavbarMobileMenu: React.FC<NavbarMobileMenuProps> = ({ user, lang, t, ui, onClose, onLogout }) => (
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
              <span className="text-xs text-neutral-600 block">{ui("Logged in")}</span>
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
              className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-center text-xs font-semibold flex flex-col items-center gap-1 hover:bg-neutral-100"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
              <span>{ui("View page")}</span>
            </Link>
            <Link
              href="/studio"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-center text-xs font-semibold flex flex-col items-center gap-1 hover:bg-neutral-100"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.nav.studio}</span>
            </Link>
            <Link
              href="/account"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-center text-xs font-semibold flex flex-col items-center gap-1 hover:bg-neutral-100"
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
