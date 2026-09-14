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
      zeroCommission: '0% commission on sales',
      microProof1: 'Live canvas preview while you build',
      microProof2: '8+ distinct creative disciplines',
      themeLabel: 'Theme:',
      customizeCta: (name) => `Customize ${name}'s Page in Studio`
    },
    builderSection: {
      badge: 'Intuitive Studio',
      title: 'Build visually. No code required.',
      subtitle: 'A fluid drag-and-drop workspace engineered for creators who care deeply about aesthetics, typography, and visitor conversion.',
      feature1Title: 'Accordion Folders & Multi-Level Lists',
      feature1Desc: 'Keep your page clean and uncluttered. Collapse presets, press kits, tour dates, and archived projects into sleek expandable drawers.',
      feature2Title: 'True Custom Domain',
      feature2Desc: 'Map links.yourname.studio or bio.brand.studio directly. Free automatic SSL included with every plan.',
      feature3Title: 'Playable Audio & Video',
      feature3Desc: 'Embed playable Spotify audio tracks, Soundcloud snippets, YouTube streams, and TikTok clips directly on your page.',
      feature4Title: 'Instagram Caption Sync',
      feature4Desc: 'Post on Instagram and let LIINX automatically pull links from your captions into your bio page without manual updates.',
      feature5Title: 'Actionable Analytics',
      feature5Desc: 'Know which links convert. Track click-through rates, geographical breakdown, referral apps, and UTM campaign tags.',
      ctaBarTitle: 'Ready to elevate your creative presence?',
      ctaBarDesc: 'Set up your profile in under 2 minutes. Free 14-day trial on all pro plans.',
      cta: 'Open the Studio Builder'
    },
    templatesSection: {
      badge: 'Bespoke Gallery',
      title: 'Built for every creative discipline.',
      subtitle: 'Explore meticulously crafted design systems for photographers, producers, indie studios, writers, and digital brands.',
      allCategory: 'All Templates',
      useTemplate: 'Use this template',
      previewMobile: 'Preview',
      categories: ['All Templates', 'Design & Art', 'Musicians', 'Brands', 'Creators', 'Podcasts', 'Gaming', 'Wellness', 'Lifestyle'],
      templates: {
        'tmpl-editorial': {
          name: 'Minimalist Editorial',
          category: 'Design & Art',
          description: 'Generous typography, delicate borders, and museum-grade whitespace for photographers and stylists.'
        },
        'tmpl-dark-sound': {
          name: 'Obsidian Studio',
          category: 'Musicians',
          description: 'High-contrast dark canvas engineered for musicians, sound designers, and tour schedules.'
        },
        'tmpl-tokyo-brand': {
          name: 'Neon Atelier',
          category: 'Brands',
          description: 'Electric accents, capsule drops, and Instagram synchronization for modern apparel and retail.'
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
      title: 'Why design-conscious creators switch to LIINX',
      subtitle: 'See how LIINX compares against traditional link aggregators that force ads and charge exorbitant fees.',
      featuresCol: 'Features & Standards',
      liinxCol: 'LIINX',
      linktreeCol: 'Linktree',
      beaconsCol: 'Beacons',
      included: 'Included',
      rows: [
        { feature: 'Clean, Ad-Free Design', liinx: true, linktree: false, beacons: false },
        { feature: 'Custom Domain (e.g. bio.yoursite.com)', liinx: true, linktree: 'Paid $24+/mo', beacons: 'Paid' },
        { feature: 'Embedded Spotify & YouTube Media', liinx: true, linktree: true, beacons: true },
        { feature: 'Accordion Folders for Clean Profiles', liinx: true, linktree: false, beacons: false },
        { feature: 'Instagram Caption Auto-Sync', liinx: true, linktree: false, beacons: false },
        { feature: 'Zero Commission on Sales/Donations', liinx: true, linktree: 'Takes 0.5-9%', beacons: 'Takes 9%' },
        { feature: 'Sub-100ms Ultra-Fast Page Load', liinx: true, linktree: false, beacons: false },
        { feature: 'Bespoke Curated Design Themes', liinx: true, linktree: 'Generic templates', beacons: 'Limited' },
        { feature: 'Multi-Profile Management (One Login)', liinx: true, linktree: 'Enterprise only', beacons: false }
      ]
    },
    pricingSection: {
      badge: 'Transparent Pricing',
      title: 'Simple plans for ambitious creators.',
      subtitle: 'Start free. Upgrade when you need custom domains, deeper analytics, and multi-profile studio rosters.',
      monthly: 'Monthly billing',
      yearly: 'Annual billing',
      yearlySave: 'Save 20%',
      startTrial: 'Start 14-day free trial',
      perMonth: '/ month',
      popular: 'Most Popular',
      plans: {
        starter: {
          name: 'Starter',
          tagline: 'Everything creators need to look world-class.',
          features: [
            'Personalized liinx.co/@username',
            'Unlimited link blocks & social icons',
            'Audio & Video auto-embeds (Spotify, YouTube)',
            'Expandable accordion folders',
            'Curated typography & theme studio',
            'Built-in newsletter capture form',
            'Dynamic QR codes with logo export',
            'Basic analytics (views & click counts)',
            'Zero platform transaction fees'
          ],
          ctaText: 'Start 14-Day Free Trial',
          billedAnnuallyText: (p) => `billed $${p}/yr`
        },
        pro: {
          name: 'Pro',
          tagline: 'The gold standard for established creators & independent studios.',
          features: [
            'Everything in Starter, plus:',
            'Connect your own custom domain (e.g. links.yourbrand.com)',
            'Multi-profile management (Up to 5 profiles included)',
            'Instagram auto-sync from post captions',
            'Custom CSS styling & custom font uploads',
            'Zero LIINX branding badge (100% white-label)',
            'Deep UTM tracking & Google Analytics / Meta Pixel',
            'Scheduling & time-release links',
            'Priority 24/7 creator concierge support'
          ],
          ctaText: 'Start 14-Day Free Trial',
          billedAnnuallyText: (p) => `billed $${p}/yr`
        },
        studio: {
          name: 'Studio / Agency',
          tagline: 'Engineered for talent agencies, record labels, and multi-brand rosters.',
          features: [
            'Everything in Pro, plus:',
            'Up to 25 managed creator profiles',
            'Team collaboration & client view permissions',
            'Public REST API access for automated link sync',
            'Custom favicons & open graph social cards per link',
            'Consolidated agency billing & invoice exports',
            'Dedicated account manager & migration assistance'
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
          answer: 'LIINX is engineered specifically for design-conscious creators, artists, and independent brands. Unlike older tools that clutter your page with corporate branding, ads, and generic plastic buttons, LIINX delivers an editorial-grade experience with bespoke typography, media embeds that feel native, accordion folders to reduce scrolling friction, and custom domain support at a fraction of the cost.'
        },
        {
          question: 'Can I connect my own custom domain?',
          answer: 'Yes! On our Pro and Studio plans, you can map any custom domain or subdomain (such as links.yourdomain.com or bio.yourname.studio) with automated zero-configuration SSL certificates.'
        },
        {
          question: 'How does the Instagram Auto-Sync feature work?',
          answer: 'When enabled, LIINX connects to your Instagram account and automatically creates clickable links whenever you include a link or mention in your latest Instagram post caption or carousel. Your bio page always stays in sync without manual updates.'
        },
        {
          question: 'Can I easily migrate my links from my existing link-in-bio?',
          answer: 'Absolutely. You can import your links directly from Linktree, Beacons, or Bio.fm in less than 60 seconds using our one-click importer in the Studio Builder.'
        },
        {
          question: 'Can I play music and videos directly on my LIINX page?',
          answer: 'Yes! LIINX supports rich interactive embeds for Spotify, Apple Music, SoundCloud, YouTube, TikTok, and Vimeo. Your fans can listen to preview tracks or watch your latest music video without leaving your profile.'
        },
        {
          question: 'Is there a free trial?',
          answer: 'Yes, both Starter and Pro plans come with a full 14-day free trial. You can build and customize your profile completely for free before deciding.'
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
      zeroCommission: '٠٪ عمولة على المبيعات',
      microProof1: 'معاينة حية أثناء التصميم والبناء',
      microProof2: 'أكثر من ٨ مجالات إبداعية متخصصة',
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
      feature2Desc: 'اربط links.yourname.studio أو bio.brand.studio مباشرة مع شهادة أمان SSL مجانية وتلقائية متضمنة في جميع الخطط.',
      feature3Title: 'تشغيل الصوت والفيديو مباشرة',
      feature3Desc: 'ضمّن مقاطع سبوتيفاي، تسجيلات ساوندكلاود، وفيديوهات يوتيوب وتيك توك لتشغيلها بسلاسة من داخل صفحتك.',
      feature4Title: 'مزامنة تلقائية مع كابشن إنستغرام',
      feature4Desc: 'انشر على إنستغرام ودع المنصة تسحب الروابط المذكورة في كابشن منشوراتك تلقائياً دون الحاجة لتحديث يدوي.',
      feature5Title: 'تحليلات قرارات فعلية',
      feature5Desc: 'اعرف الروابط الأكثر تحويلاً بدقة. تتبع نسب النقر، التوزيع الجغرافي، التطبيقات المحيلة، وحملات UTM التسويقية.',
      ctaBarTitle: 'هل أنت مستعد للارتقاء بحضورك الرقمي؟',
      ctaBarDesc: 'أنشئ ملفك الشخصي في أقل من دقيقتين. تجربة مجانية لمدة ١٤ يوماً لجميع الخطط المدفوعة.',
      cta: 'افتح استوديو التصميم'
    },
    templatesSection: {
      badge: 'معرض القوالب',
      title: 'مصمم ليناسب كافة المجالات الإبداعية.',
      subtitle: 'استكشف قوالب مختارة بعناية للمصورين، الموسيقيين، المطورين، المدربين، واستوديوهات الألعاب المستقلة.',
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
          description: 'لمسات نيون مميزة، إطلاقات حصرية، ومزامنة تلقائية مع إنستغرام لعلامات الأزياء والمتاجر الحديثة.'
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
      title: 'لماذا يختار صناع المحتوى المتميزون منصة LIINX',
      subtitle: 'اكتشف الفرق الحقيقي بين LIINX وأدوات الروابط التقليدية التي تفرض إعلانات وتقتطع عمولات باهظة.',
      featuresCol: 'المعايير والمميزات',
      liinxCol: 'LIINX',
      linktreeCol: 'Linktree',
      beaconsCol: 'Beacons',
      included: 'مشمول',
      rows: [
        { feature: 'تصميم نظيف وخالٍ تماماً من الإعلانات', liinx: true, linktree: false, beacons: false },
        { feature: 'دومين مخصص (مثل bio.yoursite.com)', liinx: true, linktree: 'مدفوع ٢٤$+/شهرياً', beacons: 'مدفوع' },
        { feature: 'تضمين مشغلات سبوتيفاي ويوتيوب التفاعلية', liinx: true, linktree: true, beacons: true },
        { feature: 'مجلدات قابلة للطي لتقليل التمرير', liinx: true, linktree: false, beacons: false },
        { feature: 'مزامنة تلقائية مع كابشن إنستغرام', liinx: true, linktree: false, beacons: false },
        { feature: '٠٪ عمولة على المبيعات والتبرعات', liinx: true, linktree: 'يقتطع ٠.٥ - ٩٪', beacons: 'يقتطع ٩٪' },
        { feature: 'سرعة تحميل فائقة أقل من ١٠٠ مللي ثانية', liinx: true, linktree: false, beacons: false },
        { feature: 'سمات تصميم فاخرة ومختارة بعناية', liinx: true, linktree: 'قوالب بلاستيكية مكررة', beacons: 'محدود' },
        { feature: 'إدارة ملفات متعددة بنفس الحساب', liinx: true, linktree: 'للشركات الكبرى فقط', beacons: false }
      ]
    },
    pricingSection: {
      badge: 'أسعار واضحة',
      title: 'خطط بسيطة تمنحك الحرية الكاملة.',
      subtitle: 'ابدأ مجاناً، ورَقِّ حسابك عندما تحتاج لربط دومين مخصص، إدارة حسابات متعددة، وتحليلات أعمق.',
      monthly: 'اشتراك شهري',
      yearly: 'اشتراك سنوي',
      yearlySave: 'وفّر ٢٠٪',
      startTrial: 'ابدأ التجربة المجانية لـ ١٤ يوماً',
      perMonth: '/ شهرياً',
      popular: 'الأكثر شعبية',
      plans: {
        starter: {
          name: 'المبتدئ',
          tagline: 'كل ما يحتاجه صانع المحتوى لظهور احترافي بمستوى عالمي.',
          features: [
            'رابط مخصص liinx.co/@username',
            'عناصر وروابط وأيقونات تواصل غير محدودة',
            'تضمين تلقائي للصوت والفيديو (سبوتيفاي، يوتيوب)',
            'مجلدات مجمعة وقابلة للطي',
            'استوديو خطوط ومظهر مصمم بعناية',
            'نموذج اشتراك في النشرة البريدية مدمج',
            'رموز QR ديناميكية مع تصدير الشعار',
            'تحليلات أساسية (المشاهدات والنقرات)',
            '٠٪ رسوم معاملات على المنصة'
          ],
          ctaText: 'ابدأ التجربة المجانية لـ ١٤ يوماً',
          billedAnnuallyText: (p) => `فاتورة سنوية $${p}/سنة`
        },
        pro: {
          name: 'المحترف',
          tagline: 'المعيار الذهبي لصناع المحتوى المحترفين والاستوديوهات المستقلة.',
          features: [
            'كل مميزات باقة المبتدئ، بالإضافة إلى:',
            'ربط دومين مخصص خاص بك (مثل links.yourbrand.com)',
            'إدارة حسابات متعددة (حتى 5 ملفات شخصية)',
            'مزامنة تلقائية مع كابشن منشورات إنستغرام',
            'تخصيص كامل بأكواد CSS ورفع خطوط مخصصة',
            'إزالة شعار LIINX بالكامل (علامة بيضاء 100%)',
            'تتبع UTM متقدم وربط Google Analytics / Meta Pixel',
            'جدولة الروابط وتحديد أوقات نشرها وانتهاء صلاحيتها',
            'دعم فني مخصص ذو أولوية على مدار الساعة 24/7'
          ],
          ctaText: 'ابدأ التجربة المجانية لـ ١٤ يوماً',
          billedAnnuallyText: (p) => `فاتورة سنوية $${p}/سنة`
        },
        studio: {
          name: 'الاستوديو / الوكالات',
          tagline: 'مصمم خصيصاً لوكالات إدارة المواهب والشركات متعددة العلامات.',
          features: [
            'كل مميزات باقة المحترف، بالإضافة إلى:',
            'إدارة حتى 25 ملفاً شخصياً لصناع المحتوى',
            'صلاحيات التعاون الجماعي وعرض العملاء',
            'واجهة برمجة تطبيقات REST API للمزامنة الآلية',
            'أيقونات Favicon وبطاقات مشاركة مخصصة لكل رابط',
            'فواتير موحدة للوكالات مع إمكانية التصدير',
            'مدير حساب مخصص ومساعدة كاملة في النقل والاستيراد'
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
          answer: 'صُممت LIINX خصيصاً للمبدعين والفنانين والعلامات التجارية التي تهتم بجمالية التصميم والتفاصيل. على عكس الأدوات القديمة التي تملأ صفحتك بالإعلانات والأزرار البلاستيكية المكررة، تمنحك LIINX موقعاً مصغراً بدرجة تحريرية عالية مع خطوط راقية، وتضمين وسائط يبدو كأنه جزء أصيل من الصفحة، ومجلدات لتقليل التمرير، ودعم النطاق المخصص بتكلفة أقل بكثير.'
        },
        {
          question: 'هل يمكنني ربط دومين مخصص خاص بي؟',
          answer: 'نعم بكل تأكيد! في خطتي Pro وStudio، يمكنك ربط أي دومين أو دومين فرعي خاص بك (مثل links.yourdomain.com أو bio.yourname.studio) مع شهادة أمان SSL مجانية وتلقائية بالكامل بدون أي إعدادات معقدة.'
        },
        {
          question: 'كيف تعمل ميزة المزامنة التلقائية مع إنستغرام؟',
          answer: 'عند تفعيلها، تتصل المنصة بحسابك على إنستغرام وتقوم تلقائياً بإنشاء روابط قابلة للنقر في صفحتك عندما تذكر رابطاً في كابشن أحدث منشور أو كاروسيل لك، لتبقى صفحتك محدثة دائماً دون أي تدخل يدوي.'
        },
        {
          question: 'هل يمكنني استيراد روابطي الحالية بسهولة من أدوات أخرى؟',
          answer: 'نعم بكل سهولة، يمكنك استيراد روابطك مباشرة من Linktree أو Beacons أو Bio.fm في أقل من ٦٠ ثانية باستخدام أداة الاستيراد بنقرة واحدة داخل استوديو التصميم.'
        },
        {
          question: 'هل يمكن تشغيل الموسيقى ومقاطع الفيديو مباشرة في صفحتي؟',
          answer: 'نعم! تدعم المنصة تضمين مشغلات تفاعلية مباشرة لـ Spotify وApple Music وSoundCloud وYouTube وTikTok وVimeo، ليستمع جمهورك لمقاطعك أو يشاهد فيديوهاتك دون مغادرة ملفك الشخصي.'
        },
        {
          question: 'هل تتوفر فترة تجريبية مجانية؟',
          answer: 'نعم، تتضمن خطتا Starter وPro تجربة مجانية كاملة لمدة ١٤ يوماً. يمكنك تصميم ملفك وتخصيصه بالكامل مجاناً قبل اتخاذ أي قرار.'
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
