'use client';

/**
 * Document verification — the public-facing form.
 *
 * Deliberately keeps the Phase 1 page's markup and visual idiom: the centred
 * `form-card bg-white p-4 rounded-3`, the same field styling, the same
 * palette. Only the values now come from `lib/theme.js` instead of being
 * retyped, so the page looks exactly as it did while sharing one source for
 * the colours.
 *
 * WHAT CHANGED UNDERNEATH
 *
 * Phase 1 queried Firestore from this component, which meant reference numbers
 * could be enumerated from a browser console. The lookup is now a POST to
 * `/api/authenticate` and the verdict is the server's. The visible difference
 * is the one that matters: a revoked document now says so.
 */

import { useState } from 'react';
import Logo from '@/components/Logo';
import { COLORS, RADIUS } from '@/lib/theme';

const FIELD = {
  padding: '12px',
  borderRadius: RADIUS.md,
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.surface,
};

const VERDICT = {
  valid: {
    title: 'This document is genuine',
    tone: COLORS.success,
    background: COLORS.successBg,
    mark: '✓',
  },
  revoked: {
    title: 'This document has been REVOKED',
    tone: COLORS.dangerText,
    background: COLORS.dangerBg,
    mark: '✕',
  },
  not_found: {
    title: 'No matching document',
    tone: COLORS.warningText,
    background: COLORS.warningBg,
    mark: '?',
  },
  not_executed: {
    title: 'Not executed',
    tone: COLORS.warningText,
    background: COLORS.warningBg,
    mark: '!',
  },
  rate_limited: {
    title: 'Too many attempts',
    tone: COLORS.warningText,
    background: COLORS.warningBg,
    mark: '!',
  },
};

