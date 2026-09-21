import React from 'react';

export type ComparisonTab = 'both' | 'raloa' | 'generic';

interface ComparisonToggleProps {
  ar: boolean;
  active: ComparisonTab;
  onSelect: (tab: ComparisonTab) => void;
}

const tabClass = (selected: boolean, dark: boolean) =>
  `px-4 py-1.5 rounded-full transition-colors ${
    selected
      ? `${dark ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-900'} shadow-xs font-bold`
      : 'text-neutral-600'
  }`;

export const ComparisonToggle: React.FC<ComparisonToggleProps> = ({ ar, active, onSelect }) => (
  <div className="flex md:hidden justify-center mb-8">
    <div className="inline-flex p-1 rounded-full bg-neutral-200/70 border border-neutral-200 text-xs font-semibold">
      <button onClick={() => onSelect('generic')} className={tabClass(active === 'generic', false)}>
        {ar ? 'قائمة الروابط البسيطة' : 'Basic link list'}
      </button>
      <button onClick={() => onSelect('raloa')} className={tabClass(active === 'raloa', true)}>
        {ar ? 'موقع RALOA' : 'RALOA Mini-Site'}
      </button>
    </div>
  </div>
);
