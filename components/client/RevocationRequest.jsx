'use client';

/**
 * Asking for a document to be revoked.
 *
 * The notice comes first and is not collapsible, because the single most
 * likely misunderstanding is that paying the fee buys the outcome. It does
 * not: it buys the review. Saying so before the form, rather than in small
 * print beside the button, is the difference between a client who is informed
 * and one who has a complaint.
 */

import { useCallback, useEffect, useState } from 'react';
import { COLORS, RADIUS, STYLES, pill } from '@/lib/theme';

const TONE = {
  submitted: 'info',
  under_review: 'warning',
  granted: 'danger',
  refused: 'neutral',
  withdrawn: 'neutral',
};

export default function RevocationRequest({ documentId = '' }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ documentId, ground: '', reason: '' });
  const [accepted, setAccepted] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [mine, files] = await Promise.all([
        fetch('/api/revocations', { cache: 'no-store' }),
        fetch('/api/files', { cache: 'no-store' }),
      ]);

      if (mine.ok) setData(await mine.json());

      if (files.ok) {
        const payload = await files.json();
        /* Only executed documents can be withdrawn — there is nothing to
           withdraw from a draft. Filtered here as well as refused server-side,
           so the dropdown does not offer something that will be rejected. */
        setDocuments(
          (payload.documents ?? []).filter((d) => ['signed', 'notarised'].includes(d.status)),
        );
      }
    } catch {
      setNotice({ tone: 'error', message: 'Could not load this page. Reload to try again.' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setNotice(null);

    try {
      const response = await fetch('/api/revocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, noticeVersion: data.options.notice.version }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (payload.field) setErrors({ [payload.field]: payload.message });
        else setNotice({ tone: 'error', message: payload.message ?? 'That did not go through.' });
        return;
      }

      setForm({ documentId: '', ground: '', reason: '' });
      setAccepted(false);
      setNotice({
        tone: 'ok',
        message:
          'Received. Every party to the document has been notified that ' +
          'revocation was requested, and you will be told the outcome.',
      });
      load();
    } catch {
      setNotice({ tone: 'error', message: 'Could not reach the server.' });
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async (id) => {
    await fetch('/api/revocations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  };

  if (!data) return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;

  const { notice: text, fee, grounds } = data.options;
  const ready = form.documentId && form.ground && form.reason.trim().length >= 20 && accepted;

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

      {/* ---- the notice, first and not collapsible ---- */}
      <section
        className="p-4 mb-4"
        style={{ ...STYLES.card, background: COLORS.warningBg, borderLeft: `4px solid ${COLORS.warning}` }}
      >
        <h2 style={{ ...STYLES.sectionHeading, marginBottom: '0.5rem', color: COLORS.warningText }}>
          {text.heading}
        </h2>
        <ul className="mb-0" style={{ fontSize: '0.9rem', lineHeight: 1.75, color: COLORS.warningText }}>
          {text.points.map((point, index) => (
            <li key={index} className="mb-2">
              {point}
            </li>
          ))}
        </ul>
      </section>

      <div className="p-3 mb-4 d-flex justify-content-between align-items-center gap-3 flex-wrap" style={STYLES.card}>
        <div>
          <strong style={{ fontSize: '0.95rem' }}>
            {fee.currency} {fee.amount.toLocaleString()}
          </strong>
          <p className="mb-0 mt-1" style={{ fontSize: '0.82rem', color: COLORS.inkMuted, maxWidth: '58ch' }}>
            {fee.note}
          </p>
        </div>
        <span style={pill('neutral')}>Review fee</span>
      </div>

      {documents.length === 0 ? (
        <div className="p-3 mb-4" style={{ ...STYLES.card, background: COLORS.surface }}>
          <p className="mb-0" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle }}>
            You have no executed documents. Only a document that has been signed
            or notarised can be withdrawn — there is nothing to withdraw from a
            draft.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="p-4 mb-4" style={STYLES.card}>
          <div className="mb-3">
            <label className="form-label" htmlFor="rr-document" style={{ fontWeight: 500 }}>
              Which document?
            </label>
            <select
              id="rr-document"
              className={`form-select ${errors.documentId ? 'is-invalid' : ''}`}
              value={form.documentId}
              onChange={(e) => setForm({ ...form, documentId: e.target.value })}
              style={{ maxWidth: 480 }}
            >
              <option value="">Choose…</option>
              {documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.name}
                </option>
              ))}
            </select>
            {errors.documentId && <div className="invalid-feedback d-block">{errors.documentId}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="rr-ground" style={{ fontWeight: 500 }}>
              On what ground?
            </label>
            <select
              id="rr-ground"
              className={`form-select ${errors.ground ? 'is-invalid' : ''}`}
              value={form.ground}
              onChange={(e) => setForm({ ...form, ground: e.target.value })}
              style={{ maxWidth: 480 }}
            >
              <option value="">Choose…</option>
              {grounds.map((ground) => (
                <option key={ground.value} value={ground.value}>
                  {ground.label}
                </option>
              ))}
            </select>
            {errors.ground && <div className="invalid-feedback d-block">{errors.ground}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="rr-reason" style={{ fontWeight: 500 }}>
              Why should it be withdrawn?
            </label>
            <textarea
              id="rr-reason"
              className={`form-control ${errors.reason ? 'is-invalid' : ''}`}
              rows={5}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              maxLength={2000}
              placeholder="What happened, when you found out, and anything that supports it."
            />
            {errors.reason ? (
              <div className="invalid-feedback d-block">{errors.reason}</div>
            ) : (
              <p className="mb-0 mt-1" style={{ fontSize: '0.82rem', color: COLORS.inkMuted }}>
                Read by the Website Manager and shown to the other parties to
                the document.
              </p>
            )}
          </div>

          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="rr-accept"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="rr-accept">
              I understand that WiScribbles decides, that the fee pays for the
              review and not the outcome, and that a revocation cannot be undone.
            </label>
          </div>
          {errors.notice && <div className="text-danger small mb-2">{errors.notice}</div>}

          <button type="submit" className="btn" disabled={!ready || saving} style={STYLES.buttonPrimary}>
            {saving ? 'Sending…' : 'Request revocation'}
          </button>
        </form>
      )}

      {data.requests?.length > 0 && (
        <section>
          <h2 style={STYLES.sectionHeading}>Requests on your documents</h2>
          <p style={{ ...STYLES.lede, fontSize: '0.86rem' }}>
            Including any made by another party to a document you are on.
          </p>

          {data.requests.map((item) => (
            <article key={item.id} className="p-3 mt-2" style={STYLES.card}>
              <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>{item.documentName}</strong>
                  <p className="mb-0 mt-1" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                    {item.groundLabel}
                    {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <span style={pill(TONE[item.status] ?? 'neutral')}>{item.statusLabel}</span>
              </div>

              {item.reason && (
                <p
                  className="mb-0 mt-2 p-2"
                  style={{
                    fontSize: '0.84rem',
                    background: COLORS.surface,
                    borderRadius: RADIUS.sm,
                    color: COLORS.inkSubtle,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {item.reason}
                </p>
              )}

              {item.decisionNote && (
                <p className="mb-0 mt-2" style={{ fontSize: '0.84rem', color: COLORS.inkSubtle }}>
                  <strong>Decision:</strong> {item.decisionNote}
                </p>
              )}

              {['submitted', 'under_review'].includes(item.status) && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-muted mt-2"
                  onClick={() => withdraw(item.id)}
                >
                  Withdraw this request
                </button>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
