'use client';

/**
 * Document template management.
 *
 * Brief: "These templates will have tick boxes for roles and jurisdiction and
 * any document uploaded by a user or account holder must be attributed to one
 * of the templates."
 *
 * The tick boxes are the easy part. What makes this worth building properly is
 * the refusal: the server will not let you tick "requires notarisation" plus a
 * jurisdiction with no enabling provision, and it says why. The UI surfaces
 * that rather than showing a generic failure, because the reason is the useful
 * part.
 */

import { useCallback, useEffect, useState } from 'react';
import { COLORS, STYLES, pill } from '@/lib/theme';

const EMPTY = {
  name: '',
  description: '',
  documentCategory: '',
  executionMode: 'esign',
  roles: [],
  jurisdictions: [],
};

export default function TemplateManager() {
  const [templates, setTemplates] = useState(null);
  const [options, setOptions] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/templates', { cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      setTemplates(payload.templates ?? []);
      setOptions(payload.options ?? null);
    } catch {
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setErrors({});
    setShowForm(false);
  };

  const toggleIn = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((v) => v !== value)
        : [...current[field], value],
    }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setNotice(null);

    try {
      const response = await fetch('/api/admin/templates', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (payload.errors) setErrors(payload.errors);
        else setNotice({ tone: 'error', message: payload.message ?? 'Could not save.' });
        return;
      }

      setNotice({
        tone: 'ok',
        message: payload.warnings?.length
          ? `Saved. ${payload.warnings.join(' ')}`
          : 'Saved.',
      });
      reset();
      load();
    } catch {
      setNotice({ tone: 'error', message: 'Could not reach the server.' });
    } finally {
      setSaving(false);
    }
  };

  const edit = (template) => {
    setForm({
      name: template.name ?? '',
      description: template.description ?? '',
      documentCategory: template.documentCategory ?? '',
      executionMode: template.executionMode ?? 'esign',
      roles: template.roles ?? [],
      jurisdictions: template.jurisdictions ?? [],
    });
    setEditingId(template.id);
    setErrors({});
    setShowForm(true);
  };

  const toggleActive = async (template) => {
    await fetch('/api/admin/templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: template.id, active: !template.active }),
    });
    load();
  };

  if (!options) return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;

  const notarized = form.executionMode === 'notarized';

  return (
    <>
      {notice && (
        <div
          className={`alert py-2 ${notice.tone === 'ok' ? 'alert-success' : 'alert-danger'}`}
          role="status"
        >
          {notice.message}
        </div>
      )}

      {!showForm && (
        <button
          type="button"
          className="btn mb-4"
          onClick={() => setShowForm(true)}
          style={STYLES.buttonPrimary}
        >
          New template
        </button>
      )}

      {showForm && (
        <form onSubmit={save} className="p-4 mb-4" style={STYLES.card}>
          <h2 style={{ ...STYLES.sectionHeading, marginBottom: '1rem' }}>
            {editingId ? 'Edit template' : 'New template'}
          </h2>

          <div className="mb-3">
            <label className="form-label" htmlFor="tpl-name" style={{ fontWeight: 500 }}>
              Name
            </label>
            <input
              id="tpl-name"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Affidavit of Identity"
              style={{ maxWidth: 480 }}
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="tpl-desc" style={{ fontWeight: 500 }}>
              Description <span style={{ color: COLORS.inkMuted }}>(optional)</span>
            </label>
            <input
              id="tpl-desc"
              className="form-control"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Shown to clients when they choose a document type"
              style={{ maxWidth: 480 }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="tpl-cat" style={{ fontWeight: 500 }}>
              Document category
            </label>
            <select
              id="tpl-cat"
              className={`form-select ${errors.documentCategory ? 'is-invalid' : ''}`}
              value={form.documentCategory}
              onChange={(e) => setForm({ ...form, documentCategory: e.target.value })}
              style={{ maxWidth: 480 }}
            >
              <option value="">Choose…</option>
              {options.categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                  {category.oftenExcluded ? ' — often excluded' : ''}
                </option>
              ))}
            </select>
            {errors.documentCategory && (
              <div className="invalid-feedback d-block">{errors.documentCategory}</div>
            )}
          </div>

          <fieldset className="mb-3">
            <legend className="form-label" style={{ fontWeight: 500, fontSize: '1rem' }}>
              How is it executed?
            </legend>
            {options.executionModes.map((mode) => (
              <div className="form-check" key={mode.value}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="executionMode"
                  id={`mode-${mode.value}`}
                  checked={form.executionMode === mode.value}
                  onChange={() => setForm({ ...form, executionMode: mode.value })}
                />
                <label className="form-check-label" htmlFor={`mode-${mode.value}`}>
                  {mode.label}
                </label>
              </div>
            ))}
          </fieldset>

          {notarized && (
            <fieldset className="mb-3">
              <legend className="form-label" style={{ fontWeight: 500, fontSize: '1rem' }}>
                Who may handle it?
              </legend>
              {options.roles.map((role) => (
                <div className="form-check" key={role.value}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`role-${role.value}`}
                    checked={form.roles.includes(role.value)}
                    onChange={() => toggleIn('roles', role.value)}
                  />
                  <label className="form-check-label" htmlFor={`role-${role.value}`}>
                    {role.label}
                  </label>
                </div>
              ))}
              {errors.roles && <div className="text-danger small mt-1">{errors.roles}</div>}
            </fieldset>
          )}

          <fieldset className="mb-3">
            <legend className="form-label" style={{ fontWeight: 500, fontSize: '1rem' }}>
              Where is it valid?
            </legend>
            {options.jurisdictions.map((jurisdiction) => {
              const blocked = notarized && !jurisdiction.supportsNotarization;
              return (
                <div className="form-check" key={jurisdiction.code}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`j-${jurisdiction.code}`}
                    checked={form.jurisdictions.includes(jurisdiction.code)}
                    onChange={() => toggleIn('jurisdictions', jurisdiction.code)}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`j-${jurisdiction.code}`}
                    style={{ color: blocked ? COLORS.warningText : 'inherit' }}
                  >
                    {jurisdiction.name}
                    {blocked && ' — e-signature only, cannot be notarised here'}
                  </label>
                </div>
              );
            })}
            {errors.jurisdictions && (
              <div className="text-danger small mt-1">{errors.jurisdictions}</div>
            )}
          </fieldset>

          <div className="d-flex gap-2">
            <button type="submit" className="btn" disabled={saving} style={STYLES.buttonPrimary}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create template'}
            </button>
            <button type="button" className="btn btn-link text-muted" onClick={reset}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {templates?.length === 0 && (
        <p style={{ color: COLORS.inkMuted, padding: '1rem 0' }}>
          No templates yet. Every uploaded document must bind to one, so the
          document workflow needs at least one before it can be used.
        </p>
      )}

      {templates?.map((template) => (
        <article key={template.id} className="p-3 mb-2" style={STYLES.card}>
          <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <div>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>{template.name}</h3>
              {template.description && (
                <p className="mb-0 mt-1" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                  {template.description}
                </p>
              )}
            </div>
            <span style={pill(template.active ? 'success' : 'neutral')}>
              {template.active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <p className="mb-0 mt-2" style={{ fontSize: '0.84rem', color: COLORS.inkSubtle }}>
            {template.executionMode === 'notarized'
              ? `Notarised · ${(template.roles ?? []).join(', ') || 'no roles'}`
              : 'E-signature only'}
            {' · '}
            {(template.jurisdictions ?? []).join(', ') || 'no jurisdictions'}
          </p>

          <div className="d-flex gap-2 mt-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => edit(template)}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => toggleActive(template)}
            >
              {template.active ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        </article>
      ))}
    </>
  );
}
