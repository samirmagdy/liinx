import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const SkipLink: React.FC = () => {
  const { tr } = useLanguage();
  return (
    <a
      href="#main-content"
      className="sr-only min-h-11 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100]"
    >
      {tr('Skip to content')}
    </a>
  );
};
