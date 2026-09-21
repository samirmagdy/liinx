import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { type DomainFinding } from '../../../hooks/useCustomDomainWizard';

/**
 * Certificate and resolver detail is a hosting-provider conversation, not a creator one, so it
 * stays behind a disclosure instead of sitting in the main path.
 */
export const DomainAdvancedDiagnostics: React.FC<{ host: string; target: string; finding: DomainFinding | null }> = ({
  host, target, finding
}) => {
  const { tr: ui } = useUiLanguage();

  return (
    <details className="domain-advanced rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold text-neutral-700">
        <span>{ui('Advanced diagnostics')}</span>
        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
      </summary>
      <div className="mt-3 space-y-3 text-xs leading-relaxed text-neutral-600">
        <p>
          {ui('Your hosting provider issues the HTTPS certificate for this host. RALOA serves the page once the certificate is in place, and never holds the private key for your domain.')}
        </p>
        <dl className="space-y-1 font-mono text-[11px]" dir="ltr">
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">{ui('Host')}</dt>
            <dd className="text-neutral-900">{host}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">{ui('Required CNAME target')}</dt>
            <dd className="text-neutral-900">{target}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">{ui('Records found')}</dt>
            <dd className="text-neutral-900">{finding?.foundTargets.length ? finding.foundTargets.join(', ') : ui('none')}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">{ui('Last check')}</dt>
            <dd className="text-neutral-900">{finding ? finding.state : ui('not checked yet')}</dd>
          </div>
        </dl>
      </div>
    </details>
  );
};
