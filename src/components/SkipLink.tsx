import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const SkipLink: React.FC = () => {
  const { tr } = useLanguage();
  return (
    <a
      href="#main-content"
      className="fixed start-4 top-4 z-[100] inline-flex min-h-11 -translate-y-[220%] items-center rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white shadow-lg transition-transform duration-150 focus:translate-y-0"
    >
      {tr('Skip to content')}
    </a>
  );
};
