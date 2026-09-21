import React from 'react';
import type { CreatorPage } from '../../types';

interface QrTargetSelectProps {
  label: string;
  homeLabel: string;
  pages: CreatorPage[];
  value: string;
  onChange: (slug: string) => void;
}

export const QrTargetSelect: React.FC<QrTargetSelectProps> = ({ label, homeLabel, pages, value, onChange }) => (
  <label htmlFor="qr-target-page" className="block mb-4 text-xs font-semibold text-neutral-700">
    {label}
    <select
      id="qr-target-page"
      name="targetPage"
      value={value}
      onChange={event => onChange(event.target.value)}
      className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-normal text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/30"
      aria-label={label}
    >
      {pages.map(page => <option key={page.id} value={page.isHome ? 'home' : page.slug}>{page.isHome ? homeLabel : page.title}</option>)}
    </select>
  </label>
);
