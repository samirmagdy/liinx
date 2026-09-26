import React from 'react';
import { ArrowUpRight, BarChart3, CalendarDays, FileText, Link2, Mail, Music2, PenLine, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { trackMarketingEvent } from '../services/marketingEvents';

const TOUCHPOINTS = [
  { icon: PenLine, en: 'Posts & projects', ar: 'المنشورات والمشاريع', detailEn: 'The work people ask you about', detailAr: 'الأعمال التي يسأل عنها جمهورك' },
  { icon: Music2, en: 'Releases & media', ar: 'الإصدارات والوسائط', detailEn: 'The things you want them to hear', detailAr: 'ما تريدهم أن يسمعوه' },
  { icon: CalendarDays, en: 'Bookings', ar: 'الحجوزات', detailEn: 'The next step beyond a like', detailAr: 'الخطوة التالية بعد الإعجاب' },
  { icon: Mail, en: 'Newsletter', ar: 'النشرة البريدية', detailEn: 'The relationship you keep', detailAr: 'العلاقة التي تحافظ عليها' }
] as const;

const JOBS = [
  { icon: Link2, en: 'Publish', ar: 'انشر', bodyEn: 'Give every link, profile, product, and booking one dependable address.', bodyAr: 'امنح كل رابط وحساب ومنتج وحجز عنواناً واحداً يمكن الاعتماد عليه.' },
  { icon: Sparkles, en: 'Present', ar: 'قدّم', bodyEn: 'Start from a real design system instead of an empty block editor.', bodyAr: 'ابدأ من نظام تصميم حقيقي بدلاً من محرر عناصر فارغ.' },
  { icon: Mail, en: 'Capture', ar: 'اجمع', bodyEn: 'Turn visits into newsletter subscribers and useful form answers.', bodyAr: 'حوّل الزيارات إلى مشتركين وإجابات مفيدة من النماذج.' },
  { icon: BarChart3, en: 'Measure', ar: 'قِس', bodyEn: 'See what people open, where they came from, and what deserves more attention.', bodyAr: 'اعرف ما يفتحه الناس ومن أين جاؤوا وما يستحق مزيداً من الاهتمام.' },
  { icon: FileText, en: 'Own the destination', ar: 'امتلك وجهتك', bodyEn: 'Build a page under your name, with custom domains when you are ready.', bodyAr: 'أنشئ صفحة باسمك مع نطاق مخصص عندما تكون مستعداً.' }
] as const;

const SEGMENTS = [
  { id: 'creator', en: 'Creators', ar: 'المبدعون', bodyEn: 'Turn your next post into a path to everything you make.', bodyAr: 'حوّل منشورك القادم إلى طريق لكل ما تصنعه.' },
  { id: 'business', en: 'Small businesses', ar: 'المشاريع الصغيرة', bodyEn: 'Put offers, contact, bookings, and proof behind one address.', bodyAr: 'اجمع العروض وبيانات التواصل والحجوزات والإثبات في عنوان واحد.' },
  { id: 'agency', en: 'Agencies', ar: 'الوكالات', bodyEn: 'Create polished starting points you can hand off and measure.', bodyAr: 'أنشئ نقاط بداية أنيقة يمكنك تسليمها وقياسها.' },
  { id: 'artist', en: 'Artists & musicians', ar: 'الفنانون والموسيقيون', bodyEn: 'Make releases, shows, press links, and mailing lists feel like one world.', bodyAr: 'اجعل الإصدارات والعروض والروابط الصحفية والقوائم البريدية عالماً واحداً.' }
] as const;

export function TouchpointConvergenceSection() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  return (
    <section className="creator-landing-convergence" aria-labelledby="convergence-title">
      <div className="creator-landing-container creator-landing-convergence-grid">
        <div className="creator-landing-copy">
          <p className="creator-landing-kicker">{ar ? 'المشكلة' : 'The problem'}</p>
          <h2 id="convergence-title">{ar ? 'جمهورك موزّع. وجهتك لا يجب أن تكون كذلك.' : 'Your audience is scattered. Your destination should not be.'}</h2>
          <p>{ar ? 'يبدأ الناس من منشور أو إصدار أو رسالة أو رابط حجز. اجمع كل نقطة تواصل في صفحة واحدة تتحدث بصوتك.' : 'People start from a post, a release, a message, or a booking link. Bring every touchpoint into one page that sounds like you.'}</p>
          <a href="#creator-jobs" className="creator-landing-text-link">{ar ? 'شاهد كيف تعمل' : 'See how it works'} <ArrowUpRight aria-hidden="true" /></a>
        </div>

        <figure className="creator-landing-convergence-visual" aria-labelledby="convergence-visual-caption">
          <figcaption id="convergence-visual-caption" className="sr-only">{ar ? 'نقاط التواصل تتحول إلى صفحة RALOA واحدة' : 'Touchpoints converging into one RALOA page'}</figcaption>
          <div className="creator-landing-touchpoints">
            {TOUCHPOINTS.map(({ icon: Icon, en, ar: arLabel, detailEn, detailAr }) => (
              <div key={en} className="creator-landing-touchpoint">
                <span className="creator-landing-touchpoint-icon"><Icon aria-hidden="true" /></span>
                <span><strong>{ar ? arLabel : en}</strong><small>{ar ? detailAr : detailEn}</small></span>
              </div>
            ))}
          </div>
          <div className="creator-landing-convergence-line" aria-hidden="true" />
          <div className="creator-landing-destination">
            <span className="creator-landing-destination-mark">R</span>
            <div><strong>raloa.app/@{ar ? 'اسمك' : 'yourname'}</strong><small>{ar ? 'صفحتك الحية' : 'your live page'}</small></div>
            <Link2 aria-hidden="true" />
          </div>
        </figure>
      </div>
    </section>
  );
}

