import React from 'react';
import { BarChart3, Monitor, Palette, Rocket } from 'lucide-react';
import { brand } from '../config/brand';
import { useLanguage } from '../context/LanguageContext';

const benefits = [
  { icon: Rocket, title: 'Launch in minutes', body: 'Pick a starter site, replace the placeholders, and the page is live.' },
  { icon: Palette, title: 'Eight starter sites', body: 'Each one arrives with its own pages and blocks, ready to edit.' },
  { icon: BarChart3, title: 'One address for everything', body: 'Links, media, bookings and newsletter signups on the same page.' },
  { icon: Monitor, title: 'Works everywhere', body: 'Looks polished on mobile, tablet and desktop.' },
];

/** Only platforms the social block actually accepts — see the platform enum in shared/contracts/blocks.ts. */
export const supportedPlatforms = ['Instagram', 'TikTok', 'YouTube', 'Spotify', 'X', 'GitHub', 'LinkedIn'];

export function HandoffBenefits() {
  const { tr: ui } = useLanguage();
  return (
    <section className="raloa-benefits" aria-labelledby="benefits-heading">
      <div className="raloa-container">
        <div className="raloa-benefits-intro">
          <p className="raloa-eyebrow">{ui('One home for your audience')}</p>
          <h2 id="benefits-heading">{ui('Everything your next click needs.')}</h2>
        </div>
        <div className="raloa-benefit-grid">
          {benefits.map(({ icon: Icon, title, body }) => (
            <article key={title} className="raloa-benefit-card">
              <div className="raloa-benefit-icon"><Icon aria-hidden="true" /></div>
              <div>
                <h3>{ui(title)}</h3>
                <p>{ui(body)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HandoffFinalCta({ onClaimUsername }: { onClaimUsername: (handle: string) => void }) {
  const { tr: ui } = useLanguage();
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
            <p className="raloa-eyebrow">{ui('Ready to build yours?')}</p>
            <h2 id="final-cta-heading">{ui('Give every post, project, and booking a home.')}</h2>
            <p>{ui('Create your page and share one address for everything your audience needs.')}</p>
          </div>
          <form className="raloa-final-form" onSubmit={submit} dir="ltr">
            <label className="sr-only" htmlFor="final-cta-handle">{ui('Choose your handle')}</label>
            <span>{`${brand.domain}/@`}</span>
            <input id="final-cta-handle" value={handle} onChange={event => setHandle(event.target.value)} placeholder={ui('yourname')} />
            <button type="submit">{ui('Create your page')} <span aria-hidden="true">→</span></button>
          </form>
        </div>
      </div>
    </section>
  );
}
