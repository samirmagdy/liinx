import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useCustomDomainWizard } from '../../../hooks/useCustomDomainWizard';
import { brand } from '../../../../../config/brand';
import { DomainRecordsTable, type DomainRecordRow } from './DomainRecordsTable';
import { DomainOutcome } from './DomainOutcome';
import { DomainAdvancedDiagnostics } from './DomainAdvancedDiagnostics';
import { DomainSaveFeedback } from './DomainSaveFeedback';

/** The three things connecting a domain actually takes, in the order they happen. */
const STEPS = ['Choose your address', 'Add the DNS record', 'Confirm it is live'] as const;

const StepList: React.FC<{ current: number }> = ({ current }) => {
  const { tr: ui } = useUiLanguage();
  return (
    <ol className="domain-steps flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono font-bold uppercase tracking-caps">
      {STEPS.map((step, index) => (
        <li
          key={step}
          aria-current={index === current ? 'step' : undefined}
          className={index === current ? 'text-neutral-900' : 'text-neutral-400'}
        >
          {index + 1}. {ui(step)}
        </li>
      ))}
    </ol>
  );
};

export const DomainWizard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    step,
    savedDomain,
    connected,
    customDomainInput,
    finding,
    isChecking,
    isSavingDomain,
    domainFeedback,
    copiedField,
    setHost,
    saveHost,
    checkNow,
    copyValue,
    editHost
  } = useCustomDomainWizard();
  const current = step === 'host' ? 0 : connected ? 2 : 1;
  const rows: DomainRecordRow[] = [
    { label: ui('Record type'), value: 'CNAME', field: 'type' },
    { label: ui('Host record'), value: savedDomain, field: 'host' },
    { label: ui('Points to'), value: brand.cnameTarget, field: 'target' }
  ];

  return (
    <div className="domain-wizard space-y-3">
      <StepList current={current} />

      {step === 'host' ? (
        <div className="space-y-2">
          <label htmlFor="settings-custom-domain" className="text-xs font-semibold text-neutral-800">
            {ui('Your domain or subdomain')}
            <input
              id="settings-custom-domain"
              name="customDomain"
              dir="ltr"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={customDomainInput}
              onChange={event => setHost(event.target.value)}
              placeholder="links.yourbrand.com"
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 font-mono text-xs text-neutral-900 focus:border-neutral-900 outline-none"
            />
          </label>
          <p className="text-xs leading-relaxed text-neutral-500">
            {ui('Use an address you control, such as links.yourbrand.com. We will show you the one record to add.')}
          </p>
          {domainFeedback && <DomainSaveFeedback feedback={domainFeedback} />}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isSavingDomain || !customDomainInput.trim()}
              onClick={() => void saveHost()}
              className="domain-save-host px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSavingDomain ? ui('Saving...') : ui('Continue to the DNS record')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="domain-saved-host min-w-0 truncate font-mono text-xs text-neutral-900" dir="ltr">{savedDomain}</span>
              <span className="domain-status whitespace-nowrap rounded-md border px-2 py-1 font-mono text-[11px] font-bold text-neutral-800 border-neutral-200 bg-neutral-100">
                {connected ? ui('DNS VERIFIED') : ui('SETUP REQUIRED')}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={isChecking}
                onClick={() => void checkNow()}
                className="domain-check-now min-h-11 rounded-xl border border-neutral-300 px-3 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 disabled:opacity-50 cursor-pointer"
              >
                {isChecking ? ui('Checking…') : ui('Check now')}
              </button>
              <button
                type="button"
                onClick={editHost}
                className="min-h-11 rounded-xl px-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                {connected ? ui('Use a different address') : ui('Edit address')}
              </button>
            </div>
          </div>

          <DomainRecordsTable rows={rows} copiedField={copiedField} onCopy={copyValue} />
          <DomainOutcome host={savedDomain} finding={finding} isChecking={isChecking} />
          <DomainAdvancedDiagnostics host={savedDomain} target={brand.cnameTarget} finding={finding} />
        </div>
      )}
    </div>
  );
};
