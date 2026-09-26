import React from 'react';
import { ArrowRight, BarChart3, Globe2, Image, Link2, Share2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Reveal } from './motion/Reveal';

/**
 * One card per thing the builder can actually place on a page. Nothing here is a promise about
 * an outcome, and nothing is a paid-only feature unless the card says so.
 */
const FEATURES = [
  { icon: Link2, title: 'Publish', body: 'Put links, socials, media, products and bookings in one page people can scan.' },
  { icon: Image, title: 'Present', body: 'Use a starter site, your type, your colors and the same live preview your visitors see.' },
  { icon: Share2, title: 'Capture', body: 'Collect newsletter signups and form answers without sending your audience elsewhere.' },
  { icon: BarChart3, title: 'Measure', body: 'See visits, link clicks, referring sources and campaign tags in one calm view.' },
  { icon: Globe2, title: 'Own the destination', body: 'Share a page under your name, with custom domains available on paid plans.' }
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
