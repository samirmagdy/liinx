import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { bookingUrl } from '../utils/booking';
import { type BookingBlock, type ThemeConfig } from '../types';

export function BookingCard({ block, theme, previewOnly = false }: { block: BookingBlock; theme: ThemeConfig; previewOnly?: boolean }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ar = lang === 'ar';
  const url = bookingUrl(block.url);
  useEffect(() => {
    if (!open || loaded || previewOnly) return;
    const timer = window.setTimeout(() => setFailed(true), 10000);
    return () => window.clearTimeout(timer);
  }, [open, loaded, previewOnly]);
  if (!url) return null;
  const openScheduler = () => {
    if (previewOnly) return;
    setOpen(value => !value);
    setLoaded(false);
    setFailed(false);
  };
  return <section className="p-4 rounded-2xl space-y-3 min-w-0 hover:scale-[1.02] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ background: theme.cardBg, color: theme.cardText, border: theme.cardBorder }}>
    <h3 className="font-bold text-base" dir="auto">{block.title}</h3>
    <p className="text-sm">{ar ? 'اختر موعدك وأكّد الحجز عبر Calendly. لا تعالج RALOA الحجوزات أو المدفوعات.' : 'Choose a time and confirm your booking through Calendly. RALOA does not process bookings or payments.'}</p>
    <button type="button" aria-expanded={open} aria-disabled={previewOnly} disabled={previewOnly} onClick={openScheduler} className="w-full min-h-11 rounded-xl border px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60">
      {previewOnly ? (ar ? 'الحجز معطّل في المعاينة' : 'Booking disabled in preview') : open ? (ar ? 'إغلاق المواعيد' : 'Close scheduler') : (ar ? 'احجز موعداً' : 'Book an appointment')}
    </button>
    {open && !loaded && !failed && <p role="status" aria-live="polite" className="text-sm">{ar ? 'جارٍ فتح Calendly. إذا لم تظهر المواعيد، استخدم الرابط أدناه.' : 'Opening Calendly. If availability does not appear, use the link below.'}</p>}
    {open && failed && <p role="alert" className="text-sm">{ar ? 'تعذّر تحميل أداة الحجز هنا. افتح Calendly في نافذة جديدة.' : 'Calendly could not load here. Open it in a new tab instead.'}</p>}
    {open && !failed && <iframe key={url} src={url} onLoad={() => { setLoaded(true); setFailed(false); }} onError={() => { setLoaded(false); setFailed(true); }} title={ar ? 'حجز موعد عبر Calendly' : 'Book with Calendly'} aria-busy={!loaded} className="w-full max-w-full border-0 rounded-xl" style={{ backgroundColor: theme.cardBg, height: 'min(700px, 85svh)', minHeight: 420 }} />}
    {open && !failed && <p className="text-xs">{ar ? 'لا يكتمل الحجز إلا بعد تأكيد Calendly. يمكنك استخدام النافذة الجديدة إذا تعذّر التمرير هنا.' : 'Your appointment is booked only after Calendly confirms it. Use a new tab if scrolling here is difficult.'}</p>}
    <a href={url} target="_blank" rel="noopener noreferrer" className="block underline text-sm py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-current">{ar ? 'افتح Calendly في نافذة جديدة' : 'Open Calendly in a new tab'}</a>
  </section>;
}
