import React from 'react';
import { BarChart3, Monitor, Palette, Rocket } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const benefits = [
  { icon: Rocket, title: 'Launch in minutes', body: 'Choose a template, add your content, and go live instantly.' },
  { icon: Palette, title: 'Stunning templates', body: 'Professionally designed and fully customizable.' },
  { icon: BarChart3, title: 'More opportunities', body: 'Grow your audience, get clients, and make sales.' },
  { icon: Monitor, title: 'Works everywhere', body: 'Looks polished on mobile, tablet and desktop.' },
];

const trustMarks = ['YouTube', 'Instagram', 'TikTok', 'LinkedIn', 'Adobe', 'Spotify', 'Notion'];

export function HandoffBenefits() {
  const { isRtl } = useLanguage();
  return (
    <>
      <section aria-label={isRtl ? 'تكاملات' : 'Integrations'} className="raloa-trust-strip">
        <div className="raloa-container">
          <p>{isRtl ? 'مصمم للمبدعين والمستقلين والشركات حول العالم' : 'Trusted by creators, freelancers and businesses worldwide'}</p>
          <div className="raloa-trust-marks" aria-label="Supported platforms">
            {trustMarks.map(mark => <span key={mark}>{mark}</span>)}
            <span>and more…</span>
          </div>
        </div>
      </section>

      <section className="raloa-benefits" aria-labelledby="benefits-heading">
        <div className="raloa-container">
          <h2 id="benefits-heading" className="sr-only">{isRtl ? 'لماذا RALOA' : 'Why RALOA'}</h2>
          <div className="raloa-benefit-grid">
            {benefits.map(({ icon: Icon, title, body }) => (
              <article key={title} className="raloa-benefit-card">
                <div className="raloa-benefit-icon"><Icon aria-hidden="true" /></div>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function HandoffFinalCta({ onClaimUsername }: { onClaimUsername: (handle: string) => void }) {
  const { isRtl } = useLanguage();
  const [handle, setHandle] = React.useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onClaimUsername(handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));
  };
  return (
    <section className="raloa-final-cta" aria-labelledby="final-cta-heading">
      <div className="raloa-container">
        <div className="raloa-final-cta-inner">
          <div>
            <p className="raloa-eyebrow">{isRtl ? 'جاهز لبناء صفحتك؟' : 'READY TO BUILD YOURS?'}</p>
            <h2 id="final-cta-heading">{isRtl ? 'أنشئ موقعك المصغر اليوم' : 'Create your mini-site today'}</h2>
            <p>{isRtl ? 'انضم إلى المبدعين والمستقلين والشركات التي تستخدم RALOA.' : 'Join creators, freelancers and businesses using RALOA.'}</p>
          </div>
          <form className="raloa-final-form" onSubmit={submit} dir="ltr">
            <label className="sr-only" htmlFor="final-cta-handle">Username</label>
            <span>raloa.app/@</span>
            <input id="final-cta-handle" value={handle} onChange={event => setHandle(event.target.value)} placeholder="yourname" />
            <button type="submit">{isRtl ? 'أنشئ صفحتك' : 'Create your page'} <span aria-hidden="true">→</span></button>
          </form>
        </div>
      </div>
    </section>
  );
}
