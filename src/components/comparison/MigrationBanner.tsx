import React from 'react';
import { ArrowRight, Download } from 'lucide-react';
import { useLocation } from 'wouter';
import { useCapabilities } from '../../context/CapabilitiesContext';

export const MigrationBanner: React.FC<{ ar: boolean }> = ({ ar }) => {
  const { hasAnyImporter } = useCapabilities();
  const [, setLocation] = useLocation();

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white border border-indigo-300 flex items-center justify-center shrink-0 shadow-xs">
          <Download className="w-5 h-5 text-indigo-700" />
        </div>
        <div>
          <h3 className="font-bold text-base text-neutral-900">
            {ar ? 'هل تنتقل من Linktree أو Beacons؟' : 'Moving from Linktree or Beacons?'}
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed mt-1">
            {hasAnyImporter
              ? (ar ? 'أدخل اسم حسابك العام واستورد جميع روابطك خلال 60 ثانية بدون إعادة كتابة أي شيء.' : 'Enter your handle to preview and import all your public links in 60 seconds.')
              : (ar ? 'أنشئ صفحتك في دقائق مع سمات تصميم مخصصة، دون رسوم من RALOA على المبيعات أو الحجوزات التي يدير مزود خارجي مدفوعاتها، وتحكم كامل في علامتك التجارية.' : 'Set up your mini-site in minutes with custom themes, no RALOA fee on sales or bookings handled by external providers, and complete layout control.')}
          </p>
        </div>
      </div>
      <button
        onClick={() => setLocation(hasAnyImporter ? '/register?after=import' : '/register')}
        className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
      >
        <span>{hasAnyImporter ? (ar ? 'استيراد الروابط الآن' : 'Import your links') : (ar ? 'أنشئ صفحتك مجاناً' : 'Create your page')}</span>
        <ArrowRight className={`w-4 h-4 ${ar ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
