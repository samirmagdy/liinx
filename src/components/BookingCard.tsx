import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { bookingUrl } from '../utils/booking';
import { BookingBlock, ThemeConfig } from '../types';

export function BookingCard({ block, theme }: { block: BookingBlock; theme: ThemeConfig }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ar = lang === 'ar';
  const url = bookingUrl(block.url);
  if (!url) return null;
  return <section className="p-4 rounded-2xl space-y-3 min-w-0" style={{ background: theme.cardBg, color: theme.cardText, border: theme.cardBorder }}>
    <h3 className="font-bold text-base" dir="auto">{block.title}</h3>
    <p className="text-sm">{ar ? 'اختر موعدك وأكّد الحجز عبر Calendly.' : 'Choose a time and confirm your booking with Calendly.'}</p>
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="w-full min-h-11 rounded-xl border px-4 py-2 font-semibold">
      {open ? (ar ? 'إغلاق المواعيد' : 'Close scheduler') : (ar ? 'احجز موعداً' : 'Book an appointment')}
    </button>
    {open && <iframe key={url} src={url} title={ar ? 'حجز موعد عبر Calendly' : 'Book with Calendly'} className="w-full border-0 rounded-xl bg-white" style={{ height: 700 }} />}
    <a href={url} target="_blank" rel="noopener noreferrer" className="block underline text-sm py-2">{ar ? 'افتح Calendly في نافذة جديدة' : 'Open Calendly in a new tab'}</a>
  </section>;
}
