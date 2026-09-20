export type Guide = { path: string; title: string; summary: string; sections: { title: string; body: string }[] };

export function getGuides(ar: boolean): Guide[] {
  return ar ? [
    {
      path: '/guides/arabic-rtl-mini-site',
      title: 'كيف تبني موقعاً مصغّراً بالعربية واتجاه RTL',
      summary: 'رتّب الروابط والأعمال وطرق التواصل في صفحة عربية يسهل قراءتها على الهاتف.',
      sections: [
        { title: 'ابدأ بعنوان مفهوم ونبذة قصيرة', body: 'اكتب اسمك أو اسم نشاطك، ثم وضّح في سطر واحد ما تقدمه ومن تخدمه. استخدم كلمات يبحث عنها جمهورك بالعربية والإنجليزية إذا كان جمهورك ثنائي اللغة.' },
        { title: 'رتّب الصفحة حسب ما تريد من الزائر', body: 'ضع الإجراء الأهم أولاً، مثل مشاهدة ملف أعمال أو حجز موعد، ثم أضف الروابط الداعمة. اجمع الروابط المتقاربة في مجلدات عندما تتوفر لديك مجموعات طويلة.' },
        { title: 'راجع اتجاه الصفحة على الهاتف', body: 'اختر العربية من محدد اللغة في Liinx وعاين الصفحة في اتجاه RTL. راجع ترتيب العناوين والأزرار، واقرأ الروابط كما يراها الزائر قبل النشر.' },
        { title: 'اختبر كل وجهة قبل المشاركة', body: 'افتح كل رابط من المعاينة وتأكد من صحة عنوانه. أضف وسائط من مزود مدعوم فقط، وتأكد من إعدادات الخصوصية لدى ذلك المزود.' }
      ]
    },
    {
      path: '/guides/instagram-bio-saudi-business',
      title: 'صفحة رابط Instagram لنشاط تجاري في السعودية',
      summary: 'حوّل مساحة الرابط في Instagram إلى مدخل واضح للموقع والكتالوج والتواصل.',
      sections: [
        { title: 'اختر هدفاً واحداً للزيارة', body: 'هل تريد استقبال طلبات، عرض قائمة خدمات، أم جذب زيارات لمتجرك؟ اجعل الوجهة الأولى في الصفحة هي الإجراء الذي يخدم هذا الهدف.' },
        { title: 'أضف المعلومات التي يحتاجها العميل', body: 'اكتب وصفاً موجزاً، وأضف ساعات العمل أو نطاق الخدمة عند الحاجة. استخدم روابط مباشرة للموقع أو الكتالوج أو قناة التواصل التي يديرها نشاطك.' },
        { title: 'استخدم رابط WhatsApp بصيغة صحيحة', body: 'يمكنك إضافة رابط wa.me كوجهة عادية لزر في الصفحة. استخدم رقم الهاتف بالصيغة الدولية من دون علامة + أو مسافات، واختبر الرابط من هاتف قبل وضعه في نبذتك.' },
        { title: 'قِس ما يعمل وحدثه', body: 'راجع مشاهدات الصفحة ونقرات الروابط في تحليلات Liinx المتاحة لخُطتك. حدّث ترتيب الروابط عند تغير العروض، ولا تعرض سعراً أو توفر خدمة لم تعد قائمة.' }
      ]
    },
    {
      path: '/guides/whatsapp-business-page',
      title: 'استخدم صفحة مصغّرة مع WhatsApp Business',
      summary: 'أنشئ صفحة تعريف وروابط مستقلة، واجعل WhatsApp قناة تواصل واضحة من خلالها.',
      sections: [
        { title: 'اجعل الصفحة مرجعاً ثابتاً', body: 'ضع وصف نشاطك وروابط منتجاتك أو خدماتك ومعلومات التواصل في موقعك المصغّر. حدّث الصفحة نفسها عندما تتغير التفاصيل، بدلاً من إرسال قائمة روابط مختلفة في كل محادثة.' },
        { title: 'أضف وجهة المحادثة بنفسك', body: 'أضف رابط click-to-chat بصيغة https://wa.me/ ثم رقمك بصيغة دولية من دون + أو شرطات. Liinx يعرض الرابط كوجهة قابلة للنقر؛ المحادثة نفسها تُفتح وتُدار داخل WhatsApp.' },
        { title: 'اختبر تجربة العميل', body: 'افتح الرابط من هاتف غير مسجل في حسابك إن أمكن، وتأكد أن الرقم صحيح وأن الرسالة تصل إلى حساب النشاط المناسب. لا تضع بيانات شخصية أو وعوداً غير مؤكدة في الرسالة المعبأة مسبقاً.' },
        { title: 'افصل بين أدوات الصفحة وأدوات البيع', body: 'Liinx ينظم صفحة التعريف والروابط؛ ولا يعالج مدفوعات أو حجوزات WhatsApp. استخدم مزود الدفع أو الحجز الذي تعتمد عليه، ثم اربط وجهته من الصفحة.' }
      ]
    }
  ] : [
    {
      path: '/guides/arabic-rtl-mini-site',
      title: 'How to build an Arabic mini-site with RTL layout',
      summary: 'Organize your work, links, and contact options into an Arabic page that reads well on mobile.',
      sections: [
        { title: 'Start with a clear name and short bio', body: 'Use your name or business name, then explain what you offer and who it is for in one sentence. Include Arabic and English terms if your audience uses both.' },
        { title: 'Order the page around the visitor’s next step', body: 'Put the most useful action first, such as viewing your portfolio or booking a call, then add supporting links. Group related links into folders when the list gets long.' },
        { title: 'Review the page in RTL on a phone', body: 'Switch Liinx to Arabic and preview the page in right-to-left layout. Check heading and button order, then read every link as a visitor would before publishing.' },
        { title: 'Test every destination before sharing', body: 'Open each link from the preview and confirm its address. Add media only from supported providers, and check that provider’s privacy settings.' }
      ]
    },
    {
      path: '/guides/instagram-bio-saudi-business',
      title: 'Instagram bio page for a Saudi business',
      summary: 'Make the link in your Instagram profile a clear entry point to your website, catalog, and contact channel.',
      sections: [
        { title: 'Choose one goal for the visit', body: 'Are you collecting enquiries, showing services, or sending people to a shop? Make the first link on your page the action that supports that goal.' },
        { title: 'Add the details customers need', body: 'Write a concise description and include service areas or business hours when useful. Link directly to the website, catalog, or contact channel your business maintains.' },
        { title: 'Add a WhatsApp destination', body: 'You can add a wa.me URL as a regular link destination. Use the phone number in international format without a plus sign or spaces, and test the link on a phone before putting it in your bio.' },
        { title: 'Measure and keep the page current', body: 'Review page views and link clicks in Liinx analytics where available on your plan. Update link order when offers change, and remove prices or availability that are no longer accurate.' }
      ]
    },
    {
      path: '/guides/whatsapp-business-page',
      title: 'Use a mini-site with WhatsApp Business',
      summary: 'Keep your business details and useful links on one page, with WhatsApp as a clear contact option.',
      sections: [
        { title: 'Keep one dependable reference page', body: 'Put your business description, product or service links, and contact options on your mini-site. Update the page when details change instead of sending a different link list in every conversation.' },
        { title: 'Add your chat destination', body: 'Add a click-to-chat URL in the form https://wa.me/ followed by your number in international format without a plus sign or hyphens. Liinx displays the link as a destination; the conversation opens and is managed in WhatsApp.' },
        { title: 'Test the customer experience', body: 'Open the link on a phone, ideally from an account that is not already signed in to your business. Check that it reaches the right number and avoid putting personal data or unverified promises in a prefilled message.' },
        { title: 'Keep page tools separate from sales tools', body: 'Liinx organizes your profile and links; it does not process WhatsApp payments or bookings. Keep using your chosen payment or booking provider, then link to it from the page.' }
      ]
    }
  ]
}
