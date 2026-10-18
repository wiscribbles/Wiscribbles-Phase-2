'use client';

/**
 * Go Live / Offline.
 *
 * Brief: "The notary can toggle their status between Go Live and Offline."
 *
 * THE HEARTBEAT
 *
 * A toggle alone is not enough to tell a client that someone is there. A closed
 * laptop never sends an "offline", so without a heartbeat the queue would offer
 * work to professionals who left hours ago, and the client would wait on
 * someone who will never answer. While live, this component pings the server
 * every minute; the server treats presence older than two minutes as gone
 * (`PRESENCE_TTL_MS` in `lib/availability.js`). One missed beat is survivable.
 *
 * It also goes offline on `beforeunload` as a courtesy, and on tab close via
 * `sendBeacon` so the request survives the page going away — but neither is
 * relied upon, because neither is guaranteed to run.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { COLORS, RADIUS, STYLES } from '@/lib/theme';

export default function GoLiveToggle({ onChange }) {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  const apply = useCallback(
    (next) => {
      setState((current) => ({ ...current, ...next }));
      onChange?.(Boolean(next.isOnline));
    },
    [onChange],
  );

  /* ---- initial state ---------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/partner/availability', { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) {
          setState({ isOnline: false, eligible: false, message: payload.message ?? null });
          return;
        }
        setState(payload);
        onChange?.(Boolean(payload.isOnline));
      } catch {
        if (!cancelled) setState({ isOnline: false, eligible: false, message: null });
      }
    })();

    return () => {
      cancelled = true;
    };
    // onChange is a stable callback from the parent; re-running on it would
    // refetch on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- heartbeat while live --------------------------------------------- */
  useEffect(() => {
    if (!state?.isOnline) {
      if (timer.current) clearInterval(timer.current);
      return undefined;
    }

    const interval = state.heartbeatMs ?? 60000;

    const beat = async () => {
      try {
        const response = await fetch('/api/partner/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ heartbeat: true }),
        });
        const payload = await response.json().catch(() => ({}));

        // The server takes an account offline if it has become ineligible
        // mid-shift — suspended, say. Reflect that rather than looking live.
        if (!response.ok || payload.isOnline === false) {
          apply({ isOnline: false, eligible: payload.eligible ?? false, message: payload.message ?? null });
        }
      } catch {
        /* A failed beat is not proof of anything; the next one may succeed.
           The server-side TTL is what actually removes stale presence. */
      }
    };

    timer.current = setInterval(beat, interval);
    return () => clearInterval(timer.current);
  }, [state?.isOnline, state?.heartbeatMs, apply]);

  /* ---- best-effort offline on leaving ----------------------------------- */
  useEffect(() => {
    if (!state?.isOnline) return undefined;

    const leave = () => {
      try {
        navigator.sendBeacon?.(
          '/api/partner/availability',
          new Blob([JSON.stringify({ isOnline: false })], { type: 'application/json' }),
        );
      } catch {
        /* Nothing to do. The TTL covers it. */
      }
    };

    window.addEventListener('pagehide', leave);
    return () => window.removeEventListener('pagehide', leave);
  }, [state?.isOnline]);

  const toggle = async () => {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/partner/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: !state?.isOnline }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.message ?? 'Could not change your status.');
        apply({ isOnline: false, eligible: payload.reason ? false : state?.eligible });
        return;
      }

      apply(payload);
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  if (!state) {
    return (
      <div className="p-3 mb-4" style={STYLES.card}>
        <span style={{ color: COLORS.inkMuted }}>Checking your status…</span>
      </div>
    );
  }

  const live = Boolean(state.isOnline);
  const blocked = state.eligible === false;

  return (
    <div
      className="p-3 mb-4 d-flex justify-content-between align-items-center gap-3 flex-wrap"
      style={{
        ...STYLES.card,
        borderLeft: `4px solid ${live ? COLORS.success : COLORS.border}`,
      }}
    >
      <div>
        <div className="d-flex align-items-center gap-2">
          <span
            aria-hidden="true"
            style={{
              width: 10,
              height: 10,
              borderRadius: RADIUS.pill,
              background: live ? COLORS.success : COLORS.inkMuted,
              display: 'inline-block',
            }}
          />
          <strong style={{ fontSize: '0.98rem', color: COLORS.ink }}>
            {live ? 'You are live' : 'You are offline'}
          </strong>
        </div>

        <p className="mb-0 mt-1" style={{ fontSize: '0.86rem', color: COLORS.inkMuted }}>
          {live
            ? `Receiving requests for ${(state.jurisdictions ?? []).join(', ') || 'your jurisdictions'}.`
            : state.stale
              ? 'Your session timed out — we stopped hearing from this browser. Go live again to receive requests.'
              : 'Clients cannot be matched to you while you are offline.'}
        </p>

        {blocked && state.message && (
          <p
            className="mb-0 mt-2"
            style={{ fontSize: '0.86rem', color: COLORS.warningText, maxWidth: '58ch' }}
          >
            {state.message}
          </p>
        )}

        {error && (
          <p className="mb-0 mt-2" style={{ fontSize: '0.86rem', color: COLORS.dangerText }}>
            {error}
          </p>
        )}
      </div>

      <button
        type="button"
        className="btn"
        onClick={toggle}
        disabled={busy || (blocked && !live)}
        style={live ? { ...STYLES.buttonPrimary, background: COLORS.inkSubtle, borderColor: COLORS.inkSubtle } : STYLES.buttonPositive}
      >
        {busy ? 'Working…' : live ? 'Go offline' : 'Go live'}
      </button>
    </div>
  );
}
