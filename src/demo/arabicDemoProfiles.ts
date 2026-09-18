import { type CreatorProfile } from '../types';

export const ARABIC_DEMO_PROFILES: CreatorProfile[] = [
  {
    id: 'elena-rostova',
    username: 'elenarostova',
    displayName: 'إلينا روستوفا',
    bio: 'مديرة فنية ومصورة معمارية في برلين. أستكشف الضوء والمساحات البسيطة والخرسانية.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    category: 'التصميم والفنون',
    verified: true,
    themeId: 'editorial-stone',
    stats: {
      viewsThisMonth: '٤٨.٢ ألف',
      ctr: '١٩.٤٪',
      totalClicks: '٩.٣ ألف'
    },
    socials: [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'twitter', url: 'https://x.com' },
      { platform: 'youtube', url: 'https://youtube.com' },
      { platform: 'email', url: 'mailto:studio@elena.design' }
    ],
    blocks: [
      {
        id: 'b1',
        type: 'link',
        title: 'كتاب مصور جديد: "الظل والحجر"',
        subtitle: 'إصدار فاخر محدود الغلاف (متبقي ٢٠٠ نسخة فقط)',
        url: 'https://example.com/book',
        badge: 'طلب مسبق',
        highlighted: true,
        clicks: 3410
      },
      {
        id: 'b2',
        type: 'audio',
        title: 'أصداء معمارية (مكس الاستوديو)',
        artist: 'إلينا روستوفا وكياسموس',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
        platform: 'spotify'
      },
      {
        id: 'b3',
        type: 'folder',
        title: 'فلاتر لايتروم وتدرجات سينمائية LUTs',
        subtitle: '٣ حزم منسقة للتصوير المعماري والتحريري',
        items: [
          { id: 'f1', title: 'بروتاليزم برلين ٣٥ مم (.xmp)', url: 'https://example.com/lut1', subtitle: 'أحادي اللون عالي التباين' },
          { id: 'f2', title: 'حزمة ساعة كيوتو الذهبية', url: 'https://example.com/lut2', subtitle: 'نغمات عنبرية دافئة' },
          { id: 'f3', title: 'حيادي نظيف وتبسيطي ٢٠٢٥', url: 'https://example.com/lut3', subtitle: 'تشبع لوني هادئ لأعمال الاستوديو' }
        ]
      },
      {
        id: 'b4',
        type: 'header',
        title: 'المعارض والجلسات الحوارية الأخيرة'
      },
      {
        id: 'b5',
        type: 'link',
        title: 'بينالي البندقية: جناح الصمت المكاني',
        subtitle: '١٤ يونيو - ٢٨ أكتوبر ٢٠٢٥',
        url: 'https://example.com/biennale',
        badge: 'معرض',
        clicks: 1280
      },
      {
        id: 'b6',
        type: 'newsletter',
        title: 'رسائل الأحد المصورة',
        description: 'مقالة أسبوعية مصورة حول التصميم والضوء. يقرأها أكثر من ١٤ ألف صانع محتوى.',
        buttonText: 'اشترك مجاناً'
      }
    ]
  },
  {
    id: 'mateo-chen',
    username: 'mateochen',
    displayName: 'ماتيو تشين',
    bio: 'منتج موسيقى إلكترونية ومصمم صوت. تسجيلات سينث نمطي وأجواء موسيقية محيطية سينمائية.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    category: 'موسيقى',
    verified: true,
    themeId: 'obsidian-noir',
    stats: {
      viewsThisMonth: '٩٢.٦ ألف',
      ctr: '٢٤.١٪',
      totalClicks: '٢٢.٣ ألف'
    },
    socials: [
      { platform: 'spotify', url: 'https://spotify.com' },
      { platform: 'youtube', url: 'https://youtube.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'instagram', url: 'https://instagram.com' }
    ],
    blocks: [
      {
        id: 'mc1',
        type: 'audio',
        title: 'إرسال منتصف الليل (المكس الأصلي)',
        artist: 'ماتيو تشين',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop',
        platform: 'spotify'
      },
      {
        id: 'mc2',
        type: 'link',
        title: 'الجولة العالمية ٢٠٢٥: برلين، طوكيو، لندن، نيويورك',
        subtitle: 'التذاكر تنفد سريعاً لحفلات ADE وSonar',
        url: 'https://example.com/tour',
        badge: 'تذاكر',
        highlighted: true,
        clicks: 8430
      },
      {
        id: 'mc3',
        type: 'video',
        title: 'جلسة سينث مباشرة من استوديو جبال الألب السويسرية',
        videoUrl: 'https://www.youtube.com',
        thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400&auto=format&fit=crop',
        platform: 'youtube'
      },
      {
        id: 'mc4',
        type: 'link',
        title: 'حزمة عينات مجانية: "رنين تماثلي"',
        subtitle: 'أكثر من ١٥٠ عينة صوتية مسجلة بجهاز Moog Sub 37',
        url: 'https://example.com/samples',
        clicks: 4210
      },
      {
        id: 'mc5',
        type: 'newsletter',
        title: 'نادي الصوت السري لكبار الشخصيات',
        description: 'احصل على نسخ تجريبية قبل طرحها وحجز مبكر للتذاكر.',
        buttonText: 'انضم للنادي'
      }
    ]
  },
  {
    id: 'studio-noir',
    username: 'studionoir',
    displayName: 'استوديو نوار',
    bio: 'دار أزياء مستقلة تصمم أزياء متجددة من أقمشة صديقة للبيئة. باريس / طوكيو.',
    avatarUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop',
    category: 'علامات تجارية',
    verified: true,
    themeId: 'tokyo-cyber',
    stats: {
      viewsThisMonth: '١١٤.٥ ألف',
      ctr: '١٨.٧٪',
      totalClicks: '٢١.٤ ألف'
    },
    socials: [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'email', url: 'mailto:contact@studionoir.co' }
    ],
    blocks: [
      {
        id: 'sn1',
        type: 'link',
        title: 'تشكيلة خريف وشتاء ٢٥: "البنية ٠٤"',
        subtitle: 'شحن دولي سريع متوفر الآن لجميع أنحاء العالم',
        url: 'https://example.com/shop',
        badge: 'إصدار جديد',
        highlighted: true,
        clicks: 12900
      },
      {
        id: 'sn2',
        type: 'instagram_grid',
        title: 'صور الحملة ومجتمعنا',
        handle: '@studionoir',
        posts: [
          { id: 'p1', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=300&auto=format&fit=crop', likes: '4.8k', linkUrl: 'https://instagram.com' },
          { id: 'p2', imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=300&auto=format&fit=crop', likes: '6.2k', linkUrl: 'https://instagram.com' },
          { id: 'p3', imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=300&auto=format&fit=crop', likes: '3.1k', linkUrl: 'https://instagram.com' },
          { id: 'p4', imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=300&auto=format&fit=crop', likes: '8.9k', linkUrl: 'https://instagram.com' }
        ]
      },
      {
        id: 'sn3',
        type: 'link',
        title: 'صالة العرض الرئيسية في حي لو ماريه',
        subtitle: '١٢ شارع دي تورين، ٧٥٠٠٤ باريس',
        url: 'https://example.com/visit',
        clicks: 3100
      },
      {
        id: 'sn4',
        type: 'newsletter',
        title: 'سجل العملاء الخاص',
        description: 'أولوية حضور عروض أسبوع الموضة بباريس وتخفيضات العينات الخاصة.',
        buttonText: 'طلب دعوة'
      }
    ]
  },
  {
    id: 'aris-thorne',
    username: 'draristhorne',
    displayName: 'د. أريس ثورن',
    bio: 'باحث في الحوسبة المكانية ومؤسس استوديو سينثيتيكا. كاتب في الطباعة الخوارزمية والعمارة الحديثة.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
    category: 'مبدعون',
    verified: true,
    themeId: 'brutalist-mono',
    stats: {
      viewsThisMonth: '٦٧.١ ألف',
      ctr: '٢٢.٨٪',
      totalClicks: '١٥.٣ ألف'
    },
    socials: [
      { platform: 'twitter', url: 'https://x.com' },
      { platform: 'github', url: 'https://github.com' },
      { platform: 'linkedin', url: 'https://linkedin.com' },
      { platform: 'youtube', url: 'https://youtube.com' }
    ],
    blocks: [
      {
        id: 'at1',
        type: 'link',
        title: 'قراءة: "آفاق المحاذاة: ما بعد ذكاء النماذج اللغوية"',
        subtitle: 'نُشرت في مجلة ستانفورد للذكاء الاصطناعي',
        url: 'https://example.com/paper',
        badge: 'مقال',
        highlighted: true,
        clicks: 9400
      },
      {
        id: 'at2',
        type: 'folder',
        title: 'مستودعات وأوزان النماذج مفتوحة المصدر',
        subtitle: 'وكلاء مستقلون ومقاييس تقييم الذكاء الاصطناعي',
        items: [
          { id: 'rf1', title: 'محرك سينثيتيكا الأساسي (إصدار ٢.٤)', url: 'https://github.com', subtitle: 'تنسيق استدلال سريع غير متزامن' },
          { id: 'rf2', title: 'مجموعة بيانات اختبار الأمان المعرفي', url: 'https://github.com', subtitle: '١٠ آلاف مدخل لاختبارات الحماية' }
        ]
      },
      {
        id: 'at3',
        type: 'booking',
        title: 'حجز كلمة رئيسية أو استشارة خاصة',
        url: 'https://calendly.com/dr-aris-thorne/consultation'
      },
      {
        id: 'at4',
        type: 'newsletter',
        title: 'الإنساني الخوارزمي',
        description: 'مقالات نصف شهرية حول الإدراك الاصطناعي. بدون أي إعلانات ممولة.',
        buttonText: 'قراءة مجاناً'
      }
    ]
  }
];
