import React from 'react';
import { ArrowRight, Download } from 'lucide-react';
import { useLocation } from 'wouter';
import { useCapabilities } from '../../context/CapabilitiesContext';
import { useLanguage as useUiLanguage } from '../../context/LanguageContext';

/**
 * The one place a rival is named, and only for the import that actually exists: the importer
 * reads a public profile and copies its links across.
 */
export const MigrationBanner: React.FC = () => {
  const { tr: ui, isRtl } = useUiLanguage();
  const { hasAnyImporter } = useCapabilities();
  const [, setLocation] = useLocation();

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white border border-indigo-300 flex items-center justify-center shrink-0 shadow-xs">
          <Download className="w-5 h-5 text-indigo-700" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-bold text-base text-neutral-900">
            {ui('Moving from Linktree or Beacons?')}
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed mt-1">
            {hasAnyImporter
              ? ui('Enter your public handle to preview the links on that profile, then bring them across.')
              : ui('Start your site with a theme, and keep your own pricing on anything a third party takes payment for.')}
          </p>
        </div>
      </div>
      <button
        onClick={() => setLocation(hasAnyImporter ? '/register?after=import' : '/register')}
        className="shrink-0 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-black px-5 py-3 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
      >
        <span>{hasAnyImporter ? ui('Import your links') : ui('Create your page')}</span>
        <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
    </div>
  );
};
