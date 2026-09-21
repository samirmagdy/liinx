import React from 'react';

/** Shared chrome for every Settings section, so cards stay one concern each. */
export const SettingsCard: React.FC<{ title: string; detail?: string; actions?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  detail,
  actions,
  children
}) => (
  <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-xs space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="font-bold text-sm text-neutral-900">{title}</h2>
        {detail && <p className="mt-0.5 text-xs text-neutral-500">{detail}</p>}
      </div>
      {actions}
    </div>
    {children}
  </section>
);
