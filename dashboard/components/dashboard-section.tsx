'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  IoAdd,
  IoClose,
  IoCloudOfflineOutline,
  IoCreateOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoFilterOutline,
  IoPowerOutline,
  IoRefresh,
  IoSearchOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import { AsyncButton } from './async-button';

type Metric = { label: string; value: string };
type Item = Record<string, unknown>;
type Row = { id: string; cells: string[]; status?: string; item?: Item };
type Field = { name: string; label: string; type?: string; required?: boolean };
type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string | string[] } };
type CatalogOption = {
  id: string;
  name?: string;
  translations?: Array<{ locale: string; name?: string; title?: string }>;
  city?: string;
};

const createFields: Record<string, Field[]> = {
  'admin/organizers': [
    ...fields([
      'name',
      'slug',
      'email',
      'city',
      'ownerFirstName',
      'ownerLastName',
      'ownerEmail',
    ]),
    {
      name: 'ownerPassword',
      label: 'Owner password',
      type: 'password',
      required: true,
    },
  ],
  'admin/categories': fields(['slug', 'nameAr', 'nameEn', 'icon']),
  'admin/destinations': fields([
    'slug',
    'nameAr',
    'nameEn',
    'city',
    'stateOrProvince',
  ]),
  'admin/complaints': fields([
    'subject',
    'description',
    'organizerId',
    'bookingId',
  ]),
  'organizer/trips': [
    ...fields([
      'titleAr',
      'titleEn',
      'descriptionAr',
      'descriptionEn',
      'slug',
      'categoryId',
      'destinationId',
      'departureCity',
    ]),
    {
      name: 'startAt',
      label: 'Start date',
      type: 'datetime-local',
      required: true,
    },
    {
      name: 'endAt',
      label: 'End date',
      type: 'datetime-local',
      required: true,
    },
    {
      name: 'bookingDeadline',
      label: 'Booking deadline',
      type: 'datetime-local',
      required: true,
    },
    {
      name: 'pricePerPerson',
      label: 'Price per person',
      type: 'number',
      required: true,
    },
    {
      name: 'totalSeats',
      label: 'Total seats',
      type: 'number',
      required: true,
    },
  ],
  'admin/trips': [
    ...fields([
      'titleAr',
      'titleEn',
      'descriptionAr',
      'descriptionEn',
      'slug',
      'organizerId',
      'categoryId',
      'destinationId',
      'departureCity',
    ]),
    {
      name: 'startAt',
      label: 'Start date',
      type: 'datetime-local',
      required: true,
    },
    {
      name: 'endAt',
      label: 'End date',
      type: 'datetime-local',
      required: true,
    },
    {
      name: 'bookingDeadline',
      label: 'Booking deadline',
      type: 'datetime-local',
      required: true,
    },
    {
      name: 'pricePerPerson',
      label: 'Price per person',
      type: 'number',
      required: true,
    },
    {
      name: 'totalSeats',
      label: 'Total seats',
      type: 'number',
      required: true,
    },
  ],
  'admin/bookings': [
    ...fields(['customerEmail', 'tripId']),
    { name: 'seatCount', label: 'Seat count', type: 'number', required: true },
    { name: 'paymentMethod', label: 'Payment method', required: true },
  ],
  'organizer/bookings': [
    ...fields(['customerEmail', 'tripId']),
    { name: 'seatCount', label: 'Seat count', type: 'number', required: true },
    { name: 'paymentMethod', label: 'Payment method', required: true },
  ],
  'organizer/team': [
    ...fields(['firstName', 'lastName', 'email']),
    {
      name: 'password',
      label: 'Temporary password',
      type: 'password',
      required: true,
    },
  ],
};
const editFields: Record<string, Field[]> = {
  organizers: [
    ...fields(['name', 'email', 'city']),
    { name: 'commissionRate', label: 'Commission rate', type: 'number' },
  ],
  categories: fields(['slug', 'nameAr', 'nameEn', 'icon']),
  destinations: fields(['slug', 'nameAr', 'nameEn', 'city', 'stateOrProvince']),
  trips: [
    ...fields([
      'titleAr',
      'titleEn',
      'descriptionAr',
      'descriptionEn',
      'departureCity',
    ]),
    { name: 'startAt', label: 'Start date', type: 'datetime-local' },
    { name: 'endAt', label: 'End date', type: 'datetime-local' },
    {
      name: 'bookingDeadline',
      label: 'Booking deadline',
      type: 'datetime-local',
    },
    { name: 'pricePerPerson', label: 'Price per person', type: 'number' },
    { name: 'totalSeats', label: 'Total seats', type: 'number' },
  ],
  bookings: [
    { name: 'organizerNotes', label: 'Organizer notes', required: false },
    { name: 'status', label: 'Booking status' },
  ],
};

