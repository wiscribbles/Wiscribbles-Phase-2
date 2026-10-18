/**
 * Plan settings — Website Manager only.
 *
 *   GET   → the three plans with their effective template allowances
 *   PATCH → set or clear per-plan allowances
 *
 * Writes go through here rather than from the browser because
 * `firestore.rules` denies all client writes to `adminSettings`, and because
 * every change is written to the audit log with who made it.
 */

import { NextResponse } from 'next/server';
import { authErrorResponse, requireApiAdmin } from '@/lib/auth/server';
import { getPlanSettings, setPlanAllowances } from '@/lib/settings';
import {
  PLAN_LIST,
  formatPriceCents,
  resolveTemplateAllowance,
} from '@/lib/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function describePlans(settings) {
  return PLAN_LIST.map((plan) => {
    const resolved = resolveTemplateAllowance({ planId: plan.id, settings });
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      monthlyPriceCents: plan.monthlyPriceCents,
      priceLabel: `${formatPriceCents(plan.monthlyPriceCents)}/month`,
      seats: plan.seats,
      features: plan.features,
      defaultAllowance: plan.documentTemplateAllowance,
      allowance: resolved.allowance,
      unlimited: resolved.unlimited,
      // 'plan-default' means no override is set, which is what the UI uses to
      // decide whether to show a "reset" control.
      overridden: resolved.source !== 'plan-default',
    };
  });
}

export async function GET() {
  try {
    await requireApiAdmin();
    const settings = await getPlanSettings();

    return NextResponse.json({
      plans: describePlans(settings),
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const admin = await requireApiAdmin();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const allowances = body?.allowances;
    if (!allowances || typeof allowances !== 'object' || Array.isArray(allowances)) {
      return NextResponse.json(
        {
          error: 'invalid_body',
          message: 'Expected { allowances: { planId: number | null } }.',
        },
        { status: 400 },
      );
    }

    let settings;
    try {
      settings = await setPlanAllowances(allowances, {
        uid: admin.uid,
        email: admin.email,
      });
    } catch (error) {
      if (error.fieldErrors) {
        return NextResponse.json(
          { error: 'validation_failed', errors: error.fieldErrors },
          { status: 422 },
        );
      }
      throw error;
    }

    return NextResponse.json({
      ok: true,
      plans: describePlans(settings),
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
