'use client';

/**
 * The Support tab.
 *
 * Brief: "This tab allows notaries to connect with WiScribbles Technical
 * Support team for any issues they may be facing. It also include technical
 * manuals and videos to guide the notaries of their platform."
 *
 * Two halves: raise a ticket, and the guides. The guides are deliberately
 * declared as data rather than hardcoded markup, so adding one later is a
 * one-line change and they can move to Firestore without touching this file.
 */

import { useCallback, useEffect, useState } from 'react';
import { COLORS, RADIUS, STYLES, pill } from '@/lib/theme';

/**
 * Placeholder entries. Replace `href` as each is produced — an entry with a
 * null href renders as "coming soon" rather than a dead link, which is the
 * honest state for a platform that has not launched.
 */
const GUIDES = [
  {
    id: 'getting-started',
    kind: 'manual',
    title: 'Getting started as a notary',
    summary: 'Approval, going live, and taking your first session.',
    href: null,
  },
  {
    id: 'session-walkthrough',
    kind: 'video',
    title: 'Running a notarisation session',
    summary: 'The video call, the document, and placing your seal.',
    href: null,
  },
  {
    id: 'jurisdiction-rules',
    kind: 'manual',
    title: 'Jurisdiction rules and excluded documents',
    summary:
      'Which documents can be notarised electronically, and which must be executed on paper.',
    href: null,
  },
  {
    id: 'payouts',
    kind: 'manual',
    title: 'Getting paid',
    summary: 'How service fees are calculated and when payouts are made.',
    href: null,
  },
];

const STATUS_TONE = { open: 'info', in_progress: 'warning', resolved: 'success' };
const STATUS_LABEL = { open: 'Open', in_progress: 'In progress', resolved: 'Resolved' };

export default function SupportTab() {
  const [tickets, setTickets] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ subject: '', category: 'session', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/support/tickets', { cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      setTickets(payload.tickets ?? []);
      setCategories(payload.categories ?? []);
    } catch {
      setTickets([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setNotice(null);

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (payload.errors) setErrors(payload.errors);
        else setNotice({ tone: 'error', message: payload.message ?? 'That did not send.' });
        return;
      }

      setForm({ subject: '', category: 'session', message: '' });
      setNotice({ tone: 'ok', message: 'Sent. We will reply by email.' });
      load();
    } catch {
      setNotice({ tone: 'error', message: 'Could not reach the server.' });
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  return (
    <div style={{ maxWidth: 720 }}>
      {/* ---------------- Raise a ticket ---------------- */}
      <section className="mb-5">
        <h2 style={STYLES.sectionHeading}>Contact technical support</h2>
        <p style={{ ...STYLES.lede, fontSize: '0.88rem' }}>
          Describe what happened and we will reply by email. If you are in the
          middle of a session, say so — those are picked up first.
        </p>

        {notice && (
          <div
            className={`alert py-2 ${notice.tone === 'ok' ? 'alert-success' : 'alert-danger'}`}
            role="status"
          >
            {notice.message}
          </div>
        )}

        <form onSubmit={submit} className="mt-3">
          <div className="mb-3">
            <label className="form-label" htmlFor="support-category" style={{ fontWeight: 500 }}>
              What is this about?
            </label>
            <select
              id="support-category"
              className={`form-select ${errors.category ? 'is-invalid' : ''}`}
              value={form.category}
              onChange={update('category')}
              style={{ maxWidth: 360 }}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && <div className="invalid-feedback d-block">{errors.category}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="support-subject" style={{ fontWeight: 500 }}>
              Subject
            </label>
            <input
              id="support-subject"
              type="text"
              className={`form-control ${errors.subject ? 'is-invalid' : ''}`}
              value={form.subject}
              onChange={update('subject')}
              maxLength={140}
              placeholder="A one-line summary"
            />
            {errors.subject && <div className="invalid-feedback">{errors.subject}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="support-message" style={{ fontWeight: 500 }}>
              What happened?
            </label>
            <textarea
              id="support-message"
              className={`form-control ${errors.message ? 'is-invalid' : ''}`}
              rows={5}
              value={form.message}
              onChange={update('message')}
              maxLength={4000}
              placeholder="Include anything you saw on screen, and roughly when it happened."
            />
            {errors.message && <div className="invalid-feedback">{errors.message}</div>}
          </div>

          <button type="submit" className="btn" disabled={submitting} style={STYLES.buttonPrimary}>
            {submitting ? 'Sending…' : 'Send to support'}
          </button>
        </form>
      </section>

      {/* ---------------- Your tickets ---------------- */}
      {tickets && tickets.length > 0 && (
        <section className="mb-5">
          <h2 style={STYLES.sectionHeading}>Your tickets</h2>
          <div className="mt-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-3 mb-2" style={STYLES.card}>
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <strong style={{ fontSize: '0.95rem' }}>{ticket.subject}</strong>
                  <span style={pill(STATUS_TONE[ticket.status] ?? 'neutral')}>
                    {STATUS_LABEL[ticket.status] ?? ticket.status}
                  </span>
                </div>
                <p
                  className="mb-0 mt-1"
                  style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}
                >
                  Opened {new Date(ticket.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- Guides ---------------- */}
      <section>
        <h2 style={STYLES.sectionHeading}>Manuals and videos</h2>
        <p style={{ ...STYLES.lede, fontSize: '0.88rem' }}>
          Guides to using the platform.
        </p>

        <div className="mt-3">
          {GUIDES.map((guide) => {
            const available = Boolean(guide.href);
            return (
              <div
                key={guide.id}
                className="d-flex align-items-start gap-3 p-3 mb-2"
                style={{ ...STYLES.card, opacity: available ? 1 : 0.65 }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: 38,
                    height: 38,
                    borderRadius: RADIUS.sm,
                    background: COLORS.surface,
                    color: COLORS.brand,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  {guide.kind === 'video' ? '▶' : '📄'}
                </span>

                <div style={{ flex: 1 }}>
                  <p className="mb-1" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {available ? (
                      <a href={guide.href} target="_blank" rel="noreferrer">
                        {guide.title}
                      </a>
                    ) : (
                      guide.title
                    )}
                  </p>
                  <p className="mb-0" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                    {guide.summary}
                  </p>
                </div>

                {!available && (
                  <span style={{ ...pill('neutral'), flexShrink: 0, fontSize: '0.78rem' }}>
                    Coming soon
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
