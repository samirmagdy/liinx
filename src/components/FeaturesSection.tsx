import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Reveal } from './motion/Reveal';

interface FeaturesSectionProps {
  onOpenStudio: () => void;
}

/**
 * Grouped by what the person is trying to do, not by which Studio panel holds the control.
 * Every line describes behaviour the server actually has, limits included.
 */
const GROUPS = [
  {
    goal: 'Build',
    title: 'Build a page, not a list of buttons',
    detail: 'Pages and folders keep a launch, a shop and an archive from competing in one long scroll.',
    items: [
      'Pages and folders you can publish one at a time',
      'Audio and video that play on the page',
      'A booking link that opens your calendar',
      'Forms and newsletter signups, with consent recorded'
    ]
  },
  {
    goal: 'Grow',
    title: 'Give every visitor somewhere to go next',
    detail: 'The page keeps working after the visit: people leave something behind you can use.',
    items: [
      'Newsletter subscribers you can export as CSV',
      'Form answers collected in the Studio',
      'Your own domain, after DNS verification (paid plans)',
      'Arabic and English layouts, built right-to-left first'
    ]
  },
  {
    goal: 'Understand',
    title: 'See what people actually clicked',
    detail: 'Traffic is counted on the page a visitor reached, and nothing is estimated.',
    items: [
      'Page views and clicks per link',
      'Where the visit came from, including UTM campaigns',
      'Which day brought the visits',
      'Milestones only from real traffic'
    ]
  },
  {
    goal: 'Own',
    title: 'It stays yours, with us or without',
    detail: 'The point of an address you own is that you can move it.',
    items: [
      'Export your profile, pages, blocks and records as JSON',
      'Uploaded media and raw analytics history are not part of that export',
      'No RALOA fee on sales or bookings settled elsewhere',
      'Cancel from Stripe; your pages stay until you delete them'
    ]
  }
];

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onOpenStudio }) => {
  const { tr: ui, isRtl } = useLanguage();

  return (
    <section id="features" className="marketing-section border-y border-neutral-200 bg-neutral-50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal distance="md" className="mb-8 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">{ui('What it does')}</p>
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl text-balance">
            {ui('Four things a page should do for you')}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base text-pretty">
            {ui('Build the page, give visitors somewhere to go next, see what worked, and keep all of it yours.')}
          </p>
        </Reveal>

        <Reveal stagger>
          <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
            {GROUPS.map((group, index) => (
              <article key={group.goal} className="motion-card border-t border-neutral-300 py-5 text-start">
                <div className="mb-2 flex items-baseline gap-3">
                  <span className="font-mono text-xs text-indigo-700">{`0${index + 1} · ${ui(group.goal)}`}</span>
                  <h3 className="text-base font-semibold text-neutral-900 text-balance">{ui(group.title)}</h3>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-neutral-600 text-pretty">{ui(group.detail)}</p>
                <ul className="space-y-1.5 text-sm text-neutral-700">
                  {group.items.map(item => <li key={item} dir="auto">{ui(item)}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </Reveal>

        <Reveal distance="sm" delay={80} className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-neutral-300 pt-5 sm:flex-row sm:items-center">
          <p className="text-sm text-neutral-600">{ui('Start with a free account and create your page in the Studio.')}</p>
          <button
            onClick={onOpenStudio}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <span>{ui('Open Studio')}</span>
            <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </Reveal>
      </div>
    </section>
  );
};
