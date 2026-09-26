import React, { useMemo, useState } from 'react';
import { BarChart3, Check, Mail, Smartphone } from 'lucide-react';
import { Link } from 'wouter';
import { PhonePreview } from './PhonePreview';
import { DEMO_PROFILES } from '../demo/demoProfiles';
import { ARABIC_DEMO_PROFILES } from '../demo/arabicDemoProfiles';
import { THEMES } from '../config/themes';
import { useLanguage } from '../context/LanguageContext';

type ProofTab = 'page' | 'measure' | 'capture';

export function CreatorProofSection() {
  const { lang, tr: ui } = useLanguage();
  const ar = lang === 'ar';
  const [tab, setTab] = useState<ProofTab>('page');
  const profile = useMemo(() => (ar ? ARABIC_DEMO_PROFILES : DEMO_PROFILES)[0], [ar]);
  const theme = THEMES.find(item => item.id === profile.themeId) || THEMES[0];

  const tabs: { id: ProofTab; icon: typeof Smartphone; en: string; ar: string }[] = [
    { id: 'page', icon: Smartphone, en: 'Your page', ar: 'صفحتك' },
    { id: 'measure', icon: BarChart3, en: 'Measure', ar: 'قِس' },
    { id: 'capture', icon: Mail, en: 'Capture', ar: 'اجمع' }
  ];

  return (
    <section id="creator-proof" className="creator-proof-section" aria-labelledby="creator-proof-title">
      <span id="how-it-works" className="creator-landing-anchor-alias" aria-hidden="true" />
      <div className="creator-landing-container">
        <div className="creator-proof-heading">
          <div>
            <p className="creator-landing-kicker">{ar ? 'المنتج الحقيقي' : 'The real product'}</p>
            <h2 id="creator-proof-title">{ar ? 'منشورك التالي يبدأ من هنا.' : 'Your next post starts here.'}</h2>
          </div>
          <p>{ar ? 'عاين الصفحة الحية، ثم شاهد كيف تجمع الجمهور وتتعلم من كل نقرة.' : 'Preview the live page, then see how you capture an audience and learn from every click.'}</p>
        </div>

        <div className="creator-proof-tabs" role="tablist" aria-label={ui('Creator product preview')}>
          {tabs.map(({ id, icon: Icon, en, ar: arLabel }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls={`creator-proof-panel-${id}`}
              onClick={() => setTab(id)}
              className={tab === id ? 'is-active' : ''}
            >
              <Icon aria-hidden="true" />
              <span>{ar ? arLabel : en}</span>
            </button>
          ))}
        </div>

        <div className="creator-proof-stage">
          <div className="creator-proof-phone" id="creator-proof-panel-page" role="tabpanel" hidden={tab !== 'page'}>
            <PhonePreview profile={profile} customTheme={theme} compact interactive={false} />
          </div>

          <div className="creator-proof-panel" id="creator-proof-panel-measure" role="tabpanel" hidden={tab !== 'measure'}>
            <div className="creator-proof-panel-icon"><BarChart3 aria-hidden="true" /></div>
            <p className="creator-landing-kicker">{ar ? 'تحليلات الصفحة' : 'Page analytics'}</p>
            <h3>{ar ? 'اعرف ما الذي يستحق مزيداً من الاهتمام.' : 'Know what deserves more attention.'}</h3>
            <p>{ar ? 'تظهر الزيارات ونقرات الروابط ومصادر الإحالة ووسوم الحملات في مكان واحد.' : 'Visits, link clicks, referring sources, and campaign tags live in one calm view.'}</p>
            <div className="creator-proof-rows" aria-label={ar ? 'عناصر التحليلات' : 'Analytics areas'}>
              {(ar ? ['الزيارات', 'نقرات الروابط', 'مصادر الإحالة'] : ['Visits', 'Link clicks', 'Referring sources']).map(label => (
                <div key={label}><span>{label}</span><strong>{ar ? 'بيانات تجريبية' : 'Demo data'}</strong></div>
              ))}
            </div>
          </div>

          <div className="creator-proof-panel" id="creator-proof-panel-capture" role="tabpanel" hidden={tab !== 'capture'}>
            <div className="creator-proof-panel-icon"><Mail aria-hidden="true" /></div>
            <p className="creator-landing-kicker">{ar ? 'التقاط الجمهور' : 'Audience capture'}</p>
            <h3>{ar ? 'لا تدع جمهورك يختفي بعد الإعجاب.' : 'Do not lose your audience after the like.'}</h3>
            <p>{ar ? 'أضف نشرة بريدية أو نموذجاً إلى الصفحة، ثم صدّر المشتركين عندما تحتاجهم.' : 'Add a newsletter or form to the page, then export subscribers when you need them.'}</p>
            <div className="creator-proof-capture-example">
              <span><Mail aria-hidden="true" />{ar ? 'النشرة البريدية' : 'Newsletter block'}</span>
              <strong><Check aria-hidden="true" />{ar ? 'مضمّنة في الصفحة' : 'Built into the page'}</strong>
            </div>
          </div>
        </div>

        <div className="creator-proof-footer">
          <p>{ar ? 'هذه معاينة حية من نفس مكوّن الصفحة العامة.' : 'This is a live preview using the same public-page component.'}</p>
          <Link href={ar ? '/ar/register' : '/register'} className="creator-proof-cta">{ar ? 'أنشئ صفحتك' : 'Create your page'} <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  );
}
