import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ResourceModal, type ResourceDocType } from './ResourceModal';
import { brand } from '../config/brand';
import { LiinxLogo } from './LiinxLogo';
import { useLanguage, useLanguage as useUiLanguage } from '../context/LanguageContext';
import { Globe, ShieldCheck } from 'lucide-react';
import { localizedPath } from '../utils/languagePaths';

interface FooterProps {
  onSelectView?: (view: 'home' | 'builder' | 'templates' | 'pricing' | 'features' | 'about' | 'contact') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectView }) => {
  const { tr: ui } = useUiLanguage();
  const [activeModalDoc, setActiveModalDoc] = useState<ResourceDocType | null>(null);
  const { lang, t } = useLanguage();
  const [location] = useLocation();
  const languageHref = localizedPath(location, lang === 'en' ? 'ar' : 'en');

  return (
    <>
      <footer className="bg-[#111315] text-[#A1A1AA] pt-12 pb-8 text-xs border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8 pb-8 border-b border-neutral-800">
            
            {/* Brand Column (2 cols) */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <LiinxLogo variant="dark" size="sm" />
                <span className="font-brand font-extrabold text-xl tracking-tight text-white">
                  {brand.productShortName}
                </span>
              </div>

              <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
                {t.footer.tagline}
              </p>

              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 max-w-sm">
                <div className="flex items-center gap-2 text-neutral-300 font-mono text-[11px] font-semibold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>{ui("Creator tools")}</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  {ui("Publish a customizable creator page, collect newsletter signups, and export subscriber records as CSV.")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-neutral-400">{ui("Global availability monitoring")}</span>
                </div>

                <a
                  href={languageHref}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-[11px] text-neutral-300 transition-colors cursor-pointer"
                >
                  <Globe className="w-3 h-3 text-amber-500" />
                  <span>{lang === 'en' ? 'العربية (RTL)' : 'English (LTR)'}</span>
                </a>
              </div>
            </div>

            {/* Nav Column 1: Product */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">{t.footer.product}</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/features" className="hover:text-white transition-colors cursor-pointer text-start block">
                    {t.nav.features}
                  </Link>
                </li>
                <li>
                  <Link href="/studio" className="hover:text-white transition-colors cursor-pointer text-start block">
                    {t.nav.studio}
                  </Link>
                </li>
                <li>
                  <Link href="/templates" className="hover:text-white transition-colors cursor-pointer text-start block">
                    {t.nav.templates}
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors cursor-pointer text-start block">
                    {t.nav.pricing}
                  </Link>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('dns-guide')}
                    className="hover:text-white transition-colors cursor-pointer text-start block"
                  >
                    {ui("Custom Domains")}
                  </button>
                </li>
              </ul>
            </div>

            {/* Nav Column 2: Resources */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">{ui("Resources")}</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/guides" className="hover:text-white transition-colors cursor-pointer text-start block">
                    {lang === 'ar' ? 'أدلة عملية' : 'Practical guides'}
                  </Link>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('creator-handbook')}
                    className="hover:text-white transition-colors cursor-pointer text-start block"
                  >
                    {ui("Creator Handbook")}
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('switch-linktree')}
                    className="hover:text-white transition-colors cursor-pointer text-start block"
                  >
                    {ui("Switch from Linktree")}
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('api-docs')}
                    className="hover:text-white transition-colors cursor-pointer text-start block"
                  >
                    {ui("Public REST API")}
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('security')}
                    className="hover:text-white transition-colors cursor-pointer text-start block"
                  >
                    {ui("Security & Privacy")}
                  </button>
                </li>
              </ul>
            </div>

            {/* Nav Column 3: Company */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">{t.footer.company}</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors cursor-pointer text-start block">
                    {ui("About")}{' '}{brand.productShortName}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors cursor-pointer text-start block">
                    {t.nav.contact}
                  </Link>
                </li>
                <li>
                  <a 
                    href="/@elenarostova" 
                    target="_blank" 
                    rel="noreferrer"
                    className="hover:text-white transition-colors cursor-pointer text-start block"
                  >
                    {ui("Live Demo")} ↗
                  </a>
                </li>
              </ul>
            </div>

            {/* Nav Column 4: Legal */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">{t.footer.legal}</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors cursor-pointer text-start block">
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors cursor-pointer text-start block">
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors cursor-pointer text-start block">
                    {t.footer.contact}
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom copyright row */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500 font-mono">
            <p>© {new Date().getFullYear()} {brand.legalName}. {t.footer.rightsReserved}</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white underline-offset-2 hover:underline">{ui("Privacy controls")}</Link>
              <span>•</span>
              <span>{ui("Account-owned content")}</span>
              <span>•</span>
              <span>{ui("No Liinx fee on external sales or bookings")}</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Real Resource / Legal Modal */}
      <ResourceModal
        isOpen={activeModalDoc !== null}
        initialDoc={activeModalDoc || 'privacy'}
        onClose={() => setActiveModalDoc(null)}
        onNavigate={onSelectView}
      />
    </>
  );
};
