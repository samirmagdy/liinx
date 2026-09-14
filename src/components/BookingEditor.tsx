import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { bookingUrl } from '../utils/booking';

export function BookingEditor({ onSave }: { onSave: (title: string, url: string) => Promise<void> }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return <form className="bg-white border rounded-2xl p-4 space-y-3" onSubmit={async e => {
    e.preventDefault();
    const valid = bookingUrl(url);
    if (!valid || !title.trim()) { setError(true); return; }
    setBusy(true); setError(false);
    try { await onSave(title.trim(), valid); setTitle(''); setUrl(''); }
    catch { setError(true); }
    finally { setBusy(false); }
  }}>
    <h3 className="font-bold">{ar ? 'إضافة حجز عبر Calendly' : 'Add Calendly booking'}</h3>
    <label className="block text-sm">{ar ? 'عنوان الخدمة' : 'Service title'}<input required maxLength={150} dir="auto" value={title} onChange={e => setTitle(e.target.value)} className="block w-full border rounded-lg p-2 mt-1" /></label>
    <label className="block text-sm">{ar ? 'رابط فعالية Calendly' : 'Calendly event URL'}<input required type="url" dir="ltr" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://calendly.com/your-name/consultation" className="block w-full min-w-0 border rounded-lg p-2 mt-1" /></label>
    <p className="text-sm">{ar ? 'أنشئ فعالية في حسابك على Calendly ثم الصق رابطها. تُدار المواعيد والتأكيدات هناك.' : 'Create an event in your Calendly account, then paste its link. Availability and confirmations are managed there.'}</p>
    {error && <p role="alert">{ar ? 'تعذّر الحفظ. تحقق من العنوان ورابط الفعالية ثم أعد المحاولة.' : 'Could not save. Check the title and event URL, then retry.'}</p>}
    <button disabled={busy} className="min-h-11 rounded-xl bg-neutral-900 text-white px-4 py-2 disabled:opacity-50">{busy ? (ar ? 'جارٍ الحفظ…' : 'Saving…') : (ar ? 'إضافة الحجز' : 'Add booking')}</button>
  </form>;
}
