import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Reveal } from './motion/Reveal';
import { PhonePreview } from './PhonePreview';
import { api } from '../services/api';
import { type ShowcaseProfile } from '../../shared/types/index.js';

/**
 * One real page per card. The preview is the same component the public bio uses, fed by the
 * same stored blocks, so what the gallery shows is what the link opens.
 */
export const ShowcaseGrid: React.FC<{ profiles: ShowcaseProfile[] }> = ({ profiles }) => {
  const { tr: ui } = useLanguage();

  if (!profiles.length) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
        <p className="text-sm font-bold text-neutral-900">{ui('No creators have opted in yet.')}</p>
        <p className="mt-1 text-xs text-neutral-600 text-pretty">
          {ui('This wall is built only from pages their owners offered. It stays empty until someone says yes.')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {profiles.map(profile => (
        <Link
          key={profile.id}
          href={profile.url}
          className="motion-card group rounded-3xl border border-neutral-200 bg-neutral-50 overflow-hidden flex flex-col hover:border-neutral-400 focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="relative h-[280px] overflow-hidden border-b border-neutral-200" aria-hidden="true" inert>
            <div className="absolute top-4 left-1/2 w-[360px] -translate-x-1/2 origin-top scale-75 pointer-events-none">
              <PhonePreview profile={profile} compact interactive={false} />
            </div>
          </div>
          <div className="p-5 flex items-start justify-between gap-3 text-start">
            <div className="min-w-0">
              <h3 className="font-brand font-bold text-sm text-neutral-900 truncate">
                <span dir="auto">{profile.displayName}</span>
              </h3>
              <p className="mt-0.5 text-xs text-neutral-500 font-mono truncate" dir="ltr">{profile.url}</p>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0 text-neutral-400 group-hover:text-neutral-900 transition-colors rtl:rotate-180" />
          </div>
        </Link>
      ))}
    </div>
  );
};

export function MadeWithRaloaSection() {
  const { isRtl, tr: ui } = useLanguage();
  const [profiles, setProfiles] = useState<ShowcaseProfile[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    let alive = true;
    api.profiles.getShowcase()
      .then(response => { if (alive) setProfiles(response.profiles || []); })
      .catch(() => { if (alive) setState('failed'); })
      .finally(() => { if (alive) setState('ready'); });
    return () => { alive = false; };
  }, []);

  // Empty community proof is not proof. Keep the homepage focused on live product demos
  // until opted-in creator pages are available, instead of reserving a large blank band.
  if (state === 'ready' && !profiles.length) return null;

  return (
    <section id="showcase" className="marketing-section py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto">
        <Reveal distance="md" className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-mono font-bold mb-3 tracking-wider">
            <span>{ui('Made with RALOA')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 text-balance">
            {ui('Pages people actually published here')}
          </h2>
          <p className="text-base text-neutral-600 mt-2 text-pretty">
            {ui('Every card below is a live page its owner let us show. Open one and it is the same site, with the same links.')}
          </p>
        </Reveal>

        {state === 'failed' ? (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
            <p className="text-sm font-bold text-neutral-900">{ui('The gallery could not load.')}</p>
            <p className="mt-1 text-xs text-neutral-600">
              {ui('Reload the page and it will try again.')}{' '}
              <Link href={isRtl ? '/ar/templates' : '/templates'} className="font-semibold text-neutral-900 underline underline-offset-2">
                {ui('Browse starter sites instead')}
              </Link>
            </p>
          </div>
        ) : state === 'loading' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-hidden="true">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className="h-[360px] rounded-3xl border border-neutral-200 bg-neutral-100" />
            ))}
          </div>
        ) : (
          <Reveal stagger><ShowcaseGrid profiles={profiles} /></Reveal>
        )}
      </div>
    </section>
  );
}
