export type Language = 'en' | 'ar';

export interface Translations {
  nav: {
    features: string;
    templates: string;
    pricing: string;
    about: string;
    contact: string;
    studio: string;
    login: string;
    register: string;
    claimCta: string;
  };
  hero: {
    badge: string;
    headline: string;
    headlineHighlight: string;
    subheadline: string;
    claimPlaceholder: string;
    claimButton: string;
    exploreTemplates: string;
    previewSubtitle: string;
    noCreditCard: string;
    customDomainIncluded: string;
    zeroCommission: string;
  };
  builderSection: {
    badge: string;
    title: string;
    subtitle: string;
    tabBlocks: string;
    tabStyling: string;
    tabAnalytics: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
  };
  templatesSection: {
    badge: string;
    title: string;
    subtitle: string;
    allCategory: string;
    useTemplate: string;
    previewMobile: string;
  };
  pricingSection: {
    badge: string;
    title: string;
    subtitle: string;
    monthly: string;
    yearly: string;
    yearlySave: string;
    startTrial: string;
  };
  faqSection: {
    badge: string;
    title: string;
    subtitle: string;
  };
  footer: {
    tagline: string;
    product: string;
    company: string;
    legal: string;
    rightsReserved: string;
    privacy: string;
    terms: string;
    contact: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      features: 'Features',
      templates: 'Templates',
      pricing: 'Pricing',
      about: 'About',
      contact: 'Contact',
      studio: 'Studio Builder',
      login: 'Sign in',
      register: 'Get Started',
      claimCta: 'Build your page'
    },
    hero: {
      badge: 'Framer-Grade Micro-Websites',
      headline: 'Your entire world.',
      headlineHighlight: 'Designed your way.',
      subheadline: 'Create a beautiful mini-site for everything you make, sell and share. Editorial typography, rich media embeds, and custom domains without touching a line of code.',
      claimPlaceholder: 'yourname',
      claimButton: 'Build your page',
      exploreTemplates: 'Explore templates',
      previewSubtitle: 'Live interactive preview',
      noCreditCard: 'No credit card required',
      customDomainIncluded: 'Custom domain ready',
      zeroCommission: '0% commission on sales'
    },
    builderSection: {
      badge: 'Intuitive Studio',
      title: 'Build visually. No code required.',
      subtitle: 'A fluid drag-and-drop workspace engineered for creators who care deeply about aesthetics, typography, and visitor conversion.',
      tabBlocks: 'Content & Media',
      tabStyling: 'Themes & Aesthetics',
      tabAnalytics: 'Decision Analytics',
      feature1Title: 'Live Dual-Screen Editing',
      feature1Desc: 'Every edit, color tweak, and font change renders instantly on the interactive canvas.',
      feature2Title: 'Rich Functional Blocks',
      feature2Desc: 'Embed Spotify previews, YouTube trailers, newsletter forms, and expandable folders.',
      feature3Title: 'Custom Domains & Zero Branding',
      feature3Desc: 'Route links.yourdomain.com with automated SSL certificates and 100% white-label badges.'
    },
    templatesSection: {
      badge: 'Bespoke Gallery',
      title: 'Built for every creative discipline.',
      subtitle: 'Explore meticulously crafted design systems for photographers, producers, indie studios, writers, and digital brands.',
      allCategory: 'All Templates',
      useTemplate: 'Use this template',
      previewMobile: 'Preview'
    },
    pricingSection: {
      badge: 'Transparent Pricing',
      title: 'Simple plans for ambitious creators.',
      subtitle: 'Start free. Upgrade when you need custom domains, deeper analytics, and multi-profile studio rosters.',
      monthly: 'Monthly billing',
      yearly: 'Annual billing',
      yearlySave: 'Save 20%',
      startTrial: 'Start 14-day free trial'
    },
    faqSection: {
      badge: 'Questions & Answers',
      title: 'Everything you need to know.',
      subtitle: 'Clear answers to help you choose the right foundation for your audience.'
    },
    footer: {
      tagline: 'A design-first micro-website builder for everything you make, sell, and share.',
      product: 'Product',
      company: 'Company',
      legal: 'Legal',
      rightsReserved: 'All rights reserved.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      contact: 'Support & Inquiries'
    }
  },
  ar: {
    nav: {
      features: 'المميزات',
      templates: 'القوالب',
      pricing: 'الأسعار',
      about: 'عن المنصة',
      contact: 'اتصل بنا',
      studio: 'استوديو التصميم',
      login: 'تسجيل الدخول',
      register: 'ابدأ مجاناً',
      claimCta: 'أنشئ صفحتك'
    },
    hero: {
      badge: 'مواقع مصغرة بتصميم احترافي رفيع',
      headline: 'عالمك بالكامل.',
      headlineHighlight: 'مصمم على طريقتك.',
      subheadline: 'أنشئ موقعاً مصغراً فائق الجمال لكل ما تصنعه وتبيعه وتشاركه. خطوط عربية فاخرة، تضمين للوسائط، ونطاق مخصص بدون كتابة سطر برمجي واحد.',
      claimPlaceholder: 'اسمك',
      claimButton: 'احجز رابطك',
      exploreTemplates: 'استكشف القوالب',
      previewSubtitle: 'معاينة تفاعلية حية',
      noCreditCard: 'بدون بطاقة ائتمانية',
      customDomainIncluded: 'يدعم دومينك المخصص',
      zeroCommission: '٠٪ عمولة على المبيعات'
    },
    builderSection: {
      badge: 'استوديو بديهي',
      title: 'صمم بمرونة وبصرياً. بدون كود.',
      subtitle: 'بيئة عمل مرنة مصممة لصناع المحتوى والعلامات التجارية المهتمة بجمالية الخطوط، تناغم الألوان، ونسب التحويل.',
      tabBlocks: 'المحتوى والوسائط',
      tabStyling: 'السمات والمظهر',
      tabAnalytics: 'تحليلات الزوار',
      feature1Title: 'تعديل لحظي متزامن',
      feature1Desc: 'كل إضافة أو تغيير في الخطوط والألوان ينعكس فوراً على المعاينة الحية.',
      feature2Title: 'عناصر وظيفية متقدمة',
      feature2Desc: 'تضمين سبوتيفاي، يوتيوب، رسائل إخبارية، وأدلة مجمعة في مجلدات أنيقة.',
      feature3Title: 'دومين مخصص وإزالة الشعار',
      feature3Desc: 'اربط نطاقك الخاص مثل links.brand.com مع شهادة SSL تلقائية وعلامة بيضاء بالكامل.'
    },
    templatesSection: {
      badge: 'معرض القوالب',
      title: 'مصمم ليناسب كافة المجالات الإبداعية.',
      subtitle: 'استكشف قوالب مختارة بعناية للمصورين، الموسيقيين، المطورين، المدربين، واستوديوهات الألعاب المستقلة.',
      allCategory: 'جميع القوالب',
      useTemplate: 'استخدم هذا القالب',
      previewMobile: 'معاينة'
    },
    pricingSection: {
      badge: 'أسعار واضحة',
      title: 'خطط بسيطة تمنحك الحرية الكاملة.',
      subtitle: 'ابدأ مجاناً، ورَقِّ حسابك عندما تحتاج لربط دومين مخصص، إدارة حسابات متعددة، وتحليلات أعمق.',
      monthly: 'اشتراك شهري',
      yearly: 'اشتراك سنوي',
      yearlySave: 'وفّر ٢٠٪',
      startTrial: 'ابدأ التجربة المجانية لـ ١٤ يوماً'
    },
    faqSection: {
      badge: 'الأسئلة الشائعة',
      title: 'كل ما تحتاج لمعرفته.',
      subtitle: 'إجابات مباشرة وواضحة لمساعدتك في اتخاذ القرار الأمثل لحضورك الرقمي.'
    },
    footer: {
      tagline: 'منصة تصميم المواقع المصغرة الأولى لكل ما تصنعه وتبيعه وتشاركه.',
      product: 'المنتج',
      company: 'الشركة',
      legal: 'الشروط القانونية',
      rightsReserved: 'جميع الحقوق محفوظة.',
      privacy: 'سياسة الخصوصية',
      terms: 'شروط الاستخدام',
      contact: 'الدعم والاستفسارات'
    }
  }
};
