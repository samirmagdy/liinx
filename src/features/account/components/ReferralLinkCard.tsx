import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function ReferralLinkCard({ referralUrl, label, inputId, ar }: { referralUrl: string; label: string; inputId: string; ar: boolean }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      setError('');
    } catch {
      setError(ar ? 'تعذر نسخ الرابط. انسخه يدوياً.' : 'Could not copy the link. Select and copy it manually.');
    }
  };

  return <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
    <label htmlFor={inputId} className="mb-2 block text-xs font-semibold text-neutral-700">{label}</label>
    <div className="flex gap-2">
      <input id={inputId} readOnly value={referralUrl} dir="ltr" className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-700" />
      <button type="button" onClick={copyLink} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'نسخ' : 'Copy')}
      </button>
    </div>
    {error && <p role="status" className="mt-2 text-xs text-rose-700">{error}</p>}
  </div>;
}
