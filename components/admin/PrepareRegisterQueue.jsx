'use client';

/**
 * Prepare & Register — the Website Manager's queue.
 *
 * Oldest first. These are clients who cannot get their document any other way:
 * the electronic route is closed to them by statute, so there is no "they can
 * try again later" fallback. Someone waiting a week here is waiting a week with
 * no alternative.
 *
 * The status buttons offered are only the transitions the state machine permits
 * from the current status (`ALLOWED_TRANSITIONS` in `lib/prepareRegister.js`).
 * "Signed on paper" is a claim about the physical world, so it is reachable
 * only from "ready to sign" — a mis-click cannot assert that a document nobody
 * has drafted has been executed.
 */

import { useCallback, useEffect, useState } from 'react';
import { COLORS, RADIUS, STYLES, pill } from '@/lib/theme';

const TONE = {
  submitted: 'info',
  in_preparation: 'info',
  information_requested: 'warning',
  ready_for_execution: 'warning',
  executed_on_paper: 'success',
  cancelled: 'neutral',
};

/** Mirrors the server state machine, so the UI offers nothing it will refuse. */
const NEXT = {
  submitted: ['in_preparation', 'information_requested', 'cancelled'],
  in_preparation: ['information_requested', 'ready_for_execution', 'cancelled'],
  information_requested: ['in_preparation', 'cancelled'],
  ready_for_execution: ['executed_on_paper', 'cancelled'],
  executed_on_paper: [],
  cancelled: [],
};

export default function PrepareRegisterQueue() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState('');

  const load = useCallback(async (status) => {
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const response = await fetch(`/api/admin/prepare-register${query}`, { cache: 'no-store' });
      if (!response.ok) return;
      setData(await response.json());
    } catch {
      setData({ requests: [], statuses: [] });
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [load, filter]);

  const advance = async (id, toStatus, withNote = null) => {
    setBusy(id);
    setNotice(null);

    try {
      const response = await fetch('/api/admin/prepare-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, toStatus, note: withNote }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setNotice({ tone: 'error', message: payload.message ?? 'That did not go through.' });
        return;
      }

      setNoteFor(null);
      setNote('');
      load(filter);
    } catch {
      setNotice({ tone: 'error', message: 'Could not reach the server.' });
    } finally {
      setBusy(null);
    }
  };

  if (!data) return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;

  const label = (value) => data.statuses.find((s) => s.value === value)?.label ?? value;

  return (
    <div>
      {notice && (
        <div className="alert alert-danger py-2" role="status">
          {notice.message}
        </div>
      )}

      <div className="mb-4" style={{ maxWidth: 280 }}>
        <label className="form-label" htmlFor="pr-filter" style={{ fontSize: '0.86rem', fontWeight: 500 }}>
          Show
        </label>
        <select
          id="pr-filter"
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
            Nothing here. Requests arrive when a client picks a document type
            that cannot be executed electronically in their jurisdiction.
          </p>
        </div>
      )}

      {data.requests?.map((item) => (
        <article key={item.id} className="p-3 mb-3" style={STYLES.card}>
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <strong style={{ fontSize: '0.98rem' }}>
                {item.clientName ?? item.clientEmail ?? 'Client'}
              </strong>
              <p className="mb-0 mt-1" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                {item.documentCategory} · {item.jurisdiction} · {item.delivery}
                {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}
                {' · '}
                {item.feeCurrency} {Number(item.feeAmount ?? 0).toLocaleString()}
                {item.feePaid ? ' (paid)' : ' (unpaid)'}
              </p>
              <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: COLORS.inkMuted }}>
                Excluded under {item.jurisdictionStatute}
              </p>
            </div>
            <span style={pill(TONE[item.status] ?? 'neutral')}>{item.statusLabel}</span>
          </div>

          {item.details && (
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
              {item.details}
            </p>
          )}

          {item.agentNote && (
            <p
              className="mb-0 mt-2"
              style={{ fontSize: '0.84rem', color: COLORS.warningText }}
            >
              Asked the client for: {item.agentNote}
            </p>
          )}

          {noteFor === item.id ? (
            <form
              className="mt-3"
              onSubmit={(event) => {
                event.preventDefault();
                advance(item.id, 'information_requested', note);
              }}
            >
              <textarea
                className="form-control form-control-sm mb-2"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What do you need from the client? They see this."
                required
              />
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-sm" disabled={busy === item.id} style={STYLES.buttonPrimary}>
                  Send
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-muted"
                  onClick={() => {
                    setNoteFor(null);
                    setNote('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="d-flex gap-2 mt-3 flex-wrap">
              {(NEXT[item.status] ?? []).map((next) => (
                <button
                  key={next}
                  type="button"
                  className={`btn btn-sm ${next === 'cancelled' ? 'btn-link text-muted' : 'btn-outline-secondary'}`}
                  disabled={busy === item.id}
                  onClick={() =>
                    next === 'information_requested'
                      ? setNoteFor(item.id)
                      : advance(item.id, next)
                  }
                >
                  {next === 'cancelled' ? 'Cancel' : label(next)}
                </button>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
