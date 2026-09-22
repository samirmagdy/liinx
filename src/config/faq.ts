import type { Language } from './i18n';
import { brand } from './brand';

/**
 * Ordered by what stops a visitor from signing up: price, then what happens when the money
 * stops, then the domain, then Arabic. How the features work comes after, because a visitor
 * who is not yet convinced never gets that far.
 */
export function getFaqs(lang: Language, hasAnyImporter: boolean) {
  return lang === 'ar' ? [
    { question: 'هل توجد خطة مجانية؟', answer: `نعم. الحساب المجاني ينشر صفحتك على عنوان ${brand.domain} مع الروابط والوسائط والمجلدات ونموذج الاشتراك وروابط الحجز. يبقى شعار RALOA على الصفحة. الخطط المدفوعة لا تتضمن فترة تجريبية وتُحصّل حسب الفترة المختارة عبر Stripe.` },
    { question: 'ماذا يحدث لصفحتي عند انتهاء الخطة المدفوعة؟', answer: `لا يُحذف شيء. تبقى صفحاتك وروابطك وقائمة المشتركين، وتستمر الصفحة في العمل على عنوان ${brand.domain}. ما يتوقف هو الجزء المدفوع: النطاق المخصص يتوقف عن الخدمة، ويتوقف تطبيق CSS المخصص والخطوط والخلفية. يمكنك الإلغاء أو تغيير الخطة من صفحة الحساب التي تفتح بوابة الفواتير في Stripe.` },
    { question: 'هل يمكنني استخدام نطاق خاص؟', answer: 'في الخطط المدفوعة وبعد التحقق من DNS. تحتاج أيضاً إلى توجيه النطاق إلى الاستضافة وتفعيل شهادة TLS، وستيجة التحقق يخبرك بالسجل الناقص تحديداً.' },
    { question: 'هل تعمل RALOA بالعربية؟', answer: 'نعم. الواجهة كاملة بالعربية وتقرأ من اليمين إلى اليسار، وأي صفحة محتواها عربي تُبنى تلقائياً من اليمين إلى اليسار. تبقى أسماء المستخدمين والروابط والتواريخ باتجاهها الأيسر.' },
    { question: 'كيف أبدأ؟', answer: 'أنشئ حساباً مجانياً فتُنشر صفحتك فوراً، ثم اختر موقع بداية وعدّل المحتوى في الاستوديو؛ كل تغيير يُحفظ في نسخته المنشورة لحظة كتابته.' },
    { question: 'كيف تختلف RALOA عن صفحة روابط عادية؟', answer: 'تجمع RALOA الروابط والوسائط المدعومة والنشرة البريدية وتضمين Calendly في صفحة مصممة قابلة للتخصيص، بدلاً من قائمة أزرار فقط.' },
    { question: 'كيف تعمل الحجوزات؟', answer: 'أضف رابط موعد صالحاً من Calendly. يختار الزائر وقتاً داخل الأداة ويؤكّد Calendly الحجز. فتح الأداة لا يُحسب حجزاً مكتملاً.' },
    {
      question: 'هل يمكن استيراد الروابط؟',
      answer: hasAnyImporter
        ? 'افتح أداة الاستيراد، أدخل رابط صفحتك العامة، ثم راجع الروابط واختر ما تريد حفظه. قد تمنع بعض المواقع الاستخراج.'
        : 'الاستيراد التلقائي من المنصات الأخرى متوقف حالياً لحين اكتمال التكامل الرسمي عبر واجهات API. يمكنك إضافة روابطك وترتيبها بسهولة ومباشرة عبر الاستوديو.'
    },
    { question: 'هل يمكنني إخراج بياناتي؟', answer: 'نزّل ملف JSON يتضمن بيانات الحساب والملفات والصفحات والعناصر ومشتركي النشرة وردود النماذج من صفحة الحساب، ومشتركو النشرة يُصدَّرون أيضاً بصيغة CSV. ملفات الوسائط المرفوعة وسجل التحليلات الخام غير مضمنين.' }
  ] : [
    { question: 'Is there a free plan?', answer: `Yes. A free account publishes a page on a ${brand.domain} address with links, media, folders, newsletter signup and booking links. The RALOA mark stays on the page. Paid plans have no free trial and are charged for the interval you choose through Stripe.` },
    { question: 'What happens to my page when a paid plan ends?', answer: `Nothing is deleted. Your pages, links and subscriber list stay, and the page keeps serving on its ${brand.domain} address. What switches off is the paid part: a custom domain stops serving, and custom CSS, web fonts and background media stop applying. Cancel or change the plan from your account page, which opens the Stripe billing portal.` },
    { question: 'Can I use a custom domain?', answer: 'On paid plans, after DNS verification. You still have to point the domain at the host and have a TLS certificate, and the verification step names the exact record that is missing.' },
    { question: 'Does RALOA work in Arabic?', answer: 'Yes. The whole product has an Arabic interface that reads right-to-left, and a page with Arabic content lays out right-to-left on its own. Usernames, links and dates keep their left-to-right order.' },
    { question: 'How do I start?', answer: 'Create a free account and your page is published straight away. Pick a starter site, then edit the content in the Studio; every change saves to the live page as you make it.' },
    { question: 'How is RALOA different from a basic link page?', answer: 'RALOA combines links, supported media, newsletter capture, and a Calendly embed in a customizable designed page instead of only a list of buttons.' },
    { question: 'How does booking work?', answer: 'Add a valid Calendly event link. Visitors choose a time in the embedded scheduler and Calendly confirms the appointment. Opening the scheduler is not counted as a completed booking.' },
    {
      question: 'Can I import my links?',
      answer: hasAnyImporter
        ? 'Open the importer, enter your public page URL, then review and select the links to save. Some sites may block extraction.'
        : 'Automated competitor imports are currently paused pending official provider API integrations. You can quickly add and organize your links directly in the Studio.'
    },
    { question: 'Can I get my data out?', answer: 'Download a JSON file with your account, profiles, pages, blocks, newsletter subscribers and form responses from your account page; subscribers also export as CSV. Uploaded media files and raw analytics history are not included.' }
  ];
}
