import React from 'react';
import { COMPARISON_FEATURES } from '../data/mockData';
import { Check, X } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  return (
    <section id="comparison" className="py-20 md:py-28 border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-mono font-bold mb-3 tracking-wider">
            <span>THE HONEST COMPARISON</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-4 text-balance">
            Why design-conscious creators switch to LIINX
          </h2>
          <p className="text-base text-neutral-600">
            See how LIINX compares against traditional link aggregators that force ads and charge exorbitant fees.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Features & Standards
                </th>
                <th className="py-4 px-6 text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
                    <span>LIINX</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Linktree
                </th>
                <th className="py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Beacons
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {COMPARISON_FEATURES.map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-neutral-900">
                    {row.feature}
                  </td>
                  
                  {/* LIINX column */}
                  <td className="py-4 px-6 font-bold text-neutral-900 border-x border-neutral-200">
                    {typeof row.liinx === 'boolean' ? (
                      row.liinx ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span className="text-xs font-mono">Included</span>
                        </div>
                      ) : (
                        <X className="w-4 h-4 text-neutral-300" />
                      )
                    ) : (
                      <span className="text-xs font-mono">{row.liinx}</span>
                    )}
                  </td>

                  {/* Linktree column */}
                  <td className="py-4 px-6 text-neutral-600 text-xs">
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
                  <td className="py-4 px-6 text-neutral-600 text-xs">
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
