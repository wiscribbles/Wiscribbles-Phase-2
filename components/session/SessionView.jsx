'use client';

/**
 * The session: video call and document, side by side, in one screen.
 *
 * Brief: "The session interface MUST display an explicit check that the
 * Document Jurisdiction matches the Professional Jurisdiction. If they do not
 * match, the session MUST NOT PROCEED."
 *
 * THE BANNER AT THE TOP IS THAT CHECK, and it is not computed here. It is the
 * result the server recorded when the session was created, read back and
 * displayed. A check the browser works out for itself would be decoration: the
 * refusal that matters already happened server-side, and what the professional
 * needs to see is the decision the platform actually made — including the
 * statute it relied on.
 *
 * Phase 1 had `SafeVideoCall.jsx`, `ContainedVideoCall.jsx` and `PDFViewer.jsx`
 * as three separate components that were never composed. This is the
 * composition: one screen, both halves live, because a notarisation is the act
 * of watching someone sign a document you can both see.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import SessionVideo from '@/components/session/SessionVideo';
import { COLORS, RADIUS, STYLES, pill } from '@/lib/theme';

/* The PDF viewer pulls in pdf.js, which has no business in the server bundle
   and no business blocking the call from starting. */
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => <p style={{ color: COLORS.inkMuted, padding: '1rem' }}>Loading document…</p>,
});

const CONFIRMATIONS = [
  {
    key: 'identity',
    label: 'I have satisfied myself as to the identity of the person signing.',
    note:
      'The platform’s identity check is evidence you may rely on. It does not ' +
      'discharge your own duty.',
  },
  {
    key: 'willing',
    label:
      'The person signed in my presence by video and appeared to do so ' +
      'willingly and with understanding.',
  },
  {
    key: 'jurisdiction',
    label: 'I am authorised to act in the jurisdiction named above.',
  },
];

