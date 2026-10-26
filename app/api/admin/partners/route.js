/**
 * Partner review queue — Website Manager only.
 *
 *   GET   → applications, filtered by status and role
 *   PATCH → record a decision on one application
 *
 * Both go through `requireApiAdmin`, and every decision is written to the
 * audit log with who made it.
 */

import { NextResponse } from 'next/server';
import { authErrorResponse, requireApiAdmin } from '@/lib/auth/server';
import {
  DECISION,
  DecisionError,
  decidePartnerApplication,
  listPartnerApplications,
} from '@/lib/admin/partners';
import { getSignedUrl } from '@/lib/storage/server';
import { ACCOUNT_STATUS } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await requireApiAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? ACCOUNT_STATUS.PENDING_REVIEW;
    const role = searchParams.get('role') ?? 'all';

    const applications = await listPartnerApplications({ status, role });

    /*
     * Certificates get a short-lived signed URL rather than a permanent one.
     * The reviewer needs to look at the document now; nothing needs a link
     * that still works next month, and these are identity documents.
     */
    const withCertificates = await Promise.all(
      applications.map(async (application) => {
        if (!application.certificatePath) return application;
        try {
          const certificateUrl = await getSignedUrl(application.certificatePath, 10 * 60 * 1000);
          return { ...application, certificateUrl };
        } catch (error) {
          console.error('[admin/partners] signed URL failed', {
            uid: application.uid,
            error,
          });
          return { ...application, certificateUrl: null };
        }
      }),
    );

    return NextResponse.json({ applications: withCertificates });
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

    const {
      uid,
      decision,
      feedback = null,
      suspendedUntil = null,
      /* The expiry date from the certificate in front of the manager.
         Required when approving or reinstating a notary or Commissioner of
         Oaths — `decidePartnerApplication` refuses without it, because
         without a date there is nothing for the lapse check to enforce. */
      credentialExpiresAt = null,
    } = body ?? {};

    if (!uid || !Object.values(DECISION).includes(decision)) {
      return NextResponse.json(
        {
          error: 'invalid_body',
          message: `Expected { uid, decision } where decision is one of: ${Object.values(
            DECISION,
          ).join(', ')}.`,
        },
        { status: 400 },
      );
    }

    // A Website Manager deciding on their own application would be a hole in
    // the review process, however unlikely in practice.
    if (uid === admin.uid) {
      return NextResponse.json(
        { error: 'self_decision', message: 'You cannot decide on your own account.' },
        { status: 403 },
      );
    }

    try {
      const result = await decidePartnerApplication({
        uid,
        decision,
        feedback,
        suspendedUntil,
        credentialExpiresAt,
        actor: { uid: admin.uid, email: admin.email },
      });
      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      if (error instanceof DecisionError) {
        /* 422 for anything the manager can put right on the form — a missing
           reason, a missing or bad expiry date, an applicant who has not
           finished identity verification. 400 is for a malformed request,
           which is a different thing and should not be reported as though the
           manager typed something wrong. */
        const RECOVERABLE = new Set([
          'feedback_required',
          'credential_expiry_required',
          'kyc_incomplete',
        ]);

        const status =
          error.code === 'not_found' ? 404 : RECOVERABLE.has(error.code) ? 422 : 400;

        return NextResponse.json({ error: error.code, message: error.message }, { status });
      }
      throw error;
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}
