import React, { useState } from 'react';
import { AccordionPanel } from './motion/AccordionPanel';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCapabilities } from '../context/CapabilitiesContext';
import { getFaqs } from '../config/faq';
import { Reveal } from './motion/Reveal';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t, lang } = useLanguage();
  const { hasAnyImporter } = useCapabilities();
  const faqList = getFaqs(lang, hasAnyImporter);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="marketing-section py-12 md:py-16 border-b border-neutral-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <Reveal distance="md" className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-mono font-bold mb-3 tracking-wider">
            <span>{t.faqSection.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-3 text-balance">
            {t.faqSection.title}
          </h2>
          <p className="text-base text-neutral-600 text-pretty">
            {t.faqSection.subtitle}
          </p>
        </Reveal>

        {/* FAQ Accordion */}
        <Reveal stagger className="space-y-3">
          {faqList.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="motion-card rounded-2xl border border-neutral-200 bg-neutral-50 overflow-hidden shadow-xs"
              >
                <button
                  id={`faq-question-${idx}`} aria-expanded={isOpen} aria-controls={`faq-answer-${idx}`}
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-start flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <span className="font-bold text-sm sm:text-base text-neutral-900 text-start">
                    {faq.question}
                  </span>
                  <div className="p-1 rounded-full bg-neutral-100 shrink-0 text-neutral-600">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                <AccordionPanel open={isOpen} id={`faq-answer-${idx}`} labelledBy={`faq-question-${idx}`}>
                    {faq.answer}
                </AccordionPanel>
              </div>
            );
          })}
        </Reveal>

      </div>
    </section>
  );
};
