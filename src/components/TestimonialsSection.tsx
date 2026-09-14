import React from 'react';
import { TESTIMONIALS } from '../data/mockData';
import { Star, CheckCircle2 } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 md:py-28 bg-white border-b border-[#E8E6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono font-bold mb-3">
            <span>TRUSTED BY 150,000+ CREATORS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111315] mb-4">
            Loved by people who care about design
          </h2>
          <p className="text-base text-[#52525B]">
            From Grammy-nominated producers to Paris fashion houses and independent authors.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-[#FAF9F6] border border-[#E8E6DF] flex flex-col justify-between hover:border-black/30 transition-all shadow-2xs"
            >
              <div>
                {/* Metric Badge */}
                <div className="inline-block px-2.5 py-1 rounded-full bg-black/5 text-[#18181B] text-[11px] font-mono font-bold mb-4">
                  {t.metric}
                </div>

                <p className="text-sm sm:text-base text-[#18181B] leading-relaxed mb-6 font-medium italic">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Row */}
              <div className="flex items-center gap-3 pt-4 border-t border-[#EAE7DE]">
                <img
                  src={t.avatar}
                  alt={t.author}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-white"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold text-[#111315] flex items-center gap-1">
                    <span>{t.author}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 fill-blue-600/20" />
                  </h4>
                  <p className="text-[11px] text-[#71717A]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
