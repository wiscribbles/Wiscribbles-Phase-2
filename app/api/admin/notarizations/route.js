/**
 * Legacy notarisation submissions — Website Manager only.
 *
 *   PATCH { submissionId, status } → move one job to a new workflow status
 *
 * Reading is still done from the browser: `firestore.rules` allows an admin to
 * read `formSubmissions`, and the listing is a plain query with no decision in
 * it. Writing is here, because the rules deny every client write to that
 * collection and should go on doing so.
 *
 * The status allow-list, the explicit field list and the audit entry are in
 * `lib/admin/submissions.js`, with the reasoning for each.
 */

import { NextResponse } from 'next/server';
import { authErrorResponse, requireApiAdmin } from '@/lib/auth/server';
import {
  SUBMISSION_STATUS_LABELS,
  SubmissionError,
  updateSubmissionStatus,
} from '@/lib/admin/submissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireApiAdmin();
    /* The labels, so the screen and the server agree on what each status is
       called. The submissions themselves are read client-side. */
    return NextResponse.json({ statuses: SUBMISSION_STATUS_LABELS });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const actor = await requireApiAdmin();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const result = await updateSubmissionStatus({
      submissionId: body?.submissionId,
      status: body?.status,
      actor,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof SubmissionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status },
      );
    }
    return authErrorResponse(error);
  }
}
