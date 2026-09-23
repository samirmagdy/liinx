import React from 'react';
import { Link } from 'wouter';
import { ExternalLink, LogOut, Settings, Smartphone } from 'lucide-react';

interface NavbarMobileAccountProps {
  user: { username: string };
  t: any;
  ui: (key: string) => string;
  onClose: () => void;
  onLogout: () => void;
}

const tileClass = 'p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-center text-xs font-semibold flex flex-col items-center gap-1 hover:bg-neutral-100';

/** Where an account holder goes from the phone menu: the page, the Studio, and the settings. */
export const NavbarMobileAccount: React.FC<NavbarMobileAccountProps> = ({ user, t, ui, onClose, onLogout }) => (
  <div className="p-3 bg-white rounded-2xl border border-neutral-200 space-y-2.5">
    <div className="flex items-center justify-between">
      <div>
        <span className="text-xs text-neutral-600 block">{ui('Logged in')}</span>
        <span className="text-xs font-bold font-mono text-neutral-900" dir="ltr">@{user.username}</span>
      </div>
      <button
        onClick={() => {
          onClose();
          onLogout();
        }}
        className="text-xs text-rose-600 font-semibold cursor-pointer hover:text-rose-700 flex items-center gap-1"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>{ui('Log out')}</span>
      </button>
    </div>
    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-100">
      <Link href={`/@${user.username}`} onClick={onClose} className={tileClass}>
        <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
        <span>{ui('View page')}</span>
      </Link>
      <Link href="/studio" onClick={onClose} className={tileClass}>
        <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
        <span>{t.nav.studio}</span>
      </Link>
      <Link href="/account" onClick={onClose} className={tileClass}>
        <Settings className="w-3.5 h-3.5 text-neutral-500" />
        <span>{ui('Settings')}</span>
      </Link>
    </div>
  </div>
);
