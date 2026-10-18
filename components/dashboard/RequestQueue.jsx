'use client';

/**
 * The waiting queue, with Accept Client and Decline Request.
 *
 * Brief: "the notary ... sees the waiting queue for their jurisdiction(s) in
 * real time" / "Accept Client / Decline Request".
 *
 * The cards carry no client identity. That is not an oversight — the queue is
 * shown to every live professional holding the jurisdiction, so anything on a
 * card is shown to a group of people none of whom have the work yet. The
 * client's name appears once this professional has accepted, and not before.
 * `lib/queue.js` enforces that server-side; this file would have nothing to
 * render even if it asked.
 *
 * Polling, not a Firestore listener — for the same reason. See the note in
 * `app/api/partner/queue/route.js`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS, STYLES, pill } from '@/lib/theme';

const formatWait = (seconds) => {
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
};

const CATEGORY_LABELS = {
  affidavit: 'Affidavit',
  statutory_declaration: 'Statutory declaration',
  attestation: 'Attestation / certified copy',
  employment_contract: 'Employment contract',
  commercial_contract: 'Commercial contract',
  corporate_resolution: 'Corporate resolution',
  nda: 'Non-disclosure agreement',
  property_management: 'Property management agreement',
  chattel_sale: 'Sale of chattels',
  other: 'Other',
};

export default function RequestQueue({ isOnline, locale }) {
  const router = useRouter();
  const [state, setState] = useState(null);
  const [acting, setActing] = useState(null);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/partner/queue', { cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      setState(payload);
    } catch {
      /* A dropped poll is not worth surfacing; the next one covers it. */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, isOnline]);

  /* Poll only while live. Polling an empty queue for an offline professional
     would be pure cost for no information. */
  useEffect(() => {
    if (!isOnline) {
      if (timer.current) clearInterval(timer.current);
      return undefined;
    }
    timer.current = setInterval(load, state?.pollMs ?? 5000);
    return () => clearInterval(timer.current);
  }, [isOnline, state?.pollMs, load]);

  /**
   * Open the session for an entry this professional holds.
   *
   * A queue entry id is not a session id. The session has to be created (or
   * found, if it already exists) by the server, which runs the jurisdiction
   * lockout as it does so — so this is a POST and not a link. Linking straight
   * to a session route with an entry id, which an earlier draft of this file
   * did, would 404 at best and skip the lockout at worst.
   */
  const openSession = async (entryId) => {
    setActing(`${entryId}:open`);
    setError(null);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.message ?? 'The session could not be opened.');
        load();
        return;
      }

      router.push(`/${locale}/session/${payload.sessionId}`);
    } catch {
      setError('Could not reach the server.');
    } finally {
      setActing(null);
    }
  };

  const act = async (entryId, action) => {
    setActing(`${entryId}:${action}`);
    setError(null);

    try {
      const response = await fetch('/api/partner/queue/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, action }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.message ?? 'That did not go through.');
        // Refresh regardless: "already taken" means the queue has moved on and
        // the stale card should disappear rather than invite another attempt.
        load();
        return;
      }

      load();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setActing(null);
    }
  };

  const active = state?.active ?? null;
  const entries = state?.entries ?? [];

  return (
    <div>
      {error && (
        <div className="alert alert-warning py-2" role="status">
          {error}
        </div>
      )}

      {/* ---------------- The one they hold ---------------- */}
      {active && (
        <section className="mb-4">
          <h2 style={STYLES.sectionHeading}>Your current client</h2>
          <div
            className="p-3 mt-2"
            style={{ ...STYLES.card, borderLeft: `4px solid ${COLORS.brand}` }}
          >
            <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
              <div>
                <strong style={{ fontSize: '1rem' }}>
                  {active.clientName ?? 'Client'}
                </strong>
                <p className="mb-0 mt-1" style={{ fontSize: '0.86rem', color: COLORS.inkMuted }}>
                  {CATEGORY_LABELS[active.documentCategory] ?? active.documentCategory} ·{' '}
                  {active.jurisdiction}
                  {active.templateName ? ` · ${active.templateName}` : ''}
                </p>
              </div>
              <span style={pill('info')}>
                {active.status === 'in_session' ? 'In session' : 'Accepted'}
              </span>
            </div>

            <div className="d-flex gap-2 mt-3 flex-wrap">
              <button
                type="button"
                className="btn"
                onClick={() => openSession(active.id)}
                disabled={acting === `${active.id}:open`}
                style={STYLES.buttonPrimary}
              >
                {acting === `${active.id}:open`
                  ? 'Opening…'
                  : active.status === 'in_session'
                    ? 'Rejoin session'
                    : 'Open session'}
              </button>
              <button
                type="button"
                className="btn btn-link text-muted"
                onClick={() => act(active.id, 'decline')}
                disabled={acting === `${active.id}:decline`}
              >
                Release back to the queue
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- The queue ---------------- */}
      <section>
        <div className="d-flex justify-content-between align-items-baseline gap-2 flex-wrap">
          <h2 style={STYLES.sectionHeading}>Waiting queue</h2>
          {isOnline && (
            <span style={{ fontSize: '0.8rem', color: COLORS.inkMuted }}>
              Refreshing every {Math.round((state?.pollMs ?? 5000) / 1000)}s
            </span>
          )}
        </div>

        <p style={{ ...STYLES.lede, fontSize: '0.86rem' }}>
          Requests in the jurisdictions you are licensed in. Client details stay
          hidden until you accept.
        </p>

        {!isOnline && (
          <div className="p-3 mt-2" style={{ ...STYLES.card, background: COLORS.surface }}>
            <p className="mb-0" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle }}>
              Go live to see who is waiting.
            </p>
          </div>
        )}

        {isOnline && entries.length === 0 && (
          <div className="p-3 mt-2" style={{ ...STYLES.card, background: COLORS.surface }}>
            <p className="mb-0" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle }}>
              Nobody is waiting at the moment. This updates on its own — you do
              not need to refresh.
            </p>
          </div>
        )}

        {isOnline &&
          entries.map((entry) => (
            <article key={entry.id} className="p-3 mt-2" style={STYLES.card}>
              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                <div>
                  <strong style={{ fontSize: '0.98rem' }}>
                    {CATEGORY_LABELS[entry.documentCategory] ?? entry.documentCategory}
                  </strong>
                  <p className="mb-0 mt-1" style={{ fontSize: '0.86rem', color: COLORS.inkMuted }}>
                    {entry.jurisdiction}
                    {entry.templateName ? ` · ${entry.templateName}` : ''}
                    {entry.pageCount ? ` · ${entry.pageCount} pages` : ''}
                  </p>
                </div>

                <span style={pill(entry.waitingSeconds > 600 ? 'warning' : 'neutral')}>
                  Waiting {formatWait(entry.waitingSeconds)}
                </span>
              </div>

              <div className="d-flex gap-2 mt-3 flex-wrap">
                <button
                  type="button"
                  className="btn"
                  onClick={() => act(entry.id, 'accept')}
                  disabled={Boolean(acting) || Boolean(active)}
                  style={STYLES.buttonPositive}
                  title={
                    active
                      ? 'Finish or release your current client first.'
                      : undefined
                  }
                >
                  {acting === `${entry.id}:accept` ? 'Accepting…' : 'Accept client'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => act(entry.id, 'decline')}
                  disabled={Boolean(acting)}
                >
                  {acting === `${entry.id}:decline` ? 'Declining…' : 'Decline'}
                </button>
              </div>
            </article>
          ))}

        {active && isOnline && entries.length > 0 && (
          <p className="mt-3 mb-0" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
            You already have a client. Finish or release that session before
            taking another.
          </p>
        )}
      </section>
    </div>
  );
}
