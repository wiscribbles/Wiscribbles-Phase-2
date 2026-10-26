/**
 * Operational settings — Website Manager only.
 *
 *   GET → the current settings, merged over the defaults
 *   PUT → save one or more of them
 *
 * `firestore.rules` denies every client write to `adminSettings`, so this
 * route is the only way these values change. The validation and the reason
 * `autoApproveAttorneys` is refused are in `lib/settings.js`.
 */

import { NextResponse } from 'next/server';
import { authErrorResponse, requireApiAdmin } from '@/lib/auth/server';
import {
  ALL_PAYOUT_CURRENCIES,
  OPERATIONAL_SETTING_DEFAULTS,
  SettingsError,
  getOperationalSettings,
  setOperationalSettings,
} from '@/lib/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function settingsError(error) {
  return NextResponse.json(
    {
      error: error.code,
      message: error.message,
      ...(error.field ? { field: error.field } : {}),
    },
    { status: error.status },
  );
}

export async function GET() {
  try {
    await requireApiAdmin();

    return NextResponse.json({
      settings: await getOperationalSettings(),
      defaults: OPERATIONAL_SETTING_DEFAULTS,
      currencies: ALL_PAYOUT_CURRENCIES,
      /* Served so the page can say it plainly rather than implying these
         switches do something. See the note in `lib/settings.js`. */
      noConsumerYet: true,
    });
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

    const settings = await setOperationalSettings(body?.settings ?? body, actor);

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    if (error instanceof SettingsError) return settingsError(error);
    return authErrorResponse(error);
  }
}
