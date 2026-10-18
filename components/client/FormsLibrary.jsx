'use client';

/**
 * The standard forms library, as a client sees it.
 *
 * Preview is separate from taking a copy. Someone deciding whether the
 * short-form affidavit is the one they need should be able to read it without
 * it landing in their repository and counting against their quota — so the
 * preview opens a short-lived link and nothing is stored until they choose.
 *
 * Their repository usage is shown at the top rather than discovered at the
 * moment of refusal.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS, RADIUS, STYLES, pill } from '@/lib/theme';

export default function FormsLibrary({ locale }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/forms', { cache: 'no-store' });
      if (!response.ok) return;
      setData(await response.json());
    } catch {
      setData({ forms: [], usage: null });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const preview = async (id) => {
    setBusy(id);
    setNotice(null);

    try {
      const response = await fetch(`/api/forms?preview=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.url) {
        setNotice({ tone: 'error', message: 'Could not open that form.' });
        return;
      }

      window.open(payload.url, '_blank', 'noopener,noreferrer');
    } finally {
      setBusy(null);
    }
  };

  const take = async (id) => {
    setBusy(id);
    setNotice(null);

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: id }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setNotice({ tone: 'error', message: payload.message ?? 'Could not take that form.' });
        return;
      }

      /* Straight on to the request flow, carrying the copy and its template,
         so nobody is asked to upload the file they were just handed. */
      router.push(
        `/${locale}/request?form=${encodeURIComponent(id)}&path=${encodeURIComponent(payload.storagePath)}&template=${encodeURIComponent(payload.templateId ?? '')}`,
      );
    } finally {
      setBusy(null);
    }
  };

  if (!data) return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;

  const usage = data.usage;

  return (
    <div>
      {notice && (
        <div className="alert alert-danger py-2" role="status">
          {notice.message}
        </div>
      )}

      {/* ---- where they stand on space ---- */}
      {usage && (
        <div className="p-3 mb-4" style={STYLES.card}>
          <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
            <div style={{ flex: 1, minWidth: 220 }}>
              <p className="mb-1" style={{ fontSize: '0.86rem', color: COLORS.inkSubtle }}>
                Your repository: {usage.used} of {usage.quota} used
                {usage.documentCount
                  ? ` · ${usage.documentCount} document${usage.documentCount === 1 ? '' : 's'}`
                  : ''}
              </p>
              <div
                style={{
                  height: 6,
                  borderRadius: RADIUS.pill,
                  background: COLORS.border,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${usage.percentUsed}%`,
                    height: '100%',
                    background:
                      usage.tone === 'danger'
                        ? COLORS.danger
                        : usage.tone === 'warning'
                          ? COLORS.warning
                          : COLORS.success,
                  }}
                />
              </div>
            </div>
            <span style={pill(usage.tone === 'ok' ? 'success' : usage.tone)}>
              {usage.percentUsed}%
            </span>
          </div>

          {usage.message && (
            <p className="mb-0 mt-2" style={{ fontSize: '0.84rem', color: COLORS.warningText }}>
              {usage.message} Executed documents are never deleted to make room —
              archive what you no longer need, or move to a larger plan.
            </p>
          )}
        </div>
      )}

      {data.forms?.length === 0 && (
        <div className="p-3" style={{ ...STYLES.card, background: COLORS.surface }}>
          <p className="mb-0" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle }}>
            No standard forms have been published yet. You can still upload your
            own document — the library is a convenience, not the only way in.
          </p>
        </div>
      )}

      {data.forms?.map((entry) => (
        <article key={entry.id} className="p-3 mb-2" style={STYLES.card}>
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <strong style={{ fontSize: '0.98rem' }}>{entry.name}</strong>
              {entry.description && (
                <p className="mb-0 mt-1" style={{ fontSize: '0.86rem', color: COLORS.inkMuted }}>
                  {entry.description}
                </p>
              )}
              <p className="mb-0 mt-1" style={{ fontSize: '0.82rem', color: COLORS.inkSubtle }}>
                {[
                  entry.categoryLabel,
                  entry.jurisdictions.join(', '),
                  entry.sizeBytes ? `${Math.round(entry.sizeBytes / 1024)} KB` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>

          <div className="d-flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => preview(entry.id)}
              disabled={busy === entry.id}
            >
              Read it first
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => take(entry.id)}
              disabled={busy === entry.id}
              style={{ ...STYLES.buttonPrimary, padding: '0.3rem 0.9rem', fontSize: '0.86rem' }}
            >
              {busy === entry.id ? 'Preparing…' : 'Use this form'}
            </button>
          </div>
        </article>
      ))}

      <p className="mt-3 mb-0" style={{ fontSize: '0.82rem', color: COLORS.inkMuted }}>
        Reading a form costs you nothing. Taking a copy puts it in your
        repository, where it counts toward your space.
      </p>
    </div>
  );
}
