import { ArrowRight, Check, Copy, Sparkles } from 'lucide-react';
import type { DeveloperSettingsPanelProps } from './accountPanelTypes';

export function DeveloperSettingsPanel(props: DeveloperSettingsPanelProps) {
  const { ar, currentPlan } = props;
  return (
    <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-6 text-start">
      <div className="border-b border-neutral-100 pb-4">
        <h2 className="text-base font-bold text-neutral-900">{ar ? 'واجهة البرمجة ومفاتيح API' : 'REST API v1 Access'}</h2>
        <p className="text-xs text-neutral-500 mt-0.5">{ar ? 'أتمتة تحديث الروابط ونشر المحتوى برمجياً.' : 'Manage headless API keys for programmatic publishing and link synchronization.'}</p>
      </div>
      {currentPlan !== 'studio' ? (
        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900"><Sparkles className="w-4 h-4 text-amber-600" /><span>{ar ? 'ميزة حصرية لخطة Studio' : 'Exclusive to Studio Plan'}</span></div>
          <p className="text-xs text-amber-800 leading-relaxed">{ar ? 'تتطلب واجهة REST API v1 الترقية إلى خطة Studio لتوليد مفاتيح تشغيل مؤتمتة.' : 'Public REST API keys are available exclusively on the Studio tier. Upgrade your account to unlock headless CMS and CI/CD pipelines.'}</p>
          <button onClick={() => props.setLocation('/pricing')} className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer inline-flex items-center gap-1.5">
            <span>{ar ? 'ترقية إلى Studio' : 'Upgrade to Studio'}</span><ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={props.createApiKey} className="flex gap-2 max-w-md">
            <input type="text" placeholder={ar ? 'اسم المفتاح (مثال: GitHub Action)' : 'Key name (e.g. Website Sync)'} value={props.newKeyName} onChange={event => props.setNewKeyName(event.target.value)} className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900/20" />
            <button type="submit" disabled={props.keyLoading || !props.newKeyName.trim()} className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer disabled:opacity-50">
              {props.keyLoading ? '...' : (ar ? 'إنشاء مفتاح' : 'Create Key')}
            </button>
          </form>
          {props.generatedKey && (
            <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-2 font-mono text-xs">
              <p className="text-amber-400 font-bold">{ar ? 'انسخ مفتاحك الآن (لن يظهر مجدداً):' : 'Copy your API key now (it will never be displayed again):'}</p>
              <div className="flex items-center justify-between gap-2 p-2 bg-neutral-800 rounded-xl">
                <code className="text-[11px] truncate">{props.generatedKey}</code>
                <button onClick={props.copyGeneratedKey} className="p-1.5 hover:bg-neutral-700 rounded-lg text-neutral-300 hover:text-white">
                  {props.copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-neutral-700 uppercase font-mono">{ar ? 'المفاتيح النشطة' : 'Active Keys'}</h3>
            {props.apiKeys.length === 0 ? <p className="text-xs text-neutral-400">{ar ? 'لا توجد مفاتيح نشطة حالياً.' : 'No active API keys created yet.'}</p> : (
              <div className="divide-y divide-neutral-100">
                {props.apiKeys.map(key => (
                  <div key={key.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div><p className="text-xs font-bold text-neutral-900">{key.name}</p><p className="text-[11px] font-mono text-neutral-400">{key.prefix}</p></div>
                    <button onClick={() => props.revokeApiKey(key.id)} className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer">{ar ? 'إلغاء المفتاح' : 'Revoke'}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
