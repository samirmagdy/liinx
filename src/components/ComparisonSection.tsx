import React from 'react';
import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import { Reveal } from './motion/Reveal';
import { ComparisonFitList } from './comparison/ComparisonFitList';
import { ComparisonHonestClose } from './comparison/ComparisonHonestClose';
import { MigrationBanner } from './comparison/MigrationBanner';

/** Who this is for, stated as fit rather than as a scorecard against a rival. */
export function ComparisonSection() {
  const { tr: ui } = useUiLanguage();

  return (
    <section id="comparison" className="marketing-section py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-neutral-50/50">
      <div className="max-w-7xl mx-auto">
        <Reveal distance="md" className="mb-8 max-w-3xl">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4 text-balance">
            {ui('Choose RALOA if any of these is true')}
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed text-pretty">
            {ui('Six things the product does today. If none of them is yours, the section below says so plainly.')}
          </p>
        </Reveal>

        <Reveal stagger>
          <ComparisonFitList />
          <ComparisonHonestClose />
        </Reveal>

        <Reveal className="mt-6">
          <MigrationBanner />
        </Reveal>
      </div>
    </section>
  );
}
