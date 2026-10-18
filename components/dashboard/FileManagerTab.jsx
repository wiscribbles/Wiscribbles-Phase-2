'use client';

/**
 * The File Manager tab — the account's document repository.
 *
 * Downloads go through `/api/files?download=…`, which checks who is asking,
 * mints a ten-minute signed URL and records the access. The URL is opened and
 * then discarded rather than rendered as a persistent link, so a stale tab does
 * not keep a working document URL in its DOM.
 *
 * There is no delete. Archiving hides a document from the list; the record
 * survives, because a signed or notarised instrument is evidence and may be
 * needed by someone who is not the account holder. The reasoning is in
 * `app/api/files/route.js`.
 */

import { useCallback, useEffect, useState } from 'react';
import { COLORS, STYLES, pill } from '@/lib/theme';

const STATUS_TONE = {
  draft: 'neutral',
  awaiting_signature: 'info',
  awaiting_notarisation: 'info',
  signed: 'success',
  notarised: 'success',
  revoked: 'danger',
};

const formatBytes = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FileManagerTab() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ status: '', jurisdiction: '', q: '', archived: 'false' });
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async (current) => {
    const params = new URLSearchParams();
    Object.entries(current).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    try {
      const response = await fetch(`/api/files?${params}`, { cache: 'no-store' });
      if (!response.ok) return;
      setData(await response.json());
    } catch {
      setData({ documents: [], options: null });
    }
  }, []);

  useEffect(() => {
    load(filters);
  }, [load, filters]);

  const download = async (id) => {
    setBusy(id);
    setError(null);

    try {
      const response = await fetch(`/api/files?download=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.url) {
        setError(payload.message ?? 'That document could not be opened.');
        return;
      }

      /* Opened immediately and not stored in state: the signed URL is a
         short-lived credential and does not belong in the rendered page. */
      window.open(payload.url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(null);
    }
  };

  const setArchived = async (id, archived) => {
    await fetch('/api/files', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, archived }),
    });
    load(filters);
  };

  const update = (field) => (event) =>
    setFilters((current) => ({ ...current, [field]: event.target.value }));

  if (!data) return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;

  const showingArchive = filters.archived === 'true';

  return (
    <div>
      <h2 style={STYLES.sectionHeading}>
        {showingArchive ? 'Archived documents' : 'Your documents'}
      </h2>

      {error && (
        <div className="alert alert-warning py-2" role="status">
          {error}
        </div>
      )}

      {/* ---------------- filters ---------------- */}
      <div className="row g-2 mb-3 mt-2">
        <div className="col-12 col-md-4">
          <input
            className="form-control"
            value={filters.q}
            onChange={update('q')}
            placeholder="Search by name"
            aria-label="Search documents by name"
          />
        </div>
        <div className="col-6 col-md-3">
          <select
            className="form-select"
            value={filters.status}
            onChange={update('status')}
            aria-label="Filter by status"
          >
            <option value="">Any status</option>
            {(data.options?.statuses ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <select
            className="form-select"
            value={filters.jurisdiction}
            onChange={update('jurisdiction')}
            aria-label="Filter by jurisdiction"
          >
            <option value="">Any jurisdiction</option>
            {(data.options?.jurisdictions ?? []).map((place) => (
              <option key={place.code} value={place.code}>
                {place.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-2">
          <button
            type="button"
            className="btn btn-outline-secondary w-100"
            onClick={() =>
              setFilters((current) => ({
                ...current,
                archived: current.archived === 'true' ? 'false' : 'true',
              }))
            }
          >
            {showingArchive ? 'Active' : 'Archive'}
          </button>
        </div>
      </div>

      {filters.q && (
        <p style={{ fontSize: '0.82rem', color: COLORS.inkMuted }}>
          Searching the documents on this page. Narrow by status or jurisdiction
          to search further back.
        </p>
      )}

      {/* ---------------- list ---------------- */}
      {data.documents?.length === 0 && (
        <div className="p-3" style={{ ...STYLES.card, background: COLORS.surface }}>
          <p className="mb-0" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle }}>
            {showingArchive
              ? 'Nothing archived.'
              : 'No documents yet. Documents appear here once they have been created or uploaded.'}
          </p>
        </div>
      )}

      {data.documents?.map((document) => (
        <article key={document.id} className="p-3 mb-2" style={STYLES.card}>
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div style={{ minWidth: 0 }}>
              <strong style={{ fontSize: '0.95rem' }}>{document.name}</strong>
              <p className="mb-0 mt-1" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                {[
                  document.templateName,
                  document.jurisdiction,
                  formatBytes(document.sizeBytes),
                  document.pageCount ? `${document.pageCount} pages` : null,
                  document.createdAt
                    ? new Date(document.createdAt).toLocaleDateString()
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>

            <span style={pill(STATUS_TONE[document.status] ?? 'neutral')}>
              {(data.options?.statuses ?? []).find((s) => s.value === document.status)?.label ??
                document.status}
            </span>
          </div>

          <div className="d-flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => download(document.id)}
              disabled={busy === document.id}
            >
              {busy === document.id ? 'Opening…' : 'Open'}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-link text-muted"
              onClick={() => setArchived(document.id, !document.archived)}
            >
              {document.archived ? 'Restore' : 'Archive'}
            </button>
          </div>
        </article>
      ))}

      {data.truncated && (
        <p className="mt-3 mb-0" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
          Showing the most recent documents. Use the filters to reach older ones.
        </p>
      )}
    </div>
  );
}
