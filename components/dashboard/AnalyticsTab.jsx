'use client';

/**
 * The Analytics tab.
 *
 * Figures come from `/api/partner/analytics`, which counts documents that
 * actually exist. Nothing here is illustrative. A dashboard that shows
 * invented numbers during a build is a dashboard nobody can trust afterwards,
 * because there is no moment at which it visibly starts being real.
 *
 * Where a figure cannot be counted yet, the API returns it as `pending` with a
 * reason, and it renders as a reason rather than a zero.
 */

import { useCallback, useEffect, useState } from 'react';
import { COLORS, RADIUS, STYLES } from '@/lib/theme';

export default function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [window, setWindow] = useState('30d');
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (value) => {
    setFailed(false);
    try {
      const response = await fetch(`/api/partner/analytics?window=${value}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        setFailed(true);
        return;
      }
      setData(await response.json());
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load(window);
  }, [load, window]);

  if (failed) {
    return (
      <p style={{ color: COLORS.inkMuted }}>
        Could not load your figures just now. Try again in a moment.
      </p>
    );
  }

  if (!data) return <p style={{ color: COLORS.inkMuted }}>Loading…</p>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3">
        <h2 style={{ ...STYLES.sectionHeading, marginBottom: 0 }}>{data.windowLabel}</h2>

        <div className="btn-group" role="group" aria-label="Period">
          {data.windows.map((option) => (
            <button
              key={option.value}
              type="button"
              className="btn btn-sm"
              onClick={() => setWindow(option.value)}
              style={
                option.value === data.window
                  ? { ...STYLES.buttonPrimary, padding: '0.3rem 0.8rem', fontSize: '0.84rem' }
                  : {
                      padding: '0.3rem 0.8rem',
                      fontSize: '0.84rem',
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.inkSubtle,
                      background: COLORS.white,
                    }
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="row g-3">
        {data.cards.map((card) => (
          <div className="col-6 col-lg-3" key={card.key}>
            <div className="p-3 h-100" style={STYLES.card}>
              <p
                className="mb-1"
                style={{ fontSize: '0.8rem', color: COLORS.inkMuted, letterSpacing: '0.02em' }}
              >
                {card.label}
              </p>
              {card.value === null || card.value === undefined ? (
                <p className="mb-0" style={{ fontSize: '0.84rem', color: COLORS.inkMuted }}>
                  {card.empty ?? '—'}
                </p>
              ) : (
                <p
                  className="mb-0"
                  style={{ fontSize: '1.6rem', fontWeight: 600, color: COLORS.ink, lineHeight: 1.2 }}
                >
                  {card.value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.pending?.length > 0 && (
        <div className="mt-4">
          {data.pending.map((item) => (
            <div
              key={item.key}
              className="p-3 mb-2"
              style={{
                ...STYLES.card,
                background: COLORS.surface,
                borderRadius: RADIUS.md,
              }}
            >
              <strong style={{ fontSize: '0.92rem', color: COLORS.ink }}>{item.label}</strong>
              <p className="mb-0 mt-1" style={{ fontSize: '0.86rem', color: COLORS.inkSubtle, maxWidth: '68ch' }}>
                {item.note}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
