import React from 'react';
import { AlertTriangle, Loader2, CircleCheck, CircleAlert } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { type DomainFinding } from '../../../hooks/useCustomDomainWizard';

const TONE: Record<DomainFinding['state'] | 'awaiting', { box: string; Icon: typeof Loader2 }> = {
  verified: { box: 'bg-emerald-50 text-emerald-900 border-emerald-200', Icon: CircleCheck },
  awaiting: { box: 'bg-neutral-50 text-neutral-800 border-neutral-200', Icon: Loader2 },
  'no-record': { box: 'bg-amber-50 text-amber-900 border-amber-200', Icon: CircleAlert },
  'pointing-elsewhere': { box: 'bg-amber-50 text-amber-900 border-amber-200', Icon: CircleAlert },
  'lookup-unavailable': { box: 'bg-neutral-50 text-neutral-800 border-neutral-200', Icon: AlertTriangle }
};

/**
 * One sentence per outcome, in the words a creator would use back to their DNS provider. The
 * host and the addresses found are Latin data inside sentences that may be Arabic, so each one
 * is isolated from the surrounding text direction.
 */
export const DomainOutcome: React.FC<{ host: string; finding: DomainFinding | null; isChecking: boolean }> = ({
  host, finding, isChecking
}) => {
  const { tr: ui } = useUiLanguage();
  const state = finding?.state ?? 'awaiting';
  const { box, Icon } = TONE[state];
  const found = (finding?.foundTargets ?? []).join(', ');

  return (
    <div className={`domain-outcome flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed ${box}`} role="status" aria-live="polite">
      <Icon className={`mt-0.5 w-4 h-4 shrink-0 ${state === 'awaiting' ? 'animate-spin' : ''}`} aria-hidden="true" />
      <p className="min-w-0">
        {state === 'verified' && (
          <>{ui('Connected. Visitors reach your site at')} <bdi className="font-mono">{host}</bdi>.</>
        )}
        {state === 'awaiting' && (
          <>{ui('Waiting for DNS. We check again every few seconds.')}</>
        )}
        {state === 'no-record' && (
          <>{ui('No CNAME record was found for')} <bdi className="font-mono">{host}</bdi>. {ui('Add the record above and we will check again automatically.')}</>
        )}
        {state === 'pointing-elsewhere' && (
          <>{ui('This host currently points to')} <bdi className="font-mono">{found}</bdi>. {ui('Change it to the value shown above.')}</>
        )}
        {state === 'lookup-unavailable' && (
          <>{ui('We could not read DNS for')} <bdi className="font-mono">{host}</bdi> {ui('just now. This is our side, not yours — we will keep checking.')}</>
        )}
        {isChecking && state !== 'awaiting' && <span className="sr-only">{ui('Checking…')}</span>}
      </p>
    </div>
  );
};
