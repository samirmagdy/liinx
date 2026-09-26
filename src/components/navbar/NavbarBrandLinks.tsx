import React from 'react';
import { Link } from 'wouter';
import { useLanguage, useLanguage as useUiLanguage } from '../../context/LanguageContext';
import { brand } from '../../config/brand';
import { HOW_IT_WORKS_ANCHOR, scrollWithinPage } from '../../hooks/useHashScroll';

interface NavbarBrandLinksProps {
  activeView: string;
}

const navLinkClass = (active: boolean) =>
  `inline-flex min-h-11 items-center rounded-full px-3.5 text-xs font-semibold transition-colors ${
    active
      ? 'text-neutral-900 bg-neutral-200/80 font-bold'
      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
  }`;

export const NavbarBrandLinks: React.FC<NavbarBrandLinksProps> = ({ activeView }) => {
  const { tr: ui } = useUiLanguage();
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-8">
      <Link 
        href="/"
        className="flex items-center gap-2.5 text-start group rounded-lg cursor-pointer"
      >
        <div className="flex flex-col group-hover:scale-[1.02] transition-transform">
          <img
            src="/brand/navbar-logo.png"
            alt={brand.productShortName}
            width={128}
            height={32}
            className="h-8 w-auto"
            loading="eager"
            decoding="async"
          />
          <span className="text-xs font-medium tracking-wide text-neutral-600">
            {ui("Design-first mini-sites")}
          </span>
        </div>
      </Link>

      {/* Desktop Nav Links */}
      <nav className="hidden xl:flex items-center gap-1">
        <Link href="/templates" className={navLinkClass(activeView === 'templates')}>
          {t.nav.templates}
        </Link>
        <Link href="/features" className={navLinkClass(activeView === 'features')}>
          {t.nav.features}
        </Link>
        <Link
          href={`/#${HOW_IT_WORKS_ANCHOR}`}
          onClick={(event) => scrollWithinPage(event, HOW_IT_WORKS_ANCHOR)}
          className={navLinkClass(false)}
        >
          {ui('How it works')}
        </Link>
        <Link href="/pricing" className={navLinkClass(activeView === 'pricing')}>
          {t.nav.pricing}
        </Link>
        <Link href="/guides" className={navLinkClass(false)}>
          {ui('Resources')}
        </Link>
      </nav>
    </div>
  );
};
