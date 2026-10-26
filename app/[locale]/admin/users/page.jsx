'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { fetchUsers, updateUserStatus } from '@/services/AdminService';
import { toast } from 'react-hot-toast';
import { Users, ShieldCheck, BadgeCheck, FileText } from 'lucide-react';

const statusFilters = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
];

const roleFilters = [
  { value: 'all', label: 'All roles' },
  { value: 'notary', label: 'Notaries' },
  { value: 'attorney', label: 'Attorneys' },
  { value: 'business', label: 'Business Accounts' },
  { value: 'real_estate_agent', label: 'Real Estate Agents' },
];

const normalizeStatus = (status) => {
  if (!status) return 'pending_review';
  return status.toLowerCase();
};

const formatStatusLabel = (status) => {
  const normalized = normalizeStatus(status);
  const labelMap = {
    pending_review: 'Pending Review',
    pending: 'Pending',
    approved: 'Approved',
    active: 'Active',
    suspended: 'Suspended',
    rejected: 'Rejected',
  };

  return labelMap[normalized] || normalized.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
};

const statusBadgeClass = (status) => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'approved':
    case 'active':
      return 'bg-success-subtle text-dark';
    case 'pending_review':
    case 'pending':
      return 'bg-warning-subtle text-dark';
    case 'rejected':
      return 'bg-danger-subtle text-dark';
    case 'suspended':
      return 'bg-secondary-subtle text-dark';
    default:
      return 'bg-light text-dark';
  }
};

const normalizeRole = (role, signUpAs) => {
  const source = role || signUpAs || 'user';
  return source.toLowerCase();
};

const formatRoleLabel = (role, signUpAs) => {
  const normalized = normalizeRole(role, signUpAs);
  const map = {
    admin: 'Admin',
    notary: 'Notary',
    attorney: 'Attorney',
    business: 'Business',
    real_estate_agent: 'Real Estate Agent',
  };
  return map[normalized] || normalized.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
};

const roleBadgeClass = (role, signUpAs) => {
  const normalized = normalizeRole(role, signUpAs);
  switch (normalized) {
    case 'admin':
      return 'bg-primary-subtle text-dark';
    case 'notary':
      return 'bg-info-subtle text-dark';
    case 'attorney':
      return 'bg-success-subtle text-dark';
    case 'business':
      return 'bg-warning-subtle text-dark';
    case 'real_estate_agent':
      return 'bg-secondary-subtle text-dark';
    default:
      return 'bg-light text-dark';
  }
};

