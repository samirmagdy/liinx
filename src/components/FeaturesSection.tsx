import React from 'react';
import { 
  FolderPlus, 
  Music, 
  Globe2, 
  BarChart2, 
  Check, 
  ArrowRight,
  Smartphone,
  Instagram
} from 'lucide-react';

interface FeaturesSectionProps {
  onOpenStudio: () => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onOpenStudio }) => {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-mono font-bold mb-4 tracking-wider">
            <span>SUPERPOWERS</span>
            <span>•</span>
            <span className="text-amber-800">ENGINEERED FOR DESIGNERS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4 text-balance">
            Everything you need in a bio link. Nothing you don't.
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl text-pretty">
            Most link tools look like 1999 directory lists filled with ads and generic buttons. 
            LIINX gives you complete aesthetic freedom to present your body of work.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">          

          {/* Feature 1: Accordion Folders */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 transition-colors">
            <div className="mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-4">
                <FolderPlus className="w-6 h-6 text-amber-800" />
              </div>
              <h3 className="font-brand font-bold text-xl sm:text-2xl text-neutral-900 mb-2 text-balance">
                Accordion Folders & Multi-Level Lists
              </h3>
              <p className="text-base text-neutral-600 max-w-xl text-pretty">
                Keep your page clean and uncluttered. Collapse presets, press kits, tour dates, and archived projects into sleek expandable drawers.
              </p>
            </div>

            {/* Visual simulation of folder */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 space-y-2">
              <div className="p-3 bg-neutral-50 rounded-xl flex items-center justify-between font-medium text-xs text-neutral-900">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-bold">2025 Tour Dates & VIP Access</span>
                </div>
                <span className="font-mono text-[10px] text-neutral-500 bg-white px-2 py-0.5 rounded-full border border-neutral-200">4 Cities</span>
              </div>
              <div className="pl-4 pr-2 py-1 space-y-1 text-xs text-neutral-600">
                <div className="flex justify-between py-1 border-b border-neutral-200">
                  <span>Berlin • Kraftwerk Studio</span>
                  <span className="font-mono font-bold text-emerald-600">SOLD OUT</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Tokyo • Sound Museum Vision</span>
                  <span className="font-mono font-bold text-amber-600">FEW TICKETS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Custom Domains */}
          <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mb-4">
                <Globe2 className="w-6 h-6 text-blue-800" />
              </div>
              <h3 className="font-brand font-bold text-xl text-neutral-900 mb-2">
                True Custom Domain
              </h3>
              <p className="text-base text-neutral-600">
                Map <code>links.yourname.studio</code> or <code>bio.brand.studio</code> directly. Free automatic SSL included with every plan.
              </p>
            </div>
            <div className="mt-6 p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-xs text-center text-neutral-900 font-bold">
              links.elenarostova.design
            </div>
          </div>

          {/* Feature 3: Playable Media Embeds */}
          <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-emerald-800" />
              </div>
              <h3 className="font-brand font-bold text-xl text-neutral-900 mb-2">
                Playable Audio & Video
              </h3>
              <p className="text-base text-neutral-600">
                Embed playable Spotify audio tracks, Soundcloud snippets, YouTube streams, and TikTok clips directly on your page.
              </p>
            </div>
            <div className="mt-6 p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold">
                ▶
              </div>
              <div className="text-xs">
                <p className="font-bold text-neutral-900">Midnight Transmission</p>
                <p className="text-[11px] text-neutral-500">Spotify Audio Player</p>
              </div>
            </div>
          </div>

          {/* Feature 4: Instagram Caption Sync */}
          <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-900 flex items-center justify-center mb-4">
                <Instagram className="w-6 h-6 text-rose-800" />
              </div>
              <h3 className="font-brand font-bold text-xl text-neutral-900 mb-2 text-balance">
                Instagram Caption Sync
              </h3>
              <p className="text-base text-neutral-600 text-pretty">
                Post on Instagram and let LIINX automatically pull links from your captions into your bio page without manual updates.
              </p>
            </div>
            <div className="mt-6 text-xs font-mono text-neutral-500 bg-white p-2.5 rounded-xl border border-neutral-200">
              Auto-sync: <span className="text-emerald-600 font-bold">ACTIVE (0 delay)</span>
            </div>
          </div>

          {/* Feature 5: Privacy-Friendly Analytics */}
          <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center mb-4">
                <BarChart2 className="w-6 h-6 text-purple-800" />
              </div>
              <h3 className="font-brand font-bold text-xl text-neutral-900 mb-2">
                Actionable Analytics
              </h3>
              <p className="text-base text-neutral-600">
                Know which links convert. Track click-through rates, geographical breakdown, referral apps, and UTM campaign tags.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-mono bg-white p-2.5 rounded-xl border border-neutral-200">
              <span>Avg CTR:</span>
                <span className="font-bold text-emerald-700">Clicks, sources & conversions</span>
            </div>
          </div>

        </div>

        {/* Bottom CTA bar */}
        <div className="p-8 sm:p-12 rounded-3xl bg-neutral-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-balance">
              Ready to elevate your creative presence?
            </h3>
            <p className="text-sm text-neutral-400">
              Set up your profile in under 2 minutes. Free 14-day trial on all pro plans.
            </p>
          </div>
          <button
            onClick={onOpenStudio}
            className="px-6 py-3.5 rounded-full bg-white text-neutral-900 text-sm font-bold hover:bg-neutral-100 transition-colors active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          >
            <span>Launch Interactive Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
