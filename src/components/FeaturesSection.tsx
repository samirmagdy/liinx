import React from 'react';
import { ArrowRight, BarChart3, CalendarDays, Globe2, Image, Palette, Search, Share2, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Reveal } from './motion/Reveal';

const FEATURES = [
  { icon: Globe2, title: 'Custom domain', body: 'Use your own domain or raloa.app/@name.' },
  { icon: CalendarDays, title: 'Bookings & scheduling', body: 'Get appointments directly on your page.' },
  { icon: ShoppingBag, title: 'Sell products', body: 'Offer digital or physical products with ease.' },
  { icon: BarChart3, title: 'Analytics', body: 'Track views, clicks and grow faster.' },
  { icon: Image, title: 'Media galleries', body: 'Showcase your work with beautiful galleries.' },
  { icon: Share2, title: 'Social integrations', body: 'Connect all your social platforms.' },
  { icon: Search, title: 'SEO optimized', body: 'Get discovered by the people looking for you.' },
  { icon: Palette, title: 'Fully customizable', body: 'Colors, fonts, sections — make it yours.' },
];

export const FeaturesSection: React.FC<{ onOpenStudio: () => void }> = ({ onOpenStudio }) => {
  const { tr: ui, isRtl } = useLanguage();
  return (
    <section id="features" className="marketing-section border-y border-neutral-200 bg-neutral-50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal distance="md" className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">{ui('MORE THAN JUST LINKS')}</p>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl text-balance">{ui('Everything you need to grow')}</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base text-pretty">{ui('Powerful features designed for creators, freelancers and businesses.')}</p>
          </div>
          <button type="button" onClick={onOpenStudio} className="raloa-section-link inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-800 shadow-sm sm:self-auto">
            {ui('See all features')} <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </Reveal>
        <Reveal stagger>
          <div className="raloa-feature-grid grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="raloa-feature-card motion-card rounded-2xl border border-white bg-white p-5 text-start shadow-sm">
                <div className="raloa-feature-icon mb-3"><Icon aria-hidden="true" /></div>
                <h3 className="text-sm font-bold text-neutral-900">{ui(title)}</h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600">{ui(body)}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
