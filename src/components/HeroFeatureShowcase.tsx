import React from 'react';
import { 
  Music, 
  Calendar, 
  Layers, 
  Globe, 
  Sparkles 
} from 'lucide-react';

export interface HeroFeatureBadge {
  id: string;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  icon: React.ComponentType<{ className?: string }>;
  profileIndex: number; // Links to Elena (0), Mateo (1), STUDIO (2), Dr. (3)
}

export const HERO_FEATURE_BADGES: HeroFeatureBadge[] = [
  {
    id: 'audio',
    labelEn: 'Inline Audio Player',
    labelAr: 'مشغل صوتيات مدمج',
    descEn: 'Play Spotify tracks & podcasts without leaving your page',
    descAr: 'تشغيل ملفات Spotify دون مغادرة الصفحة',
    icon: Music,
    profileIndex: 0 // Elena has Architectural Echoes Spotify embed
  },
  {
    id: 'booking',
    labelEn: 'Direct Scheduling',
    labelAr: 'حجز مواعيد واستشارات',
    descEn: 'Seamless Calendly integration for instant client calls',
    descAr: 'دمج تقويم Calendly للحجز الفوري دون وسيط',
    icon: Calendar,
    profileIndex: 3 // Dr. / Consultant has booking
  },
  {
    id: 'folders',
    labelEn: 'Accordion Folders',
    labelAr: 'مجلدات قابلة للطي',
    descEn: 'Organize dozens of links cleanly without visual clutter',
    descAr: 'تنظيم الروابط المتعددة داخل مجلدات أنيقة',
    icon: Layers,
    profileIndex: 0 // Elena has Lightroom Presets folder
  },
  {
    id: 'domain',
    labelEn: 'Custom Domain & CNAME',
    labelAr: 'نطاق مخصص وDNS',
    descEn: 'Attach your personal domain like links.yourbrand.com',
    descAr: 'ربط نطاقك الشخصي مثل links.yourbrand.com',
    icon: Globe,
    profileIndex: 2 // STUDIO / Brand profile
  }
];

interface HeroFeatureShowcaseProps {
  isRtl: boolean;
  selectedFeatureId: string | null;
  onSelectFeature: (featureId: string, profileIndex: number) => void;
}

export const HeroFeatureShowcase: React.FC<HeroFeatureShowcaseProps> = ({
  isRtl,
  selectedFeatureId,
  onSelectFeature
}) => {
  return (
    <div className="w-full max-w-xl lg:max-w-2xl mt-8 pt-6 border-t border-neutral-200/70">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{isRtl ? 'قدرات متقدمة مدمجة' : 'Native Building Blocks'}</span>
        </span>
        <span className="text-[11px] text-neutral-400 font-medium">
          {isRtl ? 'انقر للمعاينة الحية' : 'Click to preview on device'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {HERO_FEATURE_BADGES.map((badge) => {
          const Icon = badge.icon;
          const isActive = selectedFeatureId === badge.id;

          return (
            <button
              key={badge.id}
              type="button"
              onClick={() => onSelectFeature(badge.id, badge.profileIndex)}
              className={`group text-start p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                isActive
                  ? 'bg-white border-neutral-900 shadow-xs ring-1 ring-neutral-900/10'
                  : 'bg-white/60 hover:bg-white border-neutral-200/80 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                  isActive 
                    ? 'bg-neutral-900 text-white' 
                    : 'bg-neutral-100 text-neutral-700 group-hover:bg-neutral-200/70'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <div>
                <p className={`text-xs font-bold leading-tight ${isActive ? 'text-neutral-900' : 'text-neutral-800'}`}>
                  {isRtl ? badge.labelAr : badge.labelEn}
                </p>
                <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5 font-normal">
                  {isRtl ? badge.descAr : badge.descEn}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
