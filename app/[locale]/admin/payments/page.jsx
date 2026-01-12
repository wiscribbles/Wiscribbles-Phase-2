'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchPaymentTransactions, recordPaymentTransaction, markPaymentAsProcessed } from '@/services/AdminService';
import { toast } from 'react-hot-toast';
import { CreditCard, DollarSign, Plus, CheckCircle } from 'lucide-react';

const statusFilters = [
  { value: 'all', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const recipientFilters = [
  { value: 'all', label: 'All recipients' },
  { value: 'notary', label: 'Notaries' },
  { value: 'commissioner', label: 'Commissioners of oaths' },
  { value: 'attorney', label: 'Attorneys' },
];

const PaymentsAdminPage = () => {
  const params = useParams();
  const locale = params?.locale || 'en';
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState('scheduled');
  const [recipientRole, setRecipientRole] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState({
    recipientName: '',
    recipientEmail: '',
    recipientRole: 'notary',
    amount: '',
    currency: 'USD',
    reference: '',
    scheduledFor: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await fetchPaymentTransactions({
        status,
        recipientRole,
        limit: 200,
      });
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load payments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, recipientRole]);

  const handleCreateTransaction = async (event) => {
    event.preventDefault();
    try {
      if (!formState.recipientName || !formState.amount) {
        console.warn('Recipient name and amount are required');
        return;
      }

      await recordPaymentTransaction({
        ...formState,
        status: 'scheduled',
      });

      toast.success('Payment scheduled successfully');
      setShowForm(false);
      setFormState({
        recipientName: '',
        recipientEmail: '',
        recipientRole: 'notary',
        amount: '',
        currency: 'USD',
        reference: '',
        scheduledFor: new Date().toISOString().split('T')[0],
        notes: '',
      });
      await loadTransactions();
    } catch (error) {
      console.error('Failed to create payment', error);
    }
  };

  const handleMarkProcessed = async (transactionId) => {
    try {
      await markPaymentAsProcessed(transactionId, { status: 'completed' });
      toast.success('Payment marked as completed');
      await loadTransactions();
    } catch (error) {
      console.error('Failed to update payment', error);
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between gap-3">
        <div>
          <h2 className="fw-semibold mb-1 d-flex align-items-center gap-2">
            <CreditCard size={26} />
            Payments & Payouts
          </h2>
          <p className="text-muted mb-0">
            Track disbursements to notaries and commissioners, reconcile platform revenue, and record manual payouts.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((prev) => !prev)}>
            <Plus size={16} className="me-1" />
            Schedule Payment
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-sm-6 col-xl-3">
              <label className="form-label small text-uppercase text-muted">Status</label>
              <select className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}>
                {statusFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-sm-6 col-xl-3">
              <label className="form-label small text-uppercase text-muted">Recipient</label>
              <select
                className="form-select"
                value={recipientRole}
                onChange={(event) => setRecipientRole(event.target.value)}
              >
                {recipientFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-sm-12 col-xl-6 text-sm-end">
              <p className="text-muted small mb-0">{transactions.length} record{transactions.length === 1 ? '' : 's'} showing</p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="mb-3 d-flex align-items-center gap-2">
              <DollarSign size={18} />
              Schedule a payout
            </h5>
            <form className="row g-3" onSubmit={handleCreateTransaction}>
              <div className="col-md-4">
                <label className="form-label">Recipient name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.recipientName}
                  onChange={(event) => setFormState((prev) => ({ ...prev, recipientName: event.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Recipient email</label>
                <input
                  type="email"
                  className="form-control"
                  value={formState.recipientEmail}
                  onChange={(event) => setFormState((prev) => ({ ...prev, recipientEmail: event.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Recipient role</label>
                <select
                  className="form-select"
                  value={formState.recipientRole}
                  onChange={(event) => setFormState((prev) => ({ ...prev, recipientRole: event.target.value }))}
                >
                  <option value="notary">Notary</option>
                  <option value="commissioner">Commissioner of oaths</option>
                  <option value="attorney">Attorney</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={formState.amount}
                  onChange={(event) => setFormState((prev) => ({ ...prev, amount: event.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Currency</label>
                <select
                  className="form-select"
                  value={formState.currency}
                  onChange={(event) => setFormState((prev) => ({ ...prev, currency: event.target.value }))}
                >
                  <option value="USD">USD</option>
                  <option value="GYD">GYD</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Reference</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.reference}
                  onChange={(event) => setFormState((prev) => ({ ...prev, reference: event.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Scheduled for</label>
                <input
                  type="date"
                  className="form-control"
                  value={formState.scheduledFor}
                  onChange={(event) => setFormState((prev) => ({ ...prev, scheduledFor: event.target.value }))}
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label">Internal notes</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formState.notes}
                  onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
              <div className="col-12 d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Schedule payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Role</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                      Loading payment records...
                    </td>
                  </tr>
                )}
                {!loading && transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No payment transactions found.
                    </td>
                  </tr>
                )}
                {!loading &&
                  transactions.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">{payment.recipientName || payment.recipientEmail || '—'}</span>
                          <small className="text-muted">{payment.reference || 'No reference ID'}</small>
                        </div>
                      </td>
                      <td>
                        <span className="badge text-bg-light text-capitalize">
                          {payment.recipientRole || 'notary'}
                        </span>
                      </td>
                      <td>
                        <span className="fw-semibold">
                          ${Number(payment.amount || 0).toFixed(2)}
                        </span>
                        <small className="text-muted ms-1">{payment.currency || 'USD'}</small>
                      </td>
                      <td>
                        <span className={`badge text-bg-${payment.status === 'completed' ? 'success' : payment.status === 'scheduled' ? 'warning' : 'secondary'} text-capitalize`}>
                          {payment.status || 'scheduled'}
                        </span>
                      </td>
                      <td>
                        {payment.scheduledFor
                          ? new Date(payment.scheduledFor).toLocaleDateString()
                          : new Date(payment.createdAt || Date.now()).toLocaleString()}
                      </td>
                      <td className="text-end">
                        <div className="btn-group">
                          {payment.status !== 'completed' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleMarkProcessed(payment.id)}
                            >
                              <CheckCircle size={14} className="me-1" />
                              Mark paid
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => navigator.clipboard?.writeText(JSON.stringify(payment, null, 2))}
                          >
                            Copy record
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
  );
};

export default PaymentsAdminPage;

