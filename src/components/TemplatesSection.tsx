import React, { useEffect, useState } from 'react';
import { TEMPLATES, THEMES } from '../data/mockData';
import { CreatorProfile } from '../types';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PhonePreview } from './PhonePreview';

interface TemplatesSectionProps {
  headingLevel?: 1 | 2;
  onSelectTemplate: (profile: CreatorProfile) => void;
  maxVisible?: number;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({ onSelectTemplate, headingLevel = 2, maxVisible }) => {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isHydrated, setIsHydrated] = useState(false);
  const { t, isRtl } = useLanguage();

  const categories = ['All', 'Design & Art', 'Musicians', 'Brands', 'Creators', 'Podcasts', 'Gaming', 'Wellness', 'Lifestyle'];

  const filteredTemplates = selectedCategory === 'All' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === selectedCategory);
  const visibleTemplates = maxVisible ? filteredTemplates.slice(0, maxVisible) : filteredTemplates;

  useEffect(() => setIsHydrated(true), []);

  const isDarkTheme = (themeId: string) => THEMES.find(t => t.id === themeId)?.isDark ?? false;

  return (
    <section id="templates" className="marketing-section py-24 md:py-36 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-mono font-bold mb-3 tracking-wider">
            <span>{t.templatesSection.badge}</span>
            </div>
            <Heading className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 text-balance">
              {t.templatesSection.title}
            </Heading>
            <p className="text-base text-neutral-600 mt-2 max-w-xl text-pretty">
              {t.templatesSection.subtitle}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-neutral-100 border border-neutral-200 rounded-2xl max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                aria-pressed={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {t.templatesSection.categories[categories.indexOf(cat)] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleTemplates.map((template) => {
            const loc = t.templatesSection.templates[template.id] || {
              name: template.name,
              category: template.category,
              description: template.description
            };

            return (
              <div
                key={template.id}
                className="rounded-3xl border border-neutral-200 bg-neutral-50 overflow-hidden flex flex-col justify-between transition-colors hover:border-neutral-400 focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-900/10"
              >
                {/* Render the real profile component as a non-interactive theme example. */}
                <div className="relative h-[300px] overflow-hidden border-b" aria-label={`${loc.name} template preview`}>
                  {isHydrated ? (
                    <div className="absolute top-4 left-1/2 w-[360px] -translate-x-1/2 origin-top scale-75 pointer-events-none" aria-hidden="true" inert>
                      <PhonePreview profile={template.profile} customTheme={THEMES.find(theme => theme.id === template.profile.themeId)} compact interactive={false} />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center p-6 text-center" style={{ backgroundColor: template.previewColor }}>
                      <div>
                        <div className="w-14 h-14 rounded-full bg-neutral-900/10 mx-auto mb-3" />
                        <p className="text-sm font-bold text-neutral-900">{loc.name}</p>
                        <p className="text-xs text-neutral-600 mt-1">{isRtl ? 'معاينة القالب' : 'Template preview'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Template Body */}
                <div className="p-6 flex flex-col flex-1 justify-between text-start">
                  <div>
                    <h3 className="font-brand font-bold text-base text-neutral-900 mb-1 text-balance">
                      {loc.name}
                    </h3>
                    <p className="text-xs text-neutral-600 leading-relaxed mb-6 text-pretty">
                      {loc.description}
                    </p>
                  </div>

                <button
                  onClick={() => onSelectTemplate(template.profile)}
                  className="w-full py-2.5 px-4 rounded-full bg-neutral-950 border border-neutral-600 hover:border-neutral-500 text-xs font-bold text-neutral-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                >
                  <span>{t.templatesSection.useTemplate}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
        </div>

        {maxVisible && filteredTemplates.length > maxVisible && (
          <div className="mt-8 text-center">
            <a href="/templates" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors">
              {isRtl ? 'عرض جميع القوالب' : 'View all templates'}
              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </a>
          </div>
        )}

      </div>
    </section>
  );
};
