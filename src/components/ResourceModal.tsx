import React from 'react';
import { Modal } from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { brand } from '../config/brand';
export type ResourceDocType = 'privacy' | 'terms' | 'security' | 'dns-guide' | 'switch-linktree' | 'creator-handbook' | 'brand-assets' | 'api-docs' | 'support';
interface ResourceModalProps { isOpen: boolean; initialDoc: ResourceDocType; onClose: () => void; onNavigate?: (view: 'home' | 'builder' | 'templates' | 'pricing') => void; }
export function ResourceModal({ isOpen, initialDoc, onClose }: ResourceModalProps) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const docs: Record<ResourceDocType, { title: string; body: string; href?: string }> = {
    privacy: { title: ar ? 'الخصوصية' : 'Privacy', body: ar ? 'راجع تفاصيل البيانات المخزنة والخدمات الخارجية.' : 'Read about stored data and third-party services.', href: '/privacy' },
    terms: { title: ar ? 'شروط الاستخدام' : 'Terms', body: ar ? 'راجع شروط استخدام الخدمة والفوترة.' : 'Read service usage and billing terms.', href: '/terms' },
    security: { title: ar ? 'الأمان' : 'Security', body: ar ? 'تُجزّأ كلمات المرور باستخدام bcrypt ومفاتيح API باستخدام SHA-256. تتحقق واجهات الإدارة من ملكية الحساب. يعتمد تشفير التخزين والنسخ الاحتياطي وHTTPS على إعداد الاستضافة؛ لا نقدّم ادعاء اعتماد امتثال.' : 'Passwords use bcrypt hashes and API keys use SHA-256 hashes. Management endpoints check account ownership. Storage encryption, backups and HTTPS depend on hosting configuration; no compliance certification is claimed.' },
    'dns-guide': { title: ar ? 'إعداد النطاق' : 'Domain setup', body: ar ? 'أضف سجل CNAME إلى الهدف أدناه ثم احفظ النطاق وتحقق منه في إعدادات الاستوديو. يجب أيضاً إعداد النطاق وشهادة TLS لدى مزوّد الاستضافة؛ فحص DNS لا يصدر شهادة.' : 'Add a CNAME to the target below, then save and verify your domain in Studio settings. The hosting provider must also configure the domain and TLS certificate; DNS verification does not issue a certificate.' },
    'switch-linktree': { title: ar ? 'استيراد الروابط' : 'Import links', body: ar ? 'افتح أداة الاستيراد في الاستوديو، أدخل رابط صفحتك العامة، راجع الروابط واختر ما تريد حفظه. قد تمنع بعض المواقع قراءة محتواها.' : 'Open the importer in Studio, enter your public page URL, review the extracted links and select which to save. Some websites may block extraction.', href: '/studio' },
    'creator-handbook': { title: ar ? 'دليل الصفحة' : 'Page guide', body: ar ? 'ضع أهم رابط أولاً، واجمع الروابط الثانوية في مجلدات. اختبر صفحتك المنشورة على الهاتف وتحقق من وجهة كل رابط.' : 'Put your most important link first and group secondary links in folders. Test your published page on a phone and verify each destination.', href: '/studio' },
    'brand-assets': { title: ar ? 'الهوية البصرية' : 'Brand identity', body: ar ? 'تستخدم الواجهة ألواناً محايدة مع لون كهرماني للإبراز. تُدار هوية المنتج في إعداد مركزي.' : 'The interface uses neutral colors with an amber accent. Product identity is maintained in a central configuration.' },
    'api-docs': { title: ar ? 'واجهة REST API' : 'REST API', body: ar ? 'أنشئ مفتاحاً من إعدادات خطة Studio. أرسل المفتاح في ترويسة Authorization: Bearer. استخدم GET /api/v1/profile لقراءة الملف، وPOST /api/v1/blocks لإضافة كتلة، وDELETE /api/v1/blocks/:id لحذفها. لا تشارك المفتاح.' : 'Generate a key in Studio-plan settings. Send it in the Authorization: Bearer header. Use GET /api/v1/profile to read your profile, POST /api/v1/blocks to create a block and DELETE /api/v1/blocks/:id to delete one. Keep your key private.' },
    support: { title: ar ? 'تواصل معنا' : 'Contact us', body: ar ? 'أرسل استفسارك عبر نموذج التواصل. يتم حفظ الرسالة؛ لا يوجد وقت استجابة مضمون.' : 'Send your question through the contact form. Messages are saved; no response time is guaranteed.', href: '/contact' }
  };
  const doc = docs[initialDoc];
  return <Modal open={isOpen} onClose={onClose} label={doc.title}>
    <div className="p-6 space-y-5">
      <h2 className="text-xl font-bold">{doc.title}</h2>
      <p className="text-sm leading-7">{doc.body}</p>
      {initialDoc === 'dns-guide' && <code className="block break-all">{brand.cnameTarget}</code>}
      {doc.href && <a className="block underline min-h-11" href={doc.href}>{ar ? 'فتح الصفحة' : 'Open page'}</a>}
      <button className="w-full min-h-11 rounded-full bg-neutral-900 text-white" onClick={onClose}>{ar ? 'إغلاق' : 'Close'}</button>
    </div>
  </Modal>;
}
