'use client';

/**
 * The standard forms library — Website Manager side.
 *
 * Publish a blank PDF once and every account can take a copy. The library is
 * what makes the platform usable by someone who does not already own a
 * correctly drafted affidavit, which is most people.
 *
 * Forms are withdrawn, never deleted: an executed document records the form and
 * version it came from, and deleting the form would orphan exactly the
 * reference an audit would want.
 */

import { useCallback, useEffect, useState } from 'react';
import { COLORS, STYLES, pill } from '@/lib/theme';

const EMPTY = {
  name: '',
  description: '',
  documentCategory: '',
  templateId: '',
  jurisdictions: [],
};

export default function StandardFormsManager() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/forms', { cache: 'no-store' });
      if (!response.ok) return;
      setData(await response.json());
    } catch {
      setData({ forms: [], options: null });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleJurisdiction = (code) =>
    setForm((current) => ({
      ...current,
      jurisdictions: current.jurisdictions.includes(code)
        ? current.jurisdictions.filter((c) => c !== code)
        : [...current.jurisdictions, code],
    }));

  /* Picking a template pre-fills the category and jurisdictions from it. The
     form inherits the template's routing, so defaulting to anything else would
     invite a mismatch between where the form says it applies and where the
     template actually permits it. */
  const pickTemplate = (templateId) => {
    const template = data.options?.templates?.find((t) => t.id === templateId);
    setForm((current) => ({
      ...current,
      templateId,
      documentCategory: template?.documentCategory ?? current.documentCategory,
      jurisdictions: template?.jurisdictions?.length
        ? template.jurisdictions
        : current.jurisdictions,
    }));
  };

  const publish = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setNotice(null);

    try {
      const payload = new FormData();
      payload.set('file', file);
      payload.set('name', form.name);
      payload.set('description', form.description);
      payload.set('documentCategory', form.documentCategory);
      payload.set('templateId', form.templateId);
      payload.set('jurisdictions', JSON.stringify(form.jurisdictions));

      const response = await fetch('/api/admin/forms', { method: 'POST', body: payload });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (result.field) setErrors({ [result.field]: result.message });
        else setNotice({ tone: 'error', message: result.message ?? 'Could not publish that.' });
        return;
      }

      setForm(EMPTY);
      setFile(null);
      setShowForm(false);
      setNotice({ tone: 'ok', message: 'Published. Every account can now use it.' });
      load();
    } catch {
      setNotice({ tone: 'error', message: 'Could not reach the server.' });
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (id, active) => {
    await fetch('/api/admin/forms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active }),
    });
    load();
  };

  if (!data) return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;

  const options = data.options ?? {};
  const noTemplates = (options.templates ?? []).length === 0;
  const ready = file && form.name.trim() && form.templateId && form.jurisdictions.length > 0;

  return (
    <div>
      {notice && (
        <div
          className={`alert py-2 ${notice.tone === 'ok' ? 'alert-success' : 'alert-danger'}`}
          role="status"
        >
          {notice.message}
        </div>
      )}

      {noTemplates && (
        <div className="p-3 mb-4" style={{ ...STYLES.card, background: COLORS.warningBg }}>
          <p className="mb-0" style={{ fontSize: '0.9rem', color: COLORS.warningText }}>
            There are no active document templates, so a form has nothing to bind
            to. A form carries the routing of its template — who may handle it,
            where it has effect — so create a template first.
          </p>
        </div>
      )}

      {!showForm && !noTemplates && (
        <button
          type="button"
          className="btn mb-4"
          onClick={() => setShowForm(true)}
          style={STYLES.buttonPrimary}
        >
          Publish a form
        </button>
      )}

      {showForm && (
        <form onSubmit={publish} className="p-4 mb-4" style={STYLES.card}>
          <h2 style={{ ...STYLES.sectionHeading, marginBottom: '0.25rem' }}>Publish a form</h2>
          <p style={{ ...STYLES.lede, fontSize: '0.86rem', marginBottom: '1rem' }}>
            A blank PDF anyone on the platform can take a copy of. PDF only — the
            PDF is what gets signed and sealed, so converting a Word file here
            would mean the executed document is not the form you published.
          </p>

          <div className="mb-3">
            <label className="form-label" htmlFor="form-file" style={{ fontWeight: 500 }}>
              The form
            </label>
            <input
              id="form-file"
              type="file"
              accept="application/pdf"
              className={`form-control ${errors.file ? 'is-invalid' : ''}`}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ maxWidth: 440 }}
            />
            {errors.file && <div className="invalid-feedback d-block">{errors.file}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="form-template" style={{ fontWeight: 500 }}>
              Bind it to a template
            </label>
            <select
              id="form-template"
              className={`form-select ${errors.templateId ? 'is-invalid' : ''}`}
              value={form.templateId}
              onChange={(e) => pickTemplate(e.target.value)}
              style={{ maxWidth: 440 }}
            >
              <option value="">Choose…</option>
              {(options.templates ?? []).map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {errors.templateId ? (
              <div className="invalid-feedback d-block">{errors.templateId}</div>
            ) : (
              <p className="mb-0 mt-1" style={{ fontSize: '0.8rem', color: COLORS.inkMuted }}>
                The template decides who may handle the document and where it has
                effect. Choosing one fills in the rest.
              </p>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="form-name" style={{ fontWeight: 500 }}>
              Name
            </label>
            <input
              id="form-name"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Affidavit of Identity (short form)"
              style={{ maxWidth: 440 }}
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="form-desc" style={{ fontWeight: 500 }}>
              What is it for? <span style={{ color: COLORS.inkMuted }}>(optional)</span>
            </label>
            <textarea
              id="form-desc"
              className="form-control"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={600}
              placeholder="Shown to clients browsing the library."
              style={{ maxWidth: 440 }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="form-cat" style={{ fontWeight: 500 }}>
              Category
            </label>
            <select
              id="form-cat"
              className="form-select"
              value={form.documentCategory}
              onChange={(e) => setForm({ ...form, documentCategory: e.target.value })}
              style={{ maxWidth: 440 }}
            >
              <option value="">Choose…</option>
              {(options.categories ?? []).map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.documentCategory && (
              <div className="text-danger small mt-1">{errors.documentCategory}</div>
            )}
          </div>

          <fieldset className="mb-3">
            <legend className="form-label" style={{ fontWeight: 500, fontSize: '1rem' }}>
              Where is it used?
            </legend>
            {(options.jurisdictions ?? []).map((place) => (
              <div className="form-check" key={place.code}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`fj-${place.code}`}
                  checked={form.jurisdictions.includes(place.code)}
                  onChange={() => toggleJurisdiction(place.code)}
                />
                <label className="form-check-label" htmlFor={`fj-${place.code}`}>
                  {place.name}
                </label>
              </div>
            ))}
            {errors.jurisdictions && (
              <div className="text-danger small mt-1">{errors.jurisdictions}</div>
            )}
          </fieldset>

          <div className="d-flex gap-2">
            <button type="submit" className="btn" disabled={!ready || saving} style={STYLES.buttonPrimary}>
              {saving ? 'Publishing…' : 'Publish'}
            </button>
            <button
              type="button"
              className="btn btn-link text-muted"
              onClick={() => {
                setShowForm(false);
                setErrors({});
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {data.forms?.length === 0 && (
        <div className="p-3" style={{ ...STYLES.card, background: COLORS.surface }}>
          <p className="mb-0" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle }}>
            The library is empty. Until there is at least one form, every client
            has to supply their own correctly drafted PDF — which is the main
            reason people cannot use an online notary service.
          </p>
        </div>
      )}

      {data.forms?.map((entry) => (
        <article
          key={entry.id}
          className="p-3 mb-2"
          style={{ ...STYLES.card, opacity: entry.active ? 1 : 0.6 }}
        >
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <strong style={{ fontSize: '0.98rem' }}>{entry.name}</strong>
              {entry.description && (
                <p className="mb-0 mt-1" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                  {entry.description}
                </p>
              )}
              <p className="mb-0 mt-1" style={{ fontSize: '0.82rem', color: COLORS.inkSubtle }}>
                {[
                  entry.templateName,
                  entry.categoryLabel,
                  entry.jurisdictions.join(', '),
                  `v${entry.version}`,
                  entry.sizeBytes ? `${Math.round(entry.sizeBytes / 1024)} KB` : null,
                  `used ${entry.timesUsed} time${entry.timesUsed === 1 ? '' : 's'}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <span style={pill(entry.active ? 'success' : 'neutral')}>
              {entry.active ? 'Published' : 'Withdrawn'}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary mt-2"
            onClick={() => setActive(entry.id, !entry.active)}
          >
            {entry.active ? 'Withdraw' : 'Restore'}
          </button>
        </article>
      ))}
    </div>
  );
}
