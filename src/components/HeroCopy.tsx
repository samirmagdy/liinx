import React from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { HeroClaimForm } from './HeroClaimForm';

const PROOF = [{ label: 'Free forever' }, { label: 'No credit card required' }];

/** The left column: what it is, why it is better, and the one action that costs nothing. */
export const HeroCopy: React.FC<{ onClaimUsername: (handle: string) => void }> = ({ onClaimUsername }) => {
  const [, setLocation] = useLocation();
  const { t, tr: ui, isRtl } = useLanguage();

  return (
    <div className="lg:col-span-7 flex flex-col items-start text-start lg:pt-1">
      <div data-hero="eyebrow" className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">
        {t.hero.badge}
      </div>

      <div>
        <h1 key={isRtl ? 'ar' : 'en'} className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-[-0.045em] text-neutral-900 leading-[1.02] mb-4 text-balance">
          <span className="hero-headline-main">{t.hero.headline}</span>
          <span className="hero-headline-highlight">{t.hero.headlineHighlight}</span>
        </h1>
      </div>

      <div data-hero="copy">
        <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl lg:max-w-2xl mb-6 text-pretty">
          {t.hero.subheadline}
        </p>
      </div>

      <div data-hero="action" className="w-full max-w-xl lg:max-w-2xl mb-4">
        <HeroClaimForm
          isRtl={isRtl}
          placeholder={t.hero.claimPlaceholder}
          createLabel={ui('Create your page')}
          onClaimUsername={onClaimUsername}
          onFallbackRedirect={() => setLocation('/register')}
        />

        <div className="hero-proof raloa-hero-proof" aria-label={ui('Getting started benefits')}>
          {PROOF.map(item => <span key={item.label}><Check aria-hidden="true" />{ui(item.label)}</span>)}
        </div>

        {/* Secondary CTAs: deliberately unstyled text, so nothing competes with the claim button. */}
        <div data-hero="secondary" className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 text-xs px-2">
          <Link
            href="/@elenarostova"
            className="inline-flex min-h-11 items-center gap-1.5 font-bold text-neutral-900 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <span>{ui('View live demo ↗')}</span>
          </Link>
          <Link
            href="/templates"
            className="inline-flex min-h-11 items-center gap-1 font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <span>{t.hero.exploreTemplates}</span>
            <ArrowRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      </div>
    </div>
  );
};
