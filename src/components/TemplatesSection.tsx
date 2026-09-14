import React, { useState } from 'react';
import { TEMPLATES } from '../data/mockData';
import { CreatorProfile } from '../types';
import { ArrowRight, Eye, Layers } from 'lucide-react';

interface TemplatesSectionProps {
  onSelectTemplate: (profile: CreatorProfile) => void;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({ onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Design & Art', 'Musicians', 'Brands', 'Creators'];

  const filteredTemplates = selectedCategory === 'All' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <section id="templates" className="py-20 md:py-28 bg-white border-b border-[#E8E6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181B]/5 text-xs font-mono font-bold text-[#18181B] mb-3">
              <span>CURATED ARCHETYPES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111315]">
              Designed for your creative discipline
            </h2>
            <p className="text-base text-[#52525B] mt-2 max-w-xl">
              Start with a beautifully balanced preset crafted for your industry, then personalize every pixel in seconds.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F6] border border-[#E8E6DF] rounded-2xl overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#18181B] text-white shadow-xs'
                    : 'text-[#71717A] hover:text-[#18181B] hover:bg-black/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-3xl border border-[#E8E6DF] bg-[#FAF9F6] overflow-hidden flex flex-col justify-between hover:border-black/40 hover:shadow-md transition-all group"
            >
              {/* Preview Card Header */}
              <div 
                className="p-6 border-b border-[#E8E6DF] flex flex-col items-center justify-center relative min-h-[220px]"
                style={{ backgroundColor: template.previewColor }}
              >
                <img 
                  src={template.profile.avatarUrl} 
                  alt={template.profile.displayName}
                  className="w-18 h-18 rounded-full object-cover shadow-sm ring-2 ring-white/20 mb-3 group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <h3 className={`text-base font-bold tracking-tight text-center ${
                  template.profile.themeId.includes('noir') || template.profile.themeId.includes('cyber') 
                    ? 'text-white' 
                    : 'text-[#18181B]'
                }`}>
                  {template.profile.displayName}
                </h3>
                <p className={`text-xs font-mono opacity-65 ${
                  template.profile.themeId.includes('noir') || template.profile.themeId.includes('cyber') 
                    ? 'text-neutral-300' 
                    : 'text-neutral-600'
                }`}>
                  @{template.profile.username}
                </p>

                {/* Badge */}
                <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/10 backdrop-blur-xs text-[#18181B] dark:text-white border border-white/20">
                  {template.category}
                </span>
              </div>

              {/* Template Body */}
              <div className="p-6 flex flex-col flex-1 justify-between">
                <div>
                  <h4 className="font-brand font-bold text-base text-[#111315] mb-1">
                    {template.name}
                  </h4>
                  <p className="text-xs text-[#52525B] leading-relaxed mb-6">
                    {template.description}
                  </p>
                </div>

                <button
                  onClick={() => onSelectTemplate(template.profile)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#DCD8CF] hover:border-black text-xs font-bold text-[#18181B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer group-hover:bg-[#18181B] group-hover:text-white group-hover:border-black"
                >
                  <span>Use This Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
