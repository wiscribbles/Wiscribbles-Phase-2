/**
 * Accept Client / Decline Request.
 *
 *   POST { entryId, action: 'accept' | 'decline', reason? }
 *
 * Both run as Firestore transactions (`lib/queue.js`). Accepting runs the
 * jurisdiction lockout one final time, inside the transaction, immediately
 * before the work is handed over — that is the check the brief requires, and
 * the only moment at which it is certainly still true.
 *
 * Every accept and every decline is written to the audit log. A notarisation
 * that is later challenged will turn on who was present and what they were
 * told at the time, and a queue decision with no record of it is not evidence
 * of anything.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApprovedPartner } from '@/lib/auth/server';
import { ROLES } from '@/lib/roles';
import { AVAILABILITY_COLLECTION, isLive } from '@/lib/availability';
import { QueueError, claimEntry, declineEntry, detailForAssignee } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTIONS = ['accept', 'decline'];

async function audit(entry) {
  try {
    await adminDb().collection('auditLog').add(entry);
  } catch (error) {
    // Never fail the professional's action because the log write failed, but
    // do make the gap loud: a missing audit entry is a hole in the record.
    console.error('[partner/queue/claim] AUDIT WRITE FAILED', entry, error);
  }
}

export async function POST(request) {
  try {
    const user = await requireApprovedPartner([ROLES.NOTARY, ROLES.COATH]);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const entryId = String(body?.entryId ?? '').trim();
    const action = String(body?.action ?? '');

    if (!entryId) {
      return NextResponse.json({ error: 'missing_entry' }, { status: 400 });
    }
    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
    }

    const now = new Date().toISOString();

    /* Accepting work while offline makes no sense, and would leave a client
       assigned to someone whose browser is closed. Declining is allowed either
       way — a professional going offline should be able to clear their list. */
    if (action === 'accept') {
      const snapshot = await adminDb()
        .collection(AVAILABILITY_COLLECTION)
        .doc(user.uid)
        .get();

      if (!isLive(snapshot.exists ? snapshot.data() : null)) {
        return NextResponse.json(
          {
            error: 'not_live',
            message: 'Go live before accepting a client.',
          },
          { status: 409 },
        );
      }
    }

    try {
      if (action === 'decline') {
        await declineEntry({ entryId, professional: user, reason: body?.reason ?? null });

        await audit({
          type: 'queue_declined',
          entryId,
          actorUid: user.uid,
          actorEmail: user.email,
          actorRole: user.role,
          at: now,
        });

        return NextResponse.json({ ok: true, action: 'decline' });
      }

      const { entry } = await claimEntry({ entryId, professional: user });

      await audit({
        type: 'queue_accepted',
        entryId,
        jurisdiction: entry.jurisdiction ?? null,
        documentCategory: entry.documentCategory ?? null,
        templateId: entry.templateId ?? null,
        clientId: entry.clientId ?? null,
        actorUid: user.uid,
        actorEmail: user.email,
        actorRole: user.role,
        // The lockout passed. Recording that it was run, and against which
        // jurisdictions, is the point of logging this at all.
        jurisdictionCheck: {
          documentJurisdiction: entry.jurisdiction ?? null,
          professionalJurisdictions: user.jurisdictions ?? [],
          result: 'allowed',
        },
        at: now,
      });

      return NextResponse.json({
        ok: true,
        action: 'accept',
        entry: detailForAssignee(entryId, entry),
      });
    } catch (error) {
      if (error instanceof QueueError) {
        // A refused accept is worth logging too — a lockout refusal in
        // particular is the system doing its job and should be visible.
        if (error.code === 'jurisdiction_lockout') {
          await audit({
            type: 'queue_lockout_refused',
            entryId,
            actorUid: user.uid,
            actorRole: user.role,
            reason: error.message,
            at: now,
          });
        }

        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: error.status },
        );
      }
      throw error;
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}
