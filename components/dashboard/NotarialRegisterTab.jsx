'use client';

/**
 * The officer's own Notarial Acts Register.
 *
 * Barbados Notaries Public Act 2024 s.12(1) requires a notary to keep a
 * register of their notarial acts and to retain it for seven years, with an
 * offence under s.12(5) for failing to. The duty is the INDIVIDUAL'S, not the
 * platform's, which is why this screen exists and why the export matters more
 * than the table.
 *
 * WHAT THIS SCREEN IS FOR, stated plainly because it is unusual: it is the
 * officer's protection against the platform. If WiScribbles went away
 * tomorrow, a notary with no exported register would be in breach of a
 * statutory duty through no fault of their own. So the download is the
 * feature and the on-screen table is the preview.
 *
 * The CSV is generated server-side by `lib/notarialRegister.js` so that the
 * file the officer keeps is the file the platform would produce if a regulator
 * asked, rather than something assembled in a browser from a paginated view.
 */

import { useCallback, useEffect, useState } from 'react';
import { COLORS, RADIUS, STYLES, pill } from '@/lib/theme';

export default function NotarialRegisterTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/partner/register', { cache: 'no-store' });
      if (!response.ok) {
        setError('Your register could not be loaded. Nothing has been lost — try again shortly.');
        return;
      }
      setData(await response.json());
    } catch {
      setError('Could not reach the server.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const download = async () => {
    setDownloading(true);
    try {
      /* Fetched and turned into a blob rather than navigated to, so a failure
         shows an error here instead of replacing the dashboard with a browser
         error page. */
      const response = await fetch('/api/partner/register?format=csv', { cache: 'no-store' });
      if (!response.ok) {
        setError('The export failed. Try again, or contact support if it persists.');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `notarial-acts-register-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not reach the server.');
    } finally {
      setDownloading(false);
    }
  };

  if (error) {
    return (
      <div className="alert alert-warning" role="alert">
        {error}
      </div>
    );
  }

  if (!data) return <p style={{ color: COLORS.inkMuted }}>Loading your register…</p>;

  const rows = data.rows ?? [];

  return (
    <div>
      <h2 style={STYLES.sectionHeading}>Notarial Acts Register</h2>

      <p style={{ ...STYLES.lede, fontSize: '0.9rem' }}>
        Every act you have performed on WiScribbles, in the form a regulator
        would expect. Keeping this register is <strong>your</strong> duty rather
        than ours — in Barbados it is a statutory one, retained for seven years
        — so download a copy and keep it somewhere you control. Do not rely on
        this page being here.
      </p>

      <div className="d-flex gap-2 align-items-center flex-wrap mb-4">
        <button
          type="button"
          className="btn"
          style={STYLES.buttonPositive}
          disabled={downloading || rows.length === 0}
          onClick={download}
        >
          {downloading ? 'Preparing…' : 'Download as CSV'}
        </button>
        <span style={pill('neutral')}>
          {rows.length} act{rows.length === 1 ? '' : 's'}
        </span>
        {data.retentionYears && (
          <span style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
            Retain for {data.retentionYears} years
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="p-3" style={{ ...STYLES.card, background: COLORS.surface }}>
          <p className="mb-0" style={{ fontSize: '0.9rem', color: COLORS.inkSubtle }}>
            No acts recorded yet. Each notarisation you complete is added here
            automatically.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', ...STYLES.card, borderRadius: RADIUS.md }}>
          <table className="table mb-0" style={{ fontSize: '0.86rem' }}>
            <thead>
              <tr>
                {(data.columns ?? []).map((column) => (
                  <th key={column.key} style={{ whiteSpace: 'nowrap' }}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.reference ?? index}>
                  {(data.columns ?? []).map((column) => (
                    <td key={column.key} style={{ whiteSpace: 'nowrap' }}>
                      {row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.truncated && (
        <p className="mt-3 mb-0" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
          Showing the most recent acts. The CSV export contains everything.
        </p>
      )}
    </div>
  );
}
