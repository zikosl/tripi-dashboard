import type { Metadata } from 'next';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import '../globals.css';
import '../dashboard.css';
export const metadata: Metadata = {
  title: { default: 'Tripi Dashboard', template: '%s | Tripi' },
  description: 'Manage trips, bookings, travelers, and payments with Tripi.',
  icons: {
    icon: '/tripi-dashboard-icon.png',
    apple: '/tripi-dashboard-icon.png',
  },
};
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>{children}</body>
    </html>
  );
}
