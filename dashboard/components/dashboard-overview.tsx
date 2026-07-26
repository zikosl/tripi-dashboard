'use client';

import { useEffect, useState } from 'react';
import {
  IoAirplaneOutline,
  IoCalendarClearOutline,
  IoPeopleOutline,
  IoPulseOutline,
  IoTimeOutline,
  IoWalletOutline,
} from 'react-icons/io5';
import { AsyncButton } from './async-button';

type Data = {
  metrics: Record<string, number | string>;
  items: Array<Record<string, unknown>>;
};
type Envelope =
  | { success: true; data: Data }
  | { success: false; error: { message: string | string[] } };

const metricIcons = {
  organizers: IoPeopleOutline,
  trips: IoAirplaneOutline,
  bookings: IoCalendarClearOutline,
  payments: IoWalletOutline,
  revenue: IoWalletOutline,
  occupancy: IoPulseOutline,
};

export function DashboardOverview({
  locale,
  role,
}: {
  locale: string;
  role: 'admin' | 'organizer';
}) {
  const ar = locale === 'ar';
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const token = sessionStorage.getItem('tripi.accessToken');
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'}/dashboard/${role}/overview`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        const body = (await response.json()) as Envelope;
        if (!response.ok || !body.success)
          throw new Error(
            body.success ? 'Request failed' : String(body.error.message),
          );
        setData(body.data);
      })
      .catch((cause) => {
        if (!(cause instanceof DOMException && cause.name === 'AbortError'))
          setError(cause instanceof Error ? cause.message : 'Request failed');
      });
    return () => controller.abort();
  }, [revision, role]);

  if (error)
    return (
      <section className="card empty-state" role="alert">
        <strong>
          {ar ? 'تعذر تحميل لوحة التحكم' : 'Could not load the dashboard'}
        </strong>
        <p className="muted">{error}</p>
        <AsyncButton
          className="secondary-action"
          onAction={() => {
            setError(null);
            setRevision((value) => value + 1);
          }}
          pendingLabel={ar ? 'جارٍ المحاولة…' : 'Retrying…'}
        >
          {ar ? 'إعادة المحاولة' : 'Retry'}
        </AsyncButton>
      </section>
    );
  if (!data)
    return (
      <section className="grid metrics-grid" aria-busy="true">
        {[1, 2, 3, 4].map((item) => (
          <article className="card metric-placeholder" key={item} />
        ))}
      </section>
    );

  const labels =
    role === 'admin'
      ? {
          organizers: ['المنظمون النشطون', 'Active organizers'],
          trips: ['الرحلات المنشورة', 'Published trips'],
          bookings: ['الحجوزات المؤكدة', 'Confirmed bookings'],
          revenue: ['الإيرادات', 'Revenue'],
          occupancy: ['متوسط الإشغال', 'Average occupancy'],
        }
      : {
          trips: ['الرحلات القادمة', 'Upcoming trips'],
          bookings: ['الحجوزات المؤكدة', 'Confirmed bookings'],
          payments: ['دفعات للمراجعة', 'Payments to review'],
          revenue: ['الإيرادات', 'Revenue'],
          occupancy: ['متوسط الإشغال', 'Average occupancy'],
        };

  return (
    <>
      <section className="grid metrics-grid">
        {Object.entries(data.metrics).map(([key, value]) => {
          const Icon =
            metricIcons[key as keyof typeof metricIcons] ?? IoPulseOutline;
          return (
            <article className="card metric-card" key={key}>
              <div className="metric-heading">
                <span className="muted">
                  {labels[key as keyof typeof labels]?.[ar ? 0 : 1] ?? key}
                </span>
                <span className="metric-icon" aria-hidden="true">
                  <Icon />
                </span>
              </div>
              <div className="metric">{value}</div>
            </article>
          );
        })}
      </section>
      <section className="card activity-card">
        <div className="section-heading">
          <div>
            <span className="section-kicker">{ar ? 'مباشر' : 'Live'}</span>
            <h2>{ar ? 'آخر النشاطات' : 'Recent activity'}</h2>
          </div>
          <IoTimeOutline aria-hidden="true" />
        </div>
        {data.items.length ? (
          <ul className="activity-list">
            {data.items.map((item, index) => (
              <li key={String(item.id ?? index)}>
                <span className="activity-dot" aria-hidden="true" />
                <strong>
                  {String(
                    item.action ??
                      item.bookingReference ??
                      (ar ? 'نشاط تريبي' : 'Tripi activity'),
                  )}
                </strong>
                <span className="muted">
                  {item.createdAt
                    ? new Date(String(item.createdAt)).toLocaleString(locale)
                    : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            {ar ? 'لا توجد نشاطات حديثة.' : 'No recent activity.'}
          </p>
        )}
      </section>
    </>
  );
}
