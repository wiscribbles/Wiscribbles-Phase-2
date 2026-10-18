import { requireAdmin } from '@/lib/auth/server';
import { getPlanSettings } from '@/lib/settings';
import { PLAN_LIST, formatPriceCents, resolveTemplateAllowance } from '@/lib/plans';
import PlanAllowanceEditor from '@/components/admin/PlanAllowanceEditor';

export const metadata = {
  title: 'Plans & template allowances — WiScribbles',
};

export const dynamic = 'force-dynamic';

/**
 * Website Manager control over how many document templates each plan allows.
 *
 * Rendered server-side behind `requireAdmin`, so a non-admin never receives
 * the data at all — rather than receiving it and being asked not to look.
 */
export default async function AdminPlansPage({ params }) {
  const { locale } = await params;
  await requireAdmin(locale);

  const settings = await getPlanSettings();

  const plans = PLAN_LIST.map((plan) => {
    const resolved = resolveTemplateAllowance({ planId: plan.id, settings });
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceLabel: `${formatPriceCents(plan.monthlyPriceCents)}/month`,
      seats: plan.seats,
      defaultAllowance: plan.documentTemplateAllowance,
      allowance: resolved.allowance,
      unlimited: resolved.unlimited,
      overridden: resolved.source !== 'plan-default',
    };
  });

  return (
    <main className="container" style={{ maxWidth: 980, padding: '40px 16px 80px' }}>
      <header className="mb-4">
        <h1 style={{ fontFamily: 'Jost', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          Plans &amp; template allowances
        </h1>
        <p className="text-muted mb-0" style={{ maxWidth: '64ch', lineHeight: 1.7 }}>
          How many document templates each subscription plan may hold. Changes
          apply to every account on that plan immediately, including existing
          subscribers. An account already over a reduced limit keeps its
          templates but cannot add more.
        </p>
      </header>

      <PlanAllowanceEditor
        initialPlans={plans}
        updatedAt={settings.updatedAt}
        updatedBy={settings.updatedBy}
      />

      <section className="mt-5 pt-4" style={{ borderTop: '1px solid #e6e9ef' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Who pays</h2>
        <p className="text-muted mb-0" style={{ maxWidth: '64ch', lineHeight: 1.7 }}>
          Attorneys and Businesses pay one of these subscriptions. Notaries and
          Commissioners of Oaths are <strong>never charged</strong> — they are paid
          from the service fee, so they have no plan and no allowance. The billing
          code refuses outright to charge those two roles.
        </p>
      </section>
    </main>
  );
}
