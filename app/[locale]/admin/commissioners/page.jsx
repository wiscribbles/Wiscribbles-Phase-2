'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchUsers, fetchCommissionerApplications, updateUserStatus } from '@/services/AdminService';
import { toast } from 'react-hot-toast';
import { ShieldCheck, ClipboardCheck, Award } from 'lucide-react';

const CommissionersAdminPage = () => {
  const params = useParams();
  const locale = params?.locale || 'en';
  const [loading, setLoading] = useState(true);
  const [pendingNotaries, setPendingNotaries] = useState([]);
  const [approvedNotaries, setApprovedNotaries] = useState([]);
  const [applications, setApplications] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, approved, commissionerApps] = await Promise.all([
        fetchUsers({ role: 'notary', status: 'pending_review', limit: 200 }),
        fetchUsers({ role: 'notary', status: 'active', limit: 200 }),
        fetchCommissionerApplications({ status: 'pending_review', limit: 200 }),
      ]);

      setPendingNotaries(pending);
      setApprovedNotaries(approved);
      setApplications(commissionerApps);
    } catch (error) {
      console.error('Failed to load commissioner data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDecision = async (userId, status) => {
    /* A rejection must carry a reason — the applicant is shown it, and the
       server refuses the decision without one. See the same note on the users
       page: the full review surface is `/admin/partners`. */
    let notes = '';

    if (status === 'rejected') {
      notes = window.prompt('Reason for rejection (the applicant is shown this)') ?? '';
      if (!notes.trim()) {
        toast.error('No reason given — nothing was changed.');
        return;
      }
    }

    try {
      await updateUserStatus(userId, { status, notes });
      toast.success(`Application ${status}`);
      await loadData();
    } catch (error) {
      console.error('Failed to update status', error);
      /* Previously swallowed entirely: the write failed against the security
         rules and the manager saw nothing at all. */
      toast.error(error?.message ?? 'Unable to record that decision.');
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h2 className="fw-semibold mb-1 d-flex align-items-center gap-2">
          <ShieldCheck size={26} />
          Commissioners of Oaths
        </h2>
        <p className="text-muted mb-0">
          Review commissioner credential submissions, track onboarding progress, and coordinate payments to authorized agents.
        </p>
      </div>

      {loading && (
        <div className="d-flex align-items-center gap-2 text-muted">
          <div className="spinner-border spinner-border-sm text-primary" role="status" />
          <span>Loading commissioner data...</span>
        </div>
      )}

      <div className="row g-4">
        <div className="col-xl-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <ClipboardCheck size={18} />
                    Pending Notary Onboarding
                  </h5>
                  <p className="text-muted small mb-0">Applications awaiting identity and credential verification.</p>
                </div>
                <span className="badge text-bg-warning">{pendingNotaries.length}</span>
              </div>
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Jurisdiction</th>
                      <th>Submitted</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingNotaries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
                          No pending notary applications.
                        </td>
                      </tr>
                    )}
                    {pendingNotaries.map((applicant) => (
                      <tr key={applicant.id}>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-semibold">{applicant.name || applicant.email}</span>
                            <small className="text-muted">{applicant.email}</small>
                          </div>
                        </td>
                        <td>{applicant.jurisdictionOfPractice || '—'}</td>
                        <td>{new Date(applicant.createdAt || Date.now()).toLocaleDateString()}</td>
                        <td className="text-end">
                          <div className="btn-group">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleDecision(applicant.id, 'approved')}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDecision(applicant.id, 'rejected')}
                            >
                              Decline
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <Award size={18} />
                    Authorized Commissioners
                  </h5>
                  <p className="text-muted small mb-0">Commissioners currently certified to execute oaths.</p>
                </div>
                <span className="badge text-bg-success">{approvedNotaries.length}</span>
              </div>
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Approved</th>
                      <th className="text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedNotaries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
                          No approved commissioners yet.
                        </td>
                      </tr>
                    )}
                    {approvedNotaries.map((notary) => (
                      <tr key={notary.id}>
                        <td>{notary.name || '—'}</td>
                        <td>{notary.email || '—'}</td>
                        <td>{notary.approvedAt ? new Date(notary.approvedAt).toLocaleDateString() : '—'}</td>
                        <td className="text-end">
                          <span className="badge text-bg-success">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {applications.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="mb-3">Commissioner of Oaths Applications (Form submissions)</h5>
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Jurisdiction</th>
                    <th>Submitted</th>
                    <th className="text-end">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td>{application.applicantName || application.email || '—'}</td>
                      <td>{application.jurisdiction || '—'}</td>
                      <td>{new Date(application.submittedAt || Date.now()).toLocaleString()}</td>
                      <td className="text-end">
                        <span className="badge text-bg-warning">{application.status || 'pending_review'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionersAdminPage;

