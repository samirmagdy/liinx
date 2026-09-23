import React from 'react';
import { ArrowRight, BarChart3, CalendarDays, Globe2, Image, Link2, Palette, Share2, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Reveal } from './motion/Reveal';

/**
 * One card per thing the builder can actually place on a page. Nothing here is a promise about
 * an outcome, and nothing is a paid-only feature unless the card says so.
 */
const FEATURES = [
  { icon: Link2, title: 'Links and social profiles', body: 'Add the platforms you are already on, in the order you want them.' },
  { icon: Image, title: 'Media and galleries', body: 'Images, galleries, carousels, and supported audio and video embeds.' },
  { icon: CalendarDays, title: 'Bookings', body: 'Add a Calendly event link and visitors pick a time from your page.' },
  { icon: ShoppingBag, title: 'Product showcase', body: 'Show a product with its price and a link to where it sells.' },
  { icon: Share2, title: 'Newsletter and forms', body: 'Collect signups and answers, then export them as CSV.' },
  { icon: BarChart3, title: 'Page activity', body: 'See page views, link clicks and where the visits came from.' },
  { icon: Palette, title: 'Themes and type', body: 'Choose a theme and adjust colors and fonts. Custom CSS on paid plans.' },
  { icon: Globe2, title: 'Your own address', body: 'Every page is published under your name. Custom domains on paid plans.' }
];

export const FeaturesSection: React.FC<{ onOpenStudio: () => void }> = ({ onOpenStudio }) => {
  const { tr: ui, isRtl } = useLanguage();
  return (
    <section id="features" className="marketing-section border-y border-neutral-200 bg-neutral-50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal distance="md" className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">{ui('What goes on the page')}</p>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl text-balance">{ui('Everything one page can hold')}</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base text-pretty">{ui('Blocks you can add today, in the plan they are actually available on.')}</p>
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