export default function VerifyDocument() {
  const [reference, setReference] = useState('');
  const [date, setDate] = useState({ day: '', month: '', year: '' });
  const [outcome, setOutcome] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const digits = (value, max) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length <= max ? cleaned : cleaned.slice(0, max);
  };

  const ready = reference.trim().length >= 8 && date.day && date.month && date.year.length === 4;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setOutcome(null);

    try {
      const response = await fetch('/api/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          day: Number(date.day),
          month: Number(date.month),
          year: Number(date.year),
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok && !payload.result) {
        setError(payload.message ?? 'That could not be checked just now.');
        return;
      }

      setOutcome(payload);
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const verdict = outcome ? VERDICT[outcome.result] : null;
  const certificate = outcome?.certificate;

  return (
    <div className="d-flex">
      <div className="flex-grow-1">
        <div className="mt-4" style={{ marginLeft: '22px' }}>
          <Logo variant="dark" size="default" />
        </div>

        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="form-card bg-white p-4 rounded-3">
                <div className="text-center mb-5">
                  <h2 style={{ color: COLORS.ink, fontSize: '28px', fontWeight: 600 }}>
                    Authenticate
                  </h2>
                  <p style={{ color: COLORS.inkMuted, fontSize: '16px', marginTop: '8px' }}>
                    Check that a WiScribbles document is genuine and has not been
                    withdrawn
                  </p>
                </div>

                <form onSubmit={submit}>
                  {/* ---- reference ---- */}
                  <div className="row justify-content-center mb-4">
                    <div className="col-md-8">
                      <div className="form-group">
                        <label
                          className="form-label"
                          htmlFor="verify-reference"
                          style={{ color: COLORS.ink, marginBottom: '8px' }}
                        >
                          Reference Number
                        </label>
                        <input
                          id="verify-reference"
                          type="text"
                          className="form-control"
                          placeholder="WS-GY-26-7K4PQ2MN"
                          value={reference}
                          onChange={(e) => setReference(e.target.value.toUpperCase())}
                          style={{ ...FIELD, letterSpacing: '0.05em' }}
                          autoComplete="off"
                        />
                        <p className="text-muted small mb-0 mt-2">
                          Printed on the certificate page of the document.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ---- date signed ---- */}
                  <div className="row justify-content-center mb-5">
                    <div className="col-md-8">
                      <div className="form-group">
                        <label className="form-label" style={{ color: COLORS.ink, marginBottom: '8px' }}>
                          Date Signed
                        </label>
                        <p className="text-muted small mb-2">
                          Enter the date when the document was notarized or signed
                          (DD/MM/YYYY). Both the reference and the date must match —
                          that is what stops someone guessing their way to a
                          stranger&rsquo;s document.
                        </p>
                        <div className="d-flex gap-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="DD"
                            aria-label="Day"
                            value={date.day}
                            onChange={(e) => setDate({ ...date, day: digits(e.target.value, 2) })}
                            maxLength={2}
                            style={FIELD}
                          />
                          <input
                            type="text"
                            className="form-control"
                            placeholder="MM"
                            aria-label="Month"
                            value={date.month}
                            onChange={(e) => setDate({ ...date, month: digits(e.target.value, 2) })}
                            maxLength={2}
                            style={FIELD}
                          />
                          <input
                            type="text"
                            className="form-control"
                            placeholder="YYYY"
                            aria-label="Year"
                            value={date.year}
                            onChange={(e) => setDate({ ...date, year: digits(e.target.value, 4) })}
                            maxLength={4}
                            style={FIELD}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="row justify-content-center mb-3">
                      <div className="col-md-8">
                        <div className="alert alert-danger py-2 mb-0" role="status">
                          {error}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="row justify-content-center">
                    <div className="col-md-8 text-center">
                      <button
                        type="submit"
                        className="btn"
                        disabled={loading || !ready}
                        style={{
                          background: COLORS.brandDark,
                          borderColor: COLORS.brandDark,
                          color: COLORS.white,
                          padding: '12px 48px',
                          borderRadius: RADIUS.md,
                          opacity: loading || !ready ? 0.6 : 1,
                        }}
                      >
                        {loading ? 'Checking…' : 'Authenticate'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* ---- the verdict ---- */}
                {outcome && verdict && (
                  <div className="row justify-content-center mt-5">
                    <div className="col-md-10">
                      <div
                        className="p-4"
                        style={{
                          background: verdict.background,
                          borderRadius: RADIUS.md,
                          borderLeft: `4px solid ${verdict.tone}`,
                        }}
                      >
                        <div className="d-flex align-items-start gap-3">
                          <span
                            aria-hidden="true"
                            style={{
                              flexShrink: 0,
                              width: 34,
                              height: 34,
                              borderRadius: RADIUS.pill,
                              background: verdict.tone,
                              color: COLORS.white,
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 700,
                            }}
                          >
                            {verdict.mark}
                          </span>

                          <div>
                            <h3 style={{ fontSize: '1.1rem', color: verdict.tone, marginBottom: '0.35rem' }}>
                              {verdict.title}
                            </h3>
                            <p className="mb-0" style={{ fontSize: '0.92rem', color: COLORS.inkSubtle, lineHeight: 1.7 }}>
                              {outcome.message}
                            </p>
                          </div>
                        </div>

                        {certificate && (
                          <dl className="mb-0 mt-4" style={{ fontSize: '0.9rem' }}>
                            {[
                              ['Reference', certificate.reference],
                              ['Document type', certificate.documentType],
                              ['Jurisdiction', certificate.jurisdiction],
                              ['Statutory authority', certificate.statute],
                              [
                                'Executed',
                                certificate.executedAt
                                  ? new Date(certificate.executedAt).toLocaleDateString()
                                  : null,
                              ],
                              ['Executed by', certificate.executedBy],
                              ['Capacity', certificate.capacity],
                              ['Signatories', certificate.signatories],
                              ['Witnesses', certificate.witnesses],
                              [
                                'Revoked on',
                                certificate.revokedAt
                                  ? new Date(certificate.revokedAt).toLocaleDateString()
                                  : null,
                              ],
                            ]
                              .filter(([, value]) => value !== null && value !== undefined && value !== '')
                              .map(([label, value]) => (
                                <div
                                  key={label}
                                  className="d-flex justify-content-between py-2"
                                  style={{ borderTop: `1px solid ${COLORS.border}` }}
                                >
                                  <dt style={{ fontWeight: 500, color: COLORS.inkMuted }}>{label}</dt>
                                  <dd className="mb-0 text-end" style={{ color: COLORS.ink }}>
                                    {value}
                                  </dd>
                                </div>
                              ))}
                          </dl>
                        )}

                        {/* What a verification does NOT give you. Said plainly,
                            because a verifier expecting the file otherwise
                            reads the absence as a broken page. */}
                        {outcome.result === 'valid' && (
                          <p
                            className="mb-0 mt-3"
                            style={{ fontSize: '0.84rem', color: COLORS.inkMuted, lineHeight: 1.7 }}
                          >
                            This confirms the document exists, who executed it and
                            that it stands. It does not include the document
                            itself — a certified copy is ordered separately, by a
                            party to it.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
