'use client';

/**
 * Prepare & Register — the client-facing form.
 *
 * This page exists because six of the eight documents the marketing site
 * advertises as "Popular Documents to Notarize" cannot lawfully be notarised
 * electronically in the launch market. Refusing them was correct and left the
 * most-clicked tiles on the home page leading nowhere. This is where they lead
 * instead.
 *
 * THE TONE MATTERS HERE. A client arriving has usually just been told no. The
 * page leads with what CAN be done, names the statute once rather than
 * labouring it, and is explicit that nothing will be signed or sealed
 * electronically — because a client who half-believes they bought an online
 * notarisation is a complaint waiting to happen.
 */

import { useCallback, useEffect, useState } from 'react';
import { COLORS, RADIUS, STYLES, pill } from '@/lib/theme';

export default function PrepareRegisterForm({ locale, initialCategory = '', initialJurisdiction = '' }) {
  const [options, setOptions] = useState(null);
  const [form, setForm] = useState({
    jurisdiction: initialJurisdiction,
    documentCategory: initialCategory,
    delivery: '',
    details: '',
  });
  const [eligibility, setEligibility] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mine, setMine] = useState([]);

  const load = useCallback(async () => {
    try {
      const [optionsResponse, mineResponse] = await Promise.all([
        fetch('/api/prepare-register', { cache: 'no-store' }),
        fetch('/api/prepare-register?mine=1', { cache: 'no-store' }),
      ]);

      if (optionsResponse.ok) setOptions((await optionsResponse.json()).options);
      if (mineResponse.ok) setMine((await mineResponse.json()).requests ?? []);
    } catch {
      setNotice({ tone: 'error', message: 'Could not load this page. Reload to try again.' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* Check eligibility as soon as both halves are chosen. The answer is the
     server's, because the server holds the exclusion schedules. */
  useEffect(() => {
    if (!form.jurisdiction || !form.documentCategory) {
      setEligibility(null);
      return;
    }

    (async () => {
      try {
        const response = await fetch(
          `/api/prepare-register?jurisdiction=${encodeURIComponent(form.jurisdiction)}&category=${encodeURIComponent(form.documentCategory)}`,
          { cache: 'no-store' },
        );
        setEligibility(await response.json());
      } catch {
        setEligibility(null);
      }
    })();
  }, [form.jurisdiction, form.documentCategory]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setNotice(null);

    try {
      const response = await fetch('/api/prepare-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, noticeVersion: options.notice.version }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (payload.field) setErrors({ [payload.field]: payload.message });
        else setNotice({ tone: 'error', message: payload.message ?? 'That did not go through.' });
        return;
      }

      setForm({ jurisdiction: '', documentCategory: '', delivery: '', details: '' });
      setAccepted(false);
      setNotice({
        tone: 'ok',
        message:
          'Received. We will come back to you with the prepared document and ' +
          'what you need to bring.',
      });
      load();
    } catch {
      setNotice({ tone: 'error', message: 'Could not reach the server.' });
    } finally {
      setSaving(false);
    }
  };

  if (!options) return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;

  const fee = options.fee;
  const ready = eligibility?.eligible && accepted && form.delivery && form.details.trim().length >= 20;

  return (
    <div style={{ maxWidth: 760 }}>
      {notice && (
        <div
          className={`alert py-2 ${notice.tone === 'ok' ? 'alert-success' : 'alert-danger'}`}
          role="status"
        >
          {notice.message}
        </div>
      )}

      {/* ---------------- what this is ---------------- */}
      <section className="p-4 mb-4" style={{ ...STYLES.card, background: COLORS.surface }}>
        <h2 style={{ ...STYLES.sectionHeading, marginBottom: '0.5rem' }}>
          {options.notice.heading}
        </h2>
        <ul className="mb-0" style={{ fontSize: '0.9rem', lineHeight: 1.75, color: COLORS.inkSubtle }}>
          {options.notice.points.map((point, index) => (
            <li key={index} className="mb-2">
              {point}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------- the fee ---------------- */}
      <div className="p-3 mb-4 d-flex justify-content-between align-items-center gap-3 flex-wrap" style={STYLES.card}>
        <div>
          <strong style={{ fontSize: '0.95rem' }}>
            {fee.currency} {fee.amount.toLocaleString()}
          </strong>
          <p className="mb-0 mt-1" style={{ fontSize: '0.82rem', color: COLORS.inkMuted }}>
            Drafting, checking, identity verification and arranging execution.
            {fee.rateIsIndicative && (
              <> About US${(fee.approxUsdCents / 100).toFixed(2)} — {fee.rateNote}</>
            )}
          </p>
        </div>
        <span style={pill('neutral')}>Fixed fee</span>
      </div>

      {/* ---------------- the form ---------------- */}
      <form onSubmit={submit} className="p-4 mb-4" style={STYLES.card}>
        <div className="mb-3">
          <label className="form-label" htmlFor="pr-jurisdiction" style={{ fontWeight: 500 }}>
            Which jurisdiction is the document for?
          </label>
          <select
            id="pr-jurisdiction"
            className={`form-select ${errors.jurisdiction ? 'is-invalid' : ''}`}
            value={form.jurisdiction}
            onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
            style={{ maxWidth: 420 }}
          >
            <option value="">Choose…</option>
            {options.catalogue.map((place) => (
              <option key={place.code} value={place.code}>
                {place.name}
              </option>
            ))}
          </select>
          {errors.jurisdiction && <div className="invalid-feedback d-block">{errors.jurisdiction}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="pr-category" style={{ fontWeight: 500 }}>
            What kind of document?
          </label>
          <select
            id="pr-category"
            className={`form-select ${errors.documentCategory ? 'is-invalid' : ''}`}
            value={form.documentCategory}
            onChange={(e) => setForm({ ...form, documentCategory: e.target.value })}
            style={{ maxWidth: 420 }}
          >
            <option value="">Choose…</option>
            {options.categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.documentCategory && (
            <div className="invalid-feedback d-block">{errors.documentCategory}</div>
          )}
        </div>

        {/* The verdict, as soon as both halves are chosen. */}
        {eligibility && !eligibility.eligible && (
          <div
            className="p-3 mb-3"
            style={{
              ...STYLES.card,
              background: eligibility.useOnlineInstead ? COLORS.successBg : COLORS.warningBg,
              borderLeft: `4px solid ${eligibility.useOnlineInstead ? COLORS.success : COLORS.warning}`,
            }}
          >
            <p className="mb-0" style={{ fontSize: '0.88rem', color: eligibility.useOnlineInstead ? COLORS.success : COLORS.warningText }}>
              {eligibility.reason}
            </p>
            {eligibility.useOnlineInstead && (
              <a className="btn btn-sm mt-2" href={`/${locale}/request`} style={STYLES.buttonPositive}>
                Use the online route instead
              </a>
            )}
          </div>
        )}

        {eligibility?.eligible && (
          <div
            className="p-3 mb-3"
            style={{ ...STYLES.card, borderLeft: `4px solid ${COLORS.brand}` }}
          >
            <p className="mb-0" style={{ fontSize: '0.86rem', color: COLORS.inkSubtle }}>
              Confirmed: this document is excluded from electronic execution in{' '}
              {eligibility.jurisdiction.name} under {eligibility.jurisdiction.statute}, so it
              goes down the paper route.
            </p>
          </div>
        )}

        <fieldset className="mb-3">
          <legend className="form-label" style={{ fontWeight: 500, fontSize: '1rem' }}>
            How would you like to sign?
          </legend>
          {options.delivery.map((option) => (
            <div className="form-check mb-2" key={option.value}>
              <input
                className="form-check-input"
                type="radio"
                name="delivery"
                id={`delivery-${option.value}`}
                checked={form.delivery === option.value}
                onChange={() => setForm({ ...form, delivery: option.value })}
              />
              <label className="form-check-label" htmlFor={`delivery-${option.value}`}>
                {option.label}
                <span className="d-block" style={{ fontSize: '0.82rem', color: COLORS.inkMuted }}>
                  {option.description}
                </span>
              </label>
            </div>
          ))}
          {errors.delivery && <div className="text-danger small mt-1">{errors.delivery}</div>}
        </fieldset>

        <div className="mb-3">
          <label className="form-label" htmlFor="pr-details" style={{ fontWeight: 500 }}>
            What does the document need to do?
          </label>
          <textarea
            id="pr-details"
            className={`form-control ${errors.details ? 'is-invalid' : ''}`}
            rows={5}
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            maxLength={4000}
            placeholder="Who the parties are, what is being granted or agreed, and anything with a deadline."
          />
          {errors.details ? (
            <div className="invalid-feedback d-block">{errors.details}</div>
          ) : (
            <p className="mb-0 mt-1" style={{ fontSize: '0.82rem', color: COLORS.inkMuted }}>
              The more you give us here, the fewer questions we come back with.
            </p>
          )}
        </div>

        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="pr-accept"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="pr-accept">
            I understand this document will be signed on paper and that no
            electronic signature or seal will be applied to it.
          </label>
        </div>
        {errors.notice && <div className="text-danger small mb-2">{errors.notice}</div>}

        <button type="submit" className="btn" disabled={!ready || saving} style={STYLES.buttonPrimary}>
          {saving ? 'Sending…' : 'Request this'}
        </button>
      </form>

      {/* ---------------- theirs ---------------- */}
      {mine.length > 0 && (
        <section>
          <h2 style={STYLES.sectionHeading}>Your requests</h2>
          {mine.map((item) => (
            <article key={item.id} className="p-3 mt-2" style={STYLES.card}>
              <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>
                    {options.categories.find((c) => c.value === item.documentCategory)?.label ??
                      item.documentCategory}
                  </strong>
                  <p className="mb-0 mt-1" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                    {item.jurisdiction}
                    {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}
                    {' · '}
                    {item.feeCurrency} {Number(item.feeAmount ?? 0).toLocaleString()}
                  </p>
                </div>
                <span
                  style={pill(
                    item.status === 'executed_on_paper'
                      ? 'success'
                      : item.status === 'information_requested'
                        ? 'warning'
                        : item.status === 'cancelled'
                          ? 'neutral'
                          : 'info',
                  )}
                >
                  {item.statusLabel}
                </span>
              </div>

              {item.agentNote && (
                <p
                  className="mb-0 mt-2 p-2"
                  style={{
                    fontSize: '0.84rem',
                    background: COLORS.warningBg,
                    color: COLORS.warningText,
                    borderRadius: RADIUS.sm,
                  }}
                >
                  {item.agentNote}
                </p>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
