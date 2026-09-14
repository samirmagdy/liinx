import React, { useState } from 'react';
import { FAQS } from '../data/mockData';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-[#FAF9F6] border-b border-[#E8E6DF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181B]/5 text-xs font-mono font-bold text-[#18181B] mb-3">
            <span>QUESTIONS & ANSWERS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111315] mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-[#52525B]">
            Everything you need to know about setting up your LIINX page.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#E5E2DA] bg-white overflow-hidden transition-all shadow-2xs"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                >
                  <span className="font-bold text-sm sm:text-base text-[#111315]">
                    {faq.question}
                  </span>
                  <div className="p-1 rounded-full bg-black/5 shrink-0 text-[#71717A]">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#52525B] leading-relaxed border-t border-[#F0EEE8] animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
