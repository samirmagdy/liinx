import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  Menu, 
  X, 
  Smartphone, 
  LogOut,
  User,
  Check
} from 'lucide-react';
import { brand } from '../config/brand';

interface NavbarProps {
  activeView?: 'home' | 'builder' | 'templates' | 'pricing';
  onSelectView?: (view: 'home' | 'builder' | 'templates' | 'pricing') => void;
  onClaimClick?: (username: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView = 'home',
  onSelectView,
  onClaimClick
}) => {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickHandle, setQuickHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState<'idle' | 'available'>('idle');

  const handleHandleChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setQuickHandle(clean);
    setHandleStatus(clean.length >= 2 ? 'available' : 'idle');
  };

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
    `px-3.5 py-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
      active
        ? 'text-neutral-900 font-semibold bg-neutral-100'
        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/60 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-8">
          <Link 
            href="/"
            className="flex items-center gap-2.5 text-left group focus:outline-none focus:ring-2 focus:ring-neutral-900/20 rounded-lg"
          >
            <div className="relative w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <div className="flex items-center gap-0.5">
                <span className="w-1.5 h-4.5 bg-white rounded-full" />
                <span className="w-1.5 h-3 bg-amber-400 rounded-full" />
                <span className="w-1.5 h-4.5 bg-white rounded-full" />
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="font-brand font-extrabold text-xl tracking-tight text-neutral-900 leading-none">
                {brand.productShortName}
              </span>
              <span className="text-[10px] text-neutral-500 font-medium tracking-wide">
                Micro-site builder
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-neutral-500">
            <Link href="/" className={navLinkClass(activeView === 'home')}>
              Overview
            </Link>
            <Link href="/studio" className={`flex items-center gap-1.5 ${navLinkClass(activeView === 'builder')}`}>
              <Smartphone className="w-3.5 h-3.5 text-amber-600" />
              <span>Studio</span>
            </Link>
            <Link href="/templates" className={navLinkClass(activeView === 'templates')}>
              Templates
            </Link>
            <Link href="/pricing" className={navLinkClass(activeView === 'pricing')}>
              Pricing
            </Link>
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Quick claim pill if not logged in */}
          {!user && (
            <form onSubmit={handleClaim} className="relative flex items-center">
              <div className="flex items-center bg-neutral-50 border border-neutral-300 rounded-full pl-3 pr-1.5 py-1 text-xs shadow-xs focus-within:ring-2 focus-within:ring-neutral-900/20 focus-within:border-neutral-900 transition-colors">
                <span className="text-neutral-500 font-mono text-[11px] select-none pr-0.5">liinx.co/@</span>
                <input
                  type="text"
                  value={quickHandle}
                  onChange={(e) => handleHandleChange(e.target.value)}
                  placeholder="yourname"
                  className="w-24 outline-none font-mono text-xs text-neutral-900 bg-transparent"
                  spellCheck={false}
                />
                {handleStatus === 'available' && (
                  <span className="mr-1 text-emerald-600 flex items-center" title="Available">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <button
                  type="submit"
                  className="bg-neutral-900 hover:bg-black text-white px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span>Claim</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </form>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/studio"
                className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
              >
                <User className="w-3.5 h-3.5" />
                <span>@{user.username}</span>
              </Link>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/studio"
            className="px-3 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          >
            Studio
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200/60 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-left text-xs font-semibold block focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              Overview
            </Link>
            <Link
              href="/studio"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-amber-500/10 border border-amber-300 text-left text-xs font-semibold text-amber-900 flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              <span>Live Studio</span>
              <span className="text-[9px] bg-amber-600 text-white px-1.5 py-0.5 rounded-full tracking-wider">LIVE</span>
            </Link>
            <Link
              href="/templates"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-left text-xs font-semibold block focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              Templates
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-left text-xs font-semibold block focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              Pricing
            </Link>
          </div>

          <div className="pt-2">
            {user ? (
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-xs font-semibold">Logged in as @{user.username}</span>
                <button onClick={logout} className="text-xs text-rose-600 font-semibold cursor-pointer hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30 rounded">
                  Log Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-xs font-semibold bg-neutral-900 text-white rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
