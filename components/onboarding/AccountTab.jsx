'use client';

/**
 * The Account tab of the pre-approval holding dashboard.
 *
 * Brief: "Form must capture Jurisdiction(s) of Practice and trigger the
 * selected Identity Verification flow" and "Implement a file upload component
 * for professional certificates ... Max File Size: Must adhere to the system
 * limit (e.g. 25MB)."
 *
 * Three things, each independently savable, because a partner who has done
 * two of three should not lose them by leaving the page.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_UPLOAD_MB, UPLOAD_PURPOSE, UploadError, uploadFile } from '@/lib/storage/client';

const KYC_TONE = {
  not_started: { bg: '#f7f8fa', fg: '#5a6572' },
  pending: { bg: '#eef2f9', fg: '#274171' },
  in_review: { bg: '#eef2f9', fg: '#274171' },
  approved: { bg: '#e8f6ee', fg: '#1b7f4b' },
  declined: { bg: '#fdecea', fg: '#b3261e' },
  expired: { bg: '#fff6e5', fg: '#8a5a00' },
};

const KYC_LABEL = {
  not_started: 'Not started',
  pending: 'In progress',
  in_review: 'Under review',
  approved: 'Verified',
  declined: 'Could not be verified',
  expired: 'Expired — start again',
};

export default function AccountTab({ canEdit = true }) {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [jurisdictions, setJurisdictions] = useState([]);
  const [savingJurisdictions, setSavingJurisdictions] = useState(false);
  const [jurisdictionResult, setJurisdictionResult] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInput = useRef(null);

  const [startingKyc, setStartingKyc] = useState(false);
  const [kycError, setKycError] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/onboarding/account', { cache: 'no-store' });
      if (!response.ok) {
        setLoadError('We could not load your application. Reload the page to try again.');
        return;
      }
      const payload = await response.json();
      setData(payload);
      setJurisdictions(payload.jurisdictions ?? []);
    } catch {
      setLoadError('We could not reach the server.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /*
   * The user leaves for the provider's hosted page and comes back. Poll
   * briefly on return so the status updates without a manual refresh — the
   * webhook may land a moment after the redirect.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!new URLSearchParams(window.location.search).has('kyc')) return undefined;

    let polls = 0;
    const timer = setInterval(() => {
      polls += 1;
      if (polls > 10) {
        clearInterval(timer);
        return;
      }
      load();
    }, 3000);
    return () => clearInterval(timer);
  }, [load]);

  if (loadError) {
    return (
      <div className="alert alert-danger" role="alert">
        {loadError}
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-muted" style={{ padding: '1rem 0' }}>
        Loading your application…
      </p>
    );
  }

  const toggleJurisdiction = (code) => {
    setJurisdictionResult(null);
    setJurisdictions((current) =>
      current.includes(code) ? current.filter((c) => c !== code) : [...current, code],
    );
  };

  const saveJurisdictions = async () => {
    setSavingJurisdictions(true);
    setJurisdictionResult(null);
    try {
      const response = await fetch('/api/onboarding/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jurisdictions }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setJurisdictionResult({
          tone: 'error',
          message:
            payload.errors?.jurisdictions ?? payload.message ?? 'We could not save that.',
        });
        return;
      }
      setJurisdictionResult({ tone: 'ok', message: 'Saved.' });
      load();
    } catch {
      setJurisdictionResult({ tone: 'error', message: 'We could not reach the server.' });
    } finally {
      setSavingJurisdictions(false);
    }
  };

  const onFileChosen = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const { path } = await uploadFile(file, { purpose: UPLOAD_PURPOSE.CERTIFICATE });

      const response = await fetch('/api/onboarding/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificatePath: path }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setUploadResult({
          tone: 'error',
          message: payload.errors?.certificatePath ?? 'The upload could not be recorded.',
        });
        return;
      }

      setUploadResult({ tone: 'ok', message: `${file.name} uploaded.` });
      load();
    } catch (error) {
      setUploadResult({
        tone: 'error',
        message:
          error instanceof UploadError ? error.message : 'The upload failed. Try again.',
      });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const startKyc = async () => {
    setStartingKyc(true);
    setKycError(null);
    try {
      const response = await fetch('/api/kyc/start', { method: 'POST' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setKycError(payload.message ?? 'We could not start the identity check.');
        return;
      }
      // Leaves the site for the provider's hosted page.
      window.location.href = payload.url;
    } catch {
      setKycError('We could not reach the server.');
    } finally {
      setStartingKyc(false);
    }
  };

  const kycTone = KYC_TONE[data.kycStatus] ?? KYC_TONE.not_started;
  const kycRestartable = ['not_started', 'declined', 'expired'].includes(data.kycStatus);

  return (
    <div style={{ maxWidth: 680 }}>
      {/* ---------------- Jurisdictions ---------------- */}
      {data.jurisdictionBound && (
        <section className="mb-5">
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.4rem' }}>
            Jurisdiction(s) of practice
          </h2>
          <p className="text-muted" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
            Where you are licensed to act. You will only be offered work from
            these jurisdictions, and a session whose document belongs elsewhere
            will not proceed.
          </p>

          <div className="d-flex flex-column gap-2 mt-3">
            {data.selectableJurisdictions.map((j) => {
              const checked = jurisdictions.includes(j.code);
              return (
                <label
                  key={j.code}
                  className="d-flex align-items-center gap-2 p-2 rounded border"
                  style={{
                    cursor: canEdit ? 'pointer' : 'not-allowed',
                    opacity: canEdit ? 1 : 0.6,
                    borderColor: checked ? '#274171' : '#dee2e6',
                    background: checked ? 'rgba(39,65,113,0.04)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    className="form-check-input mt-0"
                    checked={checked}
                    disabled={!canEdit}
                    onChange={() => toggleJurisdiction(j.code)}
                  />
                  <span style={{ fontWeight: 500 }}>{j.name}</span>
                </label>
              );
            })}
          </div>

          <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.8rem' }}>
            Only jurisdictions where electronic notarisation has statutory effect
            are listed.
          </p>

          {jurisdictionResult && (
            <p
              className="mt-2 mb-0"
              style={{
                fontSize: '0.86rem',
                color: jurisdictionResult.tone === 'ok' ? '#1b7f4b' : '#b3261e',
              }}
            >
              {jurisdictionResult.message}
            </p>
          )}

          {canEdit && (
            <button
              type="button"
              className="btn mt-3"
              onClick={saveJurisdictions}
              disabled={savingJurisdictions}
              style={{ background: '#0C1134', color: '#fff', padding: '0.5rem 1.2rem' }}
            >
              {savingJurisdictions ? 'Saving…' : 'Save jurisdictions'}
            </button>
          )}
        </section>
      )}

      {/* ---------------- Identity verification ---------------- */}
      <section className="mb-5">
        <h2 style={{ fontSize: '1.05rem', marginBottom: '0.4rem' }}>Identity verification</h2>
        <p className="text-muted" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
          You will be taken to our verification partner to photograph your
          identification and take a short selfie. Your documents are handled by
          them and never stored on WiScribbles.
        </p>

        <span
          className="d-inline-block rounded-pill px-3 py-1 mt-2"
          style={{ background: kycTone.bg, color: kycTone.fg, fontSize: '0.86rem', fontWeight: 600 }}
        >
          {KYC_LABEL[data.kycStatus] ?? data.kycStatus}
        </span>

        {data.kycStatus === 'declined' && data.kycDeclineReason && (
          <p className="mt-2 mb-0" style={{ fontSize: '0.86rem', color: '#b3261e' }}>
            {data.kycDeclineReason}
          </p>
        )}

        {kycError && (
          <p className="mt-2 mb-0" style={{ fontSize: '0.86rem', color: '#b3261e' }}>
            {kycError}
          </p>
        )}

        {canEdit && kycRestartable && (
          <div>
            <button
              type="button"
              className="btn mt-3"
              onClick={startKyc}
              disabled={startingKyc}
              style={{ background: '#0C1134', color: '#fff', padding: '0.5rem 1.2rem' }}
            >
              {startingKyc
                ? 'Starting…'
                : data.kycStatus === 'not_started'
                  ? 'Verify my identity'
                  : 'Try again'}
            </button>
          </div>
        )}

        {data.kycStatus === 'approved' && (
          <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
            This confirms your identity to WiScribbles. It does not replace your
            own duty to satisfy yourself of a signer&rsquo;s identity during a
            session.
          </p>
        )}
      </section>

      {/* ---------------- Certificate ---------------- */}
      <section>
        <h2 style={{ fontSize: '1.05rem', marginBottom: '0.4rem' }}>
          {data.certificateLabel}
        </h2>
        <p className="text-muted" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
          PDF or a clear photograph, up to {MAX_UPLOAD_MB}MB. The Website Manager
          reviews this before your account is approved.
        </p>

        {data.certificatePath && (
          <p className="mb-2" style={{ fontSize: '0.88rem', color: '#1b7f4b' }}>
            ✓ Uploaded
            {data.certificateUploadedAt
              ? ` on ${new Date(data.certificateUploadedAt).toLocaleDateString()}`
              : ''}
            .
          </p>
        )}

        {canEdit && (
          <>
            <input
              ref={fileInput}
              type="file"
              className="form-control"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
              onChange={onFileChosen}
              disabled={uploading}
              style={{ maxWidth: 420 }}
            />
            {uploading && (
              <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.86rem' }}>
                Uploading…
              </p>
            )}
          </>
        )}

        {uploadResult && (
          <p
            className="mt-2 mb-0"
            style={{
              fontSize: '0.86rem',
              color: uploadResult.tone === 'ok' ? '#1b7f4b' : '#b3261e',
            }}
          >
            {uploadResult.message}
          </p>
        )}

        {data.certificatePath && canEdit && (
          <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.8rem' }}>
            Choosing another file replaces the one on record.
          </p>
        )}
      </section>
    </div>
  );
}
