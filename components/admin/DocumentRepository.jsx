'use client';

/**
 * The Website Manager's document repository.
 *
 * Brief: all documents, filterable by Jurisdiction, Partner Type and Account
 * Name, with audit, flag-as-suspicious and revoke.
 *
 * Flag and revoke are deliberately not the same shape of control. The flag is a
 * small secondary button; revoking opens a panel that requires a written reason
 * and names what it is about to withdraw. A revocation affects parties who are
 * not in this room, and the interface should feel like that.
 */

import { useCallback, useEffect, useState } from 'react';
import { COLORS, RADIUS, STYLES, pill } from '@/lib/theme';

const STATUS_TONE = {
  draft: 'neutral',
  awaiting_signature: 'info',
  awaiting_notarisation: 'info',
  signed: 'success',
  notarised: 'success',
  revoked: 'danger',
};

const EMPTY_FILTERS = {
  jurisdiction: '',
  partnerType: '',
  accountName: '',
  status: '',
  flagged: false,
};

export default function DocumentRepository() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [pending, setPending] = useState(EMPTY_FILTERS);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(null);

  /** The document whose panel is open, and which panel. */
  const [panel, setPanel] = useState(null); // { id, kind: 'audit'|'flag'|'revoke' }
  const [audit, setAudit] = useState(null);
  const [form, setForm] = useState({ reason: '', ground: '', note: '' });

  const load = useCallback(async (applied) => {
    const params = new URLSearchParams();
    Object.entries(applied).forEach(([key, value]) => {
      if (value === true) params.set(key, 'true');
      else if (value) params.set(key, value);
    });

    try {
      const response = await fetch(`/api/admin/documents?${params}`, { cache: 'no-store' });
      if (!response.ok) return;
      setData(await response.json());
    } catch {
      setData({ documents: [], options: null });
    }
  }, []);

  useEffect(() => {
    load(filters);
  }, [load, filters]);

  const openAudit = async (id) => {
    setPanel({ id, kind: 'audit' });
    setAudit(null);
    try {
      const response = await fetch(`/api/admin/documents?audit=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      setAudit(payload.events ?? []);
    } catch {
      setAudit([]);
    }
  };

  const act = async (id, action, extra = {}) => {
    setBusy(id);
    setNotice(null);

    try {
      const response = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setNotice({ tone: 'error', message: payload.message ?? 'That did not go through.' });
        return;
      }

      setPanel(null);
      setForm({ reason: '', ground: '', note: '' });
      setNotice({
        tone: 'ok',
        message:
          action === 'revoke'
            ? 'Document revoked. The parties can see the revocation record.'
            : action === 'flag'
              ? 'Flagged for review.'
              : 'Flag cleared.',
      });
      load(filters);
    } catch {
      setNotice({ tone: 'error', message: 'Could not reach the server.' });
    } finally {
      setBusy(null);
    }
  };

  const download = async (id) => {
    setBusy(id);
    try {
      const response = await fetch(`/api/admin/documents?download=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) {
        setNotice({ tone: 'error', message: payload.message ?? 'Could not open that.' });
        return;
      }
      window.open(payload.url, '_blank', 'noopener,noreferrer');
    } finally {
      setBusy(null);
    }
  };

  const update = (field) => (event) =>
    setPending((current) => ({ ...current, [field]: event.target.value }));

  if (!data) return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;

  const options = data.options ?? {};

  return (
    <div>
      {notice && (
        <div
          className={`alert py-2 ${notice.tone === 'ok' ? 'alert-success' : 'alert-danger'}`}
          role="status"
        >
          {notice.message}
        </div>
      )}

      {/* ---------------- filters ---------------- */}
      <form
        className="p-3 mb-4"
        style={STYLES.card}
        onSubmit={(event) => {
          event.preventDefault();
          setFilters(pending);
        }}
      >
        <div className="row g-2">
          <div className="col-12 col-md-3">
            <label className="form-label" htmlFor="f-jurisdiction" style={{ fontWeight: 500, fontSize: '0.86rem' }}>
              Jurisdiction
            </label>
            <select
              id="f-jurisdiction"
              className="form-select"
              value={pending.jurisdiction}
              onChange={update('jurisdiction')}
            >
              <option value="">Any</option>
              {(options.jurisdictions ?? []).map((place) => (
                <option key={place.code} value={place.code}>
                  {place.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label" htmlFor="f-partner" style={{ fontWeight: 500, fontSize: '0.86rem' }}>
              Partner type
            </label>
            <select
              id="f-partner"
              className="form-select"
              value={pending.partnerType}
              onChange={update('partnerType')}
            >
              <option value="">Any</option>
              {(options.partnerTypes ?? []).map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label" htmlFor="f-account" style={{ fontWeight: 500, fontSize: '0.86rem' }}>
              Account name
            </label>
            <input
              id="f-account"
              className="form-control"
              value={pending.accountName}
              onChange={update('accountName')}
              placeholder="Name or email"
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label" htmlFor="f-status" style={{ fontWeight: 500, fontSize: '0.86rem' }}>
              Status
            </label>
            <select
              id="f-status"
              className="form-select"
              value={pending.status}
              onChange={update('status')}
            >
              <option value="">Any</option>
              {(options.statuses ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3 mt-3 flex-wrap">
          <button type="submit" className="btn btn-sm" style={STYLES.buttonPrimary}>
            Apply
          </button>
          <button
            type="button"
            className="btn btn-sm btn-link text-muted"
            onClick={() => {
              setPending(EMPTY_FILTERS);
              setFilters(EMPTY_FILTERS);
            }}
          >
            Clear
          </button>

          <div className="form-check mb-0 ms-auto">
            <input
              className="form-check-input"
              type="checkbox"
              id="f-flagged"
              checked={pending.flagged}
              onChange={(event) => {
                const next = { ...pending, flagged: event.target.checked };
                setPending(next);
                setFilters(next);
              }}
            />
            <label className="form-check-label" htmlFor="f-flagged" style={{ fontSize: '0.88rem' }}>
              Flagged only
            </label>
          </div>
        </div>

        {pending.accountName && (
          <p className="mb-0 mt-2" style={{ fontSize: '0.8rem', color: COLORS.inkMuted }}>
            Account name matches whole accounts by name or email prefix, not
            words inside a document title.
            {data.matchedAccounts !== null && data.matchedAccounts !== undefined && (
              <> {data.matchedAccounts} account{data.matchedAccounts === 1 ? '' : 's'} matched.</>
            )}
          </p>
        )}
      </form>

      {/* ---------------- listing ---------------- */}
      {data.documents?.length === 0 && (
        <div className="p-3" style={{ ...STYLES.card, background: COLORS.surface }}>
          <p className="mb-0" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle }}>
            No documents match. Nothing has been executed on the platform yet if
            this is a new deployment.
          </p>
        </div>
      )}

      {data.documents?.map((document) => (
        <article
          key={document.id}
          className="p-3 mb-2"
          style={{
            ...STYLES.card,
            ...(document.revoked
              ? { borderLeft: `4px solid ${COLORS.danger}` }
              : document.flagged
                ? { borderLeft: `4px solid ${COLORS.warning}` }
                : {}),
          }}
        >
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div style={{ minWidth: 0 }}>
              <strong style={{ fontSize: '0.95rem' }}>{document.name}</strong>
              <p className="mb-0 mt-1" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                {[
                  document.ownerName ?? document.ownerEmail,
                  document.templateName,
                  document.jurisdiction,
                  document.professionalName ? `by ${document.professionalName}` : null,
                  document.executedAt
                    ? `executed ${new Date(document.executedAt).toLocaleDateString()}`
                    : document.createdAt
                      ? new Date(document.createdAt).toLocaleDateString()
                      : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>

            <div className="d-flex gap-2 align-items-start">
              {document.flagged && !document.revoked && <span style={pill('warning')}>Flagged</span>}
              <span style={pill(STATUS_TONE[document.status] ?? 'neutral')}>
                {(options.statuses ?? []).find((s) => s.value === document.status)?.label ??
                  document.status}
              </span>
            </div>
          </div>

          {document.flag && (
            <p
              className="mb-0 mt-2 p-2"
              style={{
                fontSize: '0.84rem',
                color: COLORS.warningText,
                background: COLORS.warningBg,
                borderRadius: RADIUS.sm,
              }}
            >
              <strong>
                {(options.flagReasons ?? []).find((r) => r.value === document.flag.reason)?.label ??
                  document.flag.reason}
              </strong>
              {document.flag.note ? ` — ${document.flag.note}` : ''}
              {document.flag.by ? ` (${document.flag.by})` : ''}
            </p>
          )}

          {document.revocation && (
            <p
              className="mb-0 mt-2 p-2"
              style={{
                fontSize: '0.84rem',
                color: COLORS.dangerText,
                background: COLORS.dangerBg,
                borderRadius: RADIUS.sm,
              }}
            >
              <strong>
                Revoked —{' '}
                {(options.revocationGrounds ?? []).find((g) => g.value === document.revocation.ground)
                  ?.label ?? document.revocation.ground}
              </strong>
              {document.revocation.note ? `: ${document.revocation.note}` : ''}
            </p>
          )}

          <div className="d-flex gap-2 mt-2 flex-wrap">
            {document.hasFile && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => download(document.id)}
                disabled={busy === document.id}
              >
                Open
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => openAudit(document.id)}
            >
              Audit trail
            </button>

            {document.flagged ? (
              <button
                type="button"
                className="btn btn-sm btn-link text-muted"
                onClick={() => act(document.id, 'unflag')}
                disabled={busy === document.id}
              >
                Clear flag
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-link text-muted"
                onClick={() => {
                  setPanel({ id: document.id, kind: 'flag' });
                  setForm({ reason: '', ground: '', note: '' });
                }}
              >
                Flag as suspicious
              </button>
            )}

            {!document.revoked && ['signed', 'notarised'].includes(document.status) && (
              <button
                type="button"
                className="btn btn-sm btn-link"
                style={{ color: COLORS.dangerText }}
                onClick={() => {
                  setPanel({ id: document.id, kind: 'revoke', name: document.name, status: document.status });
                  setForm({ reason: '', ground: '', note: '' });
                }}
              >
                Revoke
              </button>
            )}
          </div>

          {/* ---------------- panels ---------------- */}
          {panel?.id === document.id && panel.kind === 'audit' && (
            <div className="mt-3 p-3" style={{ background: COLORS.surface, borderRadius: RADIUS.sm }}>
              <div className="d-flex justify-content-between align-items-center">
                <strong style={{ fontSize: '0.9rem' }}>Audit trail</strong>
                <button type="button" className="btn btn-sm btn-link text-muted" onClick={() => setPanel(null)}>
                  Close
                </button>
              </div>

              {audit === null && (
                <p className="mb-0 mt-2" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                  Loading…
                </p>
              )}
              {audit?.length === 0 && (
                <p className="mb-0 mt-2" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                  Nothing recorded against this document yet.
                </p>
              )}
              {audit?.map((event) => (
                <div
                  key={event.id}
                  className="mt-2 pt-2"
                  style={{ borderTop: `1px solid ${COLORS.border}`, fontSize: '0.84rem' }}
                >
                  <div style={{ color: COLORS.ink }}>{event.detail}</div>
                  <div style={{ color: COLORS.inkMuted, fontSize: '0.78rem' }}>
                    {event.at ? new Date(event.at).toLocaleString() : 'time not recorded'}
                    {event.actor ? ` · ${event.actor}` : ''}
                    {event.actorRole ? ` (${event.actorRole})` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {panel?.id === document.id && panel.kind === 'flag' && (
            <form
              className="mt-3 p-3"
              style={{ background: COLORS.warningBg, borderRadius: RADIUS.sm }}
              onSubmit={(event) => {
                event.preventDefault();
                act(document.id, 'flag', { reason: form.reason, note: form.note });
              }}
            >
              <strong style={{ fontSize: '0.9rem', color: COLORS.warningText }}>
                Flag as suspicious
              </strong>
              <p className="mb-2 mt-1" style={{ fontSize: '0.82rem', color: COLORS.warningText }}>
                A flag is a note for review. It does not affect the document’s
                validity and the parties are not told.
              </p>

              <select
                className="form-select form-select-sm mb-2"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                aria-label="Reason"
                required
              >
                <option value="">Choose a reason…</option>
                {(options.flagReasons ?? []).map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>

              <textarea
                className="form-control form-control-sm mb-2"
                rows={2}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="What is the concern?"
                maxLength={1000}
              />

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-sm btn-warning" disabled={busy === document.id}>
                  Flag
                </button>
                <button type="button" className="btn btn-sm btn-link text-muted" onClick={() => setPanel(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {panel?.id === document.id && panel.kind === 'revoke' && (
            <form
              className="mt-3 p-3"
              style={{ background: COLORS.dangerBg, borderRadius: RADIUS.sm }}
              onSubmit={(event) => {
                event.preventDefault();
                act(document.id, 'revoke', { ground: form.ground, note: form.note });
              }}
            >
              <strong style={{ fontSize: '0.9rem', color: COLORS.dangerText }}>
                Revoke “{panel.name}”
              </strong>
              <p className="mb-2 mt-1" style={{ fontSize: '0.82rem', color: COLORS.dangerText }}>
                This withdraws an executed {panel.status === 'notarised' ? 'notarial act' : 'signature'}.
                A revocation record is created that every party to the document
                can read, and it cannot be undone — a document revoked in error
                is replaced by a new one, not restored.
              </p>

              <select
                className="form-select form-select-sm mb-2"
                value={form.ground}
                onChange={(e) => setForm({ ...form, ground: e.target.value })}
                aria-label="Ground for revocation"
                required
              >
                <option value="">Choose the ground…</option>
                {(options.revocationGrounds ?? []).map((ground) => (
                  <option key={ground.value} value={ground.value}>
                    {ground.label}
                  </option>
                ))}
              </select>

              <textarea
                className="form-control form-control-sm mb-2"
                rows={3}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Set out the reason. This is recorded and may be shown to the parties."
                maxLength={2000}
                required
              />

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-sm btn-danger" disabled={busy === document.id}>
                  Revoke this document
                </button>
                <button type="button" className="btn btn-sm btn-link text-muted" onClick={() => setPanel(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </article>
      ))}

      {data.truncated && (
        <p className="mt-3 mb-0" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
          Showing the most recent documents. Narrow the filters to reach older ones.
        </p>
      )}
    </div>
  );
}
