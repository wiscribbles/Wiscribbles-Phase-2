/**
 * The officer's own Notarial Acts Register.
 *
 *   GET              → the register as JSON, for display
 *   GET ?format=csv  → the same register as a CSV download
 *
 * The duty, and why the register belongs to the officer rather than to the
 * platform, is in `lib/notarialRegister.js`.
 *
 * ── THE GUARD IS DELIBERATELY LOOSER THAN `requireApprovedPartner` ──────────
 *
 * Every other partner route requires an APPROVED account. This one must not,
 * and the reason is the whole point of the feature.
 *
 * An officer whose certificate expires is set back to `more_info_requested` by
 * `lib/admin/credentials.js`. Their retention duty does not lapse with their
 * commission — Barbados s.12(1) requires seven years of records regardless of
 * whether the officer is currently appointed, and s.12(5) makes failure an
 * offence. If the export required an approved account, the platform would
 * withdraw access to the record at the exact moment the officer most needs to
 * take a copy of it: on the day their appointment lapsed.
 *
 * So any account holding a partner role may download ITS OWN register, in any
 * status. What is enforced instead is scope: the query is keyed to the
 * caller's own uid in `registerFor`, so an officer sees their own acts and
 * nobody else's. That is the control that matters here — not status.
 */

import { NextResponse } from 'next/server';
/* `AuthError` lives in `lib/auth/server.js` alongside the guards that throw
   it, not in a separate errors module — there isn't one. */
import { AuthError, authErrorResponse, requireApiUser } from '@/lib/auth/server';
import { isPartnerRole } from '@/lib/roles';
import { REGISTER_COLUMNS, RETENTION_YEARS, registerFor, toCsv } from '@/lib/notarialRegister';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await requireApiUser();

    if (!isPartnerRole(user.role)) {
      /* A client has no notarial acts, so there is nothing to serve. Said
         plainly rather than returning an empty register, which would imply
         they had performed none. */
      throw new AuthError(
        403,
        'not_an_officer',
        'A notarial acts register belongs to a notary or Commissioner of Oaths.',
      );
    }

    const register = await registerFor({ uid: user.uid });
    const { searchParams } = new URL(request.url);

    if (searchParams.get('format') === 'csv') {
      const stamp = register.generatedAt.slice(0, 10);

      return new NextResponse(toCsv(register), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          /* Named so a folder of these sorts chronologically and says whose
             it is without being opened. */
          'Content-Disposition': `attachment; filename="notarial-acts-register-${stamp}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({
      ...register,
      columns: REGISTER_COLUMNS,
      retentionYears: RETENTION_YEARS,
      obligation:
        'This is your own professional record. A notary public must keep a ' +
        'register of notarial acts and retain it for ' +
        `${RETENTION_YEARS} years (Barbados Notaries Public Act 2024 s.12(1), ` +
        'with an offence under s.12(5) for failing to keep one). Download a ' +
        'copy and keep it somewhere that does not depend on WiScribbles.',
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
