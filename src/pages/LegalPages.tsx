import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { brand } from '../config/brand';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Shield, Lock, FileText, Mail, Send, CheckCircle2, ArrowRight, Info, BookOpen } from 'lucide-react';

interface InformationPageProps {
  title: string;
  icon: React.ReactNode;
  badge: string;
  sections: [string, string][];
}

function InformationPage({ title, icon, badge, sections }: InformationPageProps) {
  const { tr: ui } = useUiLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-16 sm:py-20">

        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700 mb-4">
            {icon}
            <span>{badge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 text-balance">
            {title}
          </h1>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {sections.map(([heading, body]) => (
            <section key={heading} className="p-6 rounded-2xl bg-neutral-50/70 border border-neutral-200">
              <h2 className="text-lg font-bold text-neutral-900 mb-3">{heading}</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">{body}</p>
            </section>
          ))}
        </div>

        {/* Contact Link */}
        <div className="mt-10 text-center">
          <a
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors"
            href="/contact"
          >
            <Mail className="w-4 h-4 text-neutral-500" />
            {ui("Contact us")}
          </a>
        </div>
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
    </div>
  );
}

export function PrivacyPage() {
  const { lang } = useLanguage();
  return (
    <InformationPage
      icon={<Shield className="w-3.5 h-3.5 text-emerald-600" />}
      badge={lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
      title={lang === 'ar' ? 'الخصوصية' : 'Privacy'}
      sections={lang === 'ar' ? [
        ['بيانات الحساب والمحتوى', 'نخزّن البريد الإلكتروني وكلمة المرور بعد تجزئتها باستخدام bcrypt، ومحتوى الملف والروابط والمظهر الذي تختاره. تظهر المعلومات المنشورة لزوار صفحتك.'],
        ['الزيارات والاشتراكات', 'نسجّل زيارات الصفحة ونقرات الروابط ومصادر الإحالة ووسوم الحملات. تستخدم الإحصاءات معرّفات مشتقة من عنوان IP وتُستخدم لأغراض مجمعة ومكافحة الإساءة. تُحفظ عناوين المشتركين في القائمة الخاصة بصاحب الصفحة مع وقت الموافقة عندما يوافق المشترك.'],
        ['الخدمات الخارجية والوسائط', 'قد تحمّل الوسائط والحجوزات خدمات خارجية مثل YouTube وSpotify وCalendly. قد تُستخدم Stripe للفوترة، وInstagram OAuth للمزامنة، وGoogle Analytics أو Meta Pixel إذا فعّلها صاحب الصفحة. هذه الخدمات قد تعالج بيانات الزائر وفق سياساتها.'],
        ['الاحتفاظ والحذف', 'يمكن لصاحب الحساب حذف حسابه ومحتواه من الخدمة، مع إزالة سجلات الحساب والاشتراكات والتكاملات المرتبطة. قد تبقى نسخ احتياطية آمنة حتى انتهاء فترة الاحتفاظ التشغيلية. يمكن إزالة المشترك من قائمة صاحب الصفحة عند طلبه منه.'],
        ['طلبات البيانات', 'استخدم نموذج التواصل لطلبات الوصول إلى بياناتك أو حذفها أو الانسحاب من قائمة بريدية. لا يوجد ادعاء اعتماد امتثال أو مدة تنفيذ مضمونة.']
      ] : [
        ['Account data and content', 'We store your email, bcrypt-hashed password, profile content, links and selected appearance. Published information is visible to page visitors.'],
        ['Visits and subscriptions', 'We record page views, link clicks, referrers and campaign tags. Analytics uses identifiers derived from IP addresses for aggregate reporting and abuse prevention. Subscriber emails are stored in the page owner\'s private list, with consent time recorded when consent is provided.'],
        ['Third-party services and media', 'Media and booking embeds may load YouTube, Spotify and Calendly. Stripe may process billing, Instagram OAuth may process synchronization, and Google Analytics or Meta Pixel may load when enabled by a creator. Those providers process data under their own policies.'],
        ['Retention and deletion', 'Account owners can delete their account and associated content, subscriptions and integrations. Secure backups may retain deleted records for an operational retention period. Subscribers can ask the creator to remove their address from the creator\'s list.'],
        ['Data requests', 'Use the contact form to request access, deletion, or removal from a creator\'s newsletter list. No compliance certification or guaranteed processing time is claimed.']
      ]}
    />
  );
}

export function TermsPage() {
  const { lang } = useLanguage();
  return (
    <InformationPage
      icon={<FileText className="w-3.5 h-3.5 text-amber-600" />}
      badge={lang === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
      title={lang === 'ar' ? 'شروط الاستخدام' : 'Terms of use'}
      sections={lang === 'ar' ? [
        ['مسؤولية المحتوى ومكافحة الإساءة', 'أنت مسؤول عن المحتوى والروابط التي تنشرها وعن امتلاك حقوق استخدامها. لا تستخدم الخدمة للتصيد أو البرمجيات الضارة أو الاحتيال أو انتحال الشخصية أو البريد المزعج أو المحتوى غير القانوني. يجوز إزالة الصفحات والروابط المخالفة.'],
        ['الفوترة', 'تُعرض الأسعار وفترة الفوترة قبل الانتقال إلى Stripe. تتجدد الاشتراكات المدفوعة تلقائياً؛ يمكنك إدارتها أو إلغاؤها من بوابة الفوترة.'],
        ['الحجوزات والخدمات الخارجية', 'تُدار المواعيد وتأكيدات الحجز لدى Calendly. فتح أداة الحجز لا يعني اكتمال الحجز. إعداد النطاق وHTTPS يتطلبان استضافة مهيأة.'],
        ['توفر الخدمة', 'لا توجد ضمانات منشورة لزمن الاستجابة أو نسبة التوفر. تواصل معنا بشأن مشكلات الخدمة أو الفوترة.']
      ] : [
        ['Content responsibility and abuse', 'You are responsible for the content and destinations you publish and for having permission to use them. Do not use the service for phishing, malware, fraud, impersonation, spam or unlawful content. We may remove violating pages or destinations.'],
        ['Billing', 'Prices and billing intervals are displayed before Stripe Checkout. Paid subscriptions renew automatically; manage or cancel them through the billing portal.'],
        ['Bookings and external services', 'Calendly manages availability and booking confirmations. Opening the scheduler does not mean a booking is complete. Custom domains and HTTPS require configured hosting.'],
        ['Service availability', 'No response-time or uptime guarantee is published. Contact us about service or billing problems.']
      ]}
    />
  );
}

export function ContactPage() {
  const { tr: ui } = useUiLanguage();
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    if (sending) return;
    setSending(true);
    setError('');
    try { await api.contact({ name, email, message }); setSubmitted(true); }
    catch { setError('Your message was not saved. Please retry.'); }
    finally { setSending(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="contact" />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700">
            <Mail className="w-3.5 h-3.5 text-amber-600" />
            <span>{ui("Get in Touch")}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 text-balance">{ui("We'd love to hear from you.")}</h1>
          <p className="text-sm text-neutral-500 max-w-lg mx-auto text-pretty">
            {ui("Have a question about custom domains, partnerships, or migration from another platform? Send our support team a message.")}</p>
        </div>

        {submitted ? (
          <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200 text-center space-y-4 max-w-md mx-auto">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h2 className="text-lg font-bold text-neutral-900">{ui("Message Received!")}</h2>
            <p className="text-xs text-neutral-600">
              {ui("Your message has been saved. No response time is guaranteed.")}</p>
            <button
              onClick={() => setLocation('/')}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer flex items-center gap-2 mx-auto"
            >
              <span>{ui("Return Home")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-neutral-50/70 border border-neutral-200 space-y-5 shadow-xs">
            {error && <p role="alert" className="text-sm text-red-700 p-3 rounded-xl bg-red-50 border border-red-200">{error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-bold text-neutral-700 mb-1.5">{ui("Your Name")}</label>
                <input
                  id="contact-name" name="name" autoComplete="name" maxLength={120}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={ui("Elena Rostova")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs font-bold text-neutral-700 mb-1.5">{ui("Email Address")}</label>
                <input
                  id="contact-email" name="email" autoComplete="email" dir="ltr"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elena@studio.design"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-bold text-neutral-700 mb-1.5">{ui("How can we help?")}</label>
              <textarea
                id="contact-message" name="message" maxLength={5000}
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={ui("Tell us about your project or inquiry...")}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
            >
              <span>{sending ? ui("Sending…") : ui("Send Message")}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
    </div>
  );
}

export function AboutPage() {
  const { lang } = useLanguage();
  return (
    <InformationPage
      icon={<BookOpen className="w-3.5 h-3.5 text-blue-600" />}
      badge={lang === 'ar' ? 'من نحن' : 'About Us'}
      title={lang === 'ar' ? `عن ${brand.productShortName}` : `About ${brand.productShortName}`}
      sections={lang === 'ar' ? [
        ['صفحة واحدة لأعمالك', 'اجمع روابطك ووسائطك ونموذج الاشتراك والحجوزات في صفحة شخصية.'],
        ['صمّمها لتناسبك', 'اختر مظهراً جاهزاً ثم خصّص الألوان والخطوط وترتيب المحتوى. اختبر الصفحة المنشورة قبل مشاركتها.']
      ] : [
        ['One page for your work', 'Bring your links, media, email capture and bookings together on a personal page.'],
        ['Make it yours', 'Choose a theme, then customize colors, typography and content order. Test your published page before sharing it.']
      ]}
    />
  );
}
