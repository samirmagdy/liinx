import React from 'react';
import { ArrowUpRight, BriefcaseBusiness, Mic2, Sparkles, UsersRound } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { trackMarketingEvent } from '../services/marketingEvents';

const PATHS = [
  { id: 'creator', icon: Sparkles, title: ['Creators', 'المبدعون'], body: ['Turn every post, project, and platform into one place your audience can remember.', 'حوّل كل منشور ومشروع ومنصة إلى مكان واحد يتذكره جمهورك.'] },
  { id: 'business', icon: BriefcaseBusiness, title: ['Small businesses', 'المشاريع الصغيرة'], body: ['Put your offers, bookings, contact details, and proof behind one trusted address.', 'اجمع عروضك وحجوزاتك وبيانات التواصل في عنوان موثوق واحد.'] },
  { id: 'agency', icon: UsersRound, title: ['Agencies', 'الوكالات'], body: ['Give each client a polished starting point you can hand off, duplicate, and measure.', 'امنح كل عميل نقطة بداية أنيقة يمكنك تسليمها ونسخها وقياسها.'] },
  { id: 'artist', icon: Mic2, title: ['Artists and musicians', 'الفنانون والموسيقيون'], body: ['Make releases, shows, press links, and mailing lists feel like one world.', 'اجعل الإصدارات والعروض والروابط الصحفية والقوائم البريدية عالماً واحداً.'] }
] as const;

export function AudiencePathsSection() {
  const { lang } = useLanguage();
  return (
    <section className="raloa-audience-paths marketing-section border-b border-neutral-200 bg-neutral-950 text-white">
      <div className="raloa-container">
        <div className="raloa-audience-intro">
          <p className="raloa-eyebrow text-cyan-300">{lang === 'ar' ? 'مصمم لطريقتك في الإبداع' : 'Built for the way you already create'}</p>
          <h2>{lang === 'ar' ? 'صفحة واحدة. أربعة أنواع من الزخم.' : 'One page. Four kinds of momentum.'}</h2>
          <p>{lang === 'ar' ? 'ابدأ بالجزء الذي يحتاج جمهورك إلى العثور عليه أولاً. يمنحك الاستوديو النظام الهادئ نفسه في كل خطوة.' : 'Start with the part of your work people need to find first. The Studio gives you the same calm system underneath.'}</p>
        </div>
        <div className="raloa-audience-list">
          {PATHS.map(({ id, icon: Icon, title, body }) => (
            <a
              key={id}
              href={lang === 'ar' ? '/ar/register' : '/register'}
              className="raloa-audience-item"
              onClick={() => void trackMarketingEvent({ event: 'segment_selected', language: lang, segment: id })}
            >
              <span className="raloa-audience-icon"><Icon aria-hidden="true" /></span>
              <span className="raloa-audience-copy"><strong>{title[lang === 'ar' ? 1 : 0]}</strong><span>{body[lang === 'ar' ? 1 : 0]}</span></span>
              <ArrowUpRight aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
