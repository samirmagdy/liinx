import React from 'react';
import { TESTIMONIALS } from '../data/mockData';
import { CheckCircle2 } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="py-20 md:py-28 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-mono font-bold mb-3 tracking-wider">
            <span>TRUSTED BY 150,000+ CREATORS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-4 text-balance">
            Loved by people who care about design
          </h2>
          <p className="text-lg text-neutral-600">
            From Grammy-nominated producers to Paris fashion houses and independent authors.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200 flex flex-col justify-between hover:border-neutral-400 transition-colors"
            >
              <div>
                {/* Metric Badge */}
                <div className="inline-block px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-[11px] font-mono font-bold mb-4 tabular-nums">
                  {t.metric}
                </div>

                <p className="text-lg text-neutral-900 leading-relaxed mb-6 font-medium italic text-pretty">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Row */}
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                <img
                  src={t.avatar}
                  alt={t.author}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                    <span>{t.author}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
                  </h4>
                  <p className="text-[11px] text-neutral-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
