'use client';

/**
 * Edit the per-plan document-template allowance.
 *
 * `-1` means unlimited and `0` means none — both are real values, so the empty
 * input means "use the plan default" rather than zero. The UI keeps those three
 * states visibly distinct, because an admin who types 0 expecting "unlimited"
 * would silently switch every account on that plan off templates entirely.
 */

import { useMemo, useState } from 'react';

const UNLIMITED = -1;

export default function PlanAllowanceEditor({ initialPlans, updatedAt, updatedBy }) {
  const [plans, setPlans] = useState(initialPlans);
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(initialPlans.map((plan) => [plan.id, String(plan.allowance)])),
  );
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [meta, setMeta] = useState({ updatedAt, updatedBy });

  const dirty = useMemo(
    () => plans.some((plan) => drafts[plan.id] !== String(plan.allowance)),
    [plans, drafts],
  );

  const setDraft = (planId, value) => {
    setDrafts((current) => ({ ...current, [planId]: value }));
    setResult(null);
    setFieldErrors((current) => {
      if (!current[planId]) return current;
      const next = { ...current };
      delete next[planId];
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setResult(null);
    setFieldErrors({});

    // Send only what changed, so an untouched plan is never rewritten.
    const allowances = {};
    for (const plan of plans) {
      const draft = drafts[plan.id];
      if (draft === String(plan.allowance)) continue;
      allowances[plan.id] = draft.trim() === '' ? null : Number(draft);
    }

    if (Object.keys(allowances).length === 0) {
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowances }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.errors) setFieldErrors(data.errors);
        setResult({
          tone: 'error',
          message: data.message ?? 'Could not save. Nothing was changed.',
        });
        return;
      }

      setPlans(data.plans);
      setDrafts(Object.fromEntries(data.plans.map((p) => [p.id, String(p.allowance)])));
      setMeta({ updatedAt: data.updatedAt, updatedBy: data.updatedBy });
      setResult({ tone: 'ok', message: 'Saved.' });
    } catch {
      setResult({ tone: 'error', message: 'Could not reach the server.' });
    } finally {
      setSaving(false);
    }
  };

  const reset = () =>
    setDrafts(Object.fromEntries(plans.map((plan) => [plan.id, String(plan.allowance)])));

  return (
    <>
      {result && (
        <div
          className={`alert py-2 ${result.tone === 'ok' ? 'alert-success' : 'alert-danger'}`}
          role="status"
        >
          {result.message}
        </div>
      )}

      <div className="row g-3">
        {plans.map((plan) => {
          const draft = drafts[plan.id];
          const value = draft.trim() === '' ? null : Number(draft);
          const error = fieldErrors[plan.id];

          return (
            <div className="col-12 col-md-4" key={plan.id}>
              <div
                className="h-100 p-3 rounded"
                style={{ border: `1px solid ${error ? '#dc3545' : '#e6e9ef'}` }}
              >
                <div className="d-flex justify-content-between align-items-baseline mb-1">
                  <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{plan.name}</h2>
                  {plan.overridden && (
                    <span
                      className="badge"
                      style={{ background: '#eef2f9', color: '#274171', fontWeight: 600 }}
                    >
                      Customised
                    </span>
                  )}
                </div>

                <p className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>
                  {plan.priceLabel}
                </p>
                <p className="text-muted" style={{ fontSize: '0.84rem', lineHeight: 1.6 }}>
                  {plan.description}
                </p>

                <label
                  className="form-label mt-2 mb-1"
                  htmlFor={`allowance-${plan.id}`}
                  style={{ fontSize: '0.86rem', fontWeight: 600 }}
                >
                  Document templates
                </label>
                <input
                  id={`allowance-${plan.id}`}
                  type="number"
                  className={`form-control ${error ? 'is-invalid' : ''}`}
                  value={draft}
                  min={UNLIMITED}
                  step={1}
                  onChange={(event) => setDraft(plan.id, event.target.value)}
                  placeholder={`Default: ${plan.defaultAllowance}`}
                />

                <p className="mb-0 mt-1" style={{ fontSize: '0.8rem', minHeight: '2.4em' }}>
                  {error ? (
                    <span className="text-danger">{error}</span>
                  ) : value === null ? (
                    <span className="text-muted">
                      Empty — falls back to the plan default of {plan.defaultAllowance}.
                    </span>
                  ) : value === UNLIMITED ? (
                    <span style={{ color: '#1b7f4b' }}>Unlimited templates.</span>
                  ) : value === 0 ? (
                    <span style={{ color: '#8a5a00' }}>
                      No templates at all on this plan.
                    </span>
                  ) : (
                    <span className="text-muted">
                      {value} template{value === 1 ? '' : 's'} per account.
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-muted mt-3" style={{ fontSize: '0.84rem' }}>
        Enter <code>-1</code> for unlimited, <code>0</code> for none, or clear the
        field to return to the plan default.
      </p>

      <div className="d-flex gap-2 align-items-center mt-3">
        <button
          type="button"
          className="btn"
          onClick={save}
          disabled={!dirty || saving}
          style={{ background: '#0C1134', color: '#fff', padding: '0.55rem 1.4rem' }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {dirty && !saving && (
          <button type="button" className="btn btn-link text-muted" onClick={reset}>
            Discard
          </button>
        )}
      </div>

      {meta.updatedAt && (
        <p className="text-muted mt-3 mb-0" style={{ fontSize: '0.8rem' }}>
          Last changed {new Date(meta.updatedAt).toLocaleString()}
          {meta.updatedBy?.email ? ` by ${meta.updatedBy.email}` : ''}.
        </p>
      )}
    </>
  );
}
