import { useEffect, useState } from 'react';
import { Check, Copy, Gift, Users } from 'lucide-react';
import { api } from '../../../services/api';

type ReferralData = Awaited<ReturnType<typeof api.referrals.get>>;

export function ReferralPanel({ ar }: { ar: boolean }) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    api.referrals.get().then(setData).catch(() => setError(ar ? 'تعذر تحميل بيانات الإحالة.' : 'Could not load referral details.'));
  }, [ar]);

  const copyLink = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.referralUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(ar ? 'تعذر نسخ الرابط. انسخه يدوياً.' : 'Could not copy the link. Select and copy it manually.');
    }
  };

  if (!data && !error) return <div className="animate-pulse h-36 rounded-2xl bg-neutral-100" />;
  if (error && !data) return <p role="alert" className="text-sm text-rose-700">{error}</p>;
  if (!data) return null;
  const progress = Math.min(data.qualified, data.required);
  const rewardDate = data.rewardUntil ? new Date(data.rewardUntil).toLocaleDateString(ar ? 'ar-SA' : 'en', { dateStyle: 'medium' }) : null;

  return (
    <section className="space-y-5" aria-labelledby="referrals-title">
      <div>
        <div className="flex items-center gap-2 text-amber-700"><Gift className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wide">{ar ? 'دعوة المبدعين' : 'Creator referrals'}</span></div>
        <h2 id="referrals-title" className="mt-2 text-xl font-bold text-neutral-900">{ar ? 'شارك Liinx واحصل على Pro لمدة 90 يوماً' : 'Share Liinx. Earn 90 days of Pro.'}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
          {ar
            ? 'شارك رابطك. تُحتسب الدعوة بعد إنشاء حساب جديد والتحقق من بريده الإلكتروني. عند اكتمال ثلاث دعوات، تحصل الحسابات المجانية على Pro لمدة 90 يوماً.'
            : 'Share your link. A referral counts after a new account is created and its email is verified. After 3 qualified referrals, free accounts receive Pro for 90 days.'}
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <label htmlFor="creator-referral-url" className="mb-2 block text-xs font-semibold text-neutral-700">{ar ? 'رابط الدعوة الخاص بك' : 'Your referral link'}</label>
        <div className="flex gap-2">
          <input id="creator-referral-url" readOnly value={data.referralUrl} dir="ltr" className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-700" />
          <button type="button" onClick={copyLink} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'نسخ' : 'Copy')}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-neutral-500"><Users className="h-4 w-4" /><span className="text-xs">{ar ? 'دعوات تم التحقق منها' : 'Verified referrals'}</span></div>
          <p className="mt-2 text-2xl font-bold text-neutral-900">{progress}<span className="text-base font-medium text-neutral-400"> / {data.required}</span></p>
          <p className="mt-1 text-xs text-neutral-500">{ar ? `إجمالي التسجيلات عبر رابطك: ${data.total}` : `Total signups through your link: ${data.total}`}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-neutral-500"><Gift className="h-4 w-4" /><span className="text-xs">{ar ? 'مكافأة Pro' : 'Pro reward'}</span></div>
          <p className="mt-2 text-sm font-semibold text-neutral-900">
            {rewardDate
              ? (ar ? `مفعّل حتى ${rewardDate}` : `Active until ${rewardDate}`)
              : data.rewardEligible
                ? (ar ? `${progress} من ${data.required} دعوات مؤهلة` : `${progress} of ${data.required} qualified referrals`)
                : (ar ? 'مكافأة الإحالة متاحة للحسابات المجانية' : 'Referral Pro rewards apply to free accounts')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">{ar ? 'تُحتسب الحسابات الجديدة فقط، ومرة واحدة لكل حساب.' : 'New accounts only. Each referred account counts once.'}</p>
        </div>
      </div>
      {error && <p role="status" className="text-xs text-rose-700">{error}</p>}
    </section>
  );
}
