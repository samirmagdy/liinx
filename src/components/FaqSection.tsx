import React, { useState } from 'react';
import { FAQS } from '../data/mockData';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t, lang } = useLanguage();
  const faqList = lang === 'ar' ? [
    { question: 'كيف أبدأ؟', answer: 'أنشئ حساباً مجانياً، أضف روابطك واختر مظهراً ثم افتح صفحتك المنشورة للتحقق منها.' },
    { question: 'كيف تعمل الحجوزات؟', answer: 'أضف رابط موعد صالحاً من Calendly. يختار الزائر وقتاً داخل الأداة ويؤكّد Calendly الحجز. فتح الأداة لا يُحسب حجزاً مكتملاً.' },
    { question: 'هل يوجد نطاق مخصص؟', answer: 'تدعم الخطط المدفوعة نطاقاً مخصصاً بعد التحقق من DNS. يجب إعداد النطاق وشهادة TLS لدى مزوّد الاستضافة أيضاً.' },
    { question: 'هل يمكن استيراد الروابط؟', answer: 'افتح أداة الاستيراد، أدخل رابط صفحتك العامة، ثم راجع الروابط واختر ما تريد حفظه. قد تمنع بعض المواقع الاستخراج.' },
    { question: 'هل تتوفر تجربة مجانية؟', answer: 'توجد خطة مجانية. الخطط المدفوعة لا تتضمن فترة تجريبية مجانية وتُحصّل حسب الفترة المختارة في Stripe.' }
  ] : [
    { question: 'How do I start?', answer: 'Create a free account, add your links, choose a theme and open your published page to check it.' },
    { question: 'How does booking work?', answer: 'Add a valid Calendly event link. Visitors choose a time in the embedded scheduler and Calendly confirms the appointment. Opening the scheduler is not counted as a completed booking.' },
    { question: 'Can I use a custom domain?', answer: 'Paid plans support custom domains after DNS verification. Your hosting provider must also configure the domain and TLS certificate.' },
    { question: 'Can I import my links?', answer: 'Open the importer, enter your public page URL, then review and select the links to save. Some sites may block extraction.' },
    { question: 'Is there a free trial?', answer: 'There is a free plan. Paid plans have no free trial and are charged for the selected interval through Stripe.' }
  ];

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 md:py-28 border-b border-neutral-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-mono font-bold mb-3 tracking-wider">
            <span>{t.faqSection.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-3 text-balance">
            {t.faqSection.title}
          </h2>
          <p className="text-base text-neutral-600 text-pretty">
            {t.faqSection.subtitle}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqList.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 overflow-hidden shadow-xs"
              >
                <button
                  aria-expanded={isOpen} aria-controls={`faq-answer-${idx}`}
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-start flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                >
                  <span className="font-bold text-sm sm:text-base text-neutral-900 text-start">
                    {faq.question}
                  </span>
                  <div className="p-1 rounded-full bg-neutral-100 shrink-0 text-neutral-600">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div id={`faq-answer-${idx}`} className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 animate-fade-in text-pretty text-start">
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
