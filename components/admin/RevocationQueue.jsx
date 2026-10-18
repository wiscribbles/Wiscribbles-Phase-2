'use client';

/**
 * Revocation requests — the Website Manager's queue.
 *
 * Granting one withdraws an executed instrument, which affects people who are
 * not in the room. So the controls are weighted accordingly: "Grant" is the
 * danger button, both decisions require a written reason, and the panel states
 * what granting does before it is pressed.
 *
 * Both outcomes need a reason. A refusal without one leaves the party who
 * asked with nothing to act on, and they paid for the review.
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

export default function RevocationQueue() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [panel, setPanel] = useState(null); // { id, decision }
  const [note, setNote] = useState('');

  const load = useCallback(async (status) => {
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const response = await fetch(`/api/admin/revocations${query}`, { cache: 'no-store' });
      if (!response.ok) return;
      setData(await response.json());
    } catch {
      setData({ requests: [], statuses: [] });
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [load, filter]);

  const decide = async (id, decision, withNote = null) => {
    setBusy(id);
    setNotice(null);

    try {
      const response = await fetch('/api/admin/revocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision, note: withNote }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setNotice({ tone: 'error', message: payload.message ?? 'That did not go through.' });
        return;
      }

      setPanel(null);
      setNote('');
      load(filter);
    } catch {
      setNotice({ tone: 'error', message: 'Could not reach the server.' });
    } finally {
      setBusy(null);
    }
  };

  if (!data) return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;

  const open = (status) => ['submitted', 'under_review'].includes(status);

  return (
    <div>
      {notice && (
        <div className="alert alert-danger py-2" role="status">
          {notice.message}
        </div>
      )}

      <div className="mb-4" style={{ maxWidth: 280 }}>
        <label className="form-label" htmlFor="rr-filter" style={{ fontSize: '0.86rem', fontWeight: 500 }}>
          Show
        </label>
        <select
          id="rr-filter"
          className="form-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Everything</option>
          {data.statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {data.requests?.length === 0 && (
        <div className="p-3" style={{ ...STYLES.card, background: COLORS.surface }}>
          <p className="mb-0" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle }}>
            No requests. These arrive when a party to an executed document asks
            for it to be withdrawn.
          </p>
        </div>
      )}

      {data.requests?.map((item) => (
        <article
          key={item.id}
          className="p-3 mb-3"
          style={{
            ...STYLES.card,
            ...(open(item.status) ? { borderLeft: `4px solid ${COLORS.warning}` } : {}),
          }}
        >
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <strong style={{ fontSize: '0.98rem' }}>
                {item.documentName ?? 'Document'}
              </strong>
              <p className="mb-0 mt-1" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                {item.documentReference ?? item.documentId}
                {' · asked by '}
                {item.requestedByEmail}
                {item.requestedByRole ? ` (${item.requestedByRole})` : ''}
                {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}
              </p>
              <p className="mb-0 mt-1" style={{ fontSize: '0.84rem', color: COLORS.inkSubtle }}>
                Ground: <strong>{item.groundLabel}</strong>
                {' · fee '}
                {item.feeCurrency} {Number(item.feeAmount ?? 0).toLocaleString()}
                {item.feePaid ? ' (paid)' : ' (unpaid)'}
              </p>
            </div>
            <span style={pill(TONE[item.status] ?? 'neutral')}>{item.statusLabel}</span>
          </div>

          {item.reason && (
            <p
              className="mb-0 mt-2 p-2"
              style={{
                fontSize: '0.86rem',
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

          {open(item.status) && panel?.id !== item.id && (
            <div className="d-flex gap-2 mt-3 flex-wrap">
              {item.status === 'submitted' && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={busy === item.id}
                  onClick={() => decide(item.id, 'review')}
                >
                  Mark under review
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setPanel({ id: item.id, decision: 'refuse' });
                  setNote('');
                }}
              >
                Refuse
              </button>
              <button
                type="button"
                className="btn btn-sm btn-link"
                style={{ color: COLORS.dangerText }}
                onClick={() => {
                  setPanel({ id: item.id, decision: 'grant' });
                  setNote('');
                }}
              >
                Grant — revoke the document
              </button>
            </div>
          )}

          {panel?.id === item.id && (
            <form
              className="mt-3 p-3"
              style={{
                background: panel.decision === 'grant' ? COLORS.dangerBg : COLORS.surface,
                borderRadius: RADIUS.sm,
              }}
              onSubmit={(event) => {
                event.preventDefault();
                decide(item.id, panel.decision, note);
              }}
            >
              <strong
                style={{
                  fontSize: '0.9rem',
                  color: panel.decision === 'grant' ? COLORS.dangerText : COLORS.ink,
                }}
              >
                {panel.decision === 'grant' ? 'Grant and revoke' : 'Refuse this request'}
              </strong>

              <p
                className="mb-2 mt-1"
                style={{
                  fontSize: '0.82rem',
                  color: panel.decision === 'grant' ? COLORS.dangerText : COLORS.inkMuted,
                }}
              >
                {panel.decision === 'grant'
                  ? 'This withdraws the instrument. Anyone verifying it afterwards is ' +
                    'told it has been revoked. It cannot be undone — a document ' +
                    'revoked in error is replaced, not restored.'
                  : 'The party who asked sees this reason. They paid for the review, ' +
                    'so it should say something.'}
              </p>

              <textarea
                className="form-control form-control-sm mb-2"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  panel.decision === 'grant'
                    ? 'The reason, as it will appear on the revocation record.'
                    : 'Why the request is refused.'
                }
                maxLength={2000}
                required
              />

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className={`btn btn-sm ${panel.decision === 'grant' ? 'btn-danger' : 'btn-outline-secondary'}`}
                  disabled={busy === item.id || !note.trim()}
                >
                  {panel.decision === 'grant' ? 'Revoke the document' : 'Refuse'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-muted"
                  onClick={() => {
                    setPanel(null);
                    setNote('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </article>
      ))}
    </div>
  );
}
