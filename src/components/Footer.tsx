import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ResourceModal, type ResourceDocType } from './ResourceModal';
import { brand } from '../config/brand';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ShieldCheck } from 'lucide-react';
import { localizedPath } from '../utils/languagePaths';

/* Footer links sit in a dense list; the 44px box keeps them tappable on
   touch without enlarging the visible text. */
const footerLink = 'hover:text-white transition-colors cursor-pointer text-start flex min-h-11 items-center';

interface FooterProps {
  onSelectView?: (view: 'home' | 'builder' | 'templates' | 'pricing' | 'features' | 'about' | 'contact') => void;
}

function FooterBrand() {
  const { lang, t, tr } = useLanguage();
  const [location] = useLocation();
  const languageHref = localizedPath(location, lang === 'en' ? 'ar' : 'en');
  return <div className="md:col-span-2 space-y-4">
    <div className="flex items-center">
      <img src="/brand/footer-logo-white.png" alt={brand.productShortName} width={144} height={36} className="footer-logo-default h-9 w-auto" loading="lazy" decoding="async" />
      <img src="/brand/raloa-logo-horizontal-primary.png" alt="" width={144} height={36} className="footer-logo-marketing h-9 w-auto" loading="lazy" decoding="async" />
    </div>
    <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">{t.footer.tagline}</p>
    <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 max-w-sm">
      <div className="flex items-center gap-2 text-neutral-300 font-mono text-xs font-semibold mb-1"><ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /><span>{tr('Creator tools')}</span></div>
      <p className="text-xs text-neutral-400 leading-normal">{tr('Publish a customizable creator page, collect newsletter signups, and export subscriber records as CSV.')}</p>
    </div>
    <div className="flex flex-wrap items-center gap-4 pt-1">
      <div className="flex items-center gap-2"><span aria-hidden="true" className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-xs text-neutral-400">{tr('Global availability monitoring')}</span></div>
      <a href={languageHref} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 transition-colors cursor-pointer"><Globe className="w-3 h-3 text-indigo-500" /><span>{lang === 'en' ? 'العربية (RTL)' : 'English (LTR)'}</span></a>
    </div>
  </div>;
}

function FooterNavigation({ openDocument }: { openDocument: (doc: ResourceDocType) => void }) {
  const { lang, t, tr } = useLanguage();
  return <>
    <div className="space-y-3"><h2 className="font-mono text-xs font-bold text-white tracking-caps">{t.footer.product}</h2><ul className="space-y-2">
      <li><Link href="/features" className={footerLink}>{t.nav.features}</Link></li>
      <li><Link href="/studio" className={footerLink}>{t.nav.studio}</Link></li>
      <li><Link href="/templates" className={footerLink}>{t.nav.templates}</Link></li>
      <li><Link href="/pricing" className={footerLink}>{t.nav.pricing}</Link></li>
      <li><button type="button" onClick={() => openDocument('dns-guide')} className={footerLink}>{tr('Custom Domains')}</button></li>
    </ul></div>
    <div className="space-y-3"><h2 className="font-mono text-xs font-bold text-white tracking-caps">{tr('Resources')}</h2><ul className="space-y-2">
      <li><Link href="/guides" className={footerLink}>{lang === 'ar' ? 'أدلة عملية' : 'Practical guides'}</Link></li>
      <li><button type="button" onClick={() => openDocument('creator-handbook')} className={footerLink}>{tr('Creator Handbook')}</button></li>
      <li><button type="button" onClick={() => openDocument('switch-linktree')} className={footerLink}>{tr('Switch from Linktree')}</button></li>
      <li><button type="button" onClick={() => openDocument('api-docs')} className={footerLink}>{tr('Public REST API')}</button></li>
      <li><button type="button" onClick={() => openDocument('security')} className={footerLink}>{tr('Security & Privacy')}</button></li>
    </ul></div>
    <div className="space-y-3"><h2 className="font-mono text-xs font-bold text-white tracking-caps">{t.footer.company}</h2><ul className="space-y-2">
      <li><Link href="/about" className={footerLink}>{tr('About')} {brand.productShortName}</Link></li>
      <li><Link href="/contact" className={footerLink}>{t.nav.contact}</Link></li>
      <li><a href="/@elenarostova" target="_blank" rel="noreferrer" className={footerLink}>{tr('Live Demo')} ↗</a></li>
    </ul></div>
    <div className="space-y-3"><h2 className="font-mono text-xs font-bold text-white tracking-caps">{t.footer.legal}</h2><ul className="space-y-2">
      <li><Link href="/privacy" className={footerLink}>{t.footer.privacy}</Link></li>
      <li><Link href="/terms" className={footerLink}>{t.footer.terms}</Link></li>
      <li><Link href="/contact" className={footerLink}>{t.footer.contact}</Link></li>
    </ul></div>
  </>;
}

function FooterBottom() {
  const { tr, t } = useLanguage();
  return <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400 font-mono">
    <p>© {new Date().getFullYear()} {brand.legalName}. {t.footer.rightsReserved}</p>
    <div className="flex items-center gap-4"><Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-white underline-offset-2 hover:underline">{tr('Privacy controls')}</Link><span aria-hidden="true" className="hidden sm:inline">•</span><span>{tr('Account-owned content')}</span><span aria-hidden="true" className="hidden sm:inline">•</span><span>{tr('No RALOA fee on external sales or bookings')}</span></div>
  </div>;
}

export const Footer: React.FC<FooterProps> = ({ onSelectView }) => {
  const [activeModalDoc, setActiveModalDoc] = useState<ResourceDocType | null>(null);

  return (
    <>
      <footer className="relative overflow-hidden bg-[#0F172A] text-neutral-400 pt-12 pb-8 text-xs border-t border-neutral-800">
        <div className="raloa-hero-bg raloa-hero-bg--dark opacity-40" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8 pb-8 border-b border-neutral-800">
            <FooterBrand />
            <FooterNavigation openDocument={setActiveModalDoc} />
          </div>
          <FooterBottom />

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
