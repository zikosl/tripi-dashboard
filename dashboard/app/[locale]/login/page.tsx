import { LoginForm } from '../../../components/login-form';

export default async function Login({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LoginForm locale={locale === 'ar' ? 'ar' : 'en'} />;
}
