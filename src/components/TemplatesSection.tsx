import React, { useEffect, useState } from 'react';
import { TEMPLATES } from '../config/templates';
import { type CreatorProfile } from '../types';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Reveal } from './motion/Reveal';
import { TemplateCard } from './TemplateCard';

interface TemplatesSectionProps {
  headingLevel?: 1 | 2;
  onSelectTemplate: (profile: CreatorProfile) => void;
  maxVisible?: number;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({ onSelectTemplate, headingLevel = 2, maxVisible }) => {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const [isHydrated, setIsHydrated] = useState(false);
  const { t, isRtl } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = React.useMemo(() => {
    const cats = Array.from(new Set(TEMPLATES.map(t => t.category)));
    return ['all', ...cats];
  }, []);

  const filteredTemplates = React.useMemo(() => {
    const list = selectedCategory === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === selectedCategory);
    return maxVisible ? list.slice(0, maxVisible) : list;
  }, [selectedCategory, maxVisible]);

  useEffect(() => setIsHydrated(true), []);

  return (
    <section id="templates" className="marketing-section py-12 md:py-16 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
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
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                }`}
              >
                {cat === 'all' ? (isRtl ? 'الكل' : 'All') : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <Reveal stagger><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => {
            const loc = t.templatesSection.templates[template.id] || {
              name: template.name,
              category: template.category,
              description: template.description
            };

            return (
              <TemplateCard
                key={template.id}
                template={template}
                loc={loc}
                isHydrated={isHydrated}
                isRtl={isRtl}
                useTemplateLabel={t.templatesSection.useTemplate}
                onSelectTemplate={onSelectTemplate}
              />
            );
          })}
        </div></Reveal>

        {maxVisible && TEMPLATES.length > maxVisible && (
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
