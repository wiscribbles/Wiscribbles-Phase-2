'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { fetchAdminSettings, updateAdminSettings } from '@/services/AdminService';
import { Settings, Bell, ToggleLeft, ToggleRight } from 'lucide-react';

const AdminSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    autoAssignNotaries: false,
    autoApproveAttorneys: false,
    notifyOnLargePayments: true,
    largePaymentThreshold: 1000,
    defaultPayoutCurrency: 'USD',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await fetchAdminSettings();
        setSettings((prev) => ({ ...prev, ...data }));
      } catch (error) {
        console.error('Failed to load admin settings', error);
        toast.error('Unable to load admin settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await updateAdminSettings(settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings', error);
      toast.error('Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h2 className="fw-semibold mb-1 d-flex align-items-center gap-2">
          <Settings size={26} />
          Operations Controls
        </h2>
        <p className="text-muted mb-0">
          Configure automation for assignments, approvals, and payout monitoring to keep the back office running smoothly.
        </p>
      </div>

      {loading && (
        <div className="d-flex align-items-center gap-2 text-muted">
          <div className="spinner-border spinner-border-sm text-primary" role="status" />
          <span>Loading current settings...</span>
        </div>
      )}

      {!loading && (
        <form className="d-flex flex-column gap-4" onSubmit={handleSave}>
          <div className="card border-0 shadow-sm">
            <div className="card-body d-flex flex-column gap-3">
              <h5 className="mb-0">Automation</h5>
              <p className="text-muted small mb-3">
                Enable or disable workflow automations adopted by the operations team.
              </p>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start justify-content-between border rounded p-3">
                  <div>
                    <h6 className="mb-1">Auto-assign incoming notarizations</h6>
                    <p className="text-muted small mb-0">
                      When enabled, pending notarization requests will be distributed to available notaries based on jurisdiction and workload.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none"
                    onClick={() => handleToggle('autoAssignNotaries')}
                  >
                    {settings.autoAssignNotaries ? <ToggleRight size={28} className="text-primary" /> : <ToggleLeft size={28} className="text-muted" />}
                  </button>
                </div>

                <div className="d-flex align-items-start justify-content-between border rounded p-3">
                  <div>
                    <h6 className="mb-1">Auto-approve attorney registrations</h6>
                    <p className="text-muted small mb-0">
                      Attorneys can be auto-approved if they provide bar numbers that match the verified registry import.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none"
                    onClick={() => handleToggle('autoApproveAttorneys')}
                  >
                    {settings.autoApproveAttorneys ? <ToggleRight size={28} className="text-primary" /> : <ToggleLeft size={28} className="text-muted" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body d-flex flex-column gap-3">
              <div className="d-flex align-items-center gap-2">
                <Bell size={18} />
                <h5 className="mb-0">Notifications & Compliance</h5>
              </div>
              <div className="border rounded p-3">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="notifyLargePayments"
                    checked={settings.notifyOnLargePayments}
                    onChange={() => handleToggle('notifyOnLargePayments')}
                  />
                  <label className="form-check-label" htmlFor="notifyLargePayments">
                    Notify operations when large payments are scheduled
                  </label>
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small text-uppercase text-muted">Threshold amount</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      value={settings.largePaymentThreshold}
                      onChange={(event) =>
                        setSettings((prev) => ({ ...prev, largePaymentThreshold: Number(event.target.value) }))
                      }
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-uppercase text-muted">Default payout currency</label>
                    <select
                      className="form-select"
                      value={settings.defaultPayoutCurrency}
                      onChange={(event) =>
                        setSettings((prev) => ({ ...prev, defaultPayoutCurrency: event.target.value }))
                      }
                    >
                      <option value="USD">USD</option>
                      <option value="GYD">GYD</option>
                      <option value="CAD">CAD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <fieldset className="mb-0">
                <legend className="h5">Audit preferences</legend>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" value="" id="auditNotarySessions" disabled />
                  <label className="form-check-label text-muted" htmlFor="auditNotarySessions">
                    Require double-review for all notarizations (coming soon)
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" value="" id="autoArchive" disabled />
                  <label className="form-check-label text-muted" htmlFor="autoArchive">
                    Auto-archive executed documents after their retention period (coming soon)
                  </label>
                </div>
              </fieldset>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettingsPage;

