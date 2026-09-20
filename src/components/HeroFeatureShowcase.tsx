import React from 'react';
import { 
  Music, 
  Calendar, 
  Layers, 
  Globe
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
    <div className="w-full max-w-xl lg:max-w-2xl mt-8 pt-5 border-t border-neutral-200">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-neutral-800">
          {isRtl ? 'استكشف ميزات الصفحة' : 'Explore page features'}
        </span>
        <span className="text-xs text-neutral-500">
          {isRtl ? 'انقر للمعاينة الحية' : 'Click to preview on device'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        {HERO_FEATURE_BADGES.map((badge) => {
          const Icon = badge.icon;
          const isActive = selectedFeatureId === badge.id;

          return (
            <button
              key={badge.id}
              type="button"
              onClick={() => onSelectFeature(badge.id, badge.profileIndex)}
              className={`group text-start py-3 border-b border-neutral-200 transition-colors cursor-pointer flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                isActive
                  ? 'text-neutral-950'
                  : 'text-neutral-700 hover:text-neutral-950'
              }`}
            >
              <div className={`mt-0.5 shrink-0 ${
                  isActive 
                    ? 'text-amber-700'
                    : 'text-neutral-500 group-hover:text-neutral-800'
                }`}>
                  <Icon className="w-4 h-4" strokeWidth={1.8} />
                </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold leading-tight ${isActive ? 'text-neutral-950' : 'text-neutral-800'}`}>
                  {isRtl ? badge.labelAr : badge.labelEn}
                </p>
                <p className="text-xs text-neutral-500 mt-1 font-normal">
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
