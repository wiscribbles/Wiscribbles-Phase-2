import { redirect } from 'next/navigation';
import { requireVerifiedUser } from '@/lib/auth/server';
import { ACCOUNT_STATUS, isAdmin, isPartnerRole } from '@/lib/roles';
import LegacyClientDashboard from '@/components/legacy/LegacyClientDashboard';

export const metadata = {
  title: 'Dashboard — WiScribbles',
};

export const dynamic = 'force-dynamic';

/**
 * Where a signed-in account lands — and the thing that was missing.
 *
 * Every sign-in path redirects here (`SignInEmailForm`, `VerifyEmailPanel`,
 * `auth/verify-email`). Until now this route WAS the Phase 1 client dashboard,
 * and nothing anywhere linked to the Phase 2 dashboards. So an approved notary
 * signing in landed on the old client screen, the Go Live toggle and the queue
 * were unreachable without typing a URL, and the four stages of partner
 * dashboard built on top of them may as well not have existed.
 *
 * This is now a dispatcher. One place decides where each role goes, reading
 * role and status from the same `lib/roles.js` vocabulary as the guards, so
 * the destination and the guard on that destination cannot disagree.
 */
export default async function DashboardPage({ params }) {
  const { locale } = await params;
  const user = await requireVerifiedUser(locale, { returnTo: `/${locale}/dashboard` });

  // The Website Manager has their own surface and no use for this one.
  if (isAdmin(user.role)) {
    redirect(`/${locale}/admin/partners`);
  }

  if (isPartnerRole(user.role)) {
    /* A partner still awaiting a decision belongs on the holding route. The
       partner dashboard's own guard would send them there anyway; doing it
       here saves them a redirect they would see as a flicker. */
    if (
      user.status === ACCOUNT_STATUS.PENDING_REVIEW ||
      user.status === ACCOUNT_STATUS.MORE_INFO_REQUESTED
    ) {
      redirect(`/${locale}/onboarding/verification`);
    }

    redirect(`/${locale}/dashboard/partner`);
  }

  // Clients keep the Phase 1 dashboard, which works.
  return <LegacyClientDashboard />;
}
