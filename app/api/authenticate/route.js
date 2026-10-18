/**
 * Public document verification.
 *
 *   POST { reference, day, month, year } → the verification result
 *
 * DELIBERATELY UNAUTHENTICATED. The people who need this are banks, registries,
 * employers and counterparties — almost none of them have a WiScribbles
 * account, and requiring one would make the verification service useless for
 * its actual purpose. A document nobody outside the platform can check is not
 * much better than one with no seal at all.
 *
 * What stands in for authentication is the two-factor lookup (reference number
 * AND date signed), a rate limit per caller, and the fact that a verification
 * returns facts about the instrument rather than the instrument itself. The
 * reasoning is in `lib/authentication.js`.
 *
 * POST rather than GET, so the reference number does not end up in server
 * logs, browser history and referrer headers on every verification.
 */

import { NextResponse } from 'next/server';
import {
  AuthenticationError,
  VERIFICATION,
  normalizeDate,
  verify,
} from '@/lib/authentication';
import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The caller, for rate limiting.
 *
 * Behind a proxy the socket address is the proxy's, so the forwarded header is
 * what identifies the caller — but a header can be set by anyone, so this is a
 * throttling key and never an access decision. Only the FIRST entry is used:
 * the rest are attacker-controlled and would otherwise let one caller present
 * as a new one on every request.
 */
function callerKey(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const dateSigned = normalizeDate({
    day: body?.day,
    month: body?.month,
    year: body?.year,
  });

  if (!dateSigned) {
    return NextResponse.json(
      {
        error: 'bad_date',
        message:
          'Enter the date the document was signed as a real calendar date. ' +
          'This is the date on the certificate page, not the date you ' +
          'received the document.',
      },
      { status: 422 },
    );
  }

  try {
    const outcome = await verify({
      reference: body?.reference,
      dateSigned,
      callerKey: callerKey(request),
    });

    /* Successful verifications are logged — not for the verifier's sake but
       for the document owner's. A sudden run of verifications on one
       instrument is something the Website Manager should be able to see. The
       caller is not identified; only that it happened. */
    if (outcome.result === VERIFICATION.VALID || outcome.result === VERIFICATION.REVOKED) {
      await adminDb()
        .collection('auditLog')
        .add({
          type: 'document_verified',
          documentId: outcome.certificate?.documentId ?? null,
          result: outcome.result,
          actorUid: null,
          actorEmail: 'public',
          at: new Date().toISOString(),
        })
        .catch((error) => console.error('[authenticate] audit write failed', error));
    }

    return NextResponse.json(outcome, {
      status: outcome.result === VERIFICATION.RATE_LIMITED ? 429 : 200,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
