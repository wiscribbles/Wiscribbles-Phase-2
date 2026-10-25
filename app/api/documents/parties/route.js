/**
 * The creator's view of who has signed, and inviting the next party.
 *
 *   GET  ?documentId=        → the party list and whose turn it is
 *   POST { documentId }      → issue a signing link to whoever is next
 *
 * Only a party to the document may look, and only the owner may invite. The
 * link comes back ONCE and is not recoverable, for the same reason as every
 * other token here: only its digest is stored.
 *
 * Reissuing rotates the digest, which kills the previous link. That is the
 * behaviour you want — a signing link forwarded to the wrong person stops
 * working the moment the right person asks for a new one.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApiUser } from '@/lib/auth/server';
import {
  SigningError,
  fullyExecuted,
  inviteNextParty,
  needsInPersonWitnessing,
  nextParty,
  remoteSigningComplete,
  shapeParties,
} from '@/lib/signing';
import { REMOTE_WITNESSING_REFUSAL } from '@/lib/jurisdictions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadAsParty(documentId, user) {
  const snapshot = await adminDb().collection('documents').doc(String(documentId)).get();

  if (!snapshot.exists) {
    throw new SigningError('not_found', 'No such document.', 404);
  }

  const data = snapshot.data();
  const parties = Array.isArray(data.parties) ? data.parties : [];

  const permitted =
    data.ownerId === user.uid ||
    data.assignedProfessionalId === user.uid ||
    parties.some((p) => p.uid === user.uid) ||
    parties.some((p) => p.email && p.email === String(user.email ?? '').toLowerCase());

  if (!permitted) {
    throw new SigningError('not_found', 'No such document.', 404);
  }

  return { data, parties, isOwner: data.ownerId === user.uid };
}

export async function GET(request) {
  try {
    const user = await requireApiUser();
    const documentId = new URL(request.url).searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    }

    try {
      const { data, parties, isOwner } = await loadAsParty(documentId, user);
      const turn = nextParty(parties);

      return NextResponse.json({
        documentId,
        documentName: data.name ?? null,
        status: data.status ?? null,
        isOwner,
        parties: shapeParties(parties),
        nextParty: turn ? { order: turn.order, name: turn.name, email: turn.email } : null,
        remoteSigningComplete: remoteSigningComplete(parties),
        fullyExecuted: fullyExecuted(parties),
        needsInPersonWitnessing: needsInPersonWitnessing(parties),
        /* The reason, served alongside the flag so the UI never has to compose
           a legal explanation of its own. */
        witnessingNote: needsInPersonWitnessing(parties) ? REMOTE_WITNESSING_REFUSAL : null,
      });
    } catch (error) {
      if (error instanceof SigningError) {
        return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
      }
      throw error;
    }
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

    const documentId = String(body?.documentId ?? '');
    if (!documentId) {
      return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    }

    try {
      const { isOwner } = await loadAsParty(documentId, user);

      if (!isOwner) {
        return NextResponse.json(
          {
            error: 'not_owner',
            message: 'Only the person who created the document can send signing links.',
          },
          { status: 403 },
        );
      }

      const { token, party, expiresAt } = await inviteNextParty({ documentId });

      const origin = request.nextUrl?.origin ?? new URL(request.url).origin;
      const locale = String(body?.locale ?? 'en');

      await adminDb()
        .collection('auditLog')
        .add({
          type: 'signing_invitation_issued',
          documentId,
          partyOrder: party.order,
          actorUid: user.uid,
          actorEmail: user.email,
          at: new Date().toISOString(),
        })
        .catch(() => {});

      return NextResponse.json({
        ok: true,
        party: { order: party.order, name: party.name, email: party.email },
        url: `${origin}/${locale}/sign/party/${token}?d=${encodeURIComponent(documentId)}`,
        expiresAt,
        warning:
          'This link is shown once and is not stored in a readable form, so it ' +
          'cannot be recovered — send it now. Issuing a new link for the same ' +
          'party invalidates this one.',
      });
    } catch (error) {
      if (error instanceof SigningError) {
        return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
      }
      throw error;
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}
