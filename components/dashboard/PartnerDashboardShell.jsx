'use client';

/**
 * The partner dashboard shell — one component for all four partner roles.
 *
 * The tab set is NOT decided here. It arrives as a prop, computed on the server
 * by `getVisibleTabs(role, status)` from `lib/roles.js`, which is the same
 * function the server guard uses to decide whether a tab may be opened at all.
 * One source of truth, so the navigation cannot offer a tab the guard will then
 * refuse — the commonest way a role-based dashboard goes wrong.
 *
 * Styling is `lib/theme.js`: the existing palette, the existing
 * react-bootstrap-with-inline-styles convention. Nothing new to look at.
 */

import { useCallback, useEffect, useState } from 'react';
import { Nav } from 'react-bootstrap';
import { STYLES, COLORS, pill } from '@/lib/theme';
import { TABS } from '@/lib/roles';

const TAB_LABELS = {
  [TABS.ACCOUNT]: 'Account',
  [TABS.ANALYTICS]: 'Analytics',
  [TABS.NOTARIAL_REGISTER]: 'Acts Register',
  [TABS.SUPPORT]: 'Support',
  [TABS.FINANCIALS]: 'Financials',
  [TABS.APPOINTMENT]: 'Appointments',
  [TABS.SOCIAL_MEDIA]: 'Social media',
  [TABS.INVOICE]: 'Invoice',
  [TABS.FILE_MANAGER]: 'File manager',
};

export default function PartnerDashboardShell({
  tabs,
  initialTab,
  roleLabel,
  name,
  statusLabel,
  children,
  /** Rendered under the header, above the tabs — the Go Live toggle. */
  banner = null,
}) {
  const [active, setActive] = useState(
    tabs.includes(initialTab) ? initialTab : tabs[0],
  );

  /* Keep the tab in the URL so a refresh, a bookmark or a support request
     ("I'm on the Analytics tab and…") lands in the same place. `replaceState`
     rather than the router, because this is presentation state and should not
     add a history entry or trigger a server round-trip. */
  const select = useCallback((tab) => {
    setActive(tab);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState(null, '', url);
  }, []);

  // Back/forward should still move between tabs.
  useEffect(() => {
    const onPop = () => {
      const tab = new URL(window.location.href).searchParams.get('tab');
      if (tab && tabs.includes(tab)) setActive(tab);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [tabs]);

  return (
    <main className="container" style={{ maxWidth: 1040, padding: '36px 16px 80px' }}>
      <header className="mb-4">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h1 style={{ ...STYLES.pageHeading, marginBottom: '0.25rem' }}>
              {name ? `${name}` : roleLabel}
            </h1>
            <p className="mb-0" style={{ color: COLORS.inkMuted, fontSize: '0.92rem' }}>
              {roleLabel}
            </p>
          </div>
          {statusLabel && <span style={pill('success')}>{statusLabel}</span>}
        </div>
      </header>

      {banner}

      <Nav
        className="mb-4"
        style={{ borderBottom: `1px solid ${COLORS.border}`, flexWrap: 'wrap', gap: 0 }}
      >
        {tabs.map((tab) => (
          <Nav.Item key={tab}>
            <Nav.Link
              as="button"
              type="button"
              onClick={() => select(tab)}
              aria-current={active === tab ? 'page' : undefined}
              style={active === tab ? STYLES.tabActive : STYLES.tabInactive}
            >
              {TAB_LABELS[tab] ?? tab}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <section>{children(active)}</section>
    </main>
  );
}

export { TAB_LABELS };