export function CreatorJobsSection() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  return (
    <section className="creator-landing-jobs" id="creator-jobs" aria-labelledby="creator-jobs-title">
      <span id="how-it-works" className="creator-landing-anchor-alias" aria-hidden="true" />
      <div className="creator-landing-container creator-landing-jobs-grid">
        <div className="creator-landing-jobs-intro">
          <p className="creator-landing-kicker">{ar ? 'ما الذي تبنيه' : 'What you build'}</p>
          <h2 id="creator-jobs-title">{ar ? 'صفحة تعمل مثل بيتك الرقمي.' : 'A page that works like your digital home.'}</h2>
          <p>{ar ? 'ليست قائمة روابط أخرى. إنها وجهة تملكها وتحدّثها وتتعلم منها.' : 'Not another list of links. A destination you own, update, and learn from.'}</p>
        </div>
        <ol className="creator-landing-jobs-list">
          {JOBS.map(({ icon: Icon, en, ar: arLabel, bodyEn, bodyAr }, index) => (
            <li key={en}>
              <span className="creator-landing-job-number">0{index + 1}</span>
              <span className="creator-landing-job-icon"><Icon aria-hidden="true" /></span>
              <span className="creator-landing-job-copy"><strong>{ar ? arLabel : en}</strong><span>{ar ? bodyAr : bodyEn}</span></span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function CreatorSegmentsSection() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  return (
    <section className="creator-landing-segments" aria-labelledby="creator-segments-title">
      <div className="creator-landing-container">
        <div className="creator-landing-segments-heading">
          <div><p className="creator-landing-kicker">{ar ? 'ابدأ من مكانك' : 'Start where you are'}</p><h2 id="creator-segments-title">{ar ? 'نفس النظام. طرق مختلفة لصنع الزخم.' : 'The same system. Different ways to build momentum.'}</h2></div>
          <p>{ar ? 'المبدعون أولاً، مع مساحة للمشاريع والوكالات والفنانين.' : 'Creators first, with room for businesses, agencies, and artists.'}</p>
        </div>
        <div className="creator-landing-segment-list">
          {SEGMENTS.map(({ id, en, ar: arLabel, bodyEn, bodyAr }) => (
            <a key={id} href={ar ? '/ar/register' : '/register'} onClick={() => void trackMarketingEvent({ event: 'segment_selected', language: lang, segment: id })}>
              <span><strong>{ar ? arLabel : en}</strong><small>{ar ? bodyAr : bodyEn}</small></span><ArrowUpRight aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
