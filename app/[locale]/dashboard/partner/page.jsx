import { requirePartner } from '@/lib/auth/server';
import {
  ROLE_LABELS,
  STATUS_LABELS,
  getVisibleTabs,
  isWorkingPartner,
} from '@/lib/roles';
import WorkingPartnerDashboard from '@/components/dashboard/WorkingPartnerDashboard';
import SubscriberDashboard from '@/components/dashboard/SubscriberDashboard';

export const metadata = {
  title: 'Dashboard — WiScribbles',
};

export const dynamic = 'force-dynamic';

/**
 * The approved-partner dashboard, for all four partner roles.
 *
 * One route, because the tab set is data (`getVisibleTabs`) rather than
 * structure. Two routes would mean two guards, and two guards eventually
 * disagree.
 *
 * `requirePartner` does the gating: it bounces anyone unverified, anyone who is
 * not a partner, and — in the other direction — any partner still awaiting
 * approval, who belongs on `/onboarding/verification` until the Website Manager
 * has decided. So by the time this renders, the account is approved. The tab
 * list is still computed from role and status rather than assumed, because the
 * same function is what the per-tab guard checks against.
 */
export default async function PartnerDashboardPage({ params, searchParams }) {
  const { locale } = await params;
  const { tab } = (await searchParams) ?? {};

  const user = await requirePartner(locale);
  const tabs = getVisibleTabs(user.role, user.status);

  const shared = {
    locale,
    tabs,
    initialTab: typeof tab === 'string' ? tab : tabs[0],
    roleLabel: ROLE_LABELS[user.role],
    name: user.name ?? null,
    statusLabel: STATUS_LABELS[user.status],
  };

  return isWorkingPartner(user.role) ? (
    <WorkingPartnerDashboard {...shared} />
  ) : (
    <SubscriberDashboard {...shared} role={user.role} />
  );
}
