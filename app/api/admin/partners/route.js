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

    const { uid, decision, feedback = null, suspendedUntil = null } = body ?? {};

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
        actor: { uid: admin.uid, email: admin.email },
      });
      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      if (error instanceof DecisionError) {
        const status =
          error.code === 'not_found' ? 404 : error.code === 'feedback_required' ? 422 : 400;
        return NextResponse.json({ error: error.code, message: error.message }, { status });
      }
      throw error;
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}
