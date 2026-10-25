'use client';

/**
 * The client's five-step request.
 *
 * Terms → notice → what you need → your document → payment.
 *
 * TWO DELIBERATE CHOICES
 *
 * The jurisdiction and service are chosen BEFORE the upload, so a client in a
 * jurisdiction where electronic notarisation has no statutory effect is turned
 * away with the statute named before they have uploaded a document or entered a
 * card. Taking the file and the money and discovering it at the session is the
 * worst possible order in which to find that out.
 *
 * And the unavailable document types are shown WITH their reason rather than
 * filtered out. An empty list reads as a broken website; "a will cannot be
 * executed electronically under the Act, it must be signed on paper" reads as
 * an answer.
 *
 * NO WITNESS OPTION — 19 OCTOBER 2026
 *
 * The party list used to offer a Witness role. It no longer does, and the
 * removal is deliberate rather than an oversight. Adding a witness parked the
 * finished document at `awaiting_in_person_witnessing`, a status with no route
 * onward: nothing released it and nothing told the creator what to do, so a
 * witness quietly destroyed the document after the client had worked through
 * four screens. Meanwhile almost every instrument that classically needs a
 * witness — wills, powers of attorney, deeds of land, trusts, leases,
 * agreements of sale — is already outside the permitted catalogue and already
 * routed to Prepare & Register.
 *
 * So every party added here is a signatory, and a client who says they need a
 * witness is offered Prepare & Register: the same honest offer that flow
 * already makes, which is everything online except the part the law reserves.
 * The machinery is intact and dormant in `lib/signing.js`; what re-enables it
 * is a written opinion and the jurisdiction flag, not a UI change.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS, RADIUS, STYLES, pill } from '@/lib/theme';
import { MAX_UPLOAD_MB, UPLOAD_PURPOSE, UploadError, uploadFile } from '@/lib/storage/client';

const STEPS = ['terms', 'disclaimer', 'service', 'document', 'payment'];

export default function RequestWizard({ locale, prefill = null }) {
  const router = useRouter();

  const [options, setOptions] = useState(null);
  const [step, setStep] = useState('terms');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [accepted, setAccepted] = useState({ terms: false, disclaimer: false });
  const [choice, setChoice] = useState({ requestedService: '', jurisdiction: '', templateId: '' });
  const [templates, setTemplates] = useState(null);
  const [upload, setUpload] = useState(null); // { path, bytes, name }
  const [documentName, setDocumentName] = useState('');

  /* The actual people, not just counts.
   *
   * Phase 2 originally asked "how many signatories?" and nothing more, which
   * priced the document correctly and left the platform unable to invite
   * anyone. Each party now has a name, an email and a role; they sign one at a
   * time, in order, and the counts the fee needs are derived from the list
   * rather than typed separately — so the price can never disagree with the
   * number of people actually invited.
   *
   * The creator is party 1 and is added server-side, so this list is "everyone
   * else". */
  const [otherParties, setOtherParties] = useState([]);
  const [seals, setSeals] = useState(1);
  const [signingWindowDays, setSigningWindowDays] = useState(14);
  const [feeQuote, setFeeQuote] = useState(null);

  /* Every added party is a signatory — see the note at the top of this file.
     `witnesses` is still sent to the quote and the create call, hard-wired to
     zero, because the fee engine and the API both still accept the field and a
     silently absent parameter is harder to read later than an explicit nil. */
  const signatoryCount = 1 + otherParties.filter((p) => p.email.trim()).length;
  const witnessCount = 0;

  /* A form taken from the standard library arrives already copied into the
     client's repository, so the upload step is done before they get here. The
     file is adopted rather than re-uploaded: asking someone to upload the
     document the platform just handed them would be absurd, and would put a
     second copy against their quota. */
  useEffect(() => {
    if (!prefill?.storagePath) return;
    setUpload({ path: prefill.storagePath, bytes: 0, name: 'Standard form' });
    if (prefill.templateId) {
      setChoice((current) => ({ ...current, templateId: prefill.templateId }));
    }
  }, [prefill?.storagePath, prefill?.templateId]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/documents/request', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        setOptions(payload.options);
      } catch {
        setError('Could not load this page. Reload to try again.');
      }
    })();
  }, []);

  /* Templates are fetched when both halves of the choice are present — the
     server decides what is available, because it is the server that knows the
     statutes. */
  const loadTemplates = useCallback(async (service, jurisdiction) => {
    if (!service || !jurisdiction) {
      setTemplates(null);
      return;
    }

    setTemplates('loading');

    try {
      const response = await fetch(
        `/api/documents/request?jurisdiction=${encodeURIComponent(jurisdiction)}&service=${encodeURIComponent(service)}`,
        { cache: 'no-store' },
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setTemplates({ available: [], unavailable: [], refusal: payload.message });
        return;
      }

      setTemplates(payload);
    } catch {
      setTemplates({ available: [], unavailable: [], refusal: 'Could not load document types.' });
    }
  }, []);

  useEffect(() => {
    loadTemplates(choice.requestedService, choice.jurisdiction);
    setChoice((current) => ({ ...current, templateId: '' }));
  }, [choice.requestedService, choice.jurisdiction, loadTemplates]);

  /* The quote comes from the server as the client fills the form in. Doing the
     arithmetic here instead would mean the number shown and the number charged
     were computed by two different pieces of code — and only one of them is
     the one that counts. The site's own Terms of Service clause 5 requires the
     fee to be shown before the transaction completes. */
  const notarized = Boolean(
    options?.services?.find((s) => s.value === choice.requestedService)?.serviceType,
  );

  useEffect(() => {
    if (!choice.requestedService) {
      setFeeQuote(null);
      return;
    }

    (async () => {
      try {
        const query = new URLSearchParams({
          quote: '1',
          notarized: String(notarized),
          signatories: String(signatoryCount),
          witnesses: String(witnessCount),
          seals: String(seals),
          jurisdiction: choice.jurisdiction || '',
        });
        const response = await fetch(`/api/documents/request?${query}`, { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        setFeeQuote(response.ok ? payload.quote : null);
      } catch {
        setFeeQuote(null);
      }
    })();
  }, [notarized, signatoryCount, witnessCount, seals, choice.requestedService, choice.jurisdiction]);

  const go = (direction) => {
    const index = STEPS.indexOf(step);
    const next = STEPS[index + direction];
    if (next) {
      setError(null);
      setStep(next);
    }
  };

  const pickFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setBusy(true);

    try {
      const result = await uploadFile(file, { purpose: UPLOAD_PURPOSE.DOCUMENT });
      setUpload({ path: result.path, bytes: result.bytes, name: file.name });
      if (!documentName) setDocumentName(file.name.replace(/\.pdf$/i, ''));
    } catch (uploadError) {
      setError(
        uploadError instanceof UploadError
          ? uploadError.message
          : 'That upload did not work. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/documents/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurisdiction: choice.jurisdiction,
          requestedService: choice.requestedService,
          templateId: choice.templateId,
          storagePath: upload?.path,
          name: documentName,
          signatories: signatoryCount,
          witnesses: witnessCount,
          seals,
          signingWindowDays,
          parties: otherParties
            .filter((p) => p.email.trim())
            .map((p) => ({ name: p.name, email: p.email, role: p.role })),
          acceptances: {
            termsVersion: options.termsVersion,
            disclaimerVersion: options.disclaimer.version,
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.message ?? 'That did not go through.');
        // Send them back to the step that failed, rather than leaving them on
        // payment wondering which earlier answer was the problem.
        if (payload.field === 'document') setStep('document');
        if (payload.field === 'templateId' || payload.field === 'jurisdiction') setStep('service');
        if (payload.field === 'terms') setStep('terms');
        if (payload.field === 'disclaimer') setStep('disclaimer');
        return;
      }

      router.push(`/${locale}/request/${payload.documentId}`);
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  if (!options) {
    return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;
  }

  const index = STEPS.indexOf(step);
  const selectedService = options.services.find((s) => s.value === choice.requestedService);

  return (
    <div style={{ maxWidth: 720 }}>
      {/* ---------------- progress ---------------- */}
      <ol
        className="d-flex flex-wrap gap-2 mb-4 ps-0"
        style={{ listStyle: 'none', fontSize: '0.82rem' }}
      >
        {options.steps.map((entry, position) => (
          <li
            key={entry.value}
            style={{
              ...pill(position === index ? 'info' : position < index ? 'success' : 'neutral'),
              fontWeight: position === index ? 700 : 500,
            }}
          >
            {position < index ? '✓ ' : ''}
            {entry.label}
          </li>
        ))}
      </ol>

      {error && (
        <div className="alert alert-danger py-2" role="status">
          {error}
        </div>
      )}

      {/* ---------------- 1. terms ---------------- */}
      {step === 'terms' && (
        <section>
          <h2 style={STYLES.sectionHeading}>Terms and conditions</h2>
          <p style={{ ...STYLES.lede, fontSize: '0.9rem' }}>
            Please read the terms before continuing. Your acceptance is recorded
            with the version of the terms you agreed to, so that it is clear
            later what you were shown.
          </p>

          <div
            className="p-3 mt-3"
            style={{
              ...STYLES.card,
              background: COLORS.surface,
              maxHeight: 240,
              overflowY: 'auto',
              fontSize: '0.86rem',
              lineHeight: 1.7,
              color: COLORS.inkSubtle,
            }}
          >
            <p>
              <strong>Version {options.termsVersion}</strong>
            </p>
            <p>
              The full terms of service are published at{' '}
              <a href={`/${locale}/terms`}>/{locale}/terms</a>. In summary:
              WiScribbles provides a platform connecting you with independent
              Notaries Public and Commissioners of Oaths. Fees are payable per
              document. Professionals are independent and responsible for their
              own professional obligations. Your documents are stored encrypted
              and access to them is recorded.
            </p>
            <p>
              Electronic execution is effective only to the extent the law of
              the relevant jurisdiction gives it effect. WiScribbles refuses
              requests where it would not, rather than executing an instrument
              with no legal effect.
            </p>
          </div>

          <div className="form-check mt-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="accept-terms"
              checked={accepted.terms}
              onChange={(e) => setAccepted({ ...accepted, terms: e.target.checked })}
            />
            <label className="form-check-label" htmlFor="accept-terms">
              I have read and accept the terms and conditions.
            </label>
          </div>

          <button
            type="button"
            className="btn mt-3"
            disabled={!accepted.terms}
            onClick={() => go(1)}
            style={STYLES.buttonPrimary}
          >
            Continue
          </button>
        </section>
      )}

      {/* ---------------- 2. disclaimer ---------------- */}
      {step === 'disclaimer' && (
        <section>
          <h2 style={STYLES.sectionHeading}>{options.disclaimer.heading}</h2>

          <ul className="mt-3" style={{ fontSize: '0.9rem', lineHeight: 1.75, color: COLORS.inkSubtle }}>
            {options.disclaimer.points.map((point, position) => (
              <li key={position} className="mb-2">
                {point}
              </li>
            ))}
          </ul>

          <div className="form-check mt-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="accept-disclaimer"
              checked={accepted.disclaimer}
              onChange={(e) => setAccepted({ ...accepted, disclaimer: e.target.checked })}
            />
            <label className="form-check-label" htmlFor="accept-disclaimer">
              I understand.
            </label>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button
              type="button"
              className="btn"
              disabled={!accepted.disclaimer}
              onClick={() => go(1)}
              style={STYLES.buttonPrimary}
            >
              Continue
            </button>
            <button type="button" className="btn btn-link text-muted" onClick={() => go(-1)}>
              Back
            </button>
          </div>
        </section>
      )}

      {/* ---------------- 3. service ---------------- */}
      {step === 'service' && (
        <section>
          <h2 style={STYLES.sectionHeading}>What do you need?</h2>

          <fieldset className="mt-3 mb-3">
            {options.services.map((service) => (
              <div className="form-check mb-2" key={service.value}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="requestedService"
                  id={`service-${service.value}`}
                  checked={choice.requestedService === service.value}
                  onChange={() => setChoice({ ...choice, requestedService: service.value })}
                />
                <label className="form-check-label" htmlFor={`service-${service.value}`}>
                  {service.label}
                  <span className="d-block" style={{ fontSize: '0.82rem', color: COLORS.inkMuted }}>
                    {service.description}
                  </span>
                </label>
              </div>
            ))}
          </fieldset>

          <div className="mb-3">
            <label className="form-label" htmlFor="req-jurisdiction" style={{ fontWeight: 500 }}>
              Which jurisdiction is the document for?
            </label>
            <select
              id="req-jurisdiction"
              className="form-select"
              value={choice.jurisdiction}
              onChange={(e) => setChoice({ ...choice, jurisdiction: e.target.value })}
              style={{ maxWidth: 420 }}
            >
              <option value="">Choose…</option>
              {options.jurisdictions.map((place) => (
                <option key={place.code} value={place.code}>
                  {place.name}
                </option>
              ))}
            </select>
            <p className="mb-0 mt-1" style={{ fontSize: '0.82rem', color: COLORS.inkMuted }}>
              Where the document will be used or relied on — not necessarily
              where you are sitting.
            </p>
          </div>

          {templates === 'loading' && <p style={{ color: COLORS.inkMuted }}>Checking…</p>}

          {templates && templates !== 'loading' && (
            <>
              {templates.refusal && (
                <div className="alert alert-warning py-2" role="status">
                  {templates.refusal}
                </div>
              )}

              {selectedService?.serviceType &&
                templates.supportsNotarization === false && (
                  <div className="alert alert-warning py-2" role="status">
                    {templates.jurisdiction?.name} law does not give electronic
                    notarisation statutory effect
                    {templates.jurisdiction?.statute ? ` (${templates.jurisdiction.statute})` : ''}.
                    You can still have a document signed electronically here, but
                    it cannot be notarised or commissioned in this jurisdiction.
                  </div>
                )}

              {templates.available?.length > 0 && (
                <div className="mb-3">
                  <label className="form-label" htmlFor="req-template" style={{ fontWeight: 500 }}>
                    What kind of document?
                  </label>
                  <select
                    id="req-template"
                    className="form-select"
                    value={choice.templateId}
                    onChange={(e) => setChoice({ ...choice, templateId: e.target.value })}
                    style={{ maxWidth: 420 }}
                  >
                    <option value="">Choose…</option>
                    {templates.available.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {choice.templateId && (
                    <p className="mb-0 mt-1" style={{ fontSize: '0.82rem', color: COLORS.inkMuted }}>
                      {templates.available.find((t) => t.id === choice.templateId)?.description}
                    </p>
                  )}
                </div>
              )}

              {templates.available?.length === 0 && !templates.refusal && (
                <div className="p-3 mb-3" style={{ ...STYLES.card, background: COLORS.surface }}>
                  <p className="mb-0" style={{ fontSize: '0.88rem', color: COLORS.inkSubtle }}>
                    No document types are available for that combination. If
                    this is a new deployment, the Website Manager has not
                    created any templates yet — every document has to be bound
                    to one.
                  </p>
                </div>
              )}

              {templates.unavailable?.length > 0 && (
                <details className="mb-3">
                  <summary style={{ fontSize: '0.86rem', color: COLORS.inkSubtle, cursor: 'pointer' }}>
                    {templates.unavailable.length} document type
                    {templates.unavailable.length === 1 ? '' : 's'} not available here — why
                  </summary>
                  <ul className="mt-2" style={{ fontSize: '0.84rem', color: COLORS.inkMuted, lineHeight: 1.6 }}>
                    {templates.unavailable.map((template) => (
                      <li key={template.id} className="mb-2">
                        <strong>{template.name}</strong> — {template.reason}
                        {/* An exclusion is not a dead end. Six of the eight
                            documents the home page advertises land here, so
                            offering the paper route is the difference between
                            a product and an apology. */}
                        {template.prepareRegisterEligible && (
                          <a
                            className="d-inline-block mt-1"
                            style={{ fontSize: '0.84rem' }}
                            href={`/${locale}/prepare-register?category=${encodeURIComponent(template.documentCategory ?? '')}&jurisdiction=${encodeURIComponent(choice.jurisdiction)}`}
                          >
                            Have it prepared and signed on paper instead →
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn"
              disabled={!choice.templateId}
              onClick={() => go(1)}
              style={STYLES.buttonPrimary}
            >
              Continue
            </button>
            <button type="button" className="btn btn-link text-muted" onClick={() => go(-1)}>
              Back
            </button>
          </div>
        </section>
      )}

      {/* ---------------- 4. document ---------------- */}
      {step === 'document' && (
        <section>
          <h2 style={STYLES.sectionHeading}>Your document</h2>
          <p style={{ ...STYLES.lede, fontSize: '0.9rem' }}>
            A PDF, up to {MAX_UPLOAD_MB}MB. It has to be a PDF because the PDF
            is what gets signed and sealed — converting it here would mean the
            executed document is not the file you uploaded.
          </p>

          {prefill?.storagePath ? (
            <div
              className="p-3 mb-3"
              style={{ ...STYLES.card, borderLeft: `4px solid ${COLORS.success}` }}
            >
              <strong style={{ fontSize: '0.9rem' }}>Standard form ready</strong>
              <p className="mb-0 mt-1" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                You chose this from the forms library, so there is nothing to
                upload. Give it a name below and carry on.
              </p>
            </div>
          ) : (
            <div className="mb-3">
              <input
                type="file"
                className="form-control"
                accept="application/pdf"
                onChange={pickFile}
                disabled={busy}
                style={{ maxWidth: 420 }}
              />
            </div>
          )}

          {upload && (
            <div
              className="p-3 mb-3"
              style={{ ...STYLES.card, borderLeft: `4px solid ${COLORS.success}` }}
            >
              <strong style={{ fontSize: '0.9rem' }}>{upload.name}</strong>
              <p className="mb-0 mt-1" style={{ fontSize: '0.82rem', color: COLORS.inkMuted }}>
                {(upload.bytes / (1024 * 1024)).toFixed(2)} MB uploaded.
              </p>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label" htmlFor="req-name" style={{ fontWeight: 500 }}>
              What should we call it?
            </label>
            <input
              id="req-name"
              className="form-control"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g. Affidavit of identity — J. Persaud"
              style={{ maxWidth: 420 }}
            />
          </div>

          {/* ---- who is involved ---- */}
          <fieldset className="mb-3">
            <legend className="form-label" style={{ fontWeight: 500, fontSize: '1rem' }}>
              Who else signs this?
            </legend>
            <p style={{ ...STYLES.lede, fontSize: '0.84rem' }}>
              You are the first signatory. Add anyone else who has to sign.
              They each sign in turn, when they can — nobody has to be
              available at the same time as anyone else, and they do not need a
              WiScribbles account.
            </p>

            {otherParties.map((party, index) => (
              <div className="row g-2 mb-2 align-items-start" key={index} style={{ maxWidth: 640 }}>
                <div className="col-12 col-sm-5">
                  <input
                    className="form-control"
                    value={party.name}
                    onChange={(e) => {
                      const next = [...otherParties];
                      next[index] = { ...party, name: e.target.value };
                      setOtherParties(next);
                    }}
                    placeholder="Name"
                    aria-label={`Party ${index + 2} name`}
                  />
                </div>
                <div className="col-12 col-sm-5">
                  <input
                    className="form-control"
                    type="email"
                    value={party.email}
                    onChange={(e) => {
                      const next = [...otherParties];
                      next[index] = { ...party, email: e.target.value };
                      setOtherParties(next);
                    }}
                    placeholder="Email address"
                    aria-label={`Party ${index + 2} email`}
                  />
                </div>
                <div className="col-12 col-sm-2">
                  <button
                    type="button"
                    className="btn btn-link text-muted px-0"
                    onClick={() => setOtherParties(otherParties.filter((_, i) => i !== index))}
                    aria-label={`Remove party ${index + 2}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {otherParties.length < 9 && (
              <button
                type="button"
                className="btn btn-sm btn-link px-0"
                onClick={() =>
                  setOtherParties([...otherParties, { name: '', email: '', role: 'signatory' }])
                }
              >
                + Add a party
              </button>
            )}

            {errors.parties && <div className="text-danger small mt-1">{errors.parties}</div>}

            {/* Standing, not reactive. The old version waited until a witness
                had been added and then warned about it; this says the position
                before the client has invested anything in a plan that cannot
                work, and offers the route that does. */}
            <div
              className="p-3 mt-3"
              style={{
                ...STYLES.card,
                background: COLORS.warningBg,
                borderLeft: `4px solid ${COLORS.warning}`,
              }}
            >
              <p className="mb-2" style={{ fontSize: '0.84rem', color: COLORS.warningText, lineHeight: 1.7 }}>
                <strong>Does this document need a witness?</strong> Then it
                cannot be signed here, and we would rather say so now than at
                the end. A witness has to be present when you sign, and none of
                the electronic transactions Acts in our jurisdictions turns
                &ldquo;in the presence of&rdquo; into &ldquo;over video&rdquo;.
                Everyone you add above is a signatory.
              </p>
              <a
                style={{ fontSize: '0.84rem' }}
                href={`/${locale}/prepare-register?jurisdiction=${encodeURIComponent(choice.jurisdiction ?? '')}`}
              >
                Have it prepared here and signed on paper instead &rarr;
              </a>
            </div>

            {notarized && (
              <div className="mt-3" style={{ maxWidth: 200 }}>
                <label className="form-label" htmlFor="req-seals" style={{ fontSize: '0.86rem' }}>
                  Notarial seals
                </label>
                <input
                  id="req-seals"
                  type="number"
                  className="form-control"
                  min={1}
                  max={options.priceList?.limits?.MAX_SEALS ?? 5}
                  value={seals}
                  onChange={(e) => setSeals(Math.max(1, Number(e.target.value) || 1))}
                />
                <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: COLORS.inkMuted }}>
                  Usually one.
                </p>
              </div>
            )}

            {/* ---- the signing window ---- */}
            <div className="mt-4" style={{ maxWidth: 420 }}>
              <label className="form-label" htmlFor="req-window" style={{ fontWeight: 500 }}>
                How long do the parties have to sign?
              </label>
              <select
                id="req-window"
                className="form-select"
                value={signingWindowDays}
                onChange={(e) => setSigningWindowDays(Number(e.target.value))}
              >
                {(options.signingWindows ?? []).map((window) => (
                  <option key={window.days} value={window.days}>
                    {window.label}
                    {window.recommended ? ' — recommended' : ''}
                  </option>
                ))}
              </select>
              <p className="mb-0 mt-1" style={{ fontSize: '0.8rem', color: COLORS.inkMuted, lineHeight: 1.6 }}>
                If it is not signed in that time the file is removed to free
                storage, and you would need to upload it again. You can extend
                the window at any point before it closes. A document that HAS
                been signed or notarised is kept permanently — this only ever
                applies to one nobody completed.
              </p>
            </div>

            {feeQuote && (
              <p className="mb-0 mt-3" style={{ fontSize: '0.86rem', color: COLORS.inkSubtle }}>
                {signatoryCount} signator{signatoryCount === 1 ? 'y' : 'ies'}
                {' — fee so far '}
                <strong>{feeQuote.formattedTotal}</strong>, itemised on the next step.
              </p>
            )}
          </fieldset>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn"
              disabled={!upload || busy}
              onClick={() => go(1)}
              style={STYLES.buttonPrimary}
            >
              {busy ? 'Uploading…' : 'Continue'}
            </button>
            <button type="button" className="btn btn-link text-muted" onClick={() => go(-1)}>
              Back
            </button>
          </div>
        </section>
      )}

      {/* ---------------- 5. payment ---------------- */}
      {step === 'payment' && (
        <section>
          <h2 style={STYLES.sectionHeading}>Payment</h2>

          {/* ---- the itemised quote ---- */}
          {feeQuote && (
            <div className="p-3 mt-3 mb-3" style={STYLES.card}>
              <table className="table table-sm mb-0" style={{ fontSize: '0.88rem' }}>
                <tbody>
                  {feeQuote.lines.map((line) => (
                    <tr key={line.key}>
                      <td style={{ border: 'none', paddingLeft: 0 }}>
                        {line.label}
                        {line.note && (
                          <span
                            className="d-block"
                            style={{ fontSize: '0.78rem', color: COLORS.inkMuted }}
                          >
                            {line.note}
                          </span>
                        )}
                      </td>
                      <td
                        className="text-end"
                        style={{ border: 'none', paddingRight: 0, whiteSpace: 'nowrap' }}
                      >
                        {line.amountCents === 0
                          ? 'No charge'
                          : `$${(line.amountCents / 100).toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      style={{
                        borderTop: `1px solid ${COLORS.border}`,
                        paddingLeft: 0,
                        fontWeight: 600,
                      }}
                    >
                      Total
                    </td>
                    <td
                      className="text-end"
                      style={{
                        borderTop: `1px solid ${COLORS.border}`,
                        paddingRight: 0,
                        fontWeight: 600,
                      }}
                    >
                      {feeQuote.formattedTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div
            className="p-3 mb-3"
            style={{ ...STYLES.card, background: COLORS.surface, borderRadius: RADIUS.md }}
          >
            <p className="mb-2" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle, lineHeight: 1.7 }}>
              <strong>This is the fee, but it is not being collected yet.</strong>{' '}
              Card collection works. What is outstanding is the other half of the
              money flow — how the service fee reaches the professional who does
              the work — which depends on a money-transmission question still
              being settled. Taking your money before the platform can pay out
              on it would be the wrong way round.
            </p>
            <p className="mb-0" style={{ fontSize: '0.88rem', color: COLORS.inkMuted, lineHeight: 1.7 }}>
              Your request goes through at no charge, and the quote above is
              recorded against it so you can see what it would have been.
            </p>
          </div>

          <dl className="mb-4" style={{ fontSize: '0.88rem' }}>
            <div className="d-flex justify-content-between py-1" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <dt style={{ fontWeight: 500 }}>Service</dt>
              <dd className="mb-0" style={{ color: COLORS.inkSubtle }}>{selectedService?.label}</dd>
            </div>
            <div className="d-flex justify-content-between py-1" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <dt style={{ fontWeight: 500 }}>Document type</dt>
              <dd className="mb-0" style={{ color: COLORS.inkSubtle }}>
                {templates !== 'loading' &&
                  templates?.available?.find((t) => t.id === choice.templateId)?.name}
              </dd>
            </div>
            <div className="d-flex justify-content-between py-1" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <dt style={{ fontWeight: 500 }}>Jurisdiction</dt>
              <dd className="mb-0" style={{ color: COLORS.inkSubtle }}>
                {options.jurisdictions.find((j) => j.code === choice.jurisdiction)?.name}
              </dd>
            </div>
            <div className="d-flex justify-content-between py-1">
              <dt style={{ fontWeight: 500 }}>File</dt>
              <dd className="mb-0" style={{ color: COLORS.inkSubtle }}>{upload?.name}</dd>
            </div>
          </dl>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={submit}
              style={STYLES.buttonPositive}
            >
              {busy ? 'Submitting…' : 'Submit request'}
            </button>
            <button type="button" className="btn btn-link text-muted" onClick={() => go(-1)}>
              Back
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
