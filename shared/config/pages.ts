export const pageTitles: Record<string, [string, string]> = {
  '/': ['Your links, media and bookings', 'روابطك ووسائطك وحجوزاتك'],
  '/features': ['Features', 'الميزات'],
  '/templates': ['Templates', 'القوالب'],
  '/pricing': ['Pricing', 'الأسعار'],
  '/about': ['About', 'عن المنصة'],
  '/contact': ['Contact', 'تواصل معنا'],
  '/privacy': ['Privacy', 'الخصوصية'],
  '/terms': ['Terms of use', 'شروط الاستخدام'],
  '/login': ['Sign in', 'تسجيل الدخول'],
  '/register': ['Create an account', 'إنشاء حساب'],
  '/studio': ['Studio', 'الاستوديو'],
  '/account': ['Account Settings', 'إعدادات الحساب']
};

// Descriptions are kept beside the route titles so server prerendering and
// client-side language changes use the same truthful page summaries.
export const pageDescriptions: Record<string, [string, string]> = {
  '/': [
    'Create a customizable page for your links, media, bookings, and newsletter. Start with Liinx’s free plan.',
    'أنشئ صفحة قابلة للتخصيص لروابطك ووسائطك وحجوزاتك ونشرتك البريدية. ابدأ بالخطة المجانية من Liinx.'
  ],
  '/features': [
    'Explore Liinx features for creator pages, including supported media, custom themes, custom domains, and page analytics.',
    'اكتشف ميزات Liinx لصفحات المبدعين، بما فيها الوسائط المدعومة والسمات المخصصة والنطاقات المخصصة وتحليلات الصفحات.'
  ],
  '/templates': [
    'Browse customizable Liinx page templates and choose a starting design for your links, media, and creator content.',
    'تصفح قوالب صفحات Liinx القابلة للتخصيص واختر تصميماً أولياً لروابطك ووسائطك ومحتوى صفحتك.'
  ],
  '/pricing': [
    'Compare Liinx plans and features, including the free plan, paid options, and custom domain availability.',
    'قارن خطط Liinx وميزاتها، بما فيها الخطة المجانية والخيارات المدفوعة وإمكانية استخدام نطاق مخصص.'
  ],
  '/about': [
    'Learn about Liinx, a page builder for sharing creator links, media, bookings, and newsletter signups.',
    'تعرّف على Liinx، أداة إنشاء صفحات لمشاركة روابط المبدعين ووسائطهم وحجوزاتهم واشتراكات النشرة البريدية.'
  ],
  '/contact': [
    'Contact the Liinx team for help with your account, creator page, or product questions.',
    'تواصل مع فريق Liinx للمساعدة في حسابك أو صفحة المبدع أو استفسارات المنتج.'
  ],
  '/privacy': [
    'Read the Liinx privacy policy to learn how the service handles account and visitor information.',
    'اقرأ سياسة خصوصية Liinx لمعرفة كيفية تعامل الخدمة مع معلومات الحساب والزوار.'
  ],
  '/terms': [
    'Read the terms that apply when you use Liinx and its creator page services.',
    'اقرأ الشروط التي تنطبق عند استخدام Liinx وخدمات صفحات المبدعين.'
  ],
  '/login': ['Sign in to your Liinx account.', 'سجّل الدخول إلى حسابك في Liinx.'],
  '/register': ['Create a Liinx account to build and publish your creator page.', 'أنشئ حساب Liinx لبناء صفحة المبدع ونشرها.'],
  '/studio': ['Manage and customize your Liinx creator page.', 'أدر صفحة المبدع في Liinx وخصصها.'],
  '/account': ['Manage your Liinx account settings.', 'أدر إعدادات حسابك في Liinx.']
};
