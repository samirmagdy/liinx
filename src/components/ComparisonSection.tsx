import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Reveal } from './motion/Reveal';
import { ComparisonToggle, type ComparisonTab } from './comparison/ComparisonToggle';
import { LinkListPanel, RaloaPanel } from './comparison/ComparisonPanels';
import { MigrationBanner } from './comparison/MigrationBanner';

export function ComparisonSection() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [activeTab, setActiveTab] = useState<ComparisonTab>('both');

  return (
    <section id="comparison" className="marketing-section py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-neutral-50/50">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <Reveal distance="md" className="text-center max-w-3xl mx-auto mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono font-bold text-neutral-800 mb-3 tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{ar ? 'مقارنة بصرية واضحة' : 'The Visual Difference'}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4 text-balance">
              {ar ? 'موقع مصغر متكامل أم مجرد قائمة روابط؟' : 'A design-first mini website vs. A list of links'}
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed text-pretty">
              {ar
                ? 'شاهد الفرق بين قائمة روابط بسيطة وموقع مصغر مصمم بعناية يعكس هويتك الإبداعية.'
                : 'See the difference between a link list and a design-first mini-site.'}
            </p>
          </div>
        </Reveal>

        <ComparisonToggle ar={ar} active={activeTab} onSelect={setActiveTab} />

        {/* Side-by-Side Visual Comparison Grid */}
        <Reveal stagger>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start mb-8">
            <LinkListPanel ar={ar} hidden={activeTab === 'raloa'} />
            <RaloaPanel ar={ar} hidden={activeTab === 'generic'} />
          </div>
        </Reveal>

        <MigrationBanner ar={ar} />

      </div>
    </section>
  );
}
