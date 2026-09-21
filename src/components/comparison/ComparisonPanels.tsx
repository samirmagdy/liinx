import React from 'react';
import { Sparkles } from 'lucide-react';
import { ComparisonFeatureList } from './ComparisonFeatureList';
import { RaloaMockup } from './RaloaMockup';
import { basicListPoints, raloaPoints } from './comparisonContent';

interface ComparisonPanelProps {
  ar: boolean;
  hidden: boolean;
}

export const LinkListPanel: React.FC<ComparisonPanelProps> = ({ ar, hidden }) => (
  <div
    className={`rounded-3xl border border-neutral-300 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all ${
      hidden ? 'hidden md:flex' : 'flex'
    }`}
  >
    <div>
      <div className="flex items-center justify-between pb-5 border-b border-neutral-200 mb-6">
        <div className="flex items-center gap-2.5">
          <div aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-600">
            ✕
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-800">
              {ar ? 'قائمة الروابط البسيطة' : 'Basic link list'}
            </h3>
            <p className="text-xs text-neutral-500">
              {ar ? 'قائمة أزرار مسطحة بصفحة واحدة وتحديث يدوي' : 'Flat button list, single scroll, manual updates'}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-mono">
          {ar ? 'بسيط' : 'Basic'}
        </span>
      </div>

      {/* Mockup Preview: Plain link list style */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-100/60 p-5 space-y-3 mb-6 max-w-sm mx-auto">
        <div className="text-center pb-2">
          <div className="w-14 h-14 rounded-full bg-neutral-300 mx-auto mb-2" />
          <div className="h-3 w-28 bg-neutral-300 rounded-full mx-auto mb-1.5" />
          <div className="h-2.5 w-44 bg-neutral-200 rounded-full mx-auto" />
        </div>

        <div className="p-3 bg-white border border-neutral-200 rounded-xl text-center text-xs font-medium text-neutral-700 shadow-xs opacity-80">
          {ar ? 'أزرار توجيه مسطحة' : 'Flat destination buttons'}
        </div>
        <div className="p-3 bg-white border border-neutral-200 rounded-xl text-center text-xs font-medium text-neutral-700 shadow-xs opacity-80">
          {ar ? 'صفحة تمرير واحدة' : 'Single scrolling page'}
        </div>
        <div className="p-3 bg-white border border-neutral-200 rounded-xl text-center text-xs font-medium text-neutral-700 shadow-xs opacity-80">
          {ar ? 'رابط نطاق فرعي للمنصة' : 'Platform URL (subdomain)'}
        </div>

        <div className="text-center pt-2">
          <span className="font-mono text-xs text-neutral-600">
            {ar ? 'تخصيص بصري أساسي وتحديثات يدوية' : 'Basic visual styling • Manual content updates'}
          </span>
        </div>
      </div>

      <ComparisonFeatureList points={basicListPoints(ar)} tone="missing" />
    </div>
  </div>
);

export const RaloaPanel: React.FC<ComparisonPanelProps> = ({ ar, hidden }) => (
  <div
    className={`rounded-3xl border-2 border-neutral-900 bg-white p-5 sm:p-6 shadow-xl flex flex-col justify-between relative transition-all ${
      hidden ? 'hidden md:flex' : 'flex'
    }`}
  >
    <div className="absolute -top-3.5 left-8 px-3.5 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-bold tracking-caps uppercase flex items-center gap-1.5 shadow-md">
      <Sparkles className="w-3 h-3 text-indigo-400" />
      <span>{ar ? 'تجربة RALOA الفائقة' : 'RALOA Mini-Website'}</span>
    </div>

    <div>
      <div className="flex items-center justify-between pb-5 border-b border-neutral-200 mb-6 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xs font-bold">
            ✓
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              {ar ? 'موقعك المصغر على RALOA' : 'Your RALOA Mini-Website'}
            </h3>
            <p className="text-xs text-neutral-500">
              {ar ? 'تصميم متكامل، وسائط مدمجة، وحرية مطلقة' : 'Rich inline media, folders, scheduling & custom domain'}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-200">
          {ar ? 'هوية مستقلة' : 'Branded'}
        </span>
      </div>

      <RaloaMockup />

      <ComparisonFeatureList points={raloaPoints(ar)} tone="available" />
    </div>
  </div>
);
