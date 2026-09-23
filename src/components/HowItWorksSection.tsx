import React from 'react';
import { Link } from 'wouter';
import { ArrowRight, Brush, PenLine, Send } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { HOW_IT_WORKS_ANCHOR, useHashScroll } from '../hooks/useHashScroll';
import { Reveal } from './motion/Reveal';

/**
 * Three steps, each one a thing the product already does. Nothing here is a promise about a
 * future flow: the page is published at the moment the account is created, and the Studio
 * saves as you type.
 */
const STEPS = [
  {
    title: 'Choose a template',
    detail: 'Pick a design that fits your style or start from scratch.',
    icon: Brush,
    action: { href: '/templates', label: 'See the starter sites' }
  },
  {
    title: 'Add your content',
    detail: 'Add links, media, bookings, products and more — all in one place.',
    icon: PenLine,
    action: { href: '/studio', label: 'Open the Studio' }
  },
  {
    title: 'Go live and share',
    detail: 'Your page is published the moment the account is made. Share its address wherever people look for you.',
    icon: Send,
    action: { href: '/@elenarostova', label: 'Look at a live page' }
  }
];

export function HowItWorksSection() {
  const { tr: ui, isRtl } = useLanguage();
  useHashScroll(HOW_IT_WORKS_ANCHOR);

  return (
    <section id={HOW_IT_WORKS_ANCHOR} className="marketing-section border-b border-neutral-200 bg-white py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal distance="md" className="mb-8 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">{ui('Get started today')}</p>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl text-balance">
            {ui('How RALOA works')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base text-pretty">
            {ui('Three simple steps to your stunning mini-site.')}
          </p>
        </Reveal>

        <Reveal stagger>
          <ol className="raloa-steps-grid grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="motion-card flex h-full flex-col border-t-2 border-neutral-900 pt-4 text-start">
                <div className="raloa-step-marker"><span>{index + 1}</span><step.icon aria-hidden="true" /></div>
                <h3 className="mt-4 text-base font-semibold text-neutral-900 text-balance">{ui(step.title)}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600 text-pretty">{ui(step.detail)}</p>
                <Link
                  href={step.action.href}
                  className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-neutral-900 transition-colors hover:text-indigo-600"
                >
                  <span>{ui(step.action.label)}</span>
                  <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
