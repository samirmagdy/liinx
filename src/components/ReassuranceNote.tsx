import React from 'react';
import { Link } from 'wouter';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const linkClass = 'inline-flex min-h-11 items-center font-semibold text-neutral-700 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900';

/**
 * Sits under the two asks that cost a visitor something. Every clause has a code path behind
 * it: signup never reaches Stripe, a lapsed subscription switches features off without deleting
 * rows, and the account page answers a JSON download.
 */
export function ReassuranceNote({ className = '' }: { className?: string }) {
  const { tr: ui } = useLanguage();

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600 ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
        <span>
          {ui('No card to start. Nothing is deleted if you stop paying, and you can download your data whenever you want.')}
        </span>
      </span>
      <span className="inline-flex items-center gap-2">
        <Link href="/privacy" className={linkClass}>{ui('Privacy Policy')}</Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms" className={linkClass}>{ui('Terms of Service')}</Link>
      </span>
    </div>
  );
}
