/**
 * The price list — Website Manager only.
 *
 *   GET → every settable figure with its current value, default and bounds
 *   PUT → save one or more of them
 *
 * `firestore.rules` denies all client writes to `adminSettings`, so this route
 * is the only way prices change. Validation, the allow-list, the audit entry
 * and the reason the version is derived rather than constant are all in
 * `lib/pricing.js`.
 */

import { NextResponse } from 'next/server';
import { authErrorResponse, requireApiAdmin } from '@/lib/auth/server';
import { PricingError, describePriceList, setPrices } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireApiAdmin();
    return NextResponse.json(await describePriceList());
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PUT(request) {
  try {
    const actor = await requireApiAdmin();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const saved = await setPrices(body?.prices ?? body, actor);

    return NextResponse.json({
      ok: true,
      version: saved.version,
      prices: saved.prices,
      /* Returned so the editor can show which lines are now overridden
         without a second request. */
      overrides: saved.overrides,
    });
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json(
        { error: error.code, message: error.message, ...(error.field ? { field: error.field } : {}) },
        { status: error.status },
      );
    }
    return authErrorResponse(error);
  }
}
