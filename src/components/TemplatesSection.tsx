import React, { useEffect, useState } from 'react';
import { SITE_TEMPLATES } from '../../shared/index.js';
import { useLanguage } from '../context/LanguageContext';
import { Reveal } from './motion/Reveal';
import { TemplateCard } from './TemplateCard';
import { trackMarketingEvent } from '../services/marketingEvents';

interface TemplatesSectionProps {
  headingLevel?: 1 | 2;
  onSelectTemplate: (templateId: string) => void;
  maxVisible?: number;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({ onSelectTemplate, headingLevel = 2, maxVisible }) => {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const [isHydrated, setIsHydrated] = useState(false);
  const { t, tr: ui, isRtl } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  /** Each category is labelled by its own translated template entry, never by the raw catalog string. */
  const categoryLabels = React.useMemo(() => {
    const labels = new Map<string, string>();
    for (const template of SITE_TEMPLATES) {
      if (!labels.has(template.category)) labels.set(template.category, t.templatesSection.templates[template.id]?.category || template.category);
    }
    return labels;
  }, [t]);

  const categories = React.useMemo(() => ['all', ...categoryLabels.keys()], [categoryLabels]);

  const filteredTemplates = React.useMemo(() => {
    const list = selectedCategory === 'all' ? SITE_TEMPLATES : SITE_TEMPLATES.filter(template => template.category === selectedCategory);
    return maxVisible ? list.slice(0, maxVisible) : list;
  }, [selectedCategory, maxVisible]);

  const carouselTemplates = React.useMemo(() => [...filteredTemplates, ...filteredTemplates], [filteredTemplates]);

  const handleTemplateSelect = (templateId: string) => {
    void trackMarketingEvent({ event: 'template_selected', language: isRtl ? 'ar' : 'en', templateId });
    onSelectTemplate(templateId);
  };

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
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                }`}
              >
                {cat === 'all' ? t.templatesSection.allCategory : categoryLabels.get(cat) || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <Reveal stagger>
          <div className="raloa-template-carousel" aria-label={ui('Template carousel')}>
            <div className="raloa-template-grid template-carousel-track">
              <div className="template-carousel-group">
          {carouselTemplates.slice(0, filteredTemplates.length).map((template) => {
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
                onSelectTemplate={handleTemplateSelect}
                carouselMode
              />
            );
          })}
              </div>
              <div className="template-carousel-group" aria-hidden="true" inert>
          {carouselTemplates.slice(filteredTemplates.length).map((template) => {
            const loc = t.templatesSection.templates[template.id] || {
              name: template.name,
              category: template.category,
              description: template.description
            };

            return (
              <TemplateCard
                key={`clone-${template.id}`}
                template={template}
                loc={loc}
                isHydrated={isHydrated}
                isRtl={isRtl}
                useTemplateLabel={t.templatesSection.useTemplate}
                onSelectTemplate={handleTemplateSelect}
                carouselMode
              />
            );
          })}
              </div>
            </div>
          </div>
          {maxVisible && (
            <a href="/templates" className="raloa-more-template-card" aria-label={ui('Browse more templates')}>
              <span aria-hidden="true">＋</span>
              <strong>{ui('More templates')}</strong>
            </a>
          )}
        </Reveal>

      </div>
    </section>
  );
};
