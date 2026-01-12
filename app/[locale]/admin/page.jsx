'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchAdminDashboardMetrics, fetchNotarizationSubmissions, fetchUsers, fetchPaymentTransactions } from '@/services/AdminService';
import { LayoutDashboard, FileText, Users, CreditCard, ArrowUpRight } from 'lucide-react';

const MetricCard = ({ icon: Icon, label, value, footer, href }) => (
  <div className="col-sm-6 col-xl-3">
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex flex-column gap-3">
        <div className="d-flex align-items-center justify-content-between">
          <div className="rounded-circle bg-primary bg-opacity-10 p-2">
            <Icon size={22} className="text-primary" />
          </div>
          <span className="badge text-bg-light">{label}</span>
        </div>
        <h3 className="fw-semibold mb-0">{value}</h3>
        {footer && (
          <p className="text-muted small mb-0">
            {footer}
          </p>
        )}
        {href && (
          <Link href={href} className="stretched-link text-decoration-none small d-flex align-items-center gap-1">
            View details <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
    </div>
  </div>
);

const RecentTable = ({ title, headers, rows, emptyLabel, renderRowActions }) => (
  <div className="card border-0 shadow-sm h-100">
    <div className="card-body">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">{title}</h5>
      </div>
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
              {renderRowActions && <th className="text-end">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length + (renderRowActions ? 1 : 0)} className="text-center text-muted py-4">
                  {emptyLabel}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell, index) => (
                  <td key={`${row.id}-${index}`} className={cell?.className}>
                    {cell?.content ?? cell}
                  </td>
                ))}
                {renderRowActions && (
                  <td className="text-end">
                    {renderRowActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const AdminOverviewPage = () => {
  const params = useParams();
  const locale = params?.locale || 'en';
  const withLocale = (path) => `/${locale}${path}`;

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    pendingNotarizations: 0,
    activeUsers: 0,
    pendingUsers: 0,
    pendingPayments: 0,
  });
  const [notarizations, setNotarizations] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [metricData, recentNotarizations, reviewUsers, scheduledPayments] = await Promise.all([
          fetchAdminDashboardMetrics(),
          fetchNotarizationSubmissions({ limit: 5, includeCompleted: false }),
          fetchUsers({ status: 'pending_review', limit: 5 }),
          fetchPaymentTransactions({ status: 'scheduled', limit: 5 }),
        ]);

        if (!isMounted) return;
        setMetrics(metricData);
        setNotarizations(recentNotarizations);
        setPendingUsers(reviewUsers);
        setPayments(scheduledPayments);
      } catch (error) {
        console.error('Failed to load admin dashboard:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h2 className="fw-semibold mb-1 d-flex align-items-center gap-2">
          <LayoutDashboard size={26} />
          Operations Overview
        </h2>
        <p className="text-muted mb-0">
          Monitor notarizations, onboarding pipelines, and payments processing across the platform.
        </p>
      </div>

      {loading && (
        <div className="d-flex align-items-center gap-2 text-muted">
          <div className="spinner-border spinner-border-sm text-primary" role="status" />
          <span>Loading admin metrics...</span>
        </div>
      )}

      <div className="row g-3">
        <MetricCard
          icon={FileText}
          label="Notarizations"
          value={metrics.pendingNotarizations}
          footer="Requests awaiting assignment or in progress"
          href={withLocale('/admin/notarizations')}
        />
        <MetricCard
          icon={Users}
          label="Active Users"
          value={metrics.activeUsers}
          footer="Verified professionals and clients in good standing"
          href={withLocale('/admin/users')}
        />
        <MetricCard
          icon={Users}
          label="Pending Reviews"
          value={metrics.pendingUsers}
          footer="Accounts awaiting verification or onboarding checks"
          href={`${withLocale('/admin/users')}?status=pending_review`}
        />
        <MetricCard
          icon={CreditCard}
          label="Scheduled Payouts"
          value={metrics.pendingPayments}
          footer="Payments queued for notaries & commissioners"
          href={`${withLocale('/admin/payments')}?status=scheduled`}
        />
      </div>

      <div className="row g-4">
        <div className="col-xl-6">
          <RecentTable
            title="Notarizations in Progress"
            headers={['Reference', 'Client', 'Document', 'Status', 'Submitted']}
            rows={notarizations.map((submission) => ({
              id: submission.id,
              cells: [
                { content: submission.referenceNumber || '—', className: 'fw-semibold text-primary' },
                `${submission?.step1?.firstName ?? ''} ${submission?.step1?.lastName ?? ''}`.trim() || '—',
                submission?.document?.name || submission?.step2?.documentType || '—',
                <span className="badge bg-primary bg-opacity-75 text-gray-600 text-capitalize font-weight-bold" >
                  {submission.status || 'pending'}
                </span>,
                new Date(submission.submittedAt || submission.createdAt || Date.now()).toLocaleString(),
              ],
            }))}
            emptyLabel="No active notarization workflows at the moment."
          />
        </div>
        <div className="col-xl-6">
          <RecentTable
            title="Accounts Awaiting Approval"
            headers={['Name', 'Email', 'Role', 'Submitted']}
            rows={pendingUsers.map((user) => ({
              id: user.id,
              cells: [
                user.name || '—',
                user.email || '—',
                <span className="badge bg-warning bg-opacity-75 text-dark text-capitalize">
                  {user.role || user.signUpAs || 'pending'}
                </span>,
                new Date(user.createdAt || Date.now()).toLocaleString(),
              ],
            }))}
            emptyLabel="No pending account reviews."
          />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <RecentTable
            title="Scheduled Payments"
            headers={['Recipient', 'Role', 'Amount', 'Status', 'Scheduled']}
            rows={payments.map((payment) => ({
              id: payment.id,
              cells: [
                payment.recipientName || payment.recipientEmail || '—',
                <span className="badge text-bg-secondary text-capitalize">
                  {payment.recipientRole || 'notary'}
                </span>,
                <>
                  <span className="fw-semibold">${Number(payment.amount || 0).toFixed(2)}</span>
                  {payment.currency && <small className="text-muted ms-1">{payment.currency}</small>}
                </>,
                <span className="badge text-bg-info text-capitalize">
                  {payment.status || 'scheduled'}
                </span>,
                new Date(payment.scheduledFor || payment.createdAt || Date.now()).toLocaleString(),
              ],
            }))}
            emptyLabel="No pending payout transactions."
            renderRowActions={(row) => (
              <Link href={withLocale(`/admin/payments/${row.id}`)} className="btn btn-sm btn-outline-primary">
                View Transaction
              </Link>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;

