'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchNotarizationSubmissions, updateNotarizationStatus } from '@/services/AdminService';
import { FileText, CalendarCheck, Clock, UserCheck } from 'lucide-react';

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending assignment' },
  { value: 'assigned', label: 'Assigned to notary' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'notarized', label: 'Notarized' },
];

const badgeForStatus = (status) => {
  switch (status) {
    case 'pending':
      return 'text-bg-warning';
    case 'assigned':
      return 'text-bg-info';
    case 'in_progress':
      return 'text-bg-primary';
    case 'completed':
      return 'text-bg-success';
    case 'notarized':
      return 'text-bg-dark';
    default:
      return 'text-bg-light text-dark';
  }
};

const NotarizationsAdminPage = () => {
  const params = useParams();
  const locale = params?.locale || 'en';
  const withLocale = (path) => `/${locale}${path}`;
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  /* A failed status change used to be logged to the console and nowhere else.
     This page has no toast provider, so the message is rendered. */
  const [actionError, setActionError] = useState(null);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await fetchNotarizationSubmissions({
        status: selectedStatus,
        limit: 200,
        includeCompleted: selectedStatus === 'all',
      });
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to load submissions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const handleStatusChange = async (submissionId, nextStatus) => {
    setActionError(null);

    try {
      /* `workflowStage` is no longer sent: the server sets it alongside
         `status` so the two cannot disagree, and the route accepts only the
         status rather than spreading whatever the browser sends into the
         document. */
      await updateNotarizationStatus(submissionId, { status: nextStatus });
      await loadSubmissions();
    } catch (error) {
      console.error('Failed to update notarization', error);
      /* Shown, not just logged. This write was failing silently against the
         security rules, so the manager pressed a button and nothing happened
         with no indication why. */
      setActionError(error?.message ?? 'That status change did not go through.');
    }
  };

  const activeSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedSubmissionId) ?? null,
    [selectedSubmissionId, submissions],
  );

  return (
    <div className="d-flex flex-column gap-4">
      {actionError && (
        <div className="alert alert-warning mb-0 d-flex justify-content-between align-items-start gap-3" role="alert">
          <span>{actionError}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss"
            onClick={() => setActionError(null)}
          />
        </div>
      )}

      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between gap-3">
        <div>
          <h2 className="fw-semibold mb-1 d-flex align-items-center gap-2">
            <FileText size={26} />
            Notarization Workflows
          </h2>
          <p className="text-muted mb-0">
            Monitor session readiness, ensure compliance checks are complete, and archive notarized packages.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={loadSubmissions}>
            Refresh
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-sm-6 col-xl-3">
              <label className="form-label small text-uppercase text-muted">Status</label>
              <select
                className="form-select"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-sm-6 col-xl-3">
              <p className="text-muted small mb-0">
                {submissions.length} record{submissions.length === 1 ? '' : 's'} loaded
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Client</th>
                  <th>Document</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                      Loading notarizations...
                    </td>
                  </tr>
                )}
                {!loading && submissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No records found for the selected filters.
                    </td>
                  </tr>
                )}
                {!loading &&
                  submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="fw-semibold text-primary">{submission.referenceNumber || submission.id}</td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">
                            {`${submission?.step1?.firstName ?? ''} ${submission?.step1?.lastName ?? ''}`.trim() || '—'}
                          </span>
                          <small className="text-muted">{submission?.step1?.email || 'No email provided'}</small>
                        </div>
                      </td>
                      <td>{submission?.document?.name || submission?.step2?.documentType || '—'}</td>
                      <td>
                        {submission?.meeting?.scheduledDateTime
                          ? new Date(submission.meeting.scheduledDateTime).toLocaleString()
                          : '—'}
                      </td>
                      <td>
                        <span className={`badge ${badgeForStatus(submission.status)}`}>{submission.status}</span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setSelectedSubmissionId(submission.id)}
                          >
                            Details
                          </button>
                          {submission.status === 'pending' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleStatusChange(submission.id, 'assigned')}
                            >
                              Mark Assigned
                            </button>
                          )}
                          {submission.status === 'assigned' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleStatusChange(submission.id, 'in_progress')}
                            >
                              Start Session
                            </button>
                          )}
                          {(submission.status === 'in_progress' || submission.status === 'assigned') && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleStatusChange(submission.id, 'completed')}
                            >
                              Mark Completed
                            </button>
                          )}
                          {submission.status === 'completed' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() => handleStatusChange(submission.id, 'notarized')}
                            >
                              Archive Notarized Copy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {activeSubmission && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <CalendarCheck size={18} />
                  {activeSubmission.referenceNumber || activeSubmission.id}
                </h5>
                <p className="text-muted small mb-0">Full notarization workflow history</p>
              </div>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setSelectedSubmissionId(null)} />
            </div>

            <div className="row g-3">
              <div className="col-md-4">
                <div className="border rounded-3 p-3 h-100">
                  <h6 className="fw-semibold mb-2">Client</h6>
                  <dl className="row small mb-0">
                    <dt className="col-5 text-muted">Name</dt>
                    <dd className="col-7">
                      {`${activeSubmission?.step1?.firstName ?? ''} ${activeSubmission?.step1?.lastName ?? ''}`.trim() || '—'}
                    </dd>
                    <dt className="col-5 text-muted">Email</dt>
                    <dd className="col-7">{activeSubmission?.step1?.email || '—'}</dd>
                    <dt className="col-5 text-muted">Jurisdiction</dt>
                    <dd className="col-7">{activeSubmission?.step1?.jurisdictionOfDocumentUse || '—'}</dd>
                  </dl>
                </div>
              </div>

              <div className="col-md-4">
                <div className="border rounded-3 p-3 h-100">
                  <h6 className="fw-semibold mb-2 d-flex align-items-center gap-2">
                    <UserCheck size={18} />
                    Assignment
                  </h6>
                  <dl className="row small mb-0">
                    <dt className="col-5 text-muted">Notary</dt>
                    <dd className="col-7">{activeSubmission?.notaryAssignment?.assignedNotaryId || 'Unassigned'}</dd>
                    <dt className="col-5 text-muted">Status</dt>
                    <dd className="col-7">
                      <span className={`badge ${badgeForStatus(activeSubmission.status)}`}>{activeSubmission.status}</span>
                    </dd>
                    <dt className="col-5 text-muted">Workflow</dt>
                    <dd className="col-7 text-capitalize">{activeSubmission.workflowStage || '—'}</dd>
                    <dt className="col-5 text-muted">Priority</dt>
                    <dd className="col-7 text-capitalize">{activeSubmission.priority || 'normal'}</dd>
                  </dl>
                </div>
              </div>

              <div className="col-md-4">
                <div className="border rounded-3 p-3 h-100">
                  <h6 className="fw-semibold mb-2 d-flex align-items-center gap-2">
                    <Clock size={18} />
                    Timeline
                  </h6>
                  <dl className="row small mb-0">
                    <dt className="col-5 text-muted">Submitted</dt>
                    <dd className="col-7">{new Date(activeSubmission.submittedAt || Date.now()).toLocaleString()}</dd>
                    <dt className="col-5 text-muted">Scheduled</dt>
                    <dd className="col-7">
                      {activeSubmission?.meeting?.scheduledDateTime
                        ? new Date(activeSubmission.meeting.scheduledDateTime).toLocaleString()
                        : 'TBD'}
                    </dd>
                    <dt className="col-5 text-muted">Completed</dt>
                    <dd className="col-7">
                      {activeSubmission.completedAt ? new Date(activeSubmission.completedAt).toLocaleString() : '—'}
                    </dd>
                  </dl>
                  {activeSubmission?.document?.notarizedUrl && (
                    <Link
                      href={activeSubmission.document.notarizedUrl}
                      target="_blank"
                      className="btn btn-sm btn-outline-primary mt-3"
                    >
                      View notarized document
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotarizationsAdminPage;

