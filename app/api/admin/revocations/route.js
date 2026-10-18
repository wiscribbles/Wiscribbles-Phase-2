/**
 * Revocation requests — the Website Manager's decision.
 *
 *   GET  ?status=                        → the queue, oldest first
 *   POST { id, decision, note }          → grant or refuse
 *
 * Granting calls `revokeDocument` from `lib/admin/documents.js` rather than
 * writing the revocation itself. That is the point: there is ONE path to a
 * revoked document, with one set of refusals (not executed, already revoked),
 * one party-readable record and one audit entry. A second path that happened to
 * do the same things would drift from the first the moment either changed.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApiAdmin } from '@/lib/auth/server';
import { RepositoryError, revokeDocument } from '@/lib/admin/documents';
import { RR_STATUS, RR_STATUS_LABELS, listForAdmin } from '@/lib/revocationRequests';
import { getBaseUrl } from '@/lib/apiUtils';
import {
  revocationGrantedEmail,
  revocationRefusedEmail,
  sendEmail,
} from '@/lib/email/send';

/**
 * Email the outcome.
 *
 * A grant goes to EVERY party — somebody may be acting on the document right
 * now and needs to stop. A refusal goes only to the person who asked: the
 * other parties were told a request existed, and telling them it failed adds
 * nothing while reopening a matter they may consider closed.
 *
 * Best-effort. A mail failure must never leave a document revoked in the
 * database but not revoked as far as the code is concerned, so this runs after
 * the decision is written and only logs.
 */
async function notifyOutcome({ decision, requestRecord, note }) {
  const link = `${getBaseUrl()}/en/authenticate`;
  const documentName = requestRecord.documentName ?? 'a document';

  const addressFor = async (uid) => {
    try {
      const snapshot = await adminDb().collection('users').doc(uid).get();
      if (!snapshot.exists) return null;
      const data = snapshot.data();
      return data.email ? { email: data.email, name: data.name ?? 'there' } : null;
    } catch {
      return null;
    }
  };

  if (decision === 'refuse') {
    const recipient =
      requestRecord.requestedByEmail
        ? { email: requestRecord.requestedByEmail, name: 'there' }
        : await addressFor(requestRecord.requestedByUid);

    if (recipient) {
      await sendEmail({
        to: recipient.email,
        ...revocationRefusedEmail({
          name: recipient.name,
          documentName,
          reason: note,
          link: `${getBaseUrl()}/en/dashboard`,
        }),
      }).catch((error) => console.error('[admin/revocations] refusal email failed', error));
    }
    return;
  }

  const parties = Array.isArray(requestRecord.partyIds) ? requestRecord.partyIds : [];
  const recipients = (await Promise.all(parties.map(addressFor))).filter(Boolean);

  await Promise.all(
    recipients.map((recipient) =>
      sendEmail({
        to: recipient.email,
        ...revocationGrantedEmail({
          name: recipient.name,
          documentName,
          reference: requestRecord.documentReference ?? null,
          reason: note,
          link,
        }),
      }).catch((error) =>
        console.error('[admin/revocations] COULD NOT TELL A PARTY A DOCUMENT WAS REVOKED', {
          documentId: requestRecord.documentId,
          error,
        }),
      ),
    ),
  );
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DECISIONS = ['grant', 'refuse', 'review'];

export async function GET(request) {
  try {
    await requireApiAdmin();
    const status = new URL(request.url).searchParams.get('status');

    return NextResponse.json({
      requests: await listForAdmin({ status: status || null }),
      statuses: Object.values(RR_STATUS).map((value) => ({
        value,
        label: RR_STATUS_LABELS[value],
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const admin = await requireApiAdmin();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const id = String(body?.id ?? '');
    const decision = String(body?.decision ?? '');
    const note = String(body?.note ?? '').trim();

    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    if (!DECISIONS.includes(decision)) {
      return NextResponse.json({ error: 'invalid_decision' }, { status: 400 });
    }

    const ref = adminDb().collection('revocationRequests').doc(id);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const requestRecord = snapshot.data();

    if (![RR_STATUS.SUBMITTED, RR_STATUS.UNDER_REVIEW].includes(requestRecord.status)) {
      return NextResponse.json(
        { error: 'already_decided', message: 'That request has already been decided.' },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();

    /* Picking it up for review. No decision, just a signal to the parties that
       someone is looking — which is worth having, because the alternative is
       silence while a document's validity is in question. */
    if (decision === 'review') {
      await ref.set({ status: RR_STATUS.UNDER_REVIEW, updatedAt: now }, { merge: true });
      return NextResponse.json({ ok: true, status: RR_STATUS.UNDER_REVIEW });
    }

    /* A refusal needs a reason as much as a grant does. The party asked for
       something and is entitled to know why the answer is no. */
    if (!note) {
      return NextResponse.json(
        {
          error: 'note_required',
          message:
            decision === 'grant'
              ? 'Set out the reason. It is recorded on the revocation and shown to the parties.'
              : 'Say why the request is refused. The party who asked sees this.',
        },
        { status: 422 },
      );
    }

    if (decision === 'refuse') {
      await ref.set(
        {
          status: RR_STATUS.REFUSED,
          decisionNote: note.slice(0, 2000),
          decidedBy: { uid: admin.uid, email: admin.email },
          decidedAt: now,
          updatedAt: now,
        },
        { merge: true },
      );

      await adminDb()
        .collection('auditLog')
        .add({
          type: 'revocation_request_refused',
          documentId: requestRecord.documentId ?? null,
          revocationRequestId: id,
          note,
          actorUid: admin.uid,
          actorEmail: admin.email,
          at: now,
        })
        .catch(() => {});

      await notifyOutcome({ decision: 'refuse', requestRecord, note });

      return NextResponse.json({ ok: true, status: RR_STATUS.REFUSED });
    }

    /* ---- grant ---------------------------------------------------------- */
    try {
      await revokeDocument({
        documentId: requestRecord.documentId,
        ground: requestRecord.ground,
        // The manager's reason, not the requester's. The decision has to stand
        // on the reasoning of whoever made it.
        note,
        actor: { uid: admin.uid, email: admin.email, role: 'admin' },
      });
    } catch (error) {
      if (error instanceof RepositoryError) {
        /* The document may have been revoked by another route, or may never
           have been executed. Say which, and leave the request open rather
           than marking it granted when nothing was revoked. */
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: error.status },
        );
      }
      throw error;
    }

    await ref.set(
      {
        status: RR_STATUS.GRANTED,
        decisionNote: note.slice(0, 2000),
        decidedBy: { uid: admin.uid, email: admin.email },
        decidedAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

    await notifyOutcome({ decision: 'grant', requestRecord, note });

    return NextResponse.json({ ok: true, status: RR_STATUS.GRANTED });
  } catch (error) {
    return authErrorResponse(error);
  }
}