const UsersAdminPage = () => {
  const params = useParams();
  const locale = params?.locale || 'en';
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  const withLocale = (path) => `/${locale}${path}`;

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await fetchUsers({
        status: selectedStatus,
        role: selectedRole,
        limit: 200,
      });
      const filtered = result.filter((user) => (user.role || user.signUpAs || '').toLowerCase() !== 'admin');
      setUsers(filtered);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Unable to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedRole]);

  /* Rejecting an application, or sending it back for more information,
     requires a reason: the applicant is shown it, and an outright refusal with
     no explanation leaves them with nothing to act on. The server enforces
     this too — `decidePartnerApplication` refuses both decisions without
     feedback — so this is here to ask for it rather than to be the only
     guard.

     A prompt is a deliberately plain way to collect it. The full review
     screen with a proper feedback field is `/admin/partners`; this page is a
     Phase 1 surface kept working until it is retired, and giving it its own
     parallel decision UI is how the two drift apart. */
  const REASON_REQUIRED = { rejected: 'Reason for rejection', pending_review: 'What further information is needed?' };

  const handleUpdateStatus = async (userId, nextStatus, note = '') => {
    let reason = note;

    if (REASON_REQUIRED[nextStatus] && !reason.trim()) {
      reason = window.prompt(`${REASON_REQUIRED[nextStatus]} (the applicant is shown this)`) ?? '';
      if (!reason.trim()) {
        toast.error('No reason given — nothing was changed.');
        return;
      }
    }

    try {
      await updateUserStatus(userId, { status: nextStatus, notes: reason });
      toast.success(`User status updated to ${nextStatus}`);
      await loadUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
      /* The server's own message. These refusals are written to tell the
         reviewer what to do — "You cannot decide on your own account" is
         actionable; "Please try again" sends them round the same loop. */
      toast.error(error?.message ?? 'Unable to update status. Please try again.');
    }
  };

  const detailUser = useMemo(() => users.find((item) => item.id === selectedUser) || null, [selectedUser, users]);

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-3">
        <div>
          <h2 className="fw-semibold mb-1 d-flex align-items-center gap-2">
            <Users size={26} />
            User & Partner Accounts
          </h2>
          <p className="text-muted mb-0">
            Audit onboarding requests, approve professional credentials, and manage platform access.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href={withLocale('/admin/notarizations')} className="btn btn-outline-secondary">
            <FileText size={16} className="me-1" />
            View Notarizations
          </Link>
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
                {statusFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-sm-6 col-xl-3">
              <label className="form-label small text-uppercase text-muted">Role</label>
              <select
                className="form-select"
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
              >
                {roleFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-sm-12 col-xl-6 text-sm-end">
              <p className="text-muted small mb-0">
                {users.length} account{users.length === 1 ? '' : 's'} in view
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
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                      Loading accounts...
                    </td>
                  </tr>
                )}

                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No accounts found for the selected filters.
                    </td>
                  </tr>
                )}

                {!loading &&
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">{user.name || '—'}</span>
                          <small className="text-muted">{user.phone || 'Phone not provided'}</small>
                        </div>
                      </td>
                      <td>{user.email || '—'}</td>
                      <td>
                        <span className={`badge ${roleBadgeClass(user.role, user.signUpAs)}`}>
                          {formatRoleLabel(user.role, user.signUpAs)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass(user.status)}`}>
                          {formatStatusLabel(user.status)}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt || user.approvedAt || Date.now()).toLocaleString()}</td>
                      <td className="text-end">
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setSelectedUser(user.id)}
                          >
                            Details
                          </button>
                          {(user.status === 'pending_review' || user.status === 'rejected') && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() => handleUpdateStatus(user.id, 'approved')}
                            >
                              Approve
                            </button>
                          )}
                          {(user.status === 'pending_review' || user.status === 'approved' || user.status === 'active') && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleUpdateStatus(user.id, user.status === 'rejected' ? 'pending_review' : 'rejected')}
                            >
                              {user.status === 'rejected' ? 'Reopen' : 'Decline'}
                            </button>
                          )}
                          {(user.status === 'approved' || user.status === 'pending_review') && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleUpdateStatus(user.id, 'active')}
                            >
                              Activate
                            </button>
                          )}
                          {user.status === 'active' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => handleUpdateStatus(user.id, 'suspended')}
                            >
                              Suspend
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

      {detailUser && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <ShieldCheck size={18} />
                  {detailUser.name || detailUser.email}
                </h5>
                <p className="text-muted small mb-0">
                  Detailed profile and submitted compliance documents
                </p>
              </div>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setSelectedUser(null)} />
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="border rounded-3 p-3 h-100">
                  <h6 className="fw-semibold mb-2">Account Details</h6>
                  <dl className="row mb-0 small">
                    <dt className="col-5 text-muted">Email</dt>
                    <dd className="col-7">{detailUser.email || '—'}</dd>
                    <dt className="col-5 text-muted">Phone</dt>
                    <dd className="col-7">{detailUser.phone || '—'}</dd>
                    <dt className="col-5 text-muted">Role</dt>
                    <dd className="col-7 text-capitalize">{detailUser.role || detailUser.signUpAs || 'user'}</dd>
                    <dt className="col-5 text-muted">Status</dt>
                    <dd className="col-7">
                      <span className={`badge ${statusBadgeClass(detailUser.status)}`}>
                        {detailUser.status || 'unknown'}
                      </span>
                    </dd>
                    <dt className="col-5 text-muted">Submitted</dt>
                    <dd className="col-7">
                      {new Date(detailUser.createdAt || Date.now()).toLocaleString()}
                    </dd>
                    <dt className="col-5 text-muted">Reviewed By</dt>
                    <dd className="col-7">{detailUser.reviewerId || '—'}</dd>
                  </dl>
                </div>
              </div>
              <div className="col-md-4">
                <div className="border rounded-3 p-3 h-100">
                  <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                    <BadgeCheck size={18} />
                    Verification Assets
                  </h6>
                  <div className="d-flex flex-column gap-2 small">
                    <Link
                      href={detailUser.identificationUrl || '#'}
                      target="_blank"
                      className={`text-decoration-none ${detailUser.identificationUrl ? 'text-primary' : 'text-muted pointer-events-none'}`}
                    >
                      Government ID
                    </Link>
                    <Link
                      href={detailUser.certificateUrl || '#'}
                      target="_blank"
                      className={`text-decoration-none ${detailUser.certificateUrl ? 'text-primary' : 'text-muted pointer-events-none'}`}
                    >
                      Commission / Notary Certificate
                    </Link>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="border rounded-3 p-3 h-100">
                  <h6 className="fw-semibold mb-2">Review Notes</h6>
                  <p className="small text-muted mb-2">
                    {detailUser.reviewNotes || 'No notes recorded yet.'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => navigator.clipboard?.writeText(JSON.stringify(detailUser, null, 2))}
                  >
                    Copy full record
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAdminPage;