export default function SessionView({ sessionId, locale, userName }) {
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [failure, setFailure] = useState(null);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [documentError, setDocumentError] = useState(null);

  const [confirmed, setConfirmed] = useState({});
  const [executing, setExecuting] = useState(false);
  const [executeError, setExecuteError] = useState(null);
  const [done, setDone] = useState(false);

  /* ---- the session ------------------------------------------------------ */
  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions?id=${encodeURIComponent(sessionId)}`, {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFailure(payload.message ?? 'This session could not be opened.');
        return;
      }

      setSession(payload.session);
      if (payload.session?.status === 'executed') setDone(true);
    } catch {
      setFailure('Could not reach the server.');
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  /* The client has no way of knowing the professional has sealed the document
     unless we look. Polled only for the client, and only until it happens —
     the professional learns it from their own action. Without this the page
     would say "this page updates when they do" and then not. */
  useEffect(() => {
    if (!session || session.role === 'professional' || done) return undefined;
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [session?.role, done, load, session]);

  /* ---- the document ---------------------------------------------------- */
  useEffect(() => {
    if (!session?.documentId) return;

    (async () => {
      try {
        const response = await fetch(
          `/api/files?download=${encodeURIComponent(session.documentId)}`,
          { cache: 'no-store' },
        );
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !payload.url) {
          setDocumentError(payload.message ?? 'The document could not be opened.');
          return;
        }

        setDocumentUrl(payload.url);
      } catch {
        setDocumentError('The document could not be opened.');
      }
    })();
  }, [session?.documentId, done]);

  const execute = async () => {
    setExecuting(true);
    setExecuteError(null);

    try {
      const response = await fetch('/api/sessions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          confirmations: {
            identity: confirmed.identity === true,
            willing: confirmed.willing === true,
            jurisdiction: confirmed.jurisdiction === true,
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setExecuteError(
          [payload.message, payload.detail].filter(Boolean).join(' ') ||
            'The document could not be executed.',
        );
        return;
      }

      setDone(true);
      load();
    } catch {
      setExecuteError('Could not reach the server.');
    } finally {
      setExecuting(false);
    }
  };

  if (failure) {
    return (
      <div className="p-4" style={{ ...STYLES.card, maxWidth: 560 }}>
        <h2 style={STYLES.sectionHeading}>This session cannot be opened</h2>
        <p className="mb-3" style={{ color: COLORS.inkSubtle, fontSize: '0.9rem' }}>
          {failure}
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => router.push(`/${locale}/dashboard`)}
          style={STYLES.buttonPrimary}
        >
          Back to your dashboard
        </button>
      </div>
    );
  }

  if (!session) return <p style={{ color: COLORS.inkMuted }}>Opening session…</p>;

  const isProfessional = session.role === 'professional';
  const check = session.jurisdictionCheck;
  const allowed = check?.result === 'allowed';
  const allConfirmed = CONFIRMATIONS.every((item) => confirmed[item.key] === true);

  return (
    <div>
      {/* ---------------- the explicit jurisdiction check ---------------- */}
      <div
        className="p-3 mb-3"
        style={{
          ...STYLES.card,
          borderLeft: `4px solid ${allowed ? COLORS.success : COLORS.danger}`,
          background: allowed ? COLORS.white : COLORS.dangerBg,
        }}
      >
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <strong style={{ fontSize: '0.95rem', color: allowed ? COLORS.ink : COLORS.dangerText }}>
              {allowed
                ? 'Jurisdiction check passed'
                : 'Jurisdiction check failed — this session must not proceed'}
            </strong>
            <p className="mb-0 mt-1" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
              Document jurisdiction <strong>{check?.documentJurisdiction ?? '—'}</strong>
              {' · '}
              authorised in{' '}
              <strong>{(check?.professionalJurisdictions ?? []).join(', ') || '—'}</strong>
              {check?.statute ? ` · ${check.statute}` : ''}
            </p>
            {check?.checkedAt && (
              <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: COLORS.inkMuted }}>
                Checked by the server at {new Date(check.checkedAt).toLocaleString()}. This is
                the recorded result, not a re-check in your browser.
              </p>
            )}
          </div>
          <span style={pill(allowed ? 'success' : 'danger')}>
            {allowed ? 'Permitted' : 'Blocked'}
          </span>
        </div>
      </div>

      {/* ---------------- header ---------------- */}
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
        <div>
          <h1 style={{ ...STYLES.pageHeading, fontSize: '1.3rem', marginBottom: '0.2rem' }}>
            {session.templateName ?? 'Session'}
          </h1>
          <p className="mb-0" style={{ fontSize: '0.86rem', color: COLORS.inkMuted }}>
            {isProfessional
              ? `With ${session.clientName ?? 'your client'}`
              : `With ${session.professionalName ?? 'your professional'}`}
            {' · '}
            {session.jurisdiction}
          </p>
        </div>
        {done && <span style={pill('success')}>Executed</span>}
      </div>

      {/* ---------------- the two halves ---------------- */}
      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div style={{ height: 'min(60vh, 520px)' }}>
            {allowed ? (
              <SessionVideo sessionId={sessionId} userName={userName} />
            ) : (
              <div
                className="d-grid"
                style={{
                  ...STYLES.card,
                  placeItems: 'center',
                  height: '100%',
                  background: COLORS.surface,
                  padding: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <p className="mb-0" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle }}>
                  The call has not been started because the jurisdiction check
                  did not pass.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div
            style={{
              ...STYLES.card,
              height: 'min(60vh, 520px)',
              overflow: 'auto',
              borderRadius: RADIUS.md,
            }}
          >
            {documentError && (
              <p className="p-3 mb-0" style={{ fontSize: '0.88rem', color: COLORS.dangerText }}>
                {documentError}
              </p>
            )}
            {!documentError && documentUrl && <PDFViewer pdfUrl={documentUrl} />}
            {!documentError && !documentUrl && (
              <p className="p-3 mb-0" style={{ color: COLORS.inkMuted }}>
                Loading document…
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- execution ---------------- */}
      {done ? (
        <div
          className="p-4 mt-3"
          style={{ ...STYLES.card, borderLeft: `4px solid ${COLORS.success}` }}
        >
          <h2 style={STYLES.sectionHeading}>
            {isProfessional ? 'Document executed' : 'Your document has been executed'}
          </h2>
          <p className="mb-3" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle, lineHeight: 1.7 }}>
            The seal has been applied and a certificate page added recording the
            professional, the jurisdiction, the statutory authority and this
            session reference. The sealed version is in your documents.
          </p>
          <a
            className="btn"
            href={`/${locale}/dashboard`}
            style={STYLES.buttonPrimary}
          >
            Go to your documents
          </a>
        </div>
      ) : (
        isProfessional &&
        allowed && (
          <div className="p-4 mt-3" style={STYLES.card}>
            <h2 style={STYLES.sectionHeading}>Place your seal</h2>
            <p style={{ ...STYLES.lede, fontSize: '0.88rem' }}>
              Each of these is recorded with the document as your own
              attestation. They are not a formality — they are what the record
              of this act will rest on.
            </p>

            {CONFIRMATIONS.map((item) => (
              <div className="form-check mb-2" key={item.key}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`confirm-${item.key}`}
                  checked={confirmed[item.key] === true}
                  onChange={(event) =>
                    setConfirmed({ ...confirmed, [item.key]: event.target.checked })
                  }
                />
                <label className="form-check-label" htmlFor={`confirm-${item.key}`}>
                  {item.label}
                  {item.note && (
                    <span className="d-block" style={{ fontSize: '0.8rem', color: COLORS.inkMuted }}>
                      {item.note}
                    </span>
                  )}
                </label>
              </div>
            ))}

            {executeError && (
              <div className="alert alert-danger py-2 mt-3" role="status">
                {executeError}
              </div>
            )}

            <button
              type="button"
              className="btn mt-3"
              disabled={!allConfirmed || executing}
              onClick={execute}
              style={STYLES.buttonPositive}
            >
              {executing ? 'Sealing…' : 'Execute and seal the document'}
            </button>
          </div>
        )
      )}

      {!isProfessional && !done && (
        <p className="mt-3" style={{ fontSize: '0.86rem', color: COLORS.inkMuted }}>
          Your {session.professionalRole === 'coath' ? 'Commissioner of Oaths' : 'Notary'} will
          seal the document when they are satisfied. This page updates when they do.
        </p>
      )}
    </div>
  );
}
