import React from 'react';
import { 
  FolderPlus, 
  Music, 
  Instagram, 
  Globe2, 
  BarChart2, 
  Sparkles, 
  Layers, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Zap,
  SlidersHorizontal
} from 'lucide-react';

interface FeaturesSectionProps {
  onOpenStudio: () => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onOpenStudio }) => {
  return (
    <section id="features" className="py-20 md:py-28 bg-white border-b border-[#E8E6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181B]/5 text-xs font-mono font-bold text-[#18181B] mb-4">
            <span>SUPERPOWERS</span>
            <span>•</span>
            <span className="text-amber-700">ENGINEERED FOR DESIGNERS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111315] leading-[1.12] mb-4">
            Everything you need in a bio link. Nothing you don’t.
          </h2>
          <p className="text-base sm:text-lg text-[#52525B] leading-relaxed">
            Most link tools look like 1999 directory lists filled with ads and generic buttons. 
            LIINX gives you complete aesthetic freedom to present your body of work.
          </p>
        </div>

        {/* Bento Grid Features Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          
          {/* Feature 1: Accordion Folders */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-[#FAF9F6] border border-[#E8E6DF] flex flex-col justify-between group hover:border-black/30 transition-all">
            <div className="mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center mb-4">
                <FolderPlus className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="font-brand font-bold text-xl sm:text-2xl text-[#111315] mb-2">
                Accordion Folders & Multi-Level Lists
              </h3>
              <p className="text-sm sm:text-base text-[#52525B] leading-relaxed max-w-xl">
                Keep your page clean and uncluttered. Collapse presets, press kits, tour dates, and archived projects into sleek expandable drawers.
              </p>
            </div>

            {/* Visual simulation of folder */}
            <div className="bg-white p-4 rounded-2xl border border-[#E5E2DA] shadow-xs space-y-2">
              <div className="p-3 bg-[#FAF7F2] rounded-xl flex items-center justify-between font-medium text-xs text-[#18181B]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-bold">2025 Tour Dates & VIP Access</span>
                </div>
                <span className="font-mono text-[10px] text-[#71717A] bg-white px-2 py-0.5 rounded-full border">4 Cities</span>
              </div>
              <div className="pl-4 pr-2 py-1 space-y-1 text-xs text-[#52525B]">
                <div className="flex justify-between py-1 border-b border-black/5">
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
          <div className="p-8 rounded-3xl bg-[#FAF9F6] border border-[#E8E6DF] flex flex-col justify-between group hover:border-black/30 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-800 flex items-center justify-center mb-4">
                <Globe2 className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="font-brand font-bold text-xl text-[#111315] mb-2">
                True Custom Domain
              </h3>
              <p className="text-sm text-[#52525B] leading-relaxed mb-4">
                Map <code>links.yourname.com</code> or <code>bio.brand.studio</code> directly. Free automatic SSL included with every plan.
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E5E2DA] font-mono text-xs text-center text-[#18181B] font-bold">
              🔒 links.elenarostova.design
            </div>
          </div>

          {/* Feature 3: Playable Media Embeds */}
          <div className="p-8 rounded-3xl bg-[#FAF9F6] border border-[#E8E6DF] flex flex-col justify-between group hover:border-black/30 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-800 flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="font-brand font-bold text-xl text-[#111315] mb-2">
                Playable Audio & Video
              </h3>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Embed playable Spotify audio tracks, Soundcloud snippets, YouTube streams, and TikTok clips directly on your page.
              </p>
            </div>
            <div className="mt-4 p-3 bg-white rounded-xl border border-[#E5E2DA] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                ▶
              </div>
              <div className="text-xs">
                <p className="font-bold text-[#18181B]">Midnight Transmission</p>
                <p className="text-[11px] text-[#71717A]">Spotify Audio Player</p>
              </div>
            </div>
          </div>

          {/* Feature 4: Instagram Caption Sync */}
          <div className="p-8 rounded-3xl bg-[#FAF9F6] border border-[#E8E6DF] flex flex-col justify-between group hover:border-black/30 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-800 flex items-center justify-center mb-4">
                <Instagram className="w-6 h-6 text-rose-700" />
              </div>
              <h3 className="font-brand font-bold text-xl text-[#111315] mb-2">
                Instagram Caption Sync
              </h3>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Post on Instagram and let LIINX automatically pull links from your captions into your bio page without manual updates.
              </p>
            </div>
            <div className="mt-4 text-xs font-mono text-[#71717A] bg-white p-2.5 rounded-xl border border-[#E5E2DA]">
              Auto-sync: <span className="text-emerald-600 font-bold">ACTIVE (0 delay)</span>
            </div>
          </div>

          {/* Feature 5: Privacy-Friendly Analytics */}
          <div className="p-8 rounded-3xl bg-[#FAF9F6] border border-[#E8E6DF] flex flex-col justify-between group hover:border-black/30 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-800 flex items-center justify-center mb-4">
                <BarChart2 className="w-6 h-6 text-purple-700" />
              </div>
              <h3 className="font-brand font-bold text-xl text-[#111315] mb-2">
                Actionable Analytics
              </h3>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Know which links convert. Track click-through rates, geographical breakdown, referral apps, and UTM campaign tags.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-mono bg-white p-2.5 rounded-xl border border-[#E5E2DA]">
              <span>Avg CTR:</span>
              <span className="font-bold text-emerald-600">21.8% (3x industry avg)</span>
            </div>
          </div>

        </div>

        {/* Bottom CTA bar */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#111315] text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Ready to elevate your creative presence?
            </h3>
            <p className="text-sm text-neutral-400">
              Set up your profile in under 2 minutes. Free 14-day trial on all pro plans.
            </p>
          </div>
          <button
            onClick={onOpenStudio}
            className="px-6 py-3.5 rounded-full bg-white text-[#111315] text-sm font-bold hover:bg-neutral-100 transition-transform active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Launch Interactive Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
