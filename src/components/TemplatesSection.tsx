import React, { useState } from 'react';
import { TEMPLATES, THEMES } from '../data/mockData';
import { CreatorProfile } from '../types';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TemplatesSectionProps {
  onSelectTemplate: (profile: CreatorProfile) => void;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({ onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { t, isRtl } = useLanguage();

  const categories = ['All', 'Design & Art', 'Musicians', 'Brands', 'Creators', 'Podcasts', 'Gaming', 'Wellness', 'Lifestyle'];

  const filteredTemplates = selectedCategory === 'All' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === selectedCategory);

  const isDarkTheme = (themeId: string) => THEMES.find(t => t.id === themeId)?.isDark ?? false;

  return (
    <section id="templates" className="py-20 md:py-28 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-mono font-bold mb-3 tracking-wider">
            <span>{t.templatesSection.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 text-balance">
              {t.templatesSection.title}
            </h2>
            <p className="text-base text-neutral-600 mt-2 max-w-xl text-pretty">
              {t.templatesSection.subtitle}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 border border-neutral-200 rounded-full overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
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
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-3xl border border-neutral-200 bg-neutral-50 overflow-hidden flex flex-col justify-between transition-colors hover:border-neutral-400 focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-900/10"
            >
              {/* Preview Card Header */}
              <div 
                className="p-6 border-b border-neutral-200 flex flex-col items-center justify-center relative min-h-[220px]"
                style={{ backgroundColor: template.previewColor }}
              >
                <img 
                  src={template.profile.avatarUrl} 
                  alt={template.profile.displayName}
                  className="w-18 h-18 rounded-full object-cover shadow-sm ring-2 ring-white/20 mb-3"
                  loading="lazy"
                />
                <h3 className={`text-base font-bold tracking-tight text-center ${
                  isDarkTheme(template.profile.themeId) 
                    ? 'text-white' 
                    : 'text-neutral-900'
                }`}>
                  {template.profile.displayName}
                </h3>
                <p className={`text-xs font-mono opacity-65 ${
                  isDarkTheme(template.profile.themeId) 
                    ? 'text-neutral-300' 
                    : 'text-neutral-600'
                }`}>
                  @{template.profile.username}
                </p>

                {/* Badge */}
                <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider border ${
                  isDarkTheme(template.profile.themeId)
                    ? 'bg-white/10 text-neutral-300 border-white/10'
                    : 'bg-neutral-900/10 text-neutral-700 border-neutral-900/5'
                }`}>
                  {template.category}
                </span>
              </div>

              {/* Template Body */}
              <div className="p-6 flex flex-col flex-1 justify-between">
                <div>
                  <h4 className="font-brand font-bold text-base text-neutral-900 mb-1 text-balance">
                    {template.name}
                  </h4>
                  <p className="text-xs text-neutral-600 leading-relaxed mb-6 text-pretty">
                    {template.description}
                  </p>
                </div>

                <button
                  onClick={() => onSelectTemplate(template.profile)}
                  className="w-full py-2.5 px-4 rounded-full bg-white border border-neutral-300 hover:border-neutral-900 text-xs font-bold text-neutral-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                >
                  <span>{t.templatesSection.useTemplate}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
