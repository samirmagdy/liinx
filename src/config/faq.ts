import type { Language } from './i18n';

export function getFaqs(lang: Language, hasAnyImporter: boolean) {
  return lang === 'ar' ? [
    { question: 'كيف تختلف Liinx عن صفحة روابط عادية؟', answer: 'تجمع Liinx الروابط والوسائط المدعومة والنشرة البريدية وتضمين Calendly في صفحة مصممة قابلة للتخصيص، بدلاً من قائمة أزرار فقط.' },
    { question: 'كيف أبدأ؟', answer: 'أنشئ حساباً مجانياً، أضف روابطك واختر مظهراً ثم افتح صفحتك المنشورة للتحقق منها.' },
    { question: 'كيف تعمل الحجوزات؟', answer: 'أضف رابط موعد صالحاً من Calendly. يختار الزائر وقتاً داخل الأداة ويؤكّد Calendly الحجز. فتح الأداة لا يُحسب حجزاً مكتملاً.' },
    { question: 'هل يوجد نطاق مخصص؟', answer: 'تدعم الخطط المدفوعة نطاقاً مخصصاً بعد التحقق من DNS. يجب إعداد النطاق وشهادة TLS لدى مزوّد الاستضافة أيضاً.' },
    {
      question: 'هل يمكن استيراد الروابط؟',
      answer: hasAnyImporter
        ? 'افتح أداة الاستيراد، أدخل رابط صفحتك العامة، ثم راجع الروابط واختر ما تريد حفظه. قد تمنع بعض المواقع الاستخراج.'
        : 'الاستيراد التلقائي من المنصات الأخرى متوقف حالياً لحين اكتمال التكامل الرسمي عبر واجهات API. يمكنك إضافة روابطك وترتيبها بسهولة ومباشرة عبر الاستوديو.'
    },
    { question: 'هل يمكن تصدير المحتوى أو إلغاء الخطة؟', answer: 'يمكنك تصدير مشتركي النشرة بصيغة CSV. تُدار الاشتراكات المدفوعة وإلغاؤها عبر Stripe؛ تواصل مع الدعم قبل تغيير الخطة إذا كنت تحتاج مساعدة في المحتوى.' },
    { question: 'هل توجد خطة مجانية؟', answer: 'توجد خطة مجانية لنشر صفحة liinx.app. الخطط المدفوعة لا تتضمن فترة تجريبية مجانية وتُحصّل حسب الفترة المختارة في Stripe.' }
  ] : [
    { question: 'How is Liinx different from a basic link page?', answer: 'Liinx combines links, supported media, newsletter capture, and a Calendly embed in a customizable designed page instead of only a list of buttons.' },
    { question: 'How do I start?', answer: 'Create a free account, add your links, choose a theme and open your published page to check it.' },
    { question: 'How does booking work?', answer: 'Add a valid Calendly event link. Visitors choose a time in the embedded scheduler and Calendly confirms the appointment. Opening the scheduler is not counted as a completed booking.' },
    { question: 'Can I use a custom domain?', answer: 'Paid plans support custom domains after DNS verification. Your hosting provider must also configure the domain and TLS certificate.' },
    {
      question: 'Can I import my links?',
      answer: hasAnyImporter
        ? 'Open the importer, enter your public page URL, then review and select the links to save. Some sites may block extraction.'
        : 'Automated competitor imports are currently paused pending official provider API integrations. You can quickly add and organize your links directly in the Studio.'
    },
    { question: 'Can I export my content or cancel?', answer: 'Newsletter subscribers can be exported as CSV. Paid subscriptions and cancellations are handled through Stripe; contact support before changing plans if you need help with your content.' },
    { question: 'Is there a free plan?', answer: 'There is a free plan for publishing a liinx.app page. Paid plans have no free trial and are charged for the selected interval through Stripe.' }
  ];
}
