'use client';

/**
 * The Website Manager's review queue.
 *
 * Three actions per application, as the brief requires: accept, reject, or
 * request more information. Reject and request-more-info both demand a
 * written reason — the partner sees it, and a decision about someone's
 * livelihood with no stated reason is not a decision they can act on.
 */

import { useCallback, useEffect, useState } from 'react';

const STATUS_FILTERS = [
  { value: 'pending_review', label: 'Awaiting review' },
  { value: 'more_info_requested', label: 'Information requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'all', label: 'All' },
];

const KYC_LABEL = {
  not_started: 'Not started',
  pending: 'In progress',
  in_review: 'Under review',
  approved: 'Verified',
  declined: 'Failed',
  expired: 'Expired',
};

const KYC_COLOR = {
  approved: '#1b7f4b',
  declined: '#b3261e',
  expired: '#8a5a00',
};

export default function PartnerReviewQueue() {
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [applications, setApplications] = useState(null);
  const [error, setError] = useState(null);
  const [busyUid, setBusyUid] = useState(null);
  const [notice, setNotice] = useState(null);
  const [feedbackFor, setFeedbackFor] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [pendingDecision, setPendingDecision] = useState(null);

  const load = useCallback(async (status) => {
    setApplications(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/partners?status=${status}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        setError('Could not load the queue.');
        return;
      }
      const payload = await response.json();
      setApplications(payload.applications ?? []);
    } catch {
      setError('Could not reach the server.');
    }
  }, []);

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter, load]);

  const decide = async (uid, decision, feedback = null) => {
    setBusyUid(uid);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, decision, feedback }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setNotice({ tone: 'error', message: payload.message ?? 'That did not go through.' });
        return;
      }

      setNotice({
        tone: 'ok',
        message:
          decision === 'approve'
            ? 'Approved. They have been emailed and their dashboard is open.'
            : decision === 'request_info'
              ? 'Sent. Their application is reopened for editing.'
              : 'Recorded.',
      });
      setFeedbackFor(null);
      setFeedbackText('');
      setPendingDecision(null);
      load(statusFilter);
    } catch {
      setNotice({ tone: 'error', message: 'Could not reach the server.' });
    } finally {
      setBusyUid(null);
    }
  };

  const openFeedback = (uid, decision) => {
    setFeedbackFor(uid);
    setPendingDecision(decision);
    setFeedbackText('');
    setNotice(null);
  };

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((filter) => {
          const active = filter.value === statusFilter;
          return (
            <button
              key={filter.value}
              type="button"
              className="btn btn-sm"
              onClick={() => setStatusFilter(filter.value)}
              style={{
                background: active ? '#274171' : '#f1f3f7',
                color: active ? '#fff' : '#49536b',
                fontWeight: active ? 600 : 500,
                padding: '0.35rem 0.9rem',
              }}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {notice && (
        <div
          className={`alert py-2 ${notice.tone === 'ok' ? 'alert-success' : 'alert-danger'}`}
          role="status"
        >
          {notice.message}
        </div>
      )}

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      {applications === null && !error && <p className="text-muted">Loading…</p>}

      {applications?.length === 0 && (
        <p className="text-muted" style={{ padding: '2rem 0' }}>
          Nothing here.
        </p>
      )}

      {applications?.map((application) => {
        const busy = busyUid === application.uid;
        const showingFeedback = feedbackFor === application.uid;

        return (
          <article
            key={application.uid}
            className="rounded p-3 mb-3"
            style={{ border: '1px solid #e6e9ef' }}
          >
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <h2 style={{ fontSize: '1.05rem', margin: 0 }}>
                  {application.name ?? '(no name)'}
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.86rem' }}>
                  {application.email} · {application.roleLabel}
                </p>
              </div>
              <span
                className="badge"
                style={{ background: '#eef2f9', color: '#274171', fontWeight: 600 }}
              >
                {application.status.replace(/_/g, ' ')}
              </span>
            </div>

            <dl
              className="row mt-3 mb-0"
              style={{ fontSize: '0.88rem', rowGap: '0.4rem' }}
            >
              <dt className="col-sm-4 text-muted fw-normal">Jurisdictions</dt>
              <dd className="col-sm-8 mb-0">
                {application.jurisdictions.length
                  ? application.jurisdictions.join(', ')
                  : <span className="text-muted">None selected</span>}
              </dd>

              <dt className="col-sm-4 text-muted fw-normal">Identity check</dt>
              <dd
                className="col-sm-8 mb-0"
                style={{ color: KYC_COLOR[application.kycStatus] ?? 'inherit' }}
              >
                {KYC_LABEL[application.kycStatus] ?? application.kycStatus}
              </dd>

              <dt className="col-sm-4 text-muted fw-normal">Certificate</dt>
              <dd className="col-sm-8 mb-0">
                {application.certificateUrl ? (
                  <a href={application.certificateUrl} target="_blank" rel="noreferrer">
                    View document
                  </a>
                ) : application.certificatePath ? (
                  <span className="text-muted">Uploaded, link unavailable</span>
                ) : (
                  <span className="text-muted">Not uploaded</span>
                )}
              </dd>

              <dt className="col-sm-4 text-muted fw-normal">Submitted</dt>
              <dd className="col-sm-8 mb-0">
                {application.submittedForReviewAt
                  ? new Date(application.submittedForReviewAt).toLocaleString()
                  : '—'}
              </dd>
            </dl>

            {application.adminFeedback && (
              <p
                className="mt-3 mb-0 p-2 rounded"
                style={{ background: '#fff6e5', fontSize: '0.86rem' }}
              >
                <strong>Awaiting their reply:</strong> {application.adminFeedback}
              </p>
            )}

            {(application.kycStatus !== 'approved' || !application.certificatePath) &&
              application.status === 'pending_review' && (
                <p
                  className="mt-3 mb-0"
                  style={{ fontSize: '0.84rem', color: '#8a5a00' }}
                >
                  Incomplete —
                  {application.kycStatus !== 'approved' && ' identity not verified'}
                  {application.kycStatus !== 'approved' && !application.certificatePath && ','}
                  {!application.certificatePath && ' no certificate uploaded'}.
                </p>
              )}

            {showingFeedback ? (
              <div className="mt-3">
                <label
                  className="form-label"
                  htmlFor={`feedback-${application.uid}`}
                  style={{ fontSize: '0.86rem', fontWeight: 600 }}
                >
                  {pendingDecision === 'request_info'
                    ? 'What else do you need from them?'
                    : 'Reason for rejection'}
                </label>
                <textarea
                  id={`feedback-${application.uid}`}
                  className="form-control"
                  rows={3}
                  value={feedbackText}
                  onChange={(event) => setFeedbackText(event.target.value)}
                  placeholder={
                    pendingDecision === 'request_info'
                      ? 'e.g. The certificate is illegible — please upload a clearer scan.'
                      : 'They will be shown this.'
                  }
                />
                <div className="d-flex gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={busy || !feedbackText.trim()}
                    onClick={() => decide(application.uid, pendingDecision, feedbackText)}
                    style={{ background: '#0C1134', color: '#fff' }}
                  >
                    {busy ? 'Sending…' : 'Send'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-muted"
                    onClick={() => setFeedbackFor(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-wrap gap-2 mt-3">
                {application.status !== 'approved' && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={busy}
                    onClick={() => decide(application.uid, 'approve')}
                    style={{ background: '#1b7f4b', color: '#fff' }}
                  >
                    {busy ? 'Working…' : 'Approve'}
                  </button>
                )}

                {application.status !== 'approved' && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={busy}
                    onClick={() => openFeedback(application.uid, 'request_info')}
                  >
                    Request more information
                  </button>
                )}

                {application.status !== 'rejected' && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    disabled={busy}
                    onClick={() => openFeedback(application.uid, 'reject')}
                  >
                    Reject
                  </button>
                )}

                {application.status === 'approved' && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    disabled={busy}
                    onClick={() => openFeedback(application.uid, 'reject')}
                  >
                    Withdraw approval
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}
    </>
  );
}
