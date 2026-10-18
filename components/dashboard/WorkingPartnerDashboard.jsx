'use client';

/**
 * The Notary / Commissioner of Oaths dashboard, post-approval.
 *
 * Brief: "The Commissioner of Oaths dashboard and verification process is
 * identical to that of the Notary" — so this is one component for both roles,
 * and the only thing that differs is which service type the queue matches,
 * which is decided server-side from the role.
 *
 * Four tabs: Account, Analytics, Support, Financials.
 */

import { useState } from 'react';
import PartnerDashboardShell from '@/components/dashboard/PartnerDashboardShell';
import GoLiveToggle from '@/components/dashboard/GoLiveToggle';
import RequestQueue from '@/components/dashboard/RequestQueue';
import AnalyticsTab from '@/components/dashboard/AnalyticsTab';
import ParkedTab from '@/components/dashboard/ParkedTab';
import SupportTab from '@/components/dashboard/SupportTab';
import AccountTab from '@/components/onboarding/AccountTab';
import { TABS } from '@/lib/roles';
import { COLORS, STYLES } from '@/lib/theme';

export default function WorkingPartnerDashboard({
  locale,
  tabs,
  initialTab,
  roleLabel,
  name,
  statusLabel,
}) {
  /* Lifted so the toggle and the queue agree without a round-trip: the queue
     stops polling the moment the professional goes offline, rather than at the
     next poll. */
  const [isOnline, setIsOnline] = useState(false);

  return (
    <PartnerDashboardShell
      tabs={tabs}
      initialTab={initialTab}
      roleLabel={roleLabel}
      name={name}
      statusLabel={statusLabel}
      banner={
        <>
          <GoLiveToggle onChange={setIsOnline} />
          {/* The queue sits outside the tab set deliberately. The brief lists
              four tabs and the waiting queue is not one of them — it is what a
              live professional watches while they do everything else. Inside a
              tab it would vanish the moment they opened Analytics, and a client
              would sit waiting on someone who had stopped looking. */}
          <div className="mb-4">
            <RequestQueue locale={locale} isOnline={isOnline} />
          </div>
        </>
      }
    >
      {(active) => {
        if (active === TABS.ACCOUNT) {
          return (
            <>
              <div className="p-3 mb-4" style={{ ...STYLES.card, background: COLORS.surface }}>
                <p className="mb-0" style={{ fontSize: '0.88rem', color: COLORS.inkSubtle }}>
                  Your application details are locked now that the Website
                  Manager has approved them. To change a jurisdiction of
                  practice or replace your certificate, raise a request on the
                  Support tab — an approved profile cannot be edited in place,
                  because the approval attaches to what was reviewed.
                </p>
              </div>
              <AccountTab canEdit={false} />
            </>
          );
        }

        if (active === TABS.ANALYTICS) return <AnalyticsTab />;

        if (active === TABS.SUPPORT) return <SupportTab />;

        if (active === TABS.FINANCIALS) {
          return (
            <ParkedTab
              title="Financials"
              waitingOn={
                'Payouts are not switched on yet. Whether service fees reach ' +
                'Caribbean professionals through Stripe or through WiPay turns ' +
                'on money-transmission licensing, not on code, and that is ' +
                'being settled now. Bank details are deliberately not being ' +
                'collected until the answer is known, so that nobody enters ' +
                'them twice into two different providers.'
              }
              meanwhile={
                'Nothing is lost in the meantime: every session you complete is ' +
                'recorded with its fee, and the ledger is what the first payout ' +
                'run will pay from. As a Notary or Commissioner of Oaths you ' +
                'are never charged a subscription — you are paid from the ' +
                'service fee.'
              }
            />
          );
        }

        return null;
      }}
    </PartnerDashboardShell>
  );
}
