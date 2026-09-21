import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';

export type DomainRecordRow = {
  /** Already localized by the caller, so the parity guard sees the literal. */
  label: string;
  value: string;
  field: string;
};

/**
 * The exact record to add. Each value is its own row with its own copy control because a
 * creator copies these into a DNS form one field at a time, and every one of them is Latin
 * text that must not be re-ordered by an Arabic page.
 */
export const DomainRecordsTable: React.FC<{
  rows: DomainRecordRow[];
  copiedField: string | null;
  onCopy: (field: string, value: string) => void;
}> = ({ rows, copiedField, onCopy }) => {
  const { tr: ui } = useUiLanguage();

  return (
    <div className="domain-records rounded-2xl border border-neutral-200 bg-white p-3 space-y-1.5">
      <h3 className="text-xs font-bold text-neutral-900">{ui('Add this record at your DNS provider')}</h3>
      <p className="text-xs leading-relaxed text-neutral-500">
        {ui('Cloudflare, GoDaddy, Namecheap and similar providers all have this form. It can take a few minutes to spread across the internet.')}
      </p>
      <dl className="divide-y divide-neutral-100">
        {rows.map(row => (
          <div key={row.field} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <dt className="text-[11px] font-mono font-bold uppercase tracking-caps text-neutral-500">{row.label}</dt>
              <dd className="truncate font-mono text-xs text-neutral-900" dir="ltr">{row.value}</dd>
            </div>
            <button
              type="button"
              onClick={() => onCopy(row.field, row.value)}
              aria-label={`${ui('Copy')} ${row.label}`}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-800 hover:border-neutral-900 transition-colors cursor-pointer"
            >
              {copiedField === row.field
                ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{copiedField === row.field ? ui('Copied!') : ui('Copy')}</span>
            </button>
          </div>
        ))}
      </dl>
    </div>
  );
};
