import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { Link } from 'wouter';
import { ResourceModal, ResourceDocType } from './ResourceModal';
import { brand } from '../config/brand';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

interface FooterProps {
  onSelectView?: (view: 'home' | 'builder' | 'templates' | 'pricing' | 'features' | 'about' | 'contact') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectView }) => {
  const { tr: ui } = useUiLanguage();
  const [activeModalDoc, setActiveModalDoc] = useState<ResourceDocType | null>(null);
  const { lang, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(lang === 'en' ? 'ar' : 'en');
  };

  return (
    <>
      <footer className="bg-[#111315] text-[#A1A1AA] pt-16 pb-12 text-xs border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-neutral-800">
            
            {/* Brand Column (2 cols) */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-[#111315] flex items-center justify-center font-bold shadow-sm">
                  <div className="flex items-center gap-0.5">
                    <span className="w-1.5 h-4 bg-[#111315] rounded-full" />
                    <span className="w-1.5 h-2.5 bg-amber-500 rounded-full" />
                    <span className="w-1.5 h-4 bg-[#111315] rounded-full" />
                  </div>
                </div>
                <span className="font-brand font-extrabold text-xl tracking-tight text-white">
                  {brand.productShortName}
                </span>
              </div>

              <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
                {t.footer.tagline}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-neutral-400">{ui("Creator pages & booking")}</span>
                </div>

                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-[11px] text-neutral-300 transition-colors cursor-pointer"
                >
                  <Globe className="w-3 h-3 text-amber-500" />
                  <span>{lang === 'en' ? 'العربية (RTL)' : 'English (LTR)'}</span>
                </button>
              </div>
            </div>

            {/* Nav Column 1: Product */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">{t.footer.product}</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/features" className="hover:text-white transition-colors cursor-pointer text-left block">
                    {t.nav.features}
                  </Link>
                </li>
                <li>
                  <Link href="/studio" className="hover:text-white transition-colors cursor-pointer text-left block">
                    {t.nav.studio}
                  </Link>
                </li>
                <li>
                  <Link href="/templates" className="hover:text-white transition-colors cursor-pointer text-left block">
                    {t.nav.templates}
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors cursor-pointer text-left block">
                    {t.nav.pricing}
                  </Link>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('dns-guide')}
                    className="hover:text-white transition-colors cursor-pointer text-left block"
                  >
                    {ui("Custom Domains")}</button>
                </li>
              </ul>
            </div>

            {/* Nav Column 2: Company & Resources */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">{t.footer.company}</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors cursor-pointer text-left block">
                    {ui("About")}{brand.productShortName}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors cursor-pointer text-left block">
                    {t.nav.contact}
                  </Link>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('creator-handbook')}
                    className="hover:text-white transition-colors cursor-pointer text-left block"
                  >
                    {ui("Creator Handbook")}</button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('switch-linktree')}
                    className="hover:text-white transition-colors cursor-pointer text-left block"
                  >
                    {ui("Switch from Linktree")}</button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('api-docs')}
                    className="hover:text-white transition-colors cursor-pointer text-left block"
                  >
                    {ui("Public REST API")}</button>
                </li>
              </ul>
            </div>

            {/* Nav Column 3: Legal & Trust */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">{t.footer.legal}</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors cursor-pointer text-left block">
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors cursor-pointer text-left block">
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('security')}
                    className="hover:text-white transition-colors cursor-pointer text-left block"
                  >
                    {ui("Security")}</button>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors cursor-pointer text-left block">
                    {t.footer.contact}
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom copyright row */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500 font-mono">
            <p>© {new Date().getFullYear()} {brand.legalName}. {t.footer.rightsReserved}</p>
            <div className="flex items-center gap-4">
              <span>{ui("Privacy controls")}</span>
              <span>•</span>
              <span>{ui("Account-owned content")}</span>
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
