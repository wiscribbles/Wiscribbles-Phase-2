'use client';

/**
 * The Appointments tab.
 *
 * Brief: schedule an appointment within a maximum 24-hour window, choosing
 * between e-signature only, notarisation, and commissioning of oaths.
 *
 * The `min` and `max` on the datetime input match the server's booking horizon,
 * so the browser's own picker steers towards a valid time — but the server
 * validates independently (`lib/appointments.js`). An input attribute is a hint
 * to a browser, not a constraint on a request.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { COLORS, STYLES, pill } from '@/lib/theme';

const STATUS_TONE = {
  scheduled: 'info',
  in_session: 'warning',
  completed: 'success',
  cancelled: 'neutral',
  missed: 'danger',
};

const STATUS_LABEL = {
  scheduled: 'Scheduled',
  in_session: 'In session',
  completed: 'Completed',
  cancelled: 'Cancelled',
  missed: 'Missed',
};

/** `datetime-local` wants `YYYY-MM-DDTHH:mm` in the viewer's own timezone. */
const toLocalInput = (iso) => {
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
};

const EMPTY = {
  title: '',
  scheduledFor: '',
  serviceType: 'esign',
  jurisdiction: '',
  participants: [{ name: '', email: '' }],
};

export default function AppointmentTab() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/appointments', { cache: 'no-store' });
      if (!response.ok) return;
      setData(await response.json());
    } catch {
      setData({ appointments: [], options: null });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const bounds = useMemo(() => {
    if (!data?.options?.window) return null;
    return {
      min: toLocalInput(data.options.window.earliest),
      max: toLocalInput(data.options.window.latest),
      horizon: data.options.window.horizonHours,
    };
  }, [data?.options?.window]);

  const selectedService = data?.options?.serviceTypes?.find(
    (option) => option.value === form.serviceType,
  );

  /* A notarisation appointment in an e-signature-only jurisdiction is refused
     by the server. Showing that in the picker saves the round-trip and, more
     importantly, explains the constraint at the moment it applies. */
  const jurisdictionOptions = (data?.options?.jurisdictions ?? []).map((place) => ({
    ...place,
    blocked: Boolean(selectedService?.requiresNotarizableJurisdiction) && !place.supportsNotarization,
  }));

  const setParticipant = (index, field, value) =>
    setForm((current) => {
      const participants = [...current.participants];
      participants[index] = { ...participants[index], [field]: value };
      return { ...current, participants };
    });

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setNotice(null);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          // The input gives a local time with no zone; make the intent explicit.
          scheduledFor: new Date(form.scheduledFor).toISOString(),
          participants: form.participants.filter((person) => person.email.trim()),
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (payload.errors) setErrors(payload.errors);
        else setNotice({ tone: 'error', message: payload.message ?? 'Could not book that.' });
        return;
      }

      setForm(EMPTY);
      setShowForm(false);
      setNotice({ tone: 'ok', message: 'Appointment booked.' });
      load();
    } catch {
      setNotice({ tone: 'error', message: 'Could not reach the server.' });
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (id) => {
    await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'cancelled' }),
    });
    load();
  };

  if (!data) return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 760 }}>
      {notice && (
        <div
          className={`alert py-2 ${notice.tone === 'ok' ? 'alert-success' : 'alert-danger'}`}
          role="status"
        >
          {notice.message}
        </div>
      )}

      {!showForm && (
        <button
          type="button"
          className="btn mb-4"
          onClick={() => setShowForm(true)}
          style={STYLES.buttonPrimary}
        >
          Book an appointment
        </button>
      )}

      {showForm && (
        <form onSubmit={submit} className="p-4 mb-4" style={STYLES.card}>
          <h2 style={{ ...STYLES.sectionHeading, marginBottom: '0.25rem' }}>
            New appointment
          </h2>
          {bounds && (
            <p style={{ ...STYLES.lede, fontSize: '0.84rem', marginBottom: '1rem' }}>
              Appointments can be booked up to {bounds.horizon} hours ahead.
              Professionals come online and go offline, so a slot further out
              than that cannot be guaranteed to anyone.
            </p>
          )}

          <div className="mb-3">
            <label className="form-label" htmlFor="appt-title" style={{ fontWeight: 500 }}>
              Title
            </label>
            <input
              id="appt-title"
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Affidavit — Persaud matter"
              style={{ maxWidth: 480 }}
            />
            {errors.title && <div className="invalid-feedback">{errors.title}</div>}
          </div>

          <fieldset className="mb-3">
            <legend className="form-label" style={{ fontWeight: 500, fontSize: '1rem' }}>
              What kind of appointment?
            </legend>
            {(data.options?.serviceTypes ?? []).map((option) => (
              <div className="form-check" key={option.value}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="serviceType"
                  id={`svc-${option.value}`}
                  checked={form.serviceType === option.value}
                  onChange={() => setForm({ ...form, serviceType: option.value })}
                />
                <label className="form-check-label" htmlFor={`svc-${option.value}`}>
                  {option.label}
                  <span className="d-block" style={{ fontSize: '0.82rem', color: COLORS.inkMuted }}>
                    {option.description}
                  </span>
                </label>
              </div>
            ))}
            {errors.serviceType && (
              <div className="text-danger small mt-2">{errors.serviceType}</div>
            )}
          </fieldset>

          <div className="mb-3">
            <label className="form-label" htmlFor="appt-jurisdiction" style={{ fontWeight: 500 }}>
              Jurisdiction
            </label>
            <select
              id="appt-jurisdiction"
              className={`form-select ${errors.jurisdiction ? 'is-invalid' : ''}`}
              value={form.jurisdiction}
              onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
              style={{ maxWidth: 480 }}
            >
              <option value="">Choose…</option>
              {jurisdictionOptions.map((place) => (
                <option key={place.code} value={place.code} disabled={place.blocked}>
                  {place.name}
                  {place.blocked ? ' — e-signature only here' : ''}
                </option>
              ))}
            </select>
            {errors.jurisdiction && (
              <div className="invalid-feedback d-block">{errors.jurisdiction}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="appt-when" style={{ fontWeight: 500 }}>
              When
            </label>
            <input
              id="appt-when"
              type="datetime-local"
              className={`form-control ${errors.scheduledFor ? 'is-invalid' : ''}`}
              value={form.scheduledFor}
              min={bounds?.min}
              max={bounds?.max}
              onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
              style={{ maxWidth: 280 }}
            />
            {errors.scheduledFor && (
              <div className="invalid-feedback d-block">{errors.scheduledFor}</div>
            )}
          </div>

          <fieldset className="mb-3">
            <legend className="form-label" style={{ fontWeight: 500, fontSize: '1rem' }}>
              Who should attend?
            </legend>
            {form.participants.map((person, index) => (
              <div className="row g-2 mb-2" key={index} style={{ maxWidth: 560 }}>
                <div className="col-5">
                  <input
                    className="form-control"
                    value={person.name}
                    onChange={(e) => setParticipant(index, 'name', e.target.value)}
                    placeholder="Name"
                    aria-label={`Participant ${index + 1} name`}
                  />
                </div>
                <div className="col-7">
                  <input
                    className="form-control"
                    type="email"
                    value={person.email}
                    onChange={(e) => setParticipant(index, 'email', e.target.value)}
                    placeholder="Email address"
                    aria-label={`Participant ${index + 1} email`}
                  />
                </div>
              </div>
            ))}

            {form.participants.length < 10 && (
              <button
                type="button"
                className="btn btn-sm btn-link px-0"
                onClick={() =>
                  setForm({
                    ...form,
                    participants: [...form.participants, { name: '', email: '' }],
                  })
                }
              >
                + Add another participant
              </button>
            )}

            {errors.participants && (
              <div className="text-danger small mt-1">{errors.participants}</div>
            )}
          </fieldset>

          <div className="d-flex gap-2">
            <button type="submit" className="btn" disabled={saving} style={STYLES.buttonPrimary}>
              {saving ? 'Booking…' : 'Book appointment'}
            </button>
            <button
              type="button"
              className="btn btn-link text-muted"
              onClick={() => {
                setShowForm(false);
                setErrors({});
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <h2 style={STYLES.sectionHeading}>Your appointments</h2>

      {data.appointments?.length === 0 && (
        <p className="mt-2" style={{ color: COLORS.inkMuted }}>
          Nothing booked.
        </p>
      )}

      {data.appointments?.map((appointment) => (
        <article key={appointment.id} className="p-3 mt-2" style={STYLES.card}>
          <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <div>
              <strong style={{ fontSize: '0.98rem' }}>{appointment.title}</strong>
              <p className="mb-0 mt-1" style={{ fontSize: '0.86rem', color: COLORS.inkMuted }}>
                {new Date(appointment.scheduledFor).toLocaleString()} ·{' '}
                {appointment.jurisdiction}
                {appointment.participants?.length
                  ? ` · ${appointment.participants.length} participant${appointment.participants.length === 1 ? '' : 's'}`
                  : ''}
              </p>
            </div>
            <span style={pill(STATUS_TONE[appointment.status] ?? 'neutral')}>
              {STATUS_LABEL[appointment.status] ?? appointment.status}
            </span>
          </div>

          {appointment.status === 'scheduled' && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary mt-2"
              onClick={() => cancel(appointment.id)}
            >
              Cancel
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
