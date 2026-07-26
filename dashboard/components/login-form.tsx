'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

type Locale = 'ar' | 'en';
type AuthTokens = { accessToken: string; refreshToken: string };
type CurrentUser = {
  role: 'SUPER_ADMIN' | 'ORGANIZER_ADMIN' | 'ORGANIZER_STAFF' | 'CUSTOMER';
};
type Success<T> = { success: true; data: T };
type Failure = {
  success: false;
  error: { message: string | string[]; code: string };
};

const copy = {
  en: {
    welcome: 'Welcome to Tripi',
    title: 'Sign in',
    email: 'Email',
    password: 'Password',
    submit: 'Continue',
    submitting: 'Signing in…',
    tagline: 'Discover. Book. Travel.',
    genericError: 'Unable to sign in. Please check your details and try again.',
    customerError: 'Customer accounts must sign in through the Tripi app.',
  },
  ar: {
    welcome: 'مرحبًا بك في تريبي',
    title: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    submit: 'متابعة',
    submitting: 'جارٍ تسجيل الدخول…',
    tagline: 'اكتشف. احجز. سافر.',
    genericError: 'تعذر تسجيل الدخول. تحقق من بياناتك وحاول مرة أخرى.',
    customerError: 'يجب تسجيل دخول العملاء عبر تطبيق تريبي.',
  },
} as const;

export function LoginForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const text = copy[locale];
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

    try {
      const loginResponse = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale,
        },
        body: JSON.stringify({ email, password }),
      });
      const loginBody = (await loginResponse.json()) as
        Success<AuthTokens> | Failure;
      if (!loginResponse.ok || !loginBody.success) {
        throw new Error(readError(loginBody, text.genericError));
      }

      const meResponse = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${loginBody.data.accessToken}`,
          'Accept-Language': locale,
        },
      });
      const meBody = (await meResponse.json()) as
        Success<CurrentUser> | Failure;
      if (!meResponse.ok || !meBody.success) {
        throw new Error(readError(meBody, text.genericError));
      }

      if (meBody.data.role === 'CUSTOMER') {
        throw new Error(text.customerError);
      }

      sessionStorage.setItem('tripi.accessToken', loginBody.data.accessToken);
      sessionStorage.setItem('tripi.refreshToken', loginBody.data.refreshToken);
      const destination =
        meBody.data.role === 'SUPER_ADMIN'
          ? `/${locale}/admin`
          : `/${locale}/organizer`;
      router.replace(destination);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text.genericError);
      setSubmitting(false);
    }
  }

  return (
    <main className="login">
      <section className="card">
        <div className="login-brand">
          <Image
            className="brand-icon"
            src="/tripi-dashboard-icon.png"
            width={64}
            height={64}
            alt=""
            priority
          />
          <span className="brand">Tripi</span>
        </div>
        <p className="muted">{text.welcome}</p>
        <h1>{text.title}</h1>
        <form onSubmit={submit} aria-busy={submitting}>
          <label>
            {text.email}
            <input
              disabled={submitting}
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label>
            {text.password}
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              disabled={submitting}
              required
            />
          </label>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className={submitting ? 'is-pending' : ''}
            type="submit"
            disabled={submitting}
          >
            {submitting && <span aria-hidden="true" className="spinner" />}
            <span>{submitting ? text.submitting : text.submit}</span>
          </button>
        </form>
        <p className="muted">{text.tagline}</p>
        <Link className="login-legal-link" href={`/${locale}/privacy`}>
          {locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
        </Link>
      </section>
    </main>
  );
}

function readError(body: Success<unknown> | Failure, fallback: string) {
  if (body.success) return fallback;
  return Array.isArray(body.error.message)
    ? body.error.message.join(' ')
    : body.error.message || fallback;
}
