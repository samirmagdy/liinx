export type Language = 'en' | 'ar';

export interface TemplateTranslation {
  name: string;
  category: string;
  description: string;
}

export interface PricingPlanTranslation {
  name: string;
  tagline: string;
  features: string[];
  ctaText: string;
  billedAnnuallyText: (annualPrice: number) => string;
}

export interface ComparisonRow {
  feature: string;
  liinx: boolean | string;
  linktree: boolean | string;
  beacons: boolean | string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

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
    microProof1: string;
    microProof2: string;
    themeLabel: string;
    customizeCta: (name: string) => string;
  };
  builderSection: {
    badge: string;
    title: string;
    subtitle: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
    feature4Title: string;
    feature4Desc: string;
    feature5Title: string;
    feature5Desc: string;
    ctaBarTitle: string;
    ctaBarDesc: string;
    cta: string;
  };
  templatesSection: {
    badge: string;
    title: string;
    subtitle: string;
    allCategory: string;
    useTemplate: string;
    previewMobile: string;
    categories: string[];
    templates: Record<string, TemplateTranslation>;
  };
  comparisonSection: {
    badge: string;
    title: string;
    subtitle: string;
    featuresCol: string;
    liinxCol: string;
    linktreeCol: string;
    beaconsCol: string;
    included: string;
    rows: ComparisonRow[];
  };
  pricingSection: {
    badge: string;
    title: string;
    subtitle: string;
    monthly: string;
    yearly: string;
    yearlySave: string;
    startTrial: string;
    perMonth: string;
    popular: string;
    plans: Record<string, PricingPlanTranslation>;
  };
  faqSection: {
    badge: string;
    title: string;
    subtitle: string;
    openAnswer: string;
    faqs: FaqItem[];
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
      badge: 'A flexible page for everything you share',
      headline: 'Your entire world.',
      headlineHighlight: 'Designed your way.',
      subheadline: 'Liinx is a design-first micro-site builder for creators, professionals, and small brands. Create one customizable page for your links, supported audio and video, newsletter signups, and Calendly bookings, then publish it at liinx.app/@yourname or connect a custom domain on a paid plan.',
      claimPlaceholder: 'yourname',
      claimButton: 'Build your page',
      exploreTemplates: 'Explore templates',
      previewSubtitle: 'Interactive template preview',
      noCreditCard: 'Start with a free account',
      customDomainIncluded: 'Custom domains on paid plans',
      zeroCommission: 'Liinx does not process payments',
      microProof1: 'Preview your page as you build',
      microProof2: 'Templates for creators, studios, and brands',
      themeLabel: 'Theme:',
      customizeCta: (name) => `Customize ${name}'s Page in Studio`
    },
    builderSection: {
      badge: 'Intuitive Studio',
      title: 'A page that looks like you.',
      subtitle: 'Shape your content, preview every change, and publish when it feels right.',
      feature1Title: 'Accordion Folders & Link Lists',
      feature1Desc: 'Keep your page clean and uncluttered. Collapse presets, press kits, tour dates, and archived projects into sleek expandable drawers.',
      feature2Title: 'True Custom Domain',
      feature2Desc: 'Connect links.yourdomain.com after DNS verification and hosting TLS setup.',
      feature3Title: 'Supported Audio & Video Embeds',
      feature3Desc: 'Embed supported provider media and direct files where the configured player allows it.',
      feature4Title: 'Instagram link extraction',
      feature4Desc: 'When the integration is configured and authorized, extract eligible links from supported captions.',
      feature5Title: 'Know what your audience opens.',
      feature5Desc: 'See visits, link clicks, referring sources, and campaign tags in one calm view.',
      ctaBarTitle: 'Make your next click feel intentional.',
      ctaBarDesc: 'Start with a free account. Paid plans are available through Stripe Checkout.',
      cta: 'Open the Studio Builder'
    },
    templatesSection: {
      badge: 'Template gallery',
      title: 'Start with a page shaped around your work.',
      subtitle: 'Choose a considered starting point for your links, media, and audience.',
      allCategory: 'All Templates',
      useTemplate: 'Use this template',
      previewMobile: 'Preview',
      categories: ['All Templates', 'Design & Art', 'Musicians', 'Brands', 'Creators', 'Podcasts', 'Gaming', 'Wellness', 'Lifestyle'],
      templates: {
        'tmpl-editorial': {
          name: 'Minimalist Editorial',
          category: 'Design & Art',
          description: 'A quiet layout for photographers, designers, and visual portfolios.'
        },
        'tmpl-dark-sound': {
          name: 'Obsidian Studio',
          category: 'Musicians',
          description: 'High-contrast dark canvas engineered for musicians, sound designers, and tour schedules.'
        },
        'tmpl-tokyo-brand': {
          name: 'Neon Atelier',
          category: 'Brands',
          description: 'A bold layout for product launches, collections, and retail links.'
        },
        'tmpl-brutalist': {
          name: 'Neo Brutalist Mono',
          category: 'Creators',
          description: 'High-impact tactile 2px borders, monospaced tech typography, and raw authenticity.'
        },
        'tmpl-wellness': {
          name: 'Forest Wellness',
          category: 'Wellness',
          description: 'Organic green gradients and calming depth for fitness coaches, yoga instructors, and wellness brands.'
        },
        'tmpl-podcast': {
          name: 'Midnight Broadcast',
          category: 'Podcasts',
          description: 'Dark slate tones with monospaced typography, built for podcasters, interviewers, and audio creators.'
        },
        'tmpl-gaming': {
          name: 'Indie Dev Console',
          category: 'Gaming',
          description: 'Terminal-inspired dark theme for game studios, streamers, and indie developers with press-kit ready layouts.'
        },
        'tmpl-lifestyle': {
          name: 'Sahara Journal',
          category: 'Lifestyle',
          description: 'Warm desert tones, elegant serif accents, and earthy hues for travel bloggers and lifestyle creators.'
        }
      }
    },
    comparisonSection: {
      badge: 'THE HONEST COMPARISON',
      title: 'Compare Liinx capabilities',
      subtitle: 'See exactly what Liinx currently supports, what is handled by another provider, and what requires a paid plan.',
      featuresCol: 'Features & Standards',
      liinxCol: 'LIINX',
      linktreeCol: 'Linktree',
      beaconsCol: 'Beacons',
      included: 'Included',
      rows: [
        { feature: 'Clean, Ad-Free Design', liinx: true, linktree: false, beacons: false },
        { feature: 'Custom Domain (e.g. bio.yoursite.com)', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
        { feature: 'Supported Spotify & YouTube embeds', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
        { feature: 'Accordion folders for clean profiles', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
        { feature: 'Instagram caption link extraction when authorized', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
        { feature: 'External checkout and support links', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
        { feature: 'Public page performance depends on content and hosting', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
        { feature: 'Curated design themes', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' },
        { feature: 'Multiple profiles on eligible plans', liinx: true, linktree: 'Not assessed', beacons: 'Not assessed' }
      ]
    },
    pricingSection: {
      badge: 'Transparent Pricing',
      title: 'Simple plans for ambitious creators.',
      subtitle: 'Start free. Upgrade when you need custom domains, deeper analytics, and multi-profile studio rosters.',
      monthly: 'Monthly billing',
      yearly: 'Annual billing',
      yearlySave: 'Save 20%',
      startTrial: 'Start free',
      perMonth: '/ month',
      popular: 'Most Popular',
      plans: {
        starter: {
          name: 'Free',
          tagline: 'A simple place to publish your work and links.',
          features: [
            'Personalized liinx.app/@username',
            'Links, social icons, and supported blocks',
            'Supported audio and video embeds',
            'Expandable accordion folders',
            'Curated typography & theme studio',
            'Built-in newsletter capture form',
            'Profile QR code with downloadable export',
            'Basic analytics (views & click counts)',
            'Liinx does not process payments'
          ],
          ctaText: 'Start free',
          billedAnnuallyText: (p) => `billed $${p}/yr`
        },
        pro: {
          name: 'Pro',
          tagline: 'More control for growing creator businesses.',
          features: [
            'Everything in Free, plus:',
            'Connect your own custom domain (e.g. links.yourbrand.com)',
            'Multi-profile management (Up to 5 profiles included)',
            'Extract eligible links from supported captions',
            'Custom CSS styling & custom font uploads',
            'Remove Liinx branding on eligible plans',
            'Deep UTM tracking & Google Analytics / Meta Pixel',
            'Scheduling & time-release links',
            'Priority support'
          ],
          ctaText: 'Start free',
          billedAnnuallyText: (p) => `billed $${p}/yr`
        },
        studio: {
          name: 'Studio / Agency',
          tagline: 'Manage multiple pages and studio projects in one account.',
          features: [
            'Everything in Pro, plus:',
            'Up to 25 profiles / mini-sites under 1 account',
            'REST API v1 access',
            'API key management',
            'Custom domain support per profile',
            'Subscriber CSV export',
            'Form-response CSV export'
          ],
          ctaText: 'Contact Studio Team',
          billedAnnuallyText: (p) => `billed $${p}/yr`
        }
      }
    },
    faqSection: {
      badge: 'Questions & Answers',
      title: 'Everything you need to know.',
      subtitle: 'Clear answers to help you choose the right foundation for your audience.',
      openAnswer: 'Open answer',
      faqs: [
        {
          question: 'How is LIINX different from Linktree or generic link-in-bio tools?',
          answer: 'Liinx gives creators one customizable page for links, media, bookings, and newsletters, with layouts that give content more room than a basic list of buttons.'
        },
        {
          question: 'Can I connect my own custom domain?',
          answer: 'Yes. Paid plans support custom domains and subdomains. You must add the required DNS record and configure hosting and TLS.'
        },
        {
          question: 'How does Instagram caption link extraction work?',
          answer: 'Where the Instagram integration is configured and authorized, Liinx can extract eligible links from supported captions. Availability depends on account access and permissions.'
        },
        {
          question: 'Can I easily migrate my links from my existing link-in-bio?',
          answer: 'You can preview publicly available links from supported profiles, select what you want to keep, and import the selection. Some sites may block extraction.'
        },
        {
          question: 'Can I play music and videos directly on my LIINX page?',
          answer: 'You can add supported media embeds to your page. Playback and availability are controlled by the media provider, and some content may open outside your page.'
        },
        {
          question: 'Is there a free plan?',
          answer: 'Yes. You can create and publish a page on the free plan. Paid plans are charged for the billing interval you select through Stripe.'
        }
      ]
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
      badge: 'صفحة مرنة لكل ما تشاركه',
      headline: 'عالمك بالكامل.',
      headlineHighlight: 'مصمم على طريقتك.',
      subheadline: 'Liinx منصة مصغّرة تركز على التصميم للمبدعين والمحترفين والعلامات التجارية الصغيرة. أنشئ صفحة قابلة للتخصيص لروابطك ووسائطك المدعومة واشتراكاتك وحجوزات Calendly، وانشرها على liinx.app/@اسمك أو اربط نطاقاً مخصصاً في الخطط المدفوعة.',
      claimPlaceholder: 'اسمك',
      claimButton: 'أنشئ صفحتك مجاناً',
      exploreTemplates: 'استكشف القوالب',
      previewSubtitle: 'معاينة تفاعلية لقالب',
      noCreditCard: 'ابدأ بحساب مجاني',
      customDomainIncluded: 'النطاقات المخصصة في الخطط المدفوعة',
      zeroCommission: 'لا تعالج Liinx المدفوعات نيابةً عنك',
      microProof1: 'عاين صفحتك أثناء بنائها',
      microProof2: 'قوالب للمبدعين والاستوديوهات والعلامات التجارية',
      themeLabel: 'السمة:',
      customizeCta: (name) => `تخصيص صفحة ${name} في الاستوديو`
    },
    builderSection: {
      badge: 'استوديو بديهي',
      title: 'صمم بمرونة وبصرياً. بدون كود.',
      subtitle: 'بيئة عمل مرنة مصممة لصناع المحتوى والعلامات التجارية المهتمة بجمالية الخطوط، تناغم الألوان، ونسب التحويل.',
      feature1Title: 'مجلدات قابلة للطي وقوائم متعددة المستويات',
      feature1Desc: 'حافظ على صفحتك أنيقة ومنظمة. اجمع الملحقات والملفات الصحفية ومواعيد الجولات والمشاريع السابقة في مجلدات مرنة وسلسة.',
      feature2Title: 'دومين مخصص حقيقي',
      feature2Desc: 'اربط links.yourdomain.com بعد التحقق من DNS وإعداد الاستضافة وTLS.',
      feature3Title: 'تشغيل الصوت والفيديو مباشرة',
      feature3Desc: 'ضمّن مقاطع سبوتيفاي، تسجيلات ساوندكلاود، وفيديوهات يوتيوب وتيك توك لتشغيلها بسلاسة من داخل صفحتك.',
      feature4Title: 'استخراج الروابط من إنستغرام',
      feature4Desc: 'عند إعداد التكامل ومنحه الصلاحيات، استخرج الروابط المؤهلة من نصوص المنشورات المدعومة.',
      feature5Title: 'تحليلات قرارات فعلية',
      feature5Desc: 'تتبّع الزيارات ونقرات الروابط والمصادر المحيلة ووسوم الحملات.',
      ctaBarTitle: 'هل أنت مستعد للارتقاء بحضورك الرقمي؟',
      ctaBarDesc: 'ابدأ بحساب مجاني. اشترك في خطة مدفوعة عبر Stripe عند الحاجة.',
      cta: 'افتح استوديو التصميم'
    },
    templatesSection: {
      badge: 'معرض القوالب',
      title: 'مصمم ليناسب كافة المجالات الإبداعية.',
      subtitle: 'اختر تخطيطاً أولياً لأعمالك وروابطك ووسائطك وجمهورك.',
      allCategory: 'جميع القوالب',
      useTemplate: 'استخدم هذا القالب',
      previewMobile: 'معاينة',
      categories: ['جميع القوالب', 'التصميم والفن', 'الموسيقيون', 'العلامات التجارية', 'صناع المحتوى', 'البودكاست', 'الألعاب', 'العافية', 'أسلوب الحياة'],
      templates: {
        'tmpl-editorial': {
          name: 'تحريري هادئ',
          category: 'التصميم والفن',
          description: 'خطوط واسعة أنيقة، حدود دقيقة، ومساحات بيضاء بدرجة متاحف الفنون للمصورين ومنسقي المظهر.'
        },
        'tmpl-dark-sound': {
          name: 'استوديو أوبسيديان',
          category: 'الموسيقيون',
          description: 'لوحة داكنة عالية التباين مصممة خصيصاً للموسيقيين ومصممي الصوت وجداول الجولات الفنية.'
        },
        'tmpl-tokyo-brand': {
          name: 'نيون أتيليه',
          category: 'العلامات التجارية',
          description: 'لمسات نيون وتخطيطات لإطلاق المنتجات لعلامات الأزياء والمتاجر الحديثة.'
        },
        'tmpl-brutalist': {
          name: 'نيو بروتالست مونو',
          category: 'صناع المحتوى',
          description: 'حواف بارزة بسماكة ٢ بكسل، خطوط تقنية أحادية المسافة، وأصالة تصميمية نقية.'
        },
        'tmpl-wellness': {
          name: 'سكينة الطبيعة',
          category: 'العافية',
          description: 'تدرجات خضراء عضوية وعمق مهدئ لمدربي اللياقة ومدربي اليوغا وعلامات العافية الصحية.'
        },
        'tmpl-podcast': {
          name: 'بث منتصف الليل',
          category: 'البودكاست',
          description: 'درجات رمادية داكنة مع خطوط أحادية المسافة، مصمم لمقدمي البودكاست والمحاورين وصناع الصوتيات.'
        },
        'tmpl-gaming': {
          name: 'كونسول المطور المستقل',
          category: 'الألعاب',
          description: 'سمة داكنة مستوحاة من الطرفيات لاستوديوهات الألعاب وصناع البث مع تخطيطات جاهزة للملف الصحفي.'
        },
        'tmpl-lifestyle': {
          name: 'يوميات الصحراء',
          category: 'أسلوب الحياة',
          description: 'درجات صحراوية دافئة، تفاصيل سيريف راقية، وألوان ترابية لمدوني السفر وصناع محتوى أسلوب الحياة.'
        }
      }
    },
    comparisonSection: {
      badge: 'المقارنة الشفافة',
      title: 'قارن إمكانات Liinx',
      subtitle: 'راجع ما تدعمه Liinx حالياً، وما يتطلب مزوّداً خارجياً أو خطة مدفوعة.',
      featuresCol: 'المعايير والمميزات',
      liinxCol: 'LIINX',
      linktreeCol: 'Linktree',
      beaconsCol: 'Beacons',
      included: 'مشمول',
      rows: [
        { feature: 'تصميم نظيف وخالٍ تماماً من الإعلانات', liinx: true, linktree: false, beacons: false },
        { feature: 'دومين مخصص (مثل bio.yoursite.com)', liinx: true, linktree: 'غير مُقيّم', beacons: 'غير مُقيّم' },
        { feature: 'تضمينات Spotify وYouTube المدعومة', liinx: true, linktree: 'غير مُقيّم', beacons: 'غير مُقيّم' },
        { feature: 'مجلدات قابلة للطي لتقليل التمرير', liinx: true, linktree: 'غير مُقيّم', beacons: 'غير مُقيّم' },
        { feature: 'استخراج روابط Instagram عند التفويض', liinx: true, linktree: 'غير مُقيّم', beacons: 'غير مُقيّم' },
        { feature: 'روابط دفع ودعم خارجية', liinx: true, linktree: 'غير مُقيّم', beacons: 'غير مُقيّم' },
        { feature: 'أداء الصفحة يعتمد على المحتوى والاستضافة', liinx: true, linktree: 'غير مُقيّم', beacons: 'غير مُقيّم' },
        { feature: 'سمات تصميم مختارة بعناية', liinx: true, linktree: 'غير مُقيّم', beacons: 'غير مُقيّم' },
        { feature: 'إدارة ملفات متعددة في الخطط المؤهلة', liinx: true, linktree: 'غير مُقيّم', beacons: 'غير مُقيّم' }
      ]
    },
    pricingSection: {
      badge: 'أسعار واضحة',
      title: 'خطط بسيطة تمنحك الحرية الكاملة.',
      subtitle: 'ابدأ مجاناً، ورَقِّ حسابك عندما تحتاج لربط دومين مخصص، إدارة حسابات متعددة، وتحليلات أعمق.',
      monthly: 'اشتراك شهري',
      yearly: 'اشتراك سنوي',
      yearlySave: 'وفّر ٢٠٪',
      startTrial: 'ابدأ مجاناً',
      perMonth: '/ شهرياً',
      popular: 'الأكثر شعبية',
      plans: {
        starter: {
          name: 'المجانية',
          tagline: 'مساحة بسيطة لنشر أعمالك وروابطك.',
          features: [
            'رابط صفحتك liinx.app/@username',
            'روابط وأيقونات تواصل وكتل مدعومة',
            'تضمين وسائط صوتية ومرئية مدعومة',
            'مجلدات مجمعة وقابلة للطي',
            'استوديو خطوط ومظهر مصمم بعناية',
            'نموذج اشتراك في النشرة البريدية مدمج',
            'رمز QR للصفحة مع إمكانية التنزيل',
            'تحليلات أساسية (المشاهدات والنقرات)',
            'لا تعالج Liinx المدفوعات نيابةً عنك'
          ],
          ctaText: 'ابدأ مجاناً',
          billedAnnuallyText: (p) => `فاتورة سنوية $${p}/سنة`
        },
        pro: {
          name: 'المحترف',
          tagline: 'تحكم أكبر للأنشطة الإبداعية النامية.',
          features: [
            'كل مميزات الخطة المجانية، بالإضافة إلى:',
            'ربط دومين مخصص خاص بك (مثل links.yourbrand.com)',
            'إدارة حسابات متعددة (حتى 5 ملفات شخصية)',
            'استخراج الروابط المؤهلة من نصوص المنشورات المدعومة',
            'تخصيص كامل بأكواد CSS ورفع خطوط مخصصة',
            'إزالة شعار LIINX في الخطط المؤهلة',
            'تتبع UTM متقدم وربط Google Analytics / Meta Pixel',
            'جدولة الروابط وتحديد أوقات نشرها وانتهاء صلاحيتها',
            'دعم فني ذو أولوية'
          ],
          ctaText: 'ابدأ مجاناً',
          billedAnnuallyText: (p) => `فاتورة سنوية $${p}/سنة`
        },
        studio: {
          name: 'الاستوديو / الوكالات',
          tagline: 'أدر صفحات ومشاريع متعددة من حساب واحد.',
          features: [
            'كل مميزات باقة المحترف، بالإضافة إلى:',
            'حتى 25 ملفاً شخصياً أو موقعاً مصغراً ضمن حساب واحد',
            'الوصول إلى REST API v1',
            'إدارة مفاتيح API',
            'دعم نطاق مخصص لكل ملف شخصي',
            'تصدير المشتركين بصيغة CSV',
            'تصدير ردود النماذج بصيغة CSV'
          ],
          ctaText: 'تواصل مع فريق الاستوديو',
          billedAnnuallyText: (p) => `فاتورة سنوية $${p}/سنة`
        }
      }
    },
    faqSection: {
      badge: 'الأسئلة الشائعة',
      title: 'كل ما تحتاج لمعرفته.',
      subtitle: 'إجابات مباشرة وواضحة لمساعدتك في اتخاذ القرار الأمثل لحضورك الرقمي.',
      openAnswer: 'افتح الإجابة',
      faqs: [
        {
          question: 'كيف تختلف منصة LIINX عن Linktree وأدوات الروابط التقليدية الأخرى؟',
          answer: 'تمنحك Liinx صفحة واحدة قابلة للتخصيص لروابطك ووسائطك وحجوزاتك ونشرتك البريدية، مع تخطيطات تمنح المحتوى مساحة أكبر من قائمة الأزرار التقليدية.'
        },
        {
          question: 'هل يمكنني ربط دومين مخصص خاص بي؟',
          answer: 'نعم. تدعم الخطط المدفوعة النطاقات والنطاقات الفرعية المخصصة. يجب إضافة سجل DNS المطلوب وإعداد الاستضافة وTLS.'
        },
        {
          question: 'كيف يعمل استخراج الروابط من نصوص إنستغرام؟',
          answer: 'عند إعداد تكامل إنستغرام ومنحه الصلاحيات اللازمة، يمكن لـ Liinx استخراج الروابط المؤهلة من نصوص المنشورات المدعومة. يعتمد ذلك على الوصول إلى الحساب والصلاحيات.'
        },
        {
          question: 'هل يمكنني استيراد روابطي الحالية بسهولة من أدوات أخرى؟',
          answer: 'يمكنك معاينة الروابط العامة من الملفات المدعومة، واختيار ما تريد الاحتفاظ به، ثم استيراده. قد تمنع بعض المواقع استخراج محتواها.'
        },
        {
          question: 'هل يمكن تشغيل الموسيقى ومقاطع الفيديو مباشرة في صفحتي؟',
          answer: 'يمكنك إضافة مشغلات وسائط مدعومة إلى صفحتك. يتحكم مزود الوسائط في التشغيل والتوفر، وقد يفتح بعض المحتوى خارج صفحتك.'
        },
        {
          question: 'هل توجد خطة مجانية؟',
          answer: 'نعم. يمكنك إنشاء صفحة ونشرها ضمن الخطة المجانية. تُحصّل الخطط المدفوعة حسب الفترة التي تختارها عبر Stripe.'
        }
      ]
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
