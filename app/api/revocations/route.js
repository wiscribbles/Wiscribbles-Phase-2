/**
 * Client-initiated revocation requests.
 *
 *   GET            → the versioned notice, the fee, the grounds, and this
 *                     user's requests (as requester or as another party)
 *   POST           → make one
 *   PATCH { id }   → withdraw your own
 *
 * The decision is NOT here. Granting a revocation goes through
 * `/api/admin/revocations`, which uses the same `revokeDocument` path as any
 * manager-initiated revocation — one audited route to a revoked document. The
 * reasoning for not letting a party revoke unilaterally is at the top of
 * `lib/revocationRequests.js`.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApiUser } from '@/lib/auth/server';
import {
  RR_NOTICE,
  RR_STATUS,
  RevocationRequestError,
  createRequest,
  listForParty,
  revocationGrounds,
  revocationRequestFee,
} from '@/lib/revocationRequests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireApiUser();

    return NextResponse.json({
      requests: await listForParty(user.uid),
      options: {
        notice: RR_NOTICE,
        fee: revocationRequestFee(),
        grounds: revocationGrounds(),
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireApiUser();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    try {
      const result = await createRequest({
        documentId: String(body?.documentId ?? ''),
        ground: String(body?.ground ?? ''),
        reason: body?.reason ?? '',
        noticeVersion: String(body?.noticeVersion ?? ''),
        requester: user,
      });

      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      if (error instanceof RevocationRequestError) {
        return NextResponse.json(
          { error: error.code, message: error.message, ...(error.field ? { field: error.field } : {}) },
          { status: error.status },
        );
      }
      throw error;
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const user = await requireApiUser();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const id = String(body?.id ?? '');
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    const ref = adminDb().collection('revocationRequests').doc(id);
    const snapshot = await ref.get();

    if (!snapshot.exists || snapshot.data().requestedByUid !== user.uid) {
      /* Only the person who asked may withdraw it. Another party objecting is a
         different thing and is said in the review, not by cancelling someone
         else's request. */
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (![RR_STATUS.SUBMITTED, RR_STATUS.UNDER_REVIEW].includes(snapshot.data().status)) {
      return NextResponse.json(
        { error: 'already_decided', message: 'That request has already been decided.' },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    await ref.set({ status: RR_STATUS.WITHDRAWN, updatedAt: now }, { merge: true });

    await adminDb()
      .collection('auditLog')
      .add({
        type: 'revocation_request_withdrawn',
        documentId: snapshot.data().documentId ?? null,
        revocationRequestId: id,
        actorUid: user.uid,
        actorEmail: user.email,
        at: now,
      })
      .catch(() => {});

    return NextResponse.json({ ok: true, status: RR_STATUS.WITHDRAWN });
  } catch (error) {
    return authErrorResponse(error);
  }
}
