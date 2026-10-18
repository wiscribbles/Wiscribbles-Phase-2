'use client';

/**
 * The page a party lands on from a signing link.
 *
 * They are usually not a WiScribbles user, may never have heard of the
 * platform, and have arrived from an email. So the page leads with what the
 * document is and who asked them to sign it, before it asks for anything.
 *
 * The document is shown before the signature field, not after. A page that
 * asks for a signature above the document it signs is asking people to agree
 * to something they have not read.
 */

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
import { COLORS, RADIUS, STYLES, pill } from '@/lib/theme';

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => <p style={{ color: COLORS.inkMuted, padding: '1rem' }}>Loading document…</p>,
});

const ROLE_LABEL = { signatory: 'Signatory', witness: 'Witness' };

const STATUS_TONE = {
  waiting: 'neutral',
  invited: 'info',
  signed: 'success',
  declined: 'danger',
  in_person_required: 'warning',
};

export default function PartySigning({ token, documentId }) {
  const [data, setData] = useState(null);
  const [failure, setFailure] = useState(null);
  const [signatureName, setSignatureName] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [declining, setDeclining] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/signing?documentId=${encodeURIComponent(documentId)}&t=${encodeURIComponent(token)}`,
        { cache: 'no-store' },
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFailure(payload.message ?? 'That signing link is not valid.');
        return;
      }

      setData(payload);
      if (payload.me?.name && !signatureName) setSignatureName(payload.me.name);
    } catch {
      setFailure('Could not reach the server.');
    }
    // signatureName intentionally excluded: refilling it would overwrite typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (payload) => {
    setBusy(true);

    try {
      const response = await fetch('/api/signing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, t: token, ...payload }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFailure(result.message ?? 'That did not go through.');
        return;
      }

      setDone(result);
    } catch {
      setFailure('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const shell = (children) => (
    <main className="container" style={{ maxWidth: 900, padding: '32px 16px 72px' }}>
      <div className="mb-4">
        <Logo variant="dark" size="small" linkTo={null} />
      </div>
      {children}
    </main>
  );

  if (failure) {
    return shell(
      <div className="p-4" style={{ ...STYLES.card, maxWidth: 560 }}>
        <h1 style={{ ...STYLES.pageHeading, fontSize: '1.3rem' }}>This link does not work</h1>
        <p className="mb-0" style={{ color: COLORS.inkSubtle, fontSize: '0.92rem', lineHeight: 1.7 }}>
          {failure}
        </p>
      </div>,
    );
  }

  if (done) {
    return shell(
      <div
        className="p-4"
        style={{
          ...STYLES.card,
          maxWidth: 600,
          borderLeft: `4px solid ${done.declined ? COLORS.inkMuted : COLORS.success}`,
        }}
      >
        <h1 style={{ ...STYLES.pageHeading, fontSize: '1.3rem' }}>
          {done.declined ? 'Recorded — you have not signed' : 'Signed'}
        </h1>

        <p style={{ color: COLORS.inkSubtle, fontSize: '0.92rem', lineHeight: 1.7 }}>
          {done.declined
            ? 'We have recorded that you declined to sign, and told the person ' +
              'who sent you the document. Nobody else will be asked to sign it.'
            : done.complete
              ? done.needsWitnessing
                ? 'Every signature that can be given online is now in. This ' +
                  'document still needs a witness, and a witness has to be ' +
                  'physically present — whoever sent it to you will arrange that.'
                : done.enqueued
                  ? 'That was the last signature needed. The document is now with ' +
                    'our notaries and will be sealed shortly.'
                  : 'That was the last signature needed. The document is complete.'
              : done.next
                ? `Thank you. We have asked ${done.next.name ?? 'the next party'} to sign next.`
                : 'Thank you. Your signature has been recorded.'}
        </p>

        <p className="mb-0" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
          You can close this page. The link will not work again.
        </p>
      </div>,
    );
  }

  if (!data) return shell(<p style={{ color: COLORS.inkMuted }}>Loading…</p>);

  const { document: doc, me, others, waitingFor, documentUrl } = data;
  const ready = me.myTurn && signatureName.trim().length >= 2 && confirmed;

  return shell(
    <>
      <header className="mb-4">
        <h1 style={{ ...STYLES.pageHeading, fontSize: '1.4rem' }}>{doc.name}</h1>
        <p className="mb-0" style={{ color: COLORS.inkMuted, fontSize: '0.9rem' }}>
          {[doc.templateName, doc.jurisdiction].filter(Boolean).join(' · ')}
          {doc.ownerName ? ` · sent by ${doc.ownerName}` : ''}
        </p>
      </header>

      {/* ---- not their turn ---- */}
      {!me.myTurn && (
        <div
          className="p-3 mb-4"
          style={{ ...STYLES.card, background: COLORS.infoBg, borderLeft: `4px solid ${COLORS.brand}` }}
        >
          <p className="mb-0" style={{ fontSize: '0.9rem', color: COLORS.brand, lineHeight: 1.7 }}>
            {me.status === 'signed'
              ? 'You have already signed this document. Nothing further is needed from you.'
              : me.status === 'in_person_required'
                ? 'You are down as a witness on this document. A witness has to be ' +
                  'physically present when it is signed, so this cannot be done ' +
                  'online — whoever sent this to you will arrange it.'
                : waitingFor
                  ? `It is not your turn yet. We are waiting on ${waitingFor.name ?? 'another party'}, ` +
                    'and you will get an email when it is your turn.'
                  : 'This document is not ready for your signature.'}
          </p>
        </div>
      )}

      {/* ---- the parties ---- */}
      <section className="mb-4">
        <h2 style={{ ...STYLES.sectionHeading, fontSize: '0.98rem' }}>Who signs this</h2>
        <div className="mt-2">
          {[{ ...me, isMe: true }, ...others]
            .sort((a, b) => a.order - b.order)
            .map((party) => (
              <div
                key={party.order}
                className="d-flex justify-content-between align-items-center gap-2 py-2"
                style={{ borderBottom: `1px solid ${COLORS.border}`, fontSize: '0.88rem' }}
              >
                <span style={{ color: COLORS.ink }}>
                  {party.order}. {party.name ?? 'Unnamed party'}
                  {party.isMe && <strong> (you)</strong>}
                  <span style={{ color: COLORS.inkMuted }}>
                    {' — '}
                    {ROLE_LABEL[party.role] ?? party.role}
                  </span>
                </span>
                <span style={pill(STATUS_TONE[party.status] ?? 'neutral')}>
                  {party.status === 'in_person_required'
                    ? 'In person'
                    : party.status === 'signed'
                      ? 'Signed'
                      : party.status === 'invited'
                        ? 'Their turn'
                        : party.status === 'declined'
                          ? 'Declined'
                          : 'Waiting'}
                </span>
              </div>
            ))}
        </div>
        <p className="mb-0 mt-2" style={{ fontSize: '0.82rem', color: COLORS.inkMuted }}>
          Parties sign one at a time, in this order. You do not all need to be
          available together.
        </p>
      </section>

      {/* ---- the document, before the signature field ---- */}
      {documentUrl && (
        <section className="mb-4">
          <h2 style={{ ...STYLES.sectionHeading, fontSize: '0.98rem' }}>The document</h2>
          <div
            className="mt-2"
            style={{ ...STYLES.card, height: 'min(55vh, 460px)', overflow: 'auto', borderRadius: RADIUS.md }}
          >
            <PDFViewer pdfUrl={documentUrl} />
          </div>
        </section>
      )}

      {/* ---- sign ---- */}
      {me.myTurn && !declining && (
        <section className="p-4" style={STYLES.card}>
          <h2 style={STYLES.sectionHeading}>Sign</h2>
          <p style={{ ...STYLES.lede, fontSize: '0.88rem' }}>
            Type your full name. That typed name is your electronic signature,
            and it has the same effect as signing on paper.
          </p>

          <div className="mb-3">
            <label className="form-label" htmlFor="sig-name" style={{ fontWeight: 500 }}>
              Your full name
            </label>
            <input
              id="sig-name"
              className="form-control"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              maxLength={160}
              style={{ maxWidth: 420, fontFamily: 'Jost, sans-serif', fontSize: '1.05rem' }}
            />
          </div>

          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="sig-confirm"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="sig-confirm">
              I have read this document and I intend my typed name to be my
              signature on it.
            </label>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn"
              disabled={!ready || busy}
              onClick={() => act({ signatureName })}
              style={STYLES.buttonPositive}
            >
              {busy ? 'Signing…' : 'Sign this document'}
            </button>
            <button
              type="button"
              className="btn btn-link text-muted"
              onClick={() => setDeclining(true)}
            >
              I do not want to sign
            </button>
          </div>
        </section>
      )}

      {/* ---- decline ---- */}
      {me.myTurn && declining && (
        <section className="p-4" style={{ ...STYLES.card, background: COLORS.surface }}>
          <h2 style={STYLES.sectionHeading}>Decline to sign</h2>
          <p style={{ ...STYLES.lede, fontSize: '0.88rem' }}>
            Nobody else will be asked to sign, and the person who sent it will be
            told. You can say why, if you want to — they will see it.
          </p>

          <textarea
            className="form-control mb-3"
            rows={3}
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            maxLength={500}
            placeholder="Optional"
            style={{ maxWidth: 480 }}
          />

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={busy}
              onClick={() => act({ decline: true, reason: declineReason })}
            >
              {busy ? 'Recording…' : 'Decline'}
            </button>
            <button type="button" className="btn btn-link text-muted" onClick={() => setDeclining(false)}>
              Back
            </button>
          </div>
        </section>
      )}
    </>,
  );
}
