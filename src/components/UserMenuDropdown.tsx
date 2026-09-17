import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import {
  User,
  ExternalLink,
  Smartphone,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import { type User as AuthUser } from '../types';

interface UserMenuDropdownProps {
  user: AuthUser;
  onLogout: () => void;
}

interface DropdownMenuContentProps {
  user: AuthUser;
  ui: (key: string) => string;
  onClose: () => void;
  onLogout: () => void;
}

const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  user,
  ui,
  onClose,
  onLogout
}) => (
  <div
    role="menu"
    aria-label={ui('Account Settings')}
    className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-neutral-200 py-1.5 z-50 animate-fade-in"
  >
    {/* User Info Header */}
    <div className="px-3.5 py-2.5 border-b border-neutral-100">
      <div className="text-[11px] text-neutral-400 font-medium">
        {ui('Logged in')}
      </div>
      <div className="text-xs font-bold text-neutral-900 truncate font-mono">
        @{user.username}
      </div>
      {user.email && (
        <div className="text-[11px] text-neutral-500 truncate mt-0.5">
          {user.email}
        </div>
      )}
    </div>

    {/* Menu Items */}
    <div className="py-1">
      <Link
        href={`/@${user.username}`}
        onClick={onClose}
        role="menuitem"
        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
        <span>{ui('View Live Bio')}</span>
      </Link>

      <Link
        href="/studio"
        onClick={onClose}
        role="menuitem"
        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-600" />
        <span>{ui('Studio Builder')}</span>
      </Link>

      <Link
        href="/studio?tab=settings"
        onClick={onClose}
        role="menuitem"
        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
      >
        <Settings className="w-3.5 h-3.5 text-neutral-400" />
        <span>{ui('Account Settings')}</span>
      </Link>
    </div>

    <div className="border-t border-neutral-100 pt-1 mt-1">
      <button
        type="button"
        onClick={() => {
          onClose();
          onLogout();
        }}
        role="menuitem"
        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer text-left rtl:text-right"
      >
        <LogOut className="w-3.5 h-3.5 text-rose-500" />
        <span>{ui('Log out')}</span>
      </button>
    </div>
  </div>
);

export const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  user,
  onLogout
}) => {
  const { tr: ui } = useUiLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`${ui('Logged in')}: @${user.username}`}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
          isOpen
            ? 'bg-neutral-900 text-white shadow-xs'
            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
        }`}
      >
        <User className="w-3.5 h-3.5" />
        <span className="font-mono">@{user.username}</span>
        <ChevronDown
          className={`w-3 h-3 text-neutral-500 transition-transform ${
            isOpen ? 'rotate-180 text-neutral-300' : ''
          }`}
        />
      </button>

      {isOpen && (
        <DropdownMenuContent
          user={user}
          ui={ui}
          onClose={() => setIsOpen(false)}
          onLogout={onLogout}
        />
      )}
    </div>
  );
};
