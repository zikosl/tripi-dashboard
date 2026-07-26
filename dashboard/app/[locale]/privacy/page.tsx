import type { Metadata } from 'next';
import Link from 'next/link';
import {
  IoArrowBack,
  IoArrowForward,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Tripi collects, uses, and protects personal data.',
};

const content = {
  en: {
    title: 'Privacy Policy',
    intro:
      'This policy explains how Tripi collects, uses, stores, and protects personal information when you use our customer application, organizer portal, and related services.',
    updated: 'Last updated: July 26, 2026',
    back: 'Back to sign in',
    switchLanguage: 'العربية',
    sections: [
      [
        '1. Who we are',
        'Tripi is a bilingual group-travel marketplace connecting customers with local travel organizers. Tripi provides the technology used to discover trips, make and manage bookings, and coordinate traveler information.',
      ],
      [
        '2. Information we collect',
        'We may collect account information such as your name, email address, phone number, language preference, and authentication details; booking and traveler information; trip, organizer, and customer-support records; payment status and payment evidence; uploaded files; and technical information such as IP address, device, browser, app version, security logs, and interaction data.',
      ],
      [
        '3. How we use information',
        'We use information to create and secure accounts, display and manage trips, process bookings, provide traveler details to the relevant organizer, verify payment status, send service messages, provide support, prevent fraud and misuse, improve reliability and accessibility, meet legal obligations, and protect Tripi, organizers, travelers, and the public.',
      ],
      [
        '4. How information is shared',
        'Booking and traveler information is shared with the organizer responsible for the selected trip. We may also share limited information with infrastructure, hosting, security, analytics, payment, or communication providers that process it on our instructions. We may disclose information when required by law or when necessary to protect rights, safety, and service integrity. We do not sell personal information.',
      ],
      [
        '5. Legal basis and consent',
        'Depending on the context, we process information to perform our contract with you, take requested pre-contract steps, comply with legal obligations, protect legitimate interests, or based on your consent. Where consent is required, you may withdraw it, without affecting processing already performed lawfully.',
      ],
      [
        '6. Storage and retention',
        'Information is retained only for as long as needed for the purposes described here, including booking fulfillment, accounting, dispute resolution, fraud prevention, security, and legal compliance. Retention periods may differ by record type. Data that is no longer required is deleted, anonymized, or securely isolated.',
      ],
      [
        '7. Security',
        'We use reasonable organizational and technical safeguards, including access controls, authentication, encrypted transport, backups, logging, and restricted administrative access. No service can guarantee absolute security, so you should protect your credentials and notify Tripi promptly if you suspect unauthorized access.',
      ],
      [
        '8. Your choices and rights',
        'Subject to applicable law, you may request access to, correction of, deletion of, or restriction or objection to certain processing of your personal information. You may also withdraw consent and request information about how your data is used. Some records may need to be retained when required by law or for legitimate claims.',
      ],
      [
        '9. Children',
        'Tripi accounts are not intended to be created independently by children. A parent, guardian, or authorized adult should provide and manage information for a minor traveler where permitted.',
      ],
      [
        '10. International processing',
        'If information is processed outside Algeria, Tripi will apply appropriate safeguards and follow applicable requirements for transferring personal data.',
      ],
      [
        '11. Changes to this policy',
        'We may update this policy when our services or legal obligations change. The current version and effective date will remain available on this page. Material changes may also be communicated through Tripi.',
      ],
      [
        '12. Contact and complaints',
        'To submit a privacy request or complaint, use the official Tripi support channel shown in the application or organizer portal. You may also have the right to contact Algeria’s National Authority for the Protection of Personal Data (ANPDP).',
      ],
    ],
  },
  ar: {
    title: 'سياسة الخصوصية',
    intro:
      'توضح هذه السياسة كيفية جمع تريبي للمعلومات الشخصية واستخدامها وحفظها وحمايتها عند استعمال تطبيق العملاء وبوابة المنظم والخدمات المرتبطة بهما.',
    updated: 'آخر تحديث: 26 يوليو 2026',
    back: 'العودة إلى تسجيل الدخول',
    switchLanguage: 'English',
    sections: [
      [
        '1. من نحن',
        'تريبي منصة ثنائية اللغة للرحلات الجماعية تربط العملاء بمنظمي الرحلات المحليين. توفر تريبي التقنية اللازمة لاكتشاف الرحلات وإجراء الحجوزات وإدارتها وتنسيق معلومات المسافرين.',
      ],
      [
        '2. المعلومات التي نجمعها',
        'قد نجمع معلومات الحساب مثل الاسم والبريد الإلكتروني ورقم الهاتف واللغة وبيانات المصادقة، ومعلومات الحجوزات والمسافرين، وسجلات الرحلات والمنظمين ودعم العملاء، وحالة الدفع وإثباتاته، والملفات المرفوعة، ومعلومات تقنية مثل عنوان IP والجهاز والمتصفح وإصدار التطبيق وسجلات الأمان وبيانات التفاعل.',
      ],
      [
        '3. كيفية استخدام المعلومات',
        'نستخدم المعلومات لإنشاء الحسابات وتأمينها، وعرض الرحلات وإدارتها، ومعالجة الحجوزات، وتزويد منظم الرحلة المختار ببيانات المسافرين، والتحقق من حالة الدفع، وإرسال رسائل الخدمة، وتقديم الدعم، ومنع الاحتيال وإساءة الاستخدام، وتحسين الموثوقية وإمكانية الوصول، والوفاء بالالتزامات القانونية، وحماية تريبي والمنظمين والمسافرين والجمهور.',
      ],
      [
        '4. مشاركة المعلومات',
        'تُشارك معلومات الحجز والمسافرين مع المنظم المسؤول عن الرحلة المختارة. وقد نشارك معلومات محدودة مع مزودي الاستضافة والبنية التحتية والأمان والتحليلات والدفع أو الاتصالات الذين يعالجونها وفق تعليماتنا. وقد نكشف المعلومات إذا ألزمنا القانون أو لحماية الحقوق والسلامة وسلامة الخدمة. لا نبيع المعلومات الشخصية.',
      ],
      [
        '5. الأساس القانوني والموافقة',
        'بحسب السياق، نعالج المعلومات لتنفيذ العقد معك، أو اتخاذ خطوات طلبتها قبل التعاقد، أو الامتثال لالتزام قانوني، أو حماية مصالح مشروعة، أو بناءً على موافقتك. وعندما تكون الموافقة مطلوبة، يمكنك سحبها دون أن يؤثر ذلك في المعالجة التي تمت بصورة مشروعة قبل السحب.',
      ],
      [
        '6. الحفظ ومدة الاحتفاظ',
        'نحتفظ بالمعلومات فقط للمدة اللازمة للأغراض الموضحة هنا، ومنها تنفيذ الحجوزات والمحاسبة وتسوية النزاعات ومنع الاحتيال والأمان والامتثال القانوني. وقد تختلف المدة باختلاف نوع السجل. تُحذف البيانات غير اللازمة أو تُجعل مجهولة الهوية أو تُعزل بأمان.',
      ],
      [
        '7. الأمان',
        'نطبق ضمانات تنظيمية وتقنية معقولة تشمل التحكم في الوصول والمصادقة والنقل المشفر والنسخ الاحتياطي والتسجيل وتقييد صلاحيات الإدارة. لا توجد خدمة تضمن الأمان المطلق، لذلك عليك حماية بيانات الدخول وإبلاغ تريبي سريعًا عند الاشتباه في وصول غير مصرح به.',
      ],
      [
        '8. خياراتك وحقوقك',
        'وفقًا للقانون المعمول به، يمكنك طلب الوصول إلى معلوماتك الشخصية أو تصحيحها أو حذفها، أو تقييد بعض أوجه معالجتها أو الاعتراض عليها. ويمكنك كذلك سحب الموافقة وطلب معلومات عن كيفية استخدام بياناتك. قد نضطر إلى الاحتفاظ ببعض السجلات إذا تطلب القانون ذلك أو لحماية مطالبات مشروعة.',
      ],
      [
        '9. الأطفال',
        'حسابات تريبي غير مخصصة ليُنشئها الأطفال بصورة مستقلة. ينبغي لولي أو وصي أو شخص بالغ مخول تقديم معلومات المسافر القاصر وإدارتها حيث يسمح القانون.',
      ],
      [
        '10. المعالجة الدولية',
        'إذا عولجت المعلومات خارج الجزائر، فستطبق تريبي الضمانات المناسبة وتتبع المتطلبات المعمول بها لنقل البيانات الشخصية.',
      ],
      [
        '11. تعديل السياسة',
        'قد نحدّث هذه السياسة عند تغير خدماتنا أو التزاماتنا القانونية. تبقى النسخة الحالية وتاريخ سريانها متاحين في هذه الصفحة، وقد نبلغك أيضًا عبر تريبي بالتغييرات الجوهرية.',
      ],
      [
        '12. التواصل والشكاوى',
        'لتقديم طلب أو شكوى تتعلق بالخصوصية، استخدم قناة دعم تريبي الرسمية الظاهرة في التطبيق أو بوابة المنظم. وقد يحق لك أيضًا التواصل مع السلطة الوطنية لحماية المعطيات ذات الطابع الشخصي في الجزائر.',
      ],
    ],
  },
} as const;

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ar = locale === 'ar';
  const text = content[ar ? 'ar' : 'en'];
  const BackIcon = ar ? IoArrowForward : IoArrowBack;

  return (
    <main className="legal-page">
      <nav className="legal-nav" aria-label={ar ? 'التنقل' : 'Navigation'}>
        <Link className="legal-brand" href={`/${locale}/login`}>
          <span className="legal-mark">
            <IoShieldCheckmarkOutline />
          </span>
          <span>Tripi</span>
        </Link>
        <Link className="language-link" href={`/${ar ? 'en' : 'ar'}/privacy`}>
          {text.switchLanguage}
        </Link>
      </nav>
      <article className="legal-document">
        <header className="legal-hero">
          <span className="legal-label">Tripi</span>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
          <time dateTime="2026-07-26">{text.updated}</time>
        </header>
        <div className="legal-sections">
          {text.sections.map(([title, body]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{body}</p>
            </section>
          ))}
        </div>
        <footer className="legal-footer">
          <Link href={`/${locale}/login`}>
            <BackIcon aria-hidden="true" />
            {text.back}
          </Link>
          <span>© 2026 Tripi</span>
        </footer>
      </article>
    </main>
  );
}
