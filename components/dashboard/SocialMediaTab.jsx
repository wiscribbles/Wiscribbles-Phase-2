'use client';

/**
 * The Social Media tab — shareable signing links.
 *
 * Brief: generate a signing link to share over social media or messaging.
 *
 * The new link is shown once, in a panel the user must dismiss, because the
 * server stores only a hash of it and genuinely cannot show it again (see
 * `lib/signingLinks.js`). That is a real constraint rather than a UI choice, so
 * the panel says so instead of pretending the link can be found later.
 */

import { useCallback, useEffect, useState } from 'react';
import { COLORS, RADIUS, STYLES, pill } from '@/lib/theme';

const STATUS_TONE = {
  active: 'success',
  revoked: 'neutral',
  expired: 'warning',
  used_up: 'neutral',
};

const STATUS_LABEL = {
  active: 'Active',
  revoked: 'Revoked',
  expired: 'Expired',
  used_up: 'Use limit reached',
};

export default function SocialMediaTab({ locale }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    documentId: '',
    purpose: 'sign',
    ttlDays: 7,
    maxUses: '',
    label: '',
  });
  const [errors, setErrors] = useState({});
  const [minted, setMinted] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/signing-links', { cache: 'no-store' });
      if (!response.ok) return;
      setData(await response.json());
    } catch {
      setData({ links: [], documents: [], options: null });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setNotice(null);
    setCopied(false);

    try {
      const response = await fetch('/api/signing-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (payload.errors) setErrors(payload.errors);
        else setNotice({ tone: 'error', message: payload.message ?? 'Could not create the link.' });
        return;
      }

      setMinted(payload);
      setForm({ documentId: '', purpose: 'sign', ttlDays: 7, maxUses: '', label: '' });
      load();
    } catch {
      setNotice({ tone: 'error', message: 'Could not reach the server.' });
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id) => {
    await fetch(`/api/signing-links?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    load();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(minted.url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (!data) return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;

  const noDocuments = (data.documents ?? []).length === 0;

  return (
    <div style={{ maxWidth: 760 }}>
      <h2 style={STYLES.sectionHeading}>Shareable signing links</h2>
      <p style={{ ...STYLES.lede, fontSize: '0.88rem' }}>
        A link anyone can open to sign or review one of your documents, without
        an account. Treat it like a key: whoever holds it can use it until it
        expires or you revoke it.
      </p>

      {notice && (
        <div className="alert alert-danger py-2" role="status">
          {notice.message}
        </div>
      )}

      {/* ---------------- the one-time reveal ---------------- */}
      {minted && (
        <div
          className="p-3 mb-4"
          style={{
            ...STYLES.card,
            borderLeft: `4px solid ${COLORS.warning}`,
            background: COLORS.warningBg,
          }}
        >
          <strong style={{ fontSize: '0.95rem', color: COLORS.warningText }}>
            Copy this now — it will not be shown again
          </strong>
          <p className="mb-2 mt-1" style={{ fontSize: '0.84rem', color: COLORS.warningText }}>
            {minted.warning}
          </p>

          <div className="d-flex gap-2 align-items-center flex-wrap">
            <code
              style={{
                flex: 1,
                minWidth: 240,
                padding: '0.5rem 0.7rem',
                background: COLORS.white,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.sm,
                fontSize: '0.8rem',
                wordBreak: 'break-all',
              }}
            >
              {minted.url}
            </code>
            <button type="button" className="btn btn-sm" onClick={copy} style={STYLES.buttonPrimary}>
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-link text-muted"
              onClick={() => setMinted(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ---------------- create ---------------- */}
      {noDocuments ? (
        <div className="p-3 mb-4" style={{ ...STYLES.card, background: COLORS.surface }}>
          <p className="mb-0" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle }}>
            You have no documents yet. A signing link points at a document, so
            upload one first — the File manager tab is where they appear.
          </p>
        </div>
      ) : (
        <form onSubmit={create} className="p-4 mb-4" style={STYLES.card}>
          <div className="mb-3">
            <label className="form-label" htmlFor="link-doc" style={{ fontWeight: 500 }}>
              Document
            </label>
            <select
              id="link-doc"
              className={`form-select ${errors.documentId ? 'is-invalid' : ''}`}
              value={form.documentId}
              onChange={(e) => setForm({ ...form, documentId: e.target.value })}
              style={{ maxWidth: 480 }}
            >
              <option value="">Choose…</option>
              {data.documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.name}
                </option>
              ))}
            </select>
            {errors.documentId && (
              <div className="invalid-feedback d-block">{errors.documentId}</div>
            )}
          </div>

          <fieldset className="mb-3">
            <legend className="form-label" style={{ fontWeight: 500, fontSize: '1rem' }}>
              What may the recipient do?
            </legend>
            {(data.options?.purposes ?? []).map((option) => (
              <div className="form-check" key={option.value}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="purpose"
                  id={`purpose-${option.value}`}
                  checked={form.purpose === option.value}
                  onChange={() => setForm({ ...form, purpose: option.value })}
                />
                <label className="form-check-label" htmlFor={`purpose-${option.value}`}>
                  {option.label}
                </label>
              </div>
            ))}
          </fieldset>

          <div className="row g-3 mb-3" style={{ maxWidth: 480 }}>
            <div className="col-6">
              <label className="form-label" htmlFor="link-ttl" style={{ fontWeight: 500 }}>
                Expires after
              </label>
              <div className="input-group">
                <input
                  id="link-ttl"
                  type="number"
                  className={`form-control ${errors.ttlDays ? 'is-invalid' : ''}`}
                  min={1}
                  max={data.options?.maxTtlDays ?? 30}
                  value={form.ttlDays}
                  onChange={(e) => setForm({ ...form, ttlDays: e.target.value })}
                />
                <span className="input-group-text">days</span>
              </div>
              {errors.ttlDays && <div className="text-danger small mt-1">{errors.ttlDays}</div>}
            </div>

            <div className="col-6">
              <label className="form-label" htmlFor="link-uses" style={{ fontWeight: 500 }}>
                Use limit
              </label>
              <input
                id="link-uses"
                type="number"
                className={`form-control ${errors.maxUses ? 'is-invalid' : ''}`}
                min={1}
                max={100}
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="No limit"
              />
              {errors.maxUses && <div className="text-danger small mt-1">{errors.maxUses}</div>}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="link-label" style={{ fontWeight: 500 }}>
              Label <span style={{ color: COLORS.inkMuted }}>(optional, for your own reference)</span>
            </label>
            <input
              id="link-label"
              className="form-control"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. Sent to Mr Persaud on WhatsApp"
              style={{ maxWidth: 480 }}
            />
          </div>

          <button type="submit" className="btn" disabled={saving} style={STYLES.buttonPrimary}>
            {saving ? 'Creating…' : 'Create link'}
          </button>
        </form>
      )}

      {/* ---------------- existing ---------------- */}
      {data.links?.length > 0 && (
        <>
          <h2 style={STYLES.sectionHeading}>Your links</h2>
          {data.links.map((link) => (
            <article key={link.id} className="p-3 mt-2" style={STYLES.card}>
              <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>
                    {link.label || link.documentName || 'Signing link'}
                  </strong>
                  <p className="mb-0 mt-1" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                    {link.purpose === 'sign' ? 'Can sign' : 'View only'}
                    {' · '}
                    {link.status === 'expired'
                      ? 'Expired'
                      : `Expires ${new Date(link.expiresAt).toLocaleDateString()}`}
                    {' · used '}
                    {link.useCount}
                    {link.maxUses ? ` of ${link.maxUses}` : ' times'}
                  </p>
                </div>
                <span style={pill(STATUS_TONE[link.status] ?? 'neutral')}>
                  {STATUS_LABEL[link.status] ?? link.status}
                </span>
              </div>

              {link.status === 'active' && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary mt-2"
                  onClick={() => revoke(link.id)}
                >
                  Revoke
                </button>
              )}
            </article>
          ))}
        </>
      )}
    </div>
  );
}