export function DashboardSection({
  title,
  description,
  action,
  columns,
  metrics,
  ar,
  role,
  section,
}: {
  title: string;
  description: string;
  action?: string;
  columns: string[];
  metrics?: Metric[];
  ar: boolean;
  role: 'admin' | 'organizer';
  section: string;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [rows, setRows] = useState<Row[]>([]);
  const [liveMetrics, setLiveMetrics] = useState(metrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [preview, setPreview] = useState<Row | null>(null);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [catalog, setCatalog] = useState<{
    categories: CatalogOption[];
    destinations: CatalogOption[];
    organizers: CatalogOption[];
    trips: CatalogOption[];
  }>({ categories: [], destinations: [], organizers: [], trips: [] });
  const key = `${role}/${section}`;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{
        items?: Item[];
        metrics?: Record<string, unknown>;
      }>(`${apiUrl}/dashboard/${key}`);
      setRows(
        (data.items ?? []).map((item) => {
          const row = formatRow(section, item, ar);
          row.item = item;
          if (section === 'bookings')
            row.cells.splice(3, 0, String(item.paymentStatus ?? 'UNPAID'));
          return row;
        }),
      );
      if (data.metrics)
        setLiveMetrics(
          Object.entries(data.metrics).map(([label, value]) => ({
            label: humanize(label),
            value: money(value),
          })),
        );
    } catch (cause) {
      setError(message(cause, ar));
    } finally {
      setLoading(false);
    }
  }, [apiUrl, ar, key, section]);
  useEffect(() => {
    void load();
  }, [load, revision]);
  useEffect(() => {
    if (!modal) return;
    if (section === 'trips') {
      Promise.all([
        api<CatalogOption[]>(`${apiUrl}/public/categories`),
        api<CatalogOption[]>(`${apiUrl}/public/destinations`),
        role === 'admin'
          ? api<{ items: CatalogOption[] }>(
              `${apiUrl}/dashboard/admin/organizers`,
            ).then((value) => value.items)
          : Promise.resolve([]),
      ])
        .then(([categories, destinations, organizers]) =>
          setCatalog((value) => ({
            ...value,
            categories,
            destinations,
            organizers,
          })),
        )
        .catch((cause) => setError(message(cause, ar)));
    }
    if (section === 'bookings') {
      api<{ items: CatalogOption[] }>(`${apiUrl}/dashboard/${role}/trips`)
        .then((value) =>
          setCatalog((current) => ({ ...current, trips: value.items })),
        )
        .catch((cause) => setError(message(cause, ar)));
    }
  }, [apiUrl, ar, modal, role, section]);
  const statuses = useMemo(
    () =>
      [...new Set(rows.map((row) => row.status).filter(Boolean))] as string[],
    [rows],
  );
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const q = query.trim().toLowerCase();
        return (
          (!q || row.cells.some((cell) => cell.toLowerCase().includes(q))) &&
          (status === 'all' || row.status === status)
        );
      }),
    [query, rows, status],
  );

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = Object.fromEntries(
      new FormData(event.currentTarget),
    );
    for (const name of [
      'pricePerPerson',
      'totalSeats',
      'seatCount',
      'commissionRate',
    ])
      if (name in body) body[name] = Number(body[name]);
    if (section === 'bookings' && !editing) {
      body.travelers = Array.from(
        { length: Number(body.seatCount) },
        (_, index) => ({
          firstName: String(body[`travelerFirstName${index}`] ?? ''),
          lastName: String(body[`travelerLastName${index}`] ?? ''),
        }),
      );
      for (const name of Object.keys(body))
        if (
          name.startsWith('travelerFirstName') ||
          name.startsWith('travelerLastName')
        )
          delete body[name];
    }
    try {
      await api(
        editing
          ? `${apiUrl}/dashboard/${section}/${editing.id}`
          : `${apiUrl}/dashboard/${key}`,
        { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) },
      );
      setModal(false);
      setEditing(null);
      setNotice(ar ? 'تم الحفظ بنجاح.' : 'Saved successfully.');
      setRevision((value) => value + 1);
    } catch (cause) {
      setError(message(cause, ar));
    } finally {
      setSaving(false);
    }
  }
  async function exportRows() {
    const csv = [columns, ...filtered.map((row) => row.cells)]
      .map((row) =>
        row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','),
      )
      .join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv' }),
    );
    link.download = `tripi-${section}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  async function statusAction(row: Row) {
    if (section === 'commissions') {
      const entered = window.prompt(
        ar
          ? 'أدخل نسبة العمولة من 0 إلى 100'
          : 'Enter a commission rate from 0 to 100',
        row.cells[1]?.replace('%', ''),
      );
      if (entered === null) return;
      const commissionRate = Number(entered);
      if (
        !Number.isFinite(commissionRate) ||
        commissionRate < 0 ||
        commissionRate > 100
      )
        throw new Error(
          ar ? 'نسبة العمولة غير صالحة.' : 'Invalid commission rate.',
        );
      await api(`${apiUrl}/dashboard/admin/organizers/${row.id}/commission`, {
        method: 'PATCH',
        body: JSON.stringify({ commissionRate }),
      });
      setRevision((value) => value + 1);
      return;
    }
    const next = nextStatus(section, row.status);
    if (!next) return;
    await api(`${apiUrl}/dashboard/${resource(section)}/${row.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    setRevision((value) => value + 1);
  }
  async function performStatus(row: Row) {
    setError(null);
    try {
      await statusAction(row);
      setNotice(ar ? 'تم تحديث الحالة.' : 'Status updated.');
    } catch (cause) {
      setNotice(null);
      setError(message(cause, ar));
    }
  }
  async function removeBooking(row: Row) {
    if (
      !window.confirm(
        ar
          ? 'حذف هذا الحجز نهائيًا؟ سيتم تحرير المقاعد المحجوزة.'
          : 'Permanently delete this booking? Reserved seats will be released.',
      )
    )
      return;
    setError(null);
    try {
      await api(`${apiUrl}/dashboard/bookings/${row.id}`, { method: 'DELETE' });
      setNotice(ar ? 'تم حذف الحجز.' : 'Booking deleted.');
      setRevision((value) => value + 1);
    } catch (cause) {
      setError(message(cause, ar));
    }
  }
  const formFields = editing ? editFields[section] : createFields[key];
  const exportable = section === 'travelers';

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          <p className="muted">{description}</p>
        </div>
        {action && (createFields[key] || exportable) && (
          <AsyncButton
            className="primary-action"
            onAction={
              exportable
                ? exportRows
                : () => {
                    setError(null);
                    setEditing(null);
                    setModal(true);
                  }
            }
            pendingLabel={ar ? 'جارٍ التنفيذ…' : 'Working…'}
          >
            {exportable ? (
              <IoDownloadOutline aria-hidden="true" />
            ) : (
              <IoAdd aria-hidden="true" />
            )}
            {action}
          </AsyncButton>
        )}
      </header>
      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button
            aria-label={ar ? 'إغلاق' : 'Dismiss'}
            className="notice-close"
            onClick={() => setNotice(null)}
            type="button"
          >
            <IoClose aria-hidden="true" />
          </button>
        </div>
      )}
      {liveMetrics && (
        <section className="grid metrics-grid">
          {liveMetrics.map((metric) => (
            <article className="card" key={metric.label}>
              <span className="muted">{metric.label}</span>
              <div className="metric">{metric.value}</div>
            </article>
          ))}
        </section>
      )}
      <section className="card table-card">
        <div className="table-tools">
          <label className="search-field">
            <span className="sr-only">{ar ? 'بحث' : 'Search'}</span>
            <IoSearchOutline aria-hidden="true" className="field-icon" />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ar ? 'بحث في النتائج…' : 'Search results…'}
              type="search"
              value={query}
            />
          </label>
          <label className="filter-field">
            <IoFilterOutline aria-hidden="true" className="field-icon" />
            <select
              aria-label={ar ? 'تصفية الحالة' : 'Filter status'}
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
              {statuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <span className="result-count" aria-live="polite">
            {ar ? `${filtered.length} نتيجة` : `${filtered.length} results`}
          </span>
        </div>
        {loading ? (
          <TableSkeleton columns={columns.length} />
        ) : error && !modal ? (
          <div className="empty-state" role="alert">
            <IoCloudOfflineOutline aria-hidden="true" className="empty-icon" />
            <strong>{error}</strong>
            <p className="muted">
              {ar
                ? 'تحقق من الاتصال وحاول مجددًا.'
                : 'Check the connection and try again.'}
            </p>
            <AsyncButton
              className="secondary-action"
              onAction={load}
              pendingLabel={ar ? 'جارٍ المحاولة…' : 'Retrying…'}
            >
              <IoRefresh aria-hidden="true" />
              {ar ? 'إعادة المحاولة' : 'Retry'}
            </AsyncButton>
          </div>
        ) : filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                  {hasStatusAction(section) && (
                    <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    {row.cells.map((cell, index) => (
                      <td key={index}>
                        {index === row.cells.length - 1 ? (
                          <span className="badge">{cell}</span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                    {hasStatusAction(section) && (
                      <td>
                        <div className="row-actions">
                          {section === 'bookings' && (
                            <button
                              className="row-action secondary-action"
                              onClick={() => setPreview(row)}
                              type="button"
                            >
                              <IoEyeOutline aria-hidden="true" />
                              {ar ? 'معاينة' : 'Preview'}
                            </button>
                          )}
                          {editFields[section] && (
                            <button
                              className="row-action secondary-action"
                              onClick={() => {
                                setError(null);
                                setEditing(row);
                                setModal(true);
                              }}
                              type="button"
                            >
                              <IoCreateOutline aria-hidden="true" />
                              {ar ? 'تعديل' : 'Edit'}
                            </button>
                          )}
                          <AsyncButton
                            className="row-action"
                            onAction={() => performStatus(row)}
                            pendingLabel="…"
                          >
                            <IoPowerOutline aria-hidden="true" />
                            {actionLabel(section, row.status, ar)}
                          </AsyncButton>
                          {section === 'bookings' && (
                            <AsyncButton
                              className="row-action danger-action"
                              onAction={() => removeBooking(row)}
                              pendingLabel="…"
                            >
                              <IoTrashOutline aria-hidden="true" />
                              {ar ? 'حذف' : 'Delete'}
                            </AsyncButton>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <strong>{ar ? 'لا توجد نتائج' : 'No results found'}</strong>
            <p className="muted">
              {rows.length
                ? ar
                  ? 'جرّب تغيير البحث أو عامل التصفية.'
                  : 'Try changing your search or filter.'
                : ar
                  ? 'لا توجد بيانات في هذا القسم بعد.'
                  : 'There is no data in this section yet.'}
            </p>
            {rows.length > 0 && (
              <button
                className="secondary-action"
                onClick={() => {
                  setQuery('');
                  setStatus('all');
                }}
                type="button"
              >
                {ar ? 'مسح التصفية' : 'Clear filters'}
              </button>
            )}
          </div>
        )}
      </section>
      {modal && formFields && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => !saving && setModal(false)}
        >
          <section
            aria-modal="true"
            className="modal card"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header>
              <h2>{editing ? (ar ? 'تعديل' : 'Edit') : action}</h2>
              <button
                aria-label={ar ? 'إغلاق' : 'Close'}
                className="modal-close"
                disabled={saving}
                onClick={() => {
                  setModal(false);
                  setEditing(null);
                }}
                type="button"
              >
                <IoClose aria-hidden="true" />
              </button>
            </header>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <form onSubmit={create}>
              {formFields.map((field) => (
                <label key={field.name}>
                  {translated(field.label, ar)}
                  {field.name === 'categoryId' ? (
                    <Select
                      name={field.name}
                      options={catalog.categories}
                      placeholder={ar ? 'اختر تصنيفًا' : 'Select a category'}
                      ar={ar}
                      disabled={saving}
                    />
                  ) : field.name === 'destinationId' ? (
                    <Select
                      name={field.name}
                      options={catalog.destinations}
                      placeholder={ar ? 'اختر وجهة' : 'Select a destination'}
                      ar={ar}
                      disabled={saving}
                    />
                  ) : field.name === 'departureCity' ? (
                    <Select
                      name={field.name}
                      options={catalog.destinations}
                      placeholder={
                        ar ? 'اختر نقطة الانطلاق' : 'Select a departure point'
                      }
                      ar={ar}
                      disabled={saving}
                      valueKey="city"
                      defaultValue={
                        editing
                          ? editValue(editing.item, field.name)
                          : undefined
                      }
                    />
                  ) : field.name === 'organizerId' ? (
                    <Select
                      name={field.name}
                      options={catalog.organizers}
                      placeholder={ar ? 'اختر منظمًا' : 'Select an organizer'}
                      ar={ar}
                      disabled={saving}
                    />
                  ) : field.name === 'tripId' ? (
                    <Select
                      name={field.name}
                      options={catalog.trips}
                      placeholder={ar ? 'اختر رحلة' : 'Select a trip'}
                      ar={ar}
                      disabled={saving}
                    />
                  ) : field.name === 'paymentMethod' ? (
                    <select disabled={saving} name={field.name} required>
                      <option value="">
                        {ar ? 'اختر طريقة الدفع' : 'Select payment method'}
                      </option>
                      <option value="CASH">{ar ? 'نقدًا' : 'Cash'}</option>
                      <option value="BANK_TRANSFER">
                        {ar ? 'تحويل بنكي' : 'Bank transfer'}
                      </option>
                      <option value="PAYMENT_PROOF">
                        {ar ? 'إثبات دفع' : 'Payment proof'}
                      </option>
                    </select>
                  ) : field.name === 'status' ? (
                    <select
                      defaultValue={String(
                        editing?.item?.status ?? 'PENDING_PAYMENT',
                      )}
                      disabled={saving}
                      name="status"
                    >
                      <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
                      <option value="PAYMENT_REVIEW">PAYMENT REVIEW</option>
                      <option value="CONFIRMED">CONFIRMED / PAID</option>
                      <option value="CANCELLED_BY_ORGANIZER">CANCELLED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  ) : (
                    <input
                      defaultValue={
                        editing
                          ? editValue(editing.item, field.name)
                          : undefined
                      }
                      disabled={saving}
                      min={field.name === 'seatCount' ? 1 : undefined}
                      name={field.name}
                      onChange={
                        field.name === 'seatCount'
                          ? (event) =>
                              setBookingSeats(
                                Math.max(1, Number(event.target.value) || 1),
                              )
                          : undefined
                      }
                      required={field.required !== false}
                      type={field.type ?? 'text'}
                    />
                  )}
                </label>
              ))}
              {section === 'bookings' && !editing && (
                <fieldset className="travelers-fields">
                  <legend>
                    {ar ? 'بيانات المسافرين' : 'Traveler information'}
                  </legend>
                  {Array.from({ length: bookingSeats }, (_, index) => (
                    <div className="traveler-row" key={index}>
                      <strong>
                        {ar ? `المسافر ${index + 1}` : `Traveler ${index + 1}`}
                        {index === 0 ? (ar ? ' · الرئيسي' : ' · Primary') : ''}
                      </strong>
                      <label>
                        {ar ? 'الاسم' : 'First name'}
                        <input
                          disabled={saving}
                          name={`travelerFirstName${index}`}
                          required
                        />
                      </label>
                      <label>
                        {ar ? 'اللقب' : 'Last name'}
                        <input
                          disabled={saving}
                          name={`travelerLastName${index}`}
                          required
                        />
                      </label>
                    </div>
                  ))}
                </fieldset>
              )}
              <button
                className={saving ? 'is-pending' : ''}
                disabled={saving}
                type="submit"
              >
                {saving && <span aria-hidden="true" className="spinner" />}
                <span>
                  {saving
                    ? ar
                      ? 'جارٍ الحفظ…'
                      : 'Saving…'
                    : ar
                      ? 'حفظ'
                      : 'Save'}
                </span>
              </button>
            </form>
          </section>
        </div>
      )}
      {preview && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setPreview(null)}
        >
          <section
            aria-modal="true"
            className="modal card booking-preview"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header>
              <div>
                <span className="muted">
                  {ar ? 'مرجع الحجز' : 'Booking reference'}
                </span>
                <h2>{String(preview.item?.bookingReference ?? preview.id)}</h2>
              </div>
              <button
                aria-label={ar ? 'إغلاق' : 'Close'}
                className="modal-close"
                onClick={() => setPreview(null)}
                type="button"
              >
                <IoClose aria-hidden="true" />
              </button>
            </header>
            <PreviewDetails ar={ar} item={preview.item ?? {}} />
          </section>
        </div>
      )}
    </>
  );
}

function PreviewDetails({ item, ar }: { item: Item; ar: boolean }) {
  const customer = item.customer as Item | undefined;
  const trip = item.trip as Item | undefined;
  const translations = (trip?.translations as Item[] | undefined) ?? [];
  const travelers = (item.travelers as Item[] | undefined) ?? [];
  const payments = (item.payments as Item[] | undefined) ?? [];
  const detail = (label: string, value: unknown) => (
    <div>
      <span className="muted">{label}</span>
      <strong>{String(value ?? '—')}</strong>
    </div>
  );
  return (
    <div className="preview-content">
      <div className="preview-grid">
        {detail(
          ar ? 'العميل' : 'Customer',
          `${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`,
        )}
        {detail(ar ? 'البريد' : 'Email', customer?.email)}
        {detail(
          ar ? 'الرحلة' : 'Trip',
          translations.find((value) => value.locale === (ar ? 'AR' : 'EN'))
            ?.title,
        )}
        {detail(ar ? 'المقاعد' : 'Seats', item.seatCount)}
        {detail(ar ? 'الحالة' : 'Status', item.status)}
        {detail(ar ? 'الدفع' : 'Payment', item.paymentStatus)}
        {detail(
          ar ? 'الإجمالي' : 'Total',
          `${item.totalAmount ?? 0} ${item.currency ?? ''}`,
        )}
        {detail(
          ar ? 'تاريخ الإنشاء' : 'Created',
          new Date(String(item.createdAt)).toLocaleString(
            ar ? 'ar-DZ' : 'en-DZ',
          ),
        )}
      </div>
      <section>
        <h3>{ar ? 'المسافرون' : 'Travelers'}</h3>
        <div className="preview-list">
          {travelers.map((traveler, index) => (
            <div key={String(traveler.id ?? index)}>
              <strong>{`${traveler.firstName ?? ''} ${traveler.lastName ?? ''}`}</strong>
              <span className="muted">
                {traveler.isPrimary
                  ? ar
                    ? 'المسافر الرئيسي'
                    : 'Primary traveler'
                  : ar
                    ? `المسافر ${index + 1}`
                    : `Traveler ${index + 1}`}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3>{ar ? 'المدفوعات' : 'Payments'}</h3>
        <div className="preview-list">
          {payments.map((payment, index) => (
            <div key={String(payment.id ?? index)}>
              <strong>{`${payment.amount ?? 0} ${payment.currency ?? ''}`}</strong>
              <span className="muted">{`${payment.method ?? ''} · ${payment.status ?? ''}`}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function fields(names: string[]): Field[] {
  return names.map((name) => ({
    name,
    label: humanize(name),
    required: ![
      'city',
      'stateOrProvince',
      'icon',
      'organizerId',
      'bookingId',
    ].includes(name),
  }));
}
async function api<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const token = sessionStorage.getItem('tripi.accessToken');
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!response.ok || !envelope.success)
    throw new Error(
      envelope.success
        ? 'Request failed'
        : Array.isArray(envelope.error.message)
          ? envelope.error.message.join(' ')
          : envelope.error.message,
    );
  return envelope.data;
}
function formatRow(section: string, item: Item, ar: boolean): Row {
  const id = String(item.id ?? crypto.randomUUID());
  const text = (value: unknown) => String(value ?? '—');
  const translations =
    (item.translations as Array<Record<string, unknown>> | undefined) ?? [];
  const title = (locale: string) =>
    text(
      translations.find((t) => t.locale === locale)?.title ??
        translations.find((t) => t.locale === locale)?.name ??
        translations[0]?.title ??
        translations[0]?.name,
    );
  const customer = item.customer as Record<string, unknown> | undefined;
  const organizer = item.organizer as Record<string, unknown> | undefined;
  const booking = item.booking as Record<string, unknown> | undefined;
  const user = item.user as Record<string, unknown> | undefined;
  const trip = item.trip as Record<string, unknown> | undefined;
  const tripTranslations =
    (trip?.translations as Array<Record<string, unknown>> | undefined) ?? [];
  const status = text(item.status);
  switch (section) {
    case 'organizers':
      return {
        id,
        cells: [
          text(item.name),
          text(item.city),
          status,
          text(item.commissionRate) + '%',
        ],
        status,
      };
    case 'trips':
      return {
        id,
        cells: [
          title(ar ? 'AR' : 'EN'),
          text(
            organizer?.name ??
              new Date(String(item.startAt)).toLocaleDateString(),
          ),
          item.totalSeats
            ? `${text(item.reservedSeats)} / ${text(item.totalSeats)}`
            : new Date(String(item.startAt)).toLocaleDateString(),
          status,
        ],
        status,
      };
    case 'bookings':
      return {
        id,
        cells: [
          text(item.bookingReference),
          `${text(customer?.firstName)} ${text(customer?.lastName)}`,
          text(item.seatCount),
          status,
        ],
        status,
      };
    case 'payments':
      return {
        id,
        cells: [
          text((booking as Record<string, unknown>)?.bookingReference),
          text(item.method),
          `${text(item.amount)} ${text(item.currency)}`,
          status,
        ],
        status,
      };
    case 'categories':
      return {
        id,
        cells: [
          title('AR'),
          title('EN'),
          text((item._count as Record<string, unknown>)?.trips),
          item.isActive ? 'Active' : 'Inactive',
        ],
        status: item.isActive ? 'Active' : 'Inactive',
      };
    case 'destinations':
      return {
        id,
        cells: [
          `${title('AR')} / ${title('EN')}`,
          text(item.stateOrProvince),
          text((item._count as Record<string, unknown>)?.trips),
          item.isActive ? 'Active' : 'Inactive',
        ],
        status: item.isActive ? 'Active' : 'Inactive',
      };
    case 'complaints':
      return {
        id,
        cells: [
          id.slice(0, 8),
          text(item.subject),
          text(item.organizerId),
          status,
        ],
        status,
      };
    case 'commissions':
      return {
        id,
        cells: [
          text(item.name),
          text(item.commissionRate) + '%',
          new Date(String(item.updatedAt)).toLocaleDateString(),
          status,
        ],
        status,
      };
    case 'audit-logs':
      return {
        id,
        cells: [
          text(item.actorUserId),
          text(item.action),
          `${text(item.resourceType)} ${text(item.resourceId)}`,
          new Date(String(item.createdAt)).toLocaleString(),
        ],
      };
    case 'travelers':
      return {
        id,
        cells: [
          `${text(item.firstName)} ${text(item.lastName)}`,
          text(
            tripTranslations.find((t) => t.locale === (ar ? 'AR' : 'EN'))
              ?.title,
          ),
          text(item.phone),
          text(booking?.bookingReference),
        ],
      };
    case 'team':
      return {
        id,
        cells: [
          `${text(user?.firstName)} ${text(user?.lastName)}`,
          text(user?.email),
          text(user?.role),
          text(user?.status),
        ],
        status: text(user?.status),
      };
    case 'analytics':
      return {
        id,
        cells: [
          title(ar ? 'AR' : 'EN'),
          text((item._count as Record<string, unknown>)?.bookings),
          item.totalSeats
            ? `${Math.round((Number(item.reservedSeats) / Number(item.totalSeats)) * 100)}%`
            : '0%',
          `${Number(item.pricePerPerson) * Number(item.reservedSeats)} ${text(item.currency)}`,
        ],
      };
    default:
      return { id, cells: Object.values(item).slice(0, 4).map(text), status };
  }
}
function resource(section: string) {
  return section;
}
function hasStatusAction(section: string) {
  return [
    'organizers',
    'trips',
    'bookings',
    'payments',
    'categories',
    'destinations',
    'complaints',
    'commissions',
    'team',
  ].includes(section);
}
function nextStatus(section: string, status?: string) {
  if (section === 'organizers')
    return status === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
  if (section === 'trips')
    return status === 'DRAFT' ? 'PUBLISHED' : 'CANCELLED';
  if (section === 'bookings')
    return status === 'CONFIRMED' ? 'CANCELLED_BY_ORGANIZER' : 'CONFIRMED';
  if (section === 'payments') return status === 'PAID' ? 'REFUNDED' : 'PAID';
  if (section === 'categories' || section === 'destinations')
    return status === 'Active' ? 'INACTIVE' : 'ACTIVE';
  if (section === 'team') return status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  if (section === 'complaints')
    return status === 'RESOLVED' ? 'IN_REVIEW' : 'RESOLVED';
}
function actionLabel(section: string, status: string | undefined, ar: boolean) {
  if (section === 'commissions') return ar ? 'تعديل' : 'Edit';
  const next = nextStatus(section, status);
  const labels: Record<string, [string, string]> = {
    APPROVED: ['اعتماد', 'Approve'],
    SUSPENDED: ['تعليق', 'Suspend'],
    PUBLISHED: ['نشر', 'Publish'],
    CANCELLED: ['إلغاء', 'Cancel'],
    CONFIRMED: ['تأكيد', 'Confirm'],
    CANCELLED_BY_ORGANIZER: ['إلغاء', 'Cancel'],
    PAID: ['قبول', 'Approve'],
    REFUNDED: ['استرداد', 'Refund'],
    ACTIVE: ['تفعيل', 'Activate'],
    INACTIVE: ['تعطيل', 'Deactivate'],
    DISABLED: ['تعطيل', 'Disable'],
    RESOLVED: ['حل', 'Resolve'],
    IN_REVIEW: ['إعادة الفتح', 'Reopen'],
  };
  return labels[next ?? '']?.[ar ? 0 : 1] ?? (ar ? 'تحديث' : 'Update');
}
function humanize(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (letter) => letter.toUpperCase());
}
function translated(value: string, ar: boolean) {
  if (!ar) return value;
  const labels: Record<string, string> = {
    Name: 'الاسم',
    Slug: 'الرابط المختصر',
    Email: 'البريد الإلكتروني',
    City: 'المدينة',
    'Name Ar': 'الاسم بالعربية',
    'Name En': 'الاسم بالإنجليزية',
    'State Or Province': 'الولاية',
    Subject: 'الموضوع',
    Description: 'الوصف',
    'Organizer Id': 'معرف المنظم',
    'Booking Id': 'معرف الحجز',
    'Title Ar': 'العنوان بالعربية',
    'Title En': 'العنوان بالإنجليزية',
    'Description Ar': 'الوصف بالعربية',
    'Description En': 'الوصف بالإنجليزية',
    'Category Id': 'معرف التصنيف',
    'Destination Id': 'معرف الوجهة',
    'Departure City': 'مدينة الانطلاق',
    'Start date': 'تاريخ البداية',
    'End date': 'تاريخ النهاية',
    'Booking deadline': 'آخر أجل للحجز',
    'Price per person': 'السعر للفرد',
    'Total seats': 'عدد المقاعد',
    'First Name': 'الاسم',
    'Last Name': 'اللقب',
    'Temporary password': 'كلمة المرور المؤقتة',
  };
  return labels[value] ?? value;
}
function message(cause: unknown, ar: boolean) {
  return cause instanceof Error
    ? cause.message
    : ar
      ? 'حدث خطأ غير متوقع.'
      : 'An unexpected error occurred.';
}
function money(value: unknown) {
  return typeof value === 'object' && value !== null
    ? String(value)
    : String(value ?? 0);
}
function catalogName(option: CatalogOption, ar: boolean) {
  const translation = option.translations?.find(
    (item) => item.locale === (ar ? 'AR' : 'EN'),
  );
  return (
    translation?.name ??
    translation?.title ??
    option.name ??
    option.city ??
    option.id
  );
}
function Select({
  name,
  options,
  placeholder,
  ar,
  disabled,
  valueKey = 'id',
  defaultValue,
}: {
  name: string;
  options: CatalogOption[];
  placeholder: string;
  ar: boolean;
  disabled: boolean;
  valueKey?: 'id' | 'city';
  defaultValue?: string;
}) {
  return (
    <select
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
      required
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option
          key={option.id}
          value={
            valueKey === 'city'
              ? (option.city ?? catalogName(option, false))
              : option.id
          }
        >
          {catalogName(option, ar)}
        </option>
      ))}
    </select>
  );
}
function editValue(item: Item | undefined, name: string) {
  if (!item) return '';
  const translations =
    (item.translations as Array<Record<string, unknown>> | undefined) ?? [];
  const map: Record<string, unknown> = {
    titleAr: translations.find((value) => value.locale === 'AR')?.title,
    titleEn: translations.find((value) => value.locale === 'EN')?.title,
    nameAr: translations.find((value) => value.locale === 'AR')?.name,
    nameEn: translations.find((value) => value.locale === 'EN')?.name,
    descriptionAr: translations.find((value) => value.locale === 'AR')
      ?.description,
    descriptionEn: translations.find((value) => value.locale === 'EN')
      ?.description,
  };
  const value = map[name] ?? item[name] ?? '';
  if (['startAt', 'endAt', 'bookingDeadline'].includes(name) && value)
    return new Date(String(value)).toISOString().slice(0, 16);
  return String(value);
}
function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="table-skeleton" aria-busy="true">
      {Array.from({ length: 4 }, (_, row) => (
        <div className="skeleton-row" key={row}>
          {Array.from({ length: columns }, (_, column) => (
            <span key={column} />
          ))}
        </div>
      ))}
    </div>
  );
}
