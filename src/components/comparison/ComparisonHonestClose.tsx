import React from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../context/LanguageContext';

/**
 * The part a comparison section usually omits: when the simpler tool is the right one. Saying
 * it costs nothing here and buys the rest of the page its credibility.
 */
export const ComparisonHonestClose: React.FC = () => {
  const { tr: ui, isRtl } = useUiLanguage();

  return (
    <div className="mt-6 rounded-2xl border border-neutral-300 bg-neutral-100 p-5 sm:p-6">
      <h3 className="text-sm font-bold text-neutral-900">{ui('When you do not need RALOA')}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
        {ui('If one link that opens a tidy list of buttons covers it, a simple link list may be enough for you, and you should not pay for more than that.')}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700">
        {ui('RALOA starts to earn its place at the point where the list stops holding everything you publish.')}
      </p>
      <Link
        href="/templates"
        className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-neutral-900 px-4 text-xs font-bold text-neutral-900 hover:bg-neutral-200 transition-colors"
      >
        <span>{ui('See the sites a new account actually starts with')}</span>
        <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} aria-hidden="true" />
      </Link>
    </div>
  );
};
