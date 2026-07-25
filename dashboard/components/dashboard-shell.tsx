'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AsyncButton } from './async-button';

type Role = 'admin' | 'organizer';

const navigation = {
  admin: [
    ['trips', 'الرحلات', 'Trips'],
    ['bookings', 'الحجوزات', 'Bookings'],
    ['organizers', 'إدارة المنظمين', 'Manage organizers'],
  ],
  organizer: [
    ['trips', 'الرحلات', 'Trips'],
    ['bookings', 'الحجوزات', 'Bookings'],
  ],
} as const;

export function DashboardShell({
  locale,
  role,
  children,
}: {
  locale: string;
  role: Role;
  children: React.ReactNode;
}) {
  const ar = locale === 'ar';
  const pathname = usePathname();
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const overview = `/${locale}/${role}`;

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';
    const controller = new AbortController();
    async function validate() {
      let accessToken = sessionStorage.getItem('tripi.accessToken');
      if (!accessToken) throw new Error('Unauthorized');
      let response = await fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}`, 'Accept-Language': locale }, signal: controller.signal });
      if (response.status === 401) {
        const refreshToken = sessionStorage.getItem('tripi.refreshToken');
        if (!refreshToken) throw new Error('Unauthorized');
        const refresh = await fetch(`${apiUrl}/auth/refresh`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({refreshToken}), signal:controller.signal });
        if (!refresh.ok) throw new Error('Unauthorized');
        const refreshed = await refresh.json() as {data?:{accessToken:string;refreshToken:string}};
        if (!refreshed.data) throw new Error('Unauthorized');
        sessionStorage.setItem('tripi.accessToken',refreshed.data.accessToken); sessionStorage.setItem('tripi.refreshToken',refreshed.data.refreshToken); accessToken=refreshed.data.accessToken;
        response=await fetch(`${apiUrl}/auth/me`,{headers:{Authorization:`Bearer ${accessToken}`,'Accept-Language':locale},signal:controller.signal});
      }
      if (!response.ok) throw new Error('Unauthorized');
      const payload = await response.json() as { data?: { role?: string } };
        const userRole = payload.data?.role;
        const allowed = role === 'admin'
          ? userRole === 'SUPER_ADMIN'
          : userRole === 'ORGANIZER_ADMIN' || userRole === 'ORGANIZER_STAFF';
        if (!allowed) throw new Error('Forbidden');
        setSessionReady(true);
    }
    void validate().catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        sessionStorage.removeItem('tripi.accessToken');
        sessionStorage.removeItem('tripi.refreshToken');
        router.replace(`/${locale}/login`);
      });

    return () => controller.abort();
  }, [locale, role, router]);

  async function logout() {
    const refreshToken = sessionStorage.getItem('tripi.refreshToken');
    if (refreshToken) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';
      await fetch(`${apiUrl}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }).catch(() => undefined);
    }
    sessionStorage.removeItem('tripi.accessToken');
    sessionStorage.removeItem('tripi.refreshToken');
    router.replace(`/${locale}/login`);
  }

  if (!sessionReady) return <main className="route-loading" aria-busy="true"><Image className="brand-icon loading-icon" src="/tripi-dashboard-icon.png" width={72} height={72} alt="" priority/><div className="brand">Tripi</div><span className="spinner large" aria-hidden="true"/><p>{ar ? 'جارٍ التحقق من الجلسة…' : 'Checking your session…'}</p></main>;

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand brand-lockup" href={overview}><Image className="brand-icon" src="/tripi-dashboard-icon.png" width={40} height={40} alt="" priority/><span>Tripi</span></Link>
        <div className="tagline">{ar ? 'لوحة تحكم تريبي' : 'Tripi Dashboard'}</div>
        <nav className="nav" aria-label={ar ? 'التنقل الرئيسي' : 'Main navigation'}>
          <Link className={pathname === overview ? 'active' : ''} href={overview}>
            {ar ? 'نظرة عامة' : 'Overview'}
          </Link>
          {navigation[role].map(([path, arabic, english]) => {
            const href = `${overview}/${path}`;
            return (
              <Link className={pathname === href ? 'active' : ''} key={path} href={href}>
                {ar ? arabic : english}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <Link href={`/${ar ? 'en' : 'ar'}${pathname.slice(3)}`}>{ar ? 'English' : 'العربية'}</Link>
          <AsyncButton className="text-button" onAction={logout} pendingLabel={ar ? 'جارٍ الخروج…' : 'Signing out…'}>{ar ? 'تسجيل الخروج' : 'Sign out'}</AsyncButton>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
