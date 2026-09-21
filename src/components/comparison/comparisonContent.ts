export interface ComparisonPoint {
  label: string;
  detail: string;
}

export const basicListPoints = (ar: boolean): ComparisonPoint[] => [
  {
    label: ar ? 'أزرار توجيه مسطحة' : 'Flat destination buttons',
    detail: ar ? 'روابط نصية تنقل الزائر خارج الصفحة دون تفاعل' : 'Simple text buttons redirecting visitors elsewhere'
  },
  {
    label: ar ? 'صفحة تمرير واحدة' : 'Single scrolling page',
    detail: ar ? 'تكدس طولي للروابط بدون صفحات فرعية أو مجلدات' : 'Single continuous scroll with no sub-pages or folder grouping'
  },
  {
    label: ar ? 'رابط المنصة الافتراضي' : 'Platform URL',
    detail: ar ? 'الاعتماد على رابط فرعي تابع للمنصة' : 'Runs on standard shared platform link URLs'
  },
  {
    label: ar ? 'تخصيص بصري أساسي' : 'Basic visual customization',
    detail: ar ? 'خيارات محدودة لتعديل الألوان والخطوط' : 'Basic preset styling and limited typography controls'
  },
  {
    label: ar ? 'تحديثات محتوى يدوية' : 'Manual content updates',
    detail: ar ? 'تعديل يدوي مستمر للروابط دون أتمتة عبر API' : 'Manual block maintenance with no API automation'
  }
];

export const raloaPoints = (ar: boolean): ComparisonPoint[] => [
  {
    label: ar ? 'كتل تفاعلية ثرية' : 'Rich interactive blocks',
    detail: ar ? 'تشغيل وسائط مدمجة (Spotify، YouTube)، نماذج حجز، وتجميع مشتركين' : 'Inline audio, video, newsletters, booking embeds, and folders'
  },
  {
    label: ar ? 'صفحات متعددة ومجلدات' : 'Pages + folders',
    detail: ar ? 'تنظيم المشاريع في صفحات فرعية ومجلدات قابلة للتوسيع' : 'Organize deep content into subpages and collapsible accordion folders'
  },
  {
    label: ar ? 'دعم النطاق الخاص' : 'Custom-domain support',
    detail: ar ? 'نشر على نطاقك الخاص (links.yourname.com) مع توجيه DNS وتشفير HTTPS بعد إعداد الاستضافة' : 'Publish on your custom domain with guided DNS verification and secure HTTPS after hosting setup'
  },
  {
    label: ar ? 'تخصيص معماري متقدم' : 'CSS/fonts/themes',
    detail: ar ? 'خطوط عربية ولاتينية منسقة، سمات معمارية دقيقة، وتحكم كامل بالهوية' : 'Curated typography, architectural dark/light themes, and custom layout styling'
  },
  {
    label: 'REST API v1',
    detail: ar ? 'قراءة بيانات الملف وإنشاء كتل الروابط أو حذفها' : 'Read profile data and create or delete link blocks'
  }
];
