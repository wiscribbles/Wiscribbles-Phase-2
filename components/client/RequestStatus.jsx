'use client';

/**
 * The waiting room.
 *
 * Where a client sits between submitting a request and a professional
 * accepting it. Polls, and moves them into the session the moment one opens.
 *
 * WHAT IT DOES NOT SAY
 *
 * It does not name the professional before the session opens. There is nothing
 * a client can do with the name beforehand, and it is the professional's to
 * give when they appear. It does say what KIND of professional has accepted,
 * because that is the thing a client might reasonably want to check.
 *
 * It also does not pretend to know how long the wait will be. An invented
 * estimate that passes with nobody arriving is worse than no estimate.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS, STYLES, pill } from '@/lib/theme';

const POLL_MS = 5000;

const PROFESSIONAL_LABEL = {
  notary: 'A Notary Public',
  coath: 'A Commissioner of Oaths',
};

const WAITING_COPY = {
  waiting:
    'Your request is with the professionals licensed in this jurisdiction. ' +
    'This page moves on by itself when one accepts — you do not need to ' +
    'refresh, and you can close it and come back.',
  assigned: 'Your session is being opened. This page will take you into it.',
  in_session: 'Your session is open.',
  completed: 'This request is finished.',
  cancelled: 'This request was withdrawn.',
  expired:
    'Nobody accepted this request, so it has lapsed. You can submit it again ' +
    'at a time when more professionals are likely to be online.',
};

export default function RequestStatus({ documentId, locale }) {
  const router = useRouter();
  const [status, setStatus] = useState(null);
  const [failed, setFailed] = useState(false);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/documents/request?status=${encodeURIComponent(documentId)}`,
        { cache: 'no-store' },
      );

      if (!response.ok) {
        setFailed(true);
        return;
      }

      const payload = await response.json();
      setStatus(payload.status);

      /* The moment a session exists, go. The client has been waiting and the
         professional is already there. */
      if (payload.status?.queue?.sessionId) {
        router.push(`/${locale}/session/${payload.status.queue.sessionId}`);
      }
    } catch {
      /* A dropped poll is not worth showing; the next one covers it. */
    }
  }, [documentId, locale, router]);

  useEffect(() => {
    load();
    timer.current = setInterval(load, POLL_MS);
    return () => clearInterval(timer.current);
  }, [load]);

  if (failed) {
    return (
      <p style={{ color: COLORS.inkMuted }}>
        We could not find that request. If you have just submitted it, give it a
        moment and reload.
      </p>
    );
  }

  if (!status) return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;

  const queueStatus = status.queue?.status ?? null;
  const waiting = queueStatus === 'waiting';

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="p-4" style={STYLES.card}>
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h2 style={{ ...STYLES.sectionHeading, marginBottom: '0.25rem' }}>{status.name}</h2>
            <p className="mb-0" style={{ fontSize: '0.86rem', color: COLORS.inkMuted }}>
              {[status.templateName, status.jurisdiction].filter(Boolean).join(' · ')}
            </p>
          </div>

          {queueStatus && (
            <span style={pill(waiting ? 'info' : queueStatus === 'expired' ? 'warning' : 'success')}>
              {waiting ? 'Waiting' : queueStatus === 'assigned' ? 'Accepted' : queueStatus}
            </span>
          )}
        </div>

        {waiting && (
          <div className="d-flex align-items-center gap-3 mt-3">
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
              style={{ color: COLORS.brand }}
            />
            <span style={{ fontSize: '0.9rem', color: COLORS.inkSubtle }}>
              Looking for an available professional…
            </span>
          </div>
        )}

        <p className="mb-0 mt-3" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle, lineHeight: 1.7 }}>
          {WAITING_COPY[queueStatus] ??
            (status.serviceType
              ? WAITING_COPY.waiting
              : 'This document needs no professional. It is ready for signature.')}
        </p>

        {status.queue?.professionalRole && queueStatus !== 'waiting' && (
          <p className="mb-0 mt-2" style={{ fontSize: '0.9rem', color: COLORS.ink }}>
            {PROFESSIONAL_LABEL[status.queue.professionalRole] ?? 'A professional'} has
            accepted your request.
          </p>
        )}

        {!status.serviceType && (
          <a
            className="btn mt-3"
            href={`/${locale}/dashboard`}
            style={STYLES.buttonPrimary}
          >
            Go to your documents
          </a>
        )}
      </div>

      {waiting && (
        <p className="mt-3" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
          Requests lapse after an hour if nobody accepts. You will not be
          charged for a request that lapses.
        </p>
      )}
    </div>
  );
}
