import React from 'react';
import { Check, X } from 'lucide-react';
import type { ComparisonPoint } from './comparisonContent';

interface ComparisonFeatureListProps {
  points: ComparisonPoint[];
  tone: 'available' | 'missing';
}

export const ComparisonFeatureList: React.FC<ComparisonFeatureListProps> = ({ points, tone }) => {
  const Icon = tone === 'available' ? Check : X;

  return (
    <ul className={`space-y-2.5 text-xs ${tone === 'available' ? 'text-neutral-700' : 'text-neutral-600'}`}>
      {points.map(point => (
        <li key={point.label} className="flex items-start gap-2">
          <Icon
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              tone === 'available' ? 'text-emerald-600 stroke-[2.5]' : 'text-neutral-500'
            }`}
          />
          <span><strong>{point.label}:</strong> {point.detail}</span>
        </li>
      ))}
    </ul>
  );
};
