import React, { useState } from 'react';
import { ResourceModal, ResourceDocType } from './ResourceModal';
import { brand } from '../config/brand';

interface FooterProps {
  onSelectView: (view: 'home' | 'builder' | 'templates' | 'pricing') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectView }) => {
  const [activeModalDoc, setActiveModalDoc] = useState<ResourceDocType | null>(null);

  return (
    <>
      <footer className="bg-[#111315] text-[#A1A1AA] pt-16 pb-12 text-xs border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-neutral-800">
            
            {/* Brand Column (2 cols) */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-[#111315] flex items-center justify-center font-bold">
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
                The design-first link in bio platform engineered for creators, independent studios, and modern brands who refuse to compromise on visual identity.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono text-neutral-400">All systems operational • 99.99% uptime</span>
              </div>
            </div>

            {/* Nav Column 1: Product */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">Product</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    type="button"
                    onClick={() => onSelectView('builder')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    Interactive Studio
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => onSelectView('templates')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    Template Gallery
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => onSelectView('pricing')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    Plans & Pricing
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('dns-guide')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    Custom Domains
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => onSelectView('builder')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    Instagram Auto-Sync
                  </button>
                </li>
              </ul>
            </div>

            {/* Nav Column 2: Resources */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('creator-handbook')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    Creator Handbook
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('switch-linktree')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    Switching from Linktree
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('dns-guide')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    DNS & CNAME Setup
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('brand-assets')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    Brand Assets & Logos
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('api-docs')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    Public REST API
                  </button>
                </li>
              </ul>
            </div>

            {/* Nav Column 3: Legal & Trust */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('privacy')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('terms')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('security')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    Security & GDPR
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModalDoc('support')}
                    className="hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  >
                    Contact Support
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom copyright row */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500 font-mono">
            <p>© {new Date().getFullYear()} {brand.legalName}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Crafted with zero clutter</span>
              <span>•</span>
              <span>Sub-100ms Global CDN</span>
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
