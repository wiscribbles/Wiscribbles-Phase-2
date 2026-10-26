'use client';

/**
 * The price list, editable by the Website Manager.
 *
 * Every figure the platform charges a client is set here and read everywhere
 * else — the request wizard's live quote, the stored charge, the public
 * pricing panel. Before this existed the numbers were in `lib/fees.js` and
 * typed again into the homepage markup, which meant a price could be changed
 * in one place and not the other, and a client could be quoted one figure on
 * the homepage and charged another at checkout.
 *
 * TWO THINGS THE UI HAS TO BE HONEST ABOUT.
 *
 * Prices are held in CENTS, not dollars, because that is what the calculation
 * and the payment provider use and converting at the edges is how rounding
 * errors get in. Showing a manager a box containing `1500` and expecting them
 * to know it means $15.00 is a trap, so the dollar value is rendered beside
 * every field as it is typed.
 *
 * And a blank field is not zero. Blank CLEARS the override and returns that
 * line to the figure in the code, which is a different thing from charging
 * nothing — so the control says which it is doing and the placeholder shows
 * the default it would fall back to.
 */

import { useCallback, useEffect, useState } from 'react';

const money = (cents) =>
  typeof cents === 'number' && Number.isFinite(cents)
    ? `$${(cents / 100).toFixed(2)}`
    : '—';

/** GYD is quoted whole, not in cents — see the note on PREPARE_REGISTER_GYD. */
const display = (field, value) =>
  field.unit === 'GYD' ? `GYD ${Number(value ?? 0).toLocaleString()}` : money(Number(value));

export default function PriceListEditor() {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setNotice(null);
    try {
      const response = await fetch('/api/admin/pricing', { cache: 'no-store' });
      if (!response.ok) {
        setNotice({ tone: 'error', message: 'Could not load the price list.' });
        return;
      }
      const payload = await response.json();
      setData(payload);
      /* The draft starts as the values actually in force, so a save with one
         field edited does not reset the others to their defaults. */
      setDraft(
        Object.fromEntries(payload.fields.map((field) => [field.key, String(field.value)])),
      );
    } catch {
      setNotice({ tone: 'error', message: 'Could not reach the server.' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    setNotice(null);

    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: draft }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        /* The server's message names the field and its bounds. Replacing it
           with "could not save" would hide which of seven boxes was wrong. */
        setNotice({ tone: 'error', message: payload.message ?? 'That did not save.' });
        return;
      }

      setNotice({
        tone: 'ok',
        message:
          'Saved. Every new quote uses these figures from now on, and the ' +
          'public pricing panel updates within half a minute. Quotes already ' +
          'given keep the prices they were given at.',
      });
      load();
    } catch {
      setNotice({ tone: 'error', message: 'Could not reach the server.' });
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return <p className="text-muted mb-0">{notice?.message ?? 'Loading the price list…'}</p>;
  }

  return (
    <div>
      {notice && (
        <div
          className={`alert ${notice.tone === 'ok' ? 'alert-success' : 'alert-warning'} py-2`}
          role="status"
        >
          {notice.message}
        </div>
      )}

      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">Charge</th>
              <th scope="col" style={{ width: 160 }}>
                Amount
              </th>
              <th scope="col" style={{ width: 120 }}>
                Shown as
              </th>
              <th scope="col" style={{ width: 150 }}>
                Default
              </th>
            </tr>
          </thead>
          <tbody>
            {data.fields.map((field) => (
              <tr key={field.key}>
                <td>
                  <div style={{ fontWeight: 500 }}>{field.label}</div>
                  {field.note && (
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{field.note}</div>
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min={field.min}
                    max={field.max}
                    step={1}
                    value={draft[field.key] ?? ''}
                    placeholder={String(field.default)}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    aria-label={`${field.label} in ${field.unit}`}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {field.unit === 'GYD' ? 'Guyana dollars' : 'cents'}
                  </div>
                </td>
                <td>{display(field, draft[field.key] === '' ? field.default : draft[field.key])}</td>
                <td>
                  <span style={{ color: '#6b7280' }}>{display(field, field.default)}</span>
                  {field.overridden && (
                    <div style={{ fontSize: '0.75rem', color: '#8a5a00' }}>changed from default</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 mb-2" style={{ fontSize: '0.84rem', color: '#6b7280' }}>
        Leave a box empty to go back to the default for that line. Amounts are
        in cents, so 1500 is $15.00 — the dollar figure beside each box is what
        a client sees.
      </p>

      {/* The constraint a pricing screen must not let anyone forget. */}
      <div className="alert alert-info py-2" style={{ fontSize: '0.86rem' }}>
        <strong>These are platform fees.</strong> What the notary or
        Commissioner of Oaths receives is fixed by law, not by this screen —
        Guyana caps notarial fees at the figure prescribed by rules of court,
        and Jamaica and Barbados fix them by published tariff. Raising a price
        here raises the platform&apos;s own fee; it must never be implemented as
        a larger share of a capped notarial fee.
      </div>

      <div className="d-flex align-items-center gap-3">
        <button
          type="button"
          className="btn btn-sm"
          style={{ background: '#0C1134', color: '#fff' }}
          disabled={busy}
          onClick={save}
        >
          {busy ? 'Saving…' : 'Save prices'}
        </button>

        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
          Version <code>{data.version}</code>
          {data.updatedAt
            ? ` · last changed ${new Date(data.updatedAt).toLocaleString()}${
                data.updatedBy?.email ? ` by ${data.updatedBy.email}` : ''
              }`
            : ' · never changed from the defaults'}
        </span>
      </div>
    </div>
  );
}
