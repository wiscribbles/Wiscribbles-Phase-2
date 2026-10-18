import { requirePartner } from '@/lib/auth/server';
import {
  ACCOUNT_STATUS,
  ROLE_LABELS,
  TABS,
  getVisibleTabs,
  isWorkingPartner,
} from '@/lib/roles';
import OnboardingStatusTracker from '@/components/onboarding/OnboardingStatusTracker';

export const metadata = {
  title: 'Complete your application — WiScribbles',
};

/**
 * The restricted route the brief requires:
 *
 *   "Redirect users with role: Notary and status: pending_review to a
 *    restricted route: /onboarding/verification."
 *
 * `requirePartner(..., { allowPending: true })` is the gate. It bounces anyone
 * who is not a partner, anyone unverified, and — in the other direction — any
 * partner who has already been approved, since the holding dashboard is
 * "replaced upon approval".
 *
 * While here, the partner sees only their pre-approval tab set:
 *   Notary / COath  → Account, Financials
 *   Attorney / Business → Account, Invoice
 *
 * Stage 2 fills these tabs with the jurisdiction form, KYC trigger, certificate
 * upload and the Stripe onboarding. The guard, the tab restriction and the
 * feedback-and-resubmission loop are Stage 1 and are live.
 */
export default async function OnboardingVerificationPage({ params }) {
  const { locale } = await params;
  const user = await requirePartner(locale, { allowPending: true });

  const tabs = getVisibleTabs(user.role, user.status);
  const financialTab = isWorkingPartner(user.role) ? TABS.FINANCIALS : TABS.INVOICE;

  return (
    <OnboardingStatusTracker
      locale={locale}
      roleLabel={ROLE_LABELS[user.role]}
      status={user.status}
      adminFeedback={user.adminFeedback}
      canResubmit={user.status === ACCOUNT_STATUS.MORE_INFO_REQUESTED}
      tabs={tabs}
      financialTab={financialTab}
      isWorkingPartner={isWorkingPartner(user.role)}
      jurisdictions={user.jurisdictions}
    />
  );
}
