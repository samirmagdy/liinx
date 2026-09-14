import React from 'react';
import { Check, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const ComparisonSection: React.FC = () => {
  const { t } = useLanguage();
  const c = t.comparisonSection;

  return (
    <section id="comparison" className="py-20 md:py-28 border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-mono font-bold mb-3 tracking-wider">
            <span>{c.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-4 text-balance">
            {c.title}
          </h2>
          <p className="text-base text-neutral-600">
            {c.subtitle}
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="py-4 px-6 text-start text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  {c.featuresCol}
                </th>
                <th className="py-4 px-6 text-start text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
                    <span>{c.liinxCol}</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-start text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  {c.linktreeCol}
                </th>
                <th className="py-4 px-6 text-start text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  {c.beaconsCol}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {c.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-neutral-900 text-start">
                    {row.feature}
                  </td>
                  
                  {/* LIINX column */}
                  <td className="py-4 px-6 font-bold text-neutral-900 border-x border-neutral-200 text-start">
                    {typeof row.liinx === 'boolean' ? (
                      row.liinx ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span className="text-xs font-mono">{c.included}</span>
                        </div>
                      ) : (
                        <X className="w-4 h-4 text-neutral-300" />
                      )
                    ) : (
                      <span className="text-xs font-mono">{row.liinx}</span>
                    )}
                  </td>

                  {/* Linktree column */}
                  <td className="py-4 px-6 text-neutral-600 text-xs text-start">
                    {typeof row.linktree === 'boolean' ? (
                      row.linktree ? (
                        <Check className="w-4 h-4 text-neutral-600" />
                      ) : (
                        <X className="w-4 h-4 text-rose-400" />
                      )
                    ) : (
                      <span className="font-mono text-neutral-600">{row.linktree}</span>
                    )}
                  </td>

                  {/* Beacons column */}
                  <td className="py-4 px-6 text-neutral-600 text-xs text-start">
                    {typeof row.beacons === 'boolean' ? (
                      row.beacons ? (
                        <Check className="w-4 h-4 text-neutral-600" />
                      ) : (
                        <X className="w-4 h-4 text-rose-400" />
                      )
                    ) : (
                      <span className="font-mono text-neutral-600">{row.beacons}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
};
