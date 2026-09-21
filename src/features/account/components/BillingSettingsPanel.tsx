import { ExternalLink, Sparkles } from 'lucide-react';
import { entitlementsFor } from '../../../config/plans';
import type { BillingSettingsPanelProps } from './accountPanelTypes';

export function BillingSettingsPanel({ ar, currentPlan, profilesCount, hasActiveSubscription, setLocation, openBillingPortal }: BillingSettingsPanelProps) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-6 text-start">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900">{ar ? 'الخطة والاشتراك' : 'Subscription & Quotas'}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">{ar ? 'إدارة مستوى اشتراكك وحدود الحساب.' : 'Manage your current plan entitlement and account limits.'}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-caps font-mono bg-neutral-100 text-neutral-900 border border-neutral-200">{currentPlan}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60">
          <p className="text-xs text-neutral-500 font-medium">{ar ? 'الملفات المتاحة' : 'Profile Limit'}</p>
          <p className="text-xl font-bold text-neutral-900 font-mono mt-1">{entitlementsFor(currentPlan).maxProfiles}</p>
          <p className="text-xs text-neutral-600 mt-0.5">{profilesCount} {ar ? 'مستخدمة حالياً' : 'currently active'}</p>
        </div>
        <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60">
          <p className="text-xs text-neutral-500 font-medium">{ar ? 'النطاقات المخصصة' : 'Custom Domains'}</p>
          <p className="text-xl font-bold text-neutral-900 font-mono mt-1">{currentPlan === 'free' ? (ar ? 'غير متاح' : 'None') : (ar ? 'مشمول' : 'Included')}</p>
          <p className="text-xs text-neutral-600 mt-0.5">{ar ? 'إرشادات DNS، ويلزم إعداد TLS لدى مزوّد الاستضافة' : 'DNS setup guidance; TLS must be configured by your host'}</p>
        </div>
        <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60">
          <p className="text-xs text-neutral-500 font-medium">{ar ? 'واجهة REST API' : 'REST API v1'}</p>
          <p className="text-xl font-bold text-neutral-900 font-mono mt-1">{currentPlan === 'studio' ? (ar ? 'مفعل' : 'Active') : (ar ? 'خطة Studio فقط' : 'Studio only')}</p>
          <p className="text-xs text-neutral-600 mt-0.5">{ar ? 'قراءة بيانات الملف وإضافة كتل الروابط أو حذفها' : 'Read profile data and create or delete link blocks'}</p>
        </div>
      </div>
      <div className="pt-2 flex flex-wrap items-center gap-3">
        <button onClick={() => setLocation('/pricing')} className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{currentPlan === 'free' ? (ar ? 'ترقية الخطة' : 'Upgrade Plan') : (ar ? 'تغيير الخطة' : 'Change Plan')}</span>
        </button>
        {hasActiveSubscription && (
          <button onClick={openBillingPortal} className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-800 text-xs font-semibold hover:bg-neutral-50 transition-colors cursor-pointer flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
            <span>{ar ? 'بوابة فواتير Stripe' : 'Manage on Stripe'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
