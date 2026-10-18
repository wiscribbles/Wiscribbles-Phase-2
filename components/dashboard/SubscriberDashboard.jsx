'use client';

/**
 * The Attorney / Business dashboard, post-approval.
 *
 * Brief: "Business profiles workflow are similar to that of Attorneys except
 * for the type of document required to be submitted for approval" — and the
 * document type is an onboarding matter, settled before this screen is
 * reachable. So one component serves both roles, as with the Notary and the
 * Commissioner of Oaths.
 *
 * Seven tabs: Account, Appointments, Social media, Analytics, Support, Invoice,
 * File manager. Six of them work. The Invoice tab is parked, for the reason
 * `ParkedTab` explains.
 */

import PartnerDashboardShell from '@/components/dashboard/PartnerDashboardShell';
import AnalyticsTab from '@/components/dashboard/AnalyticsTab';
import AppointmentTab from '@/components/dashboard/AppointmentTab';
import SocialMediaTab from '@/components/dashboard/SocialMediaTab';
import FileManagerTab from '@/components/dashboard/FileManagerTab';
import SupportTab from '@/components/dashboard/SupportTab';
import ParkedTab from '@/components/dashboard/ParkedTab';
import AccountTab from '@/components/onboarding/AccountTab';
import { ROLES, TABS } from '@/lib/roles';
import { COLORS, STYLES } from '@/lib/theme';

export default function SubscriberDashboard({
  locale,
  tabs,
  initialTab,
  roleLabel,
  name,
  statusLabel,
  role,
}) {
  return (
    <PartnerDashboardShell
      tabs={tabs}
      initialTab={initialTab}
      roleLabel={roleLabel}
      name={name}
      statusLabel={statusLabel}
    >
      {(active) => {
        if (active === TABS.ACCOUNT) {
          return (
            <>
              <div className="p-3 mb-4" style={{ ...STYLES.card, background: COLORS.surface }}>
                <p className="mb-0" style={{ fontSize: '0.88rem', color: COLORS.inkSubtle }}>
                  Your application details are locked now that the Website
                  Manager has approved them. To change them, raise a request on
                  the Support tab — the approval attaches to what was reviewed.
                  {role === ROLES.BUSINESS || role === ROLES.ATTORNEY ? (
                    <>
                      {' '}
                      Unlike Notaries and Commissioners of Oaths, your practice
                      is not confined to a jurisdiction.
                    </>
                  ) : null}
                </p>
              </div>
              <AccountTab canEdit={false} />
            </>
          );
        }

        if (active === TABS.APPOINTMENT) return <AppointmentTab />;
        if (active === TABS.SOCIAL_MEDIA) return <SocialMediaTab locale={locale} />;
        if (active === TABS.ANALYTICS) return <AnalyticsTab />;
        if (active === TABS.SUPPORT) return <SupportTab />;
        if (active === TABS.FILE_MANAGER) return <FileManagerTab />;

        if (active === TABS.INVOICE) {
          return (
            <ParkedTab
              title="Invoice"
              waitingOn={
                'Subscription billing is built but not switched on. The plans ' +
                'are set — Solo at USD $50, Chambers at USD $150 and ' +
                'Enterprise at USD $350 a month — and collection runs through ' +
                'Stripe Checkout. What is outstanding is the other half of the ' +
                'money flow: how service fees reach Caribbean professionals, ' +
                'which is a money-transmission question rather than a coding ' +
                'one. Taking subscriptions before that is settled would mean ' +
                'collecting money the platform cannot yet pay out.'
              }
              meanwhile={
                'Your account is fully usable in the meantime. Nothing you do ' +
                'now will need redoing when billing opens.'
              }
            />
          );
        }

        return null;
      }}
    </PartnerDashboardShell>
  );
}
