import { useEffect, useState } from 'react';
import { BadgeDollarSign, Check, Copy, Users } from 'lucide-react';
import { api } from '../../../services/api';

type AgencyReferralData = Awaited<ReturnType<typeof api.agencyReferrals.get>>;

export function AgencyReferralPanel({ ar }: { ar: boolean }) {
  const [data, setData] = useState<AgencyReferralData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    api.agencyReferrals.get().then(setData).catch(() => setError(ar ? 'تعذر تحميل بيانات الإحالة.' : 'Could not load agency referral details.'));
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
  const money = (cents: number) => new Intl.NumberFormat(ar ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  return (
    <section className="space-y-5" aria-labelledby="agency-referrals-title">
      <div>
        <div className="flex items-center gap-2 text-amber-700"><BadgeDollarSign className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wide">{ar ? 'برنامج إحالة الوكالات' : 'Agency referral program'}</span></div>
        <h2 id="agency-referrals-title" className="mt-2 text-xl font-bold text-neutral-900">{ar ? 'اكسب رصيداً لحسابك مع كل وكالة جديدة' : 'Earn account credit for each new agency'}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
          {ar
            ? `تحصل على ${money(data.creditCents)} رصيداً عند اشتراك وكالة جديدة في Studio ودفع أول فاتورة. انتظر 30 يوماً بعد الدفع؛ ثم يُضاف الرصيد تلقائياً إذا كان اشتراكك في Studio نشطاً.`
            : `Earn ${money(data.creditCents)} when a new agency joins Studio and pays its first invoice. After a 30-day hold, credit is added automatically while your Studio subscription is active.`}
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <label htmlFor="agency-referral-url" className="mb-2 block text-xs font-semibold text-neutral-700">{ar ? 'رابط إحالة الوكالة' : 'Your agency referral link'}</label>
        <div className="flex gap-2">
          <input id="agency-referral-url" readOnly value={data.referralUrl} dir="ltr" className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-700" />
          <button type="button" onClick={copyLink} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'نسخ' : 'Copy')}
          </button>
        </div>
      </div>

      {data.requiresStudio && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
        {ar ? 'يُضاف الرصيد عند وجود اشتراك Studio نشط. ستظل إحالاتك المؤهلة معلّقة إلى أن يصبح اشتراكك نشطاً.' : 'Credits are issued to active Studio accounts. Qualified referrals remain pending until your Studio subscription is active.'}
      </p>}
      {!data.stripeConfigured && <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600">
        {ar ? 'تظهر الأرصدة وتُضاف بعد إعداد فوترة Stripe لحسابك.' : 'Credit balance and automatic credit issuance require your Stripe billing account.'}
      </p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-neutral-500"><Users className="h-4 w-4" /><span className="text-xs">{ar ? 'إحالات الوكالات' : 'Agency referrals'}</span></div>
          <p className="mt-2 text-2xl font-bold text-neutral-900">{data.creditedThisYear}<span className="text-base font-medium text-neutral-400"> / {data.cap}</span></p>
          <p className="mt-1 text-xs text-neutral-500">{ar ? 'أرصدة مُنحت خلال آخر 12 شهراً' : 'Credits issued in the last 12 months'}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-neutral-500"><BadgeDollarSign className="h-4 w-4" /><span className="text-xs">{ar ? 'رصيد Stripe المتاح' : 'Available Stripe balance'}</span></div>
          <p className="mt-2 text-2xl font-bold text-neutral-900">{money(data.availableCreditCents)}</p>
          <p className="mt-1 text-xs text-neutral-500">{ar ? 'يُطبّق على الفواتير التالية تلقائياً' : 'Applied automatically to upcoming invoices'}</p>
        </div>
      </div>

      {(data.awaitingStudioPayment > 0 || data.coolingOff > 0 || data.pending > 0) && <div className="rounded-2xl border border-neutral-200 p-4">
        <h3 className="text-sm font-semibold text-neutral-900">{ar ? 'حالة الإحالات' : 'Referral status'}</h3>
        <ul className="mt-3 space-y-2 text-xs text-neutral-600">
          {data.awaitingStudioPayment > 0 && <li>{ar ? `بانتظار أول فاتورة Studio: ${data.awaitingStudioPayment}` : `Waiting for first Studio payment: ${data.awaitingStudioPayment}`}</li>}
          {data.coolingOff > 0 && <li>{ar ? `فترة الانتظار 30 يوماً: ${data.coolingOff}` : `In the 30-day hold: ${data.coolingOff}`}</li>}
          {data.pending > data.coolingOff && <li>{ar ? `مؤهلة بانتظار إصدار الرصيد أو توفر حد الإحالات: ${data.pending - data.coolingOff}` : `Qualified, waiting for credit issuance or annual-cap availability: ${data.pending - data.coolingOff}`}</li>}
        </ul>
      </div>}

      <p className="text-xs leading-relaxed text-neutral-500">
        {ar
          ? `ثلاثة أرصدة كحد أقصى خلال أي 12 شهراً. يُطبّق رصيد ${money(data.creditCents)} تلقائياً على فاتورة Liinx مستقبلية عبر Stripe؛ لا قيمة نقدية له ولا يُسترد. تُحتسب الحسابات الجديدة بعد توثيق البريد، واشتراك Studio، ودفع أول فاتورة.`
          : `Maximum 3 credits in any 12-month period. Each ${money(data.creditCents)} credit is automatically applied to a future Liinx invoice through Stripe; it is non-cash and non-refundable. The referral must be a new account with verified email, an active Studio subscription, and a paid first invoice.`}
      </p>
      {error && <p role="status" className="text-xs text-rose-700">{error}</p>}
    </section>
  );
}
