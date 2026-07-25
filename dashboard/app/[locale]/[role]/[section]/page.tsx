import { notFound } from 'next/navigation';
import { DashboardShell } from '../../../../components/dashboard-shell';
import { DashboardSection } from '../../../../components/dashboard-section';

type Copy = { ar: string; en: string };
type Section = {
  title: Copy;
  description: Copy;
  action?: Copy;
  columns: Copy[];
  rows: string[][];
  metrics?: Array<[Copy, string]>;
};

const c = (ar: string, en: string): Copy => ({ ar, en });

const sections: Record<'admin' | 'organizer', Record<string, Section>> = {
  admin: {
    organizers: {
      title: c('المنظمون', 'Organizers'),
      description: c(
        'اعتماد وإدارة منظمي الرحلات وحسابات المالكين.',
        'Approve and manage travel organizers and owner accounts.',
      ),
      action: c('إضافة منظم', 'Add organizer'),
      columns: [
        c('المنظم', 'Organizer'),
        c('المدينة', 'City'),
        c('الحالة', 'Status'),
        c('العمولة', 'Commission'),
      ],
      rows: [
        ['Sahara Steps', 'Djanet', 'Approved', '8%'],
        ['Atlas Escape', 'Blida', 'Pending', '10%'],
        ['Coastline DZ', 'Oran', 'Approved', '7%'],
      ],
    },
    trips: {
      title: c('الرحلات', 'Trips'),
      description: c(
        'إنشاء الرحلات وتحريرها ونشرها وإدارة السعة.',
        'Create, edit, publish, and manage trip capacity.',
      ),
      action: c('إنشاء رحلة', 'Create trip'),
      columns: [
        c('الرحلة', 'Trip'),
        c('المنظم', 'Organizer'),
        c('الإشغال', 'Occupancy'),
        c('الحالة', 'Status'),
      ],
      rows: [],
    },
    bookings: {
      title: c('الحجوزات', 'Bookings'),
      description: c(
        'إنشاء الحجوزات وتعديلها وتأكيد الدفع من مكان واحد.',
        'Create and edit bookings, travelers, and payment from one place.',
      ),
      action: c('إنشاء حجز', 'Create booking'),
      columns: [
        c('المرجع', 'Reference'),
        c('العميل', 'Customer'),
        c('المقاعد', 'Seats'),
        c('الدفع', 'Payment'),
        c('الحالة', 'Status'),
      ],
      rows: [],
    },
    payments: {
      title: c('المدفوعات', 'Payments'),
      description: c(
        'مراجعة حالات الدفع وإثباتات التحويل والاسترداد.',
        'Review payment status, transfer proofs, and refunds.',
      ),
      columns: [
        c('المرجع', 'Reference'),
        c('الطريقة', 'Method'),
        c('المبلغ', 'Amount'),
        c('الحالة', 'Status'),
      ],
      rows: [
        ['PAY-88421', 'Bank transfer', '18,000 DZD', 'Paid'],
        ['PAY-88422', 'Payment proof', '12,500 DZD', 'Pending verification'],
        ['PAY-88423', 'Cash', '8,000 DZD', 'Unpaid'],
      ],
    },
    categories: {
      title: c('تصنيفات الرحلات', 'Trip categories'),
      description: c(
        'إدارة التصنيفات العربية والإنجليزية المستخدمة في البحث.',
        'Manage Arabic and English categories used in discovery.',
      ),
      action: c('إضافة تصنيف', 'Add category'),
      columns: [
        c('التصنيف', 'Category'),
        c('الاسم الإنجليزي', 'English name'),
        c('الرحلات', 'Trips'),
        c('الحالة', 'Status'),
      ],
      rows: [
        ['مغامرة', 'Adventure', '24', 'Active'],
        ['ثقافة', 'Culture', '13', 'Active'],
        ['شاطئ', 'Beach', '9', 'Active'],
      ],
    },
    destinations: {
      title: c('الوجهات ونقاط الانطلاق', 'Destinations & departures'),
      description: c(
        'إدارة المدن المستخدمة كوجهات أو نقاط انطلاق للرحلات.',
        'Manage cities used as trip destinations or departure points.',
      ),
      action: c('إضافة مدينة', 'Add location'),
      columns: [
        c('الوجهة', 'Destination'),
        c('الولاية', 'Province'),
        c('الرحلات', 'Trips'),
        c('الحالة', 'Status'),
      ],
      rows: [
        ['جانت / Djanet', 'Illizi', '12', 'Active'],
        ['وهران / Oran', 'Oran', '8', 'Active'],
        ['الشريعة / Chréa', 'Blida', '6', 'Active'],
      ],
    },
    complaints: {
      title: c('الشكاوى', 'Complaints'),
      description: c(
        'مراجعة شكاوى العملاء ومتابعة حلها.',
        'Review customer complaints and track resolutions.',
      ),
      columns: [
        c('الرقم', 'ID'),
        c('الموضوع', 'Subject'),
        c('المنظم', 'Organizer'),
        c('الحالة', 'Status'),
      ],
      rows: [
        ['CMP-1042', 'Departure time changed', 'Sahara Steps', 'In review'],
        ['CMP-1041', 'Refund request', 'Coastline DZ', 'Open'],
        ['CMP-1038', 'Trip information', 'Atlas Escape', 'Resolved'],
      ],
    },
    commissions: {
      title: c('إعدادات العمولات', 'Commission settings'),
      description: c(
        'ضبط نسبة عمولة المنصة الافتراضية والخاصة بكل منظم.',
        'Configure default and organizer-specific platform commission rates.',
      ),
      action: c('حفظ الإعدادات', 'Save settings'),
      columns: [
        c('النطاق', 'Scope'),
        c('النسبة', 'Rate'),
        c('آخر تعديل', 'Last updated'),
        c('الحالة', 'Status'),
      ],
      rows: [
        ['Platform default', '10%', '24 Jul 2026', 'Active'],
        ['Sahara Steps', '8%', '18 Jul 2026', 'Custom'],
        ['Coastline DZ', '7%', '12 Jul 2026', 'Custom'],
      ],
    },
    'audit-logs': {
      title: c('سجل التدقيق', 'Audit logs'),
      description: c(
        'تتبع إجراءات الإدارة والتغييرات الحساسة.',
        'Track administrative actions and sensitive changes.',
      ),
      columns: [
        c('المستخدم', 'User'),
        c('الإجراء', 'Action'),
        c('المورد', 'Resource'),
        c('الوقت', 'Time'),
      ],
      rows: [
        ['Admin User', 'Approved organizer', 'Atlas Escape', 'Today, 10:42'],
        [
          'Admin User',
          'Updated commission',
          'Sahara Steps',
          'Yesterday, 16:18',
        ],
        ['Nadia Staff', 'Suspended account', 'USR-2841', '22 Jul, 09:05'],
      ],
    },
  },
  organizer: {
    trips: {
      title: c('رحلاتي', 'My trips'),
      description: c(
        'إنشاء الرحلات وتحريرها ونشرها وإدارة السعة.',
        'Create, edit, publish, and manage trip capacity.',
      ),
      action: c('إنشاء رحلة', 'Create trip'),
      metrics: [
        [c('منشورة', 'Published'), '8'],
        [c('مسودات', 'Drafts'), '3'],
        [c('مقاعد محجوزة', 'Reserved seats'), '124'],
      ],
      columns: [
        c('الرحلة', 'Trip'),
        c('التاريخ', 'Date'),
        c('الإشغال', 'Occupancy'),
        c('الحالة', 'Status'),
      ],
      rows: [
        ['Djanet Desert Weekend', '12 Sep 2026', '18 / 22', 'Published'],
        ['Chréa Day Escape', '20 Sep 2026', '9 / 16', 'Draft'],
        ['Timimoun Oasis', '08 Oct 2026', '14 / 20', 'Published'],
      ],
    },
    bookings: {
      title: c('الحجوزات', 'Bookings'),
      description: c(
        'إنشاء الحجوزات وتعديلها وتأكيد الدفع من مكان واحد.',
        'Create and edit bookings, travelers, and payment from one place.',
      ),
      action: c('إنشاء حجز', 'Create booking'),
      columns: [
        c('المرجع', 'Reference'),
        c('العميل', 'Customer'),
        c('المقاعد', 'Seats'),
        c('الدفع', 'Payment'),
        c('الحالة', 'Status'),
      ],
      rows: [],
    },
    travelers: {
      title: c('المسافرون', 'Travelers'),
      description: c(
        'عرض قوائم الركاب وتصديرها للرحلات القادمة.',
        'View and export passenger lists for upcoming trips.',
      ),
      action: c('تصدير القائمة', 'Export list'),
      columns: [
        c('المسافر', 'Traveler'),
        c('الرحلة', 'Trip'),
        c('الهاتف', 'Phone'),
        c('الحجز', 'Booking'),
      ],
      rows: [
        [
          'Amine Benali',
          'Djanet Desert Weekend',
          '+213 555 000 121',
          'TRP-A8F4K2',
        ],
        [
          'Sara Khelifi',
          'Oran Coast Weekend',
          '+213 555 000 256',
          'TRP-N2C8L1',
        ],
        ['Lina Amari', 'Timimoun Oasis', '+213 555 000 308', 'TRP-P7D3M9'],
      ],
    },
    payments: {
      title: c('مراجعة المدفوعات', 'Payment review'),
      description: c(
        'التحقق من إثباتات الدفع وقبولها أو رفضها.',
        'Verify payment proofs and approve or reject them.',
      ),
      columns: [
        c('المرجع', 'Reference'),
        c('العميل', 'Customer'),
        c('المبلغ', 'Amount'),
        c('الحالة', 'Status'),
      ],
      rows: [
        ['PAY-88422', 'Sara K.', '12,500 DZD', 'Pending verification'],
        ['PAY-88419', 'Amine B.', '18,000 DZD', 'Paid'],
        ['PAY-88410', 'Lina A.', '24,000 DZD', 'Rejected'],
      ],
    },
    team: {
      title: c('فريق المنظم', 'Organizer team'),
      description: c(
        'إدارة أعضاء الفريق والصلاحيات.',
        'Manage team members and permissions.',
      ),
      action: c('دعوة عضو', 'Invite member'),
      columns: [
        c('العضو', 'Member'),
        c('البريد', 'Email'),
        c('الدور', 'Role'),
        c('الحالة', 'Status'),
      ],
      rows: [
        ['Karim Mansouri', 'karim@example.com', 'Owner', 'Active'],
        ['Nadia Bellal', 'nadia@example.com', 'Booking staff', 'Active'],
        ['Yacine Haddad', 'yacine@example.com', 'Trip editor', 'Invited'],
      ],
    },
    analytics: {
      title: c('التحليلات', 'Analytics'),
      description: c(
        'نظرة على الحجوزات والإيرادات وأداء الرحلات.',
        'See booking, revenue, and trip performance.',
      ),
      metrics: [
        [c('إيرادات هذا الشهر', 'Revenue this month'), '486,000 DZD'],
        [c('الحجوزات', 'Bookings'), '124'],
        [c('متوسط الإشغال', 'Average occupancy'), '78%'],
      ],
      columns: [
        c('الرحلة', 'Trip'),
        c('الحجوزات', 'Bookings'),
        c('الإشغال', 'Occupancy'),
        c('الإيرادات', 'Revenue'),
      ],
      rows: [
        ['Djanet Desert Weekend', '18', '82%', '216,000 DZD'],
        ['Timimoun Oasis', '14', '70%', '168,000 DZD'],
        ['Oran Coast Weekend', '11', '69%', '102,000 DZD'],
      ],
    },
  },
};

function value(copy: Copy, ar: boolean) {
  return ar ? copy.ar : copy.en;
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ locale: string; role: string; section: string }>;
}) {
  const { locale, role, section } = await params;
  if (
    (locale !== 'ar' && locale !== 'en') ||
    (role !== 'admin' && role !== 'organizer')
  )
    notFound();
  const allowed =
    role === 'admin'
      ? ['trips', 'bookings', 'organizers', 'categories', 'destinations']
      : ['trips', 'bookings'];
  if (!allowed.includes(section)) notFound();
  const page = sections[role][section];
  if (!page) notFound();
  const ar = locale === 'ar';

  return (
    <DashboardShell locale={locale} role={role}>
      <DashboardSection
        action={page.action ? value(page.action, ar) : undefined}
        ar={ar}
        columns={page.columns.map((column) => value(column, ar))}
        description={value(page.description, ar)}
        metrics={page.metrics?.map(([label, metric]) => ({
          label: value(label, ar),
          value: metric,
        }))}
        role={role}
        section={section}
        title={value(page.title, ar)}
      />
    </DashboardShell>
  );
}
