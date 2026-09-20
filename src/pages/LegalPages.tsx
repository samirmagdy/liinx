import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { brand } from '../config/brand';
import { api } from '../services/api';
import { useLanguage, useLanguage as useUiLanguage } from '../context/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Shield, FileText, Mail, Send, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';

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
    <div className="marketing-shell min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-10 sm:py-12">

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
        ['الزيارات والاشتراكات', 'نسجّل زيارات الصفحة ونقرات الروابط ومصادر الإحالة ووسوم الحملات. تستخدم الإحصاءات معرّفات مشتقة من عنوان IP وتُستخدم لأغراض مجمعة ومكافحة الإساءة. عند طلب الاشتراك، نرسل رسالة تأكيد ولا نضيف البريد إلى قائمة صاحب الصفحة حتى يضغط الشخص على زر التأكيد. نحذف الطلبات غير المؤكدة بعد 24 ساعة. نسجّل وقت الموافقة والتأكيد وإصدار نص الموافقة؛ ويمكن للمشترك الانسحاب عبر رابط إلغاء الاشتراك.'],
        ['الإحالات', 'إذا سجّلت عبر رابط دعوة، نحفظ مُعرّف الحساب الذي دعاك وحالة التحقق من بريدك لحساب الدعوة ضمن برنامج المكافآت.'],
        ['الخدمات الخارجية والوسائط', 'قد تحمّل الوسائط والحجوزات خدمات خارجية مثل YouTube وSpotify وCalendly. قد تُستخدم Stripe للفوترة، وInstagram OAuth للمزامنة، وGoogle Analytics أو Meta Pixel إذا فعّلها صاحب الصفحة. هذه الخدمات قد تعالج بيانات الزائر وفق سياساتها.'],
        ['رسائل الدعم', 'تُحفظ الرسائل المرسلة من نموذج الدعم مع الاسم والبريد والرسالة ووقت الإرسال. يطّلع عليها حساب المشغّل المصرّح به فقط. قد يُحاول النظام إرسال إشعار إلى صندوق الدعم عند تهيئة مزوّد البريد؛ حفظ الرسالة لا يعني تسليم البريد. لا توجد حالياً مدة احتفاظ تلقائية محددة لرسائل الدعم.'],
        ['الاحتفاظ والحذف', 'يمكن لصاحب الحساب حذف حسابه ومحتواه من الخدمة، مع إزالة سجلات الحساب والاشتراكات والتكاملات المرتبطة. قد تبقى نسخ احتياطية آمنة حتى انتهاء فترة الاحتفاظ التشغيلية. يمكن إزالة المشترك من قائمة صاحب الصفحة عند طلبه منه.'],
        ['طلبات البيانات', 'استخدم نموذج التواصل لطلبات الوصول إلى بياناتك أو حذفها أو الانسحاب من قائمة بريدية. لا يوجد ادعاء اعتماد امتثال أو مدة تنفيذ مضمونة.']
      ] : [
        ['Account data and content', 'We store your email, bcrypt-hashed password, profile content, links and selected appearance. Published information is visible to page visitors.'],
        ['Visits and subscriptions', 'We record page views, link clicks, referrers and campaign tags. Analytics uses identifiers derived from IP addresses for aggregate reporting and abuse prevention. When someone requests a newsletter subscription, we send a confirmation email and do not add the address to the page owner\'s list until they press the confirmation button. Unconfirmed requests are deleted after 24 hours. We record consent time, confirmation time, and the consent text version; subscribers can withdraw through their unsubscribe link.'],
        ['Referrals', 'If you register through a referral link, we store the referring account ID and your email-verification status for referral reward accounting.'],
        ['Third-party services and media', 'Media and booking embeds may load YouTube, Spotify and Calendly. Stripe may process billing, Instagram OAuth may process synchronization, and Google Analytics or Meta Pixel may load when enabled by a creator. Those providers process data under their own policies.'],
        ['Support messages', 'Support messages store the sender name, email, message, and submission time. Access is limited to the configured support operator account. The service may attempt an email notification when a mail provider is configured; saving a message does not mean that email was delivered. No automatic retention period is currently configured for support messages.'],
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
        ['برنامج دعوة المبدعين', 'تُحتسب الدعوة بعد إنشاء حساب جديد والتحقق من البريد الإلكتروني. يحصل الحساب المجاني الذي دعا ثلاثة حسابات مؤهلة على Pro لمدة 90 يوماً مرة واحدة. الحسابات ذات الاشتراك المدفوع غير مؤهلة للمكافأة. لا تُحتسب الحسابات المكررة، ولا تُحوّل المكافأة إلى نقد.'],
        ['إحالات الوكالات', 'تُحتسب الإحالة عندما ينشئ حساب جديد موثّق البريد اشتراك Studio ويدفع أول فاتورة. يُمنح صاحب الإحالة رصيداً بقيمة 29 دولاراً أمريكياً بعد 30 يوماً، شريطة أن يكون اشتراكه في Studio نشطاً. يُطبّق الرصيد تلقائياً على فاتورة Liinx لاحقة عبر Stripe. الحد الأقصى ثلاثة أرصدة خلال أي 12 شهراً. الرصيد غير نقدي وغير قابل للاسترداد.'],
        ['الحجوزات والخدمات الخارجية', 'تُدار المواعيد وتأكيدات الحجز لدى Calendly. فتح أداة الحجز لا يعني اكتمال الحجز. إعداد النطاق وHTTPS يتطلبان استضافة مهيأة.'],
        ['توفر الخدمة', 'لا توجد ضمانات منشورة لزمن الاستجابة أو نسبة التوفر. تواصل معنا بشأن مشكلات الخدمة أو الفوترة.']
      ] : [
        ['Content responsibility and abuse', 'You are responsible for the content and destinations you publish and for having permission to use them. Do not use the service for phishing, malware, fraud, impersonation, spam or unlawful content. We may remove violating pages or destinations.'],
        ['Billing', 'Prices and billing intervals are displayed before Stripe Checkout. Paid subscriptions renew automatically; manage or cancel them through the billing portal.'],
        ['Creator referral program', 'A referral qualifies after a new account is created and its email address is verified. A free account that refers three qualified accounts receives Pro for 90 days once. Accounts with a paid subscription are not eligible for this reward. Each referred account can qualify once; rewards have no cash value.'],
        ['Agency referral credit', 'A referral qualifies when a new account with a verified email starts a Studio subscription and pays its first invoice. The referrer earns USD $29 in account credit after a 30-day hold, once the referrer has an active Studio subscription. Credit is automatically applied to a future Liinx invoice through Stripe. The limit is three credits in any 12-month period. Each referred account can qualify once; credits are non-cash and non-refundable.'],
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
  const [notification, setNotification] = useState<'sent' | 'not_configured' | 'failed' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(ui('Enter your name, email address, and message.'));
      return;
    }
    if (sending) return;
    setSending(true);
    setError('');
    try {
      const website = (document.getElementById('contact-website') as HTMLInputElement | null)?.value || '';
      const result = await api.contact({ name: name.trim(), email: email.trim(), message: message.trim(), website });
      setSubmitted(true);
      setNotification(result.notification);
    }
    catch { setError(ui('We could not confirm that your message was saved. Please retry.')); }
    finally { setSending(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="contact" />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 sm:py-12">
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
              {notification === 'sent'
                ? ui('Your message was saved and the support notification was sent.')
                : notification === 'failed'
                  ? ui('Your message was saved, but the support notification could not be sent.')
                  : ui('Your message was saved. Email notification is not configured; no response time is guaranteed.')}</p>
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
            <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
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
        ['ما هي Liinx؟', 'Liinx أداة لإنشاء صفحة عامة قابلة للتخصيص تجمع الروابط والوسائط المدعومة واشتراكات النشرة وروابط الحجز في مكان واحد.'],
        ['كيف تعمل الصفحة؟', 'أضف محتواك من الاستوديو، رتّب الكتل واختر مظهراً. يمكن نشر صفحات متعددة بروابط مستقلة، وتختلف الميزات المتاحة حسب الخطة.'],
        ['النشرة والحجوزات', 'تُجمع طلبات الاشتراك بموافقة صريحة، ولا تظهر للمبدع حتى تأكيد البريد الإلكتروني. تُحذف الطلبات غير المؤكدة بعد 24 ساعة، ونحتفظ بوقت الموافقة والتأكيد وإصدار نص الموافقة لإثبات الاشتراك. يمكن للمشترك إلغاء اشتراكه عبر رابط الإلغاء. تفتح كتل الحجز تقويم Calendly؛ ويُدير Calendly المواعيد والتأكيدات.'],
        ['النطاقات والمدفوعات', 'تدعم الخطط المؤهلة ربط نطاق مخصص بعد التحقق من DNS، مع إعداد الاستضافة وشهادة TLS. لا تعالج Liinx مدفوعات المبيعات أو الحجوزات؛ وتُدار هذه العمليات لدى مزوّد الخدمة الخارجي.']
      ] : [
        ['What is Liinx?', 'Liinx is a tool for creating a customizable public page that brings together links, supported media, newsletter signups, and booking links.'],
        ['How pages work', 'Add content in the Studio, arrange blocks, and choose a theme. You can publish multiple pages at separate URLs; feature availability varies by plan.'],
        ['Newsletters and bookings', 'Newsletter signup blocks require an explicit opt-in and email confirmation before a subscriber appears to the creator. Unconfirmed requests expire after 24 hours. We record consent time, confirmation time, and the consent text version as subscription evidence. Subscribers can withdraw through their unsubscribe link. Booking blocks open Calendly, which manages availability and booking confirmations.'],
        ['Domains and payments', 'Eligible plans support custom domains after DNS verification; hosting and TLS also need to be configured. Liinx does not process sales or booking payments; external providers handle those transactions.']
      ]}
    />
  );
}
