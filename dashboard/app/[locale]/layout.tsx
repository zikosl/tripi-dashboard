import type { Metadata } from 'next'; import '../globals.css';
export const metadata: Metadata = { title: { default: 'Tripi Dashboard', template: '%s | Tripi' }, description: 'Manage trips, bookings, travelers, and payments with Tripi.' };
export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) { const { locale } = await params; return <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}><body>{children}</body></html>; }
