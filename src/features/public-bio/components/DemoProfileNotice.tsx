import React from 'react';
import { findSystemDemoProfile } from '../../../../shared/index.js';
import { useLanguage } from '../../../context/LanguageContext';

export function DemoProfileNotice({ username }: { username: string }) {
  const { tr: ui } = useLanguage();
  if (!findSystemDemoProfile(username)) return null;

  return (
    <p role="note" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      {ui('Fictional sample profile. Names, metrics, and links are demonstration content, not customer data.')}
    </p>
  );
}
