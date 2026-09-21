import React, { useState } from 'react';
import { brand } from '../config/brand';
import { useUsernameAvailability } from '../hooks/useUsernameAvailability';
import { ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';

interface HeroClaimFormProps {
  isRtl: boolean;
  placeholder: string;
  createLabel: string;
  onClaimUsername: (handle: string) => void;
  onFallbackRedirect: () => void;
}

function ClaimStatusBadge({ status, reason, isRtl }: { status: string; reason: string | null; isRtl: boolean }) {
  if (status === 'checking') {
    return <Loader2 className="w-4 h-4 text-neutral-500 animate-spin shrink-0" />;
  }
  if (status === 'available') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
        <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
        <span>{isRtl ? 'متاح' : 'Available'}</span>
      </span>
    );
  }
  if (status === 'taken' || status === 'invalid') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
        <AlertCircle className="w-3 h-3 text-amber-600" />
        <span>{reason}</span>
      </span>
    );
  }
  return null;
}

export const HeroClaimForm: React.FC<HeroClaimFormProps> = ({
  isRtl,
  placeholder,
  createLabel,
  onClaimUsername,
  onFallbackRedirect
}) => {
  const [handle, setHandle] = useState('');
  const { status, reason } = useUsernameAvailability(handle, isRtl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = handle.trim().toLowerCase();
    if (clean) {
      onClaimUsername(clean);
    } else {
      onFallbackRedirect();
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="p-1.5 sm:p-2 bg-neutral-50 rounded-2xl sm:rounded-full border border-neutral-300 shadow-[0_10px_30px_rgba(24,24,23,0.04)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 focus-within:border-neutral-900 transition-colors"
      >
        <div className="flex items-center min-w-0 px-3 sm:px-4 py-2 sm:py-1 flex-1" dir="ltr">
          <span className="text-neutral-500 font-mono text-sm sm:text-base font-semibold select-none shrink-0">
            {brand.domain}/@
          </span>
          <input
            id="hero-claim-input"
            type="text"
            name="username"
            autoComplete="username"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder={placeholder}
            className="hero-claim-input w-full min-w-0 pl-1.5 pr-2 font-mono text-sm sm:text-base font-bold text-neutral-900 placeholder:text-neutral-500 bg-transparent"
            spellCheck={false}
            aria-label={`Claim your ${brand.productShortName} handle`}
            aria-describedby="hero-claim-status"
          />

          <span id="hero-claim-status" className="contents" aria-live="polite">
            <ClaimStatusBadge status={status} reason={reason} isRtl={isRtl} />
          </span>
        </div>

        <button
          id="hero-claim-btn"
          type="submit"
          className="min-h-[44px] px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-full bg-neutral-900 hover:bg-black text-white text-sm font-bold tracking-tight transition-colors active:scale-[0.985] flex items-center justify-center gap-2 cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <span>{createLabel}</span>
          <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
        </button>
      </form>
    </div>
  );
};
