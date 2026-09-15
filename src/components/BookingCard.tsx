import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { bookingUrl } from '../utils/booking';
import { BookingBlock, ThemeConfig } from '../types';

export function BookingCard({ block, theme }: { block: BookingBlock; theme: ThemeConfig }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ar = lang === 'ar';
  const url = bookingUrl(block.url);
  if (!url) return null;
  return <section className="p-4 rounded-2xl space-y-3 min-w-0 hover:scale-[1.02] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ background: theme.cardBg, color: theme.cardText, border: theme.cardBorder }}>
    <h3 className="font-bold text-base" dir="auto">{block.title}</h3>
    <p className="text-sm">{ar ? 'اختر موعدك وأكّد الحجز عبر Calendly.' : 'Choose a time and confirm your booking with Calendly.'}</p>
    <button type="button" aria-expanded={open} onClick={() => { setOpen(!open); setLoaded(false); }} className="w-full min-h-11 rounded-xl border px-4 py-2 font-semibold">
      {open ? (ar ? 'إغلاق المواعيد' : 'Close scheduler') : (ar ? 'احجز موعداً' : 'Book an appointment')}
    </button>
    {open && !loaded && <p role="status" className="text-sm">{ar ? 'جارٍ فتح Calendly. إذا لم تظهر المواعيد، استخدم الرابط أدناه.' : 'Opening Calendly. If availability does not appear, use the link below.'}</p>}
    {open && <iframe key={url} src={url} onLoad={() => setLoaded(true)} title={ar ? 'حجز موعد عبر Calendly' : 'Book with Calendly'} className="w-full border-0 rounded-xl" style={{ backgroundColor: theme.cardBg, height: 'min(700px, 85svh)', minHeight: 420 }} />}
    {open && <p className="text-xs">{ar ? 'لا يكتمل الحجز إلا بعد تأكيد Calendly. يمكنك استخدام النافذة الجديدة إذا تعذّر التمرير هنا.' : 'Your appointment is booked only after Calendly confirms it. Use a new tab if scrolling here is difficult.'}</p>}
    <a href={url} target="_blank" rel="noopener noreferrer" className="block underline text-sm py-2">{ar ? 'افتح Calendly في نافذة جديدة' : 'Open Calendly in a new tab'}</a>
  </section>;
}
