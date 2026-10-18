/**
 * Execute the document — the professional places their seal.
 *
 *   POST { sessionId, confirmations: { identity, willing, jurisdiction } }
 *
 * This is the act the whole platform exists to perform, so it is the most
 * carefully gated thing here.
 *
 * WHY THE CONFIRMATIONS ARE REQUIRED AND RECORDED
 *
 * A notary's duty is to satisfy themselves about who is in front of them and
 * that they are acting willingly. The platform cannot do that for them, and a
 * passed KYC check does not discharge it. What the platform CAN do is make the
 * professional state that they have done it, and record the statement — so the
 * act has a contemporaneous record of the professional's own attestation rather
 * than only a timestamp.
 *
 * WHY IT RUNS THE LOCKOUT AGAIN
 *
 * This is the fourth time: at the request, at the accept, at session creation,
 * and here. Three of those are now in the past. A professional suspended or
 * amended mid-session must not be able to complete the act, and this is the
 * only check that happens at the moment the seal is applied.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApprovedPartner } from '@/lib/auth/server';
import { ROLES } from '@/lib/roles';
import { checkJurisdictionLockout } from '@/lib/jurisdictions';
import { QUEUE_COLLECTION, QUEUE_STATUS } from '@/lib/queue';
import {
  SESSIONS_COLLECTION,
  SESSION_STATUS,
  SessionError,
  assertParticipant,
  isConductingProfessional,
} from '@/lib/sessions';
import { StampError, applySeal } from '@/lib/stamp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Each must be explicitly true. A missing one is not an implied yes. */
const REQUIRED_CONFIRMATIONS = Object.freeze({
  identity:
    'Confirm that you have satisfied yourself as to the identity of the ' +
    'person signing.',
  willing:
    'Confirm that the person signed in your presence, by video, and appeared ' +
    'to do so willingly and with understanding.',
  jurisdiction:
    'Confirm that you are authorised to act in the jurisdiction named.',
});

export async function POST(request) {
  try {
    const professional = await requireApprovedPartner([ROLES.NOTARY, ROLES.COATH]);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const sessionId = String(body?.sessionId ?? '').trim();
    const confirmations = body?.confirmations ?? {};

    const missing = Object.keys(REQUIRED_CONFIRMATIONS).filter(
      (key) => confirmations[key] !== true,
    );

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: 'confirmations_required',
          missing,
          message: REQUIRED_CONFIRMATIONS[missing[0]],
        },
        { status: 422 },
      );
    }

    try {
      const session = await assertParticipant(sessionId, professional);

      if (!isConductingProfessional(session, professional)) {
        throw new SessionError(
          'not_the_professional',
          'Only the professional conducting this session can execute the document.',
          403,
        );
      }

      if (session.status === SESSION_STATUS.EXECUTED) {
        throw new SessionError(
          'already_executed',
          'This document has already been executed.',
        );
      }

      if (session.status === SESSION_STATUS.ABANDONED) {
        throw new SessionError('session_closed', 'That session has ended.');
      }

      /* The lockout, for the last time and at the moment that counts. */
      const lockout = checkJurisdictionLockout({
        documentJurisdiction: session.jurisdiction,
        professionalJurisdictions: professional.jurisdictions ?? [],
        documentCategory: session.documentCategory ?? null,
      });

      if (!lockout.allowed) {
        await adminDb()
          .collection('auditLog')
          .add({
            type: 'execution_refused',
            sessionId,
            documentId: session.documentId ?? null,
            reason: lockout.message,
            actorUid: professional.uid,
            actorEmail: professional.email,
            actorRole: professional.role,
            at: new Date().toISOString(),
          })
          .catch(() => {});

        throw new SessionError('jurisdiction_lockout', lockout.message, 403);
      }

      if (!session.documentId) {
        throw new SessionError('no_document', 'This session has no document attached.');
      }

      const documentRef = adminDb().collection('documents').doc(session.documentId);
      const documentSnapshot = await documentRef.get();

      if (!documentSnapshot.exists) {
        throw new SessionError('no_document', 'The document could not be found.', 404);
      }

      const record = { id: session.documentId, ...documentSnapshot.data() };

      if (record.status === 'revoked') {
        throw new SessionError(
          'revoked',
          'This document has been revoked and cannot be executed.',
        );
      }

      const executedAt = new Date().toISOString();

      /* The seal. Reads the source PDF from Storage by path — the path on the
         document record, not one supplied in the request. */
      const sealed = await applySeal({
        storagePath: record.storagePath,
        professional,
        session,
        document: record,
        executedAt,
      });

      /* Written as a batch so a document cannot end up sealed-but-not-marked,
         which would leave the client watching a session that never finishes
         and an executed instrument nobody knows about. */
      const batch = adminDb().batch();

      batch.set(
        documentRef,
        {
          status: 'notarised',
          stampedPath: sealed.path,
          pageCount: sealed.pageCount,
          executedAt,
          executedBy: {
            uid: professional.uid,
            name: professional.name ?? null,
            role: professional.role,
          },
          // The professional's own attestation, kept with the document.
          executionConfirmations: {
            identity: true,
            willing: true,
            jurisdiction: true,
            at: executedAt,
          },
          updatedAt: executedAt,
        },
        { merge: true },
      );

      batch.set(
        adminDb().collection(SESSIONS_COLLECTION).doc(sessionId),
        { status: SESSION_STATUS.EXECUTED, executedAt, updatedAt: executedAt },
        { merge: true },
      );

      if (session.queueEntryId) {
        batch.set(
          adminDb().collection(QUEUE_COLLECTION).doc(session.queueEntryId),
          { status: QUEUE_STATUS.COMPLETED, completedAt: executedAt, updatedAt: executedAt },
          { merge: true },
        );
      }

      await batch.commit();

      await adminDb()
        .collection('auditLog')
        .add({
          type: 'document_executed',
          sessionId,
          documentId: session.documentId,
          entryId: session.queueEntryId ?? null,
          jurisdiction: session.jurisdiction ?? null,
          templateId: session.templateId ?? null,
          actorUid: professional.uid,
          actorEmail: professional.email,
          actorRole: professional.role,
          confirmations: ['identity', 'willing', 'jurisdiction'],
          jurisdictionCheck: {
            documentJurisdiction: session.jurisdiction ?? null,
            professionalJurisdictions: professional.jurisdictions ?? [],
            result: 'allowed',
          },
          at: executedAt,
        })
        .catch((error) => console.error('[sessions/execute] AUDIT WRITE FAILED', error));

      return NextResponse.json({ ok: true, executedAt, pageCount: sealed.pageCount });
    } catch (error) {
      if (error instanceof SessionError) {
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: error.status },
        );
      }
      if (error instanceof StampError) {
        return NextResponse.json(
          {
            error: error.code,
            message: error.message,
            // Nothing was written: the batch runs only after a successful seal.
            // Say so, or the professional will not know whether to try again.
            detail: 'Nothing has been recorded. You can try again.',
          },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}
