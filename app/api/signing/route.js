/**
 * Party signing — token-authenticated, no account required.
 *
 *   GET  ?documentId=&t=   → what this party is being asked to sign
 *   POST { documentId, t, signatureName }        → sign
 *   POST { documentId, t, decline: true, reason } → refuse
 *
 * UNAUTHENTICATED BY NECESSITY. The other side of a sale is not a WiScribbles
 * user and should not have to become one to sign. The token is the credential;
 * only its digest is stored, and the party is found BY digest so there is no
 * comparison to time.
 *
 * WHAT A TOKEN HOLDER CAN SEE is deliberately narrow: the document's name and
 * type, who else is party to it, and the document itself. Not the other
 * parties' email addresses — a signing link forwarded on should not hand a
 * stranger the contact details of everyone involved.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSignedUrl } from '@/lib/storage/server';
import {
  SigningError,
  afterSigningComplete,
  declineToSign,
  hashToken,
  nextParty,
  recordSignature,
  tokensMatch,
} from '@/lib/signing';
import { getJurisdiction } from '@/lib/jurisdictions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOWNLOAD_TTL_MS = 30 * 60 * 1000;

function signingError(error) {
  return NextResponse.json(
    {
      error: error.code,
      message: error.message,
      ...(error.field ? { field: error.field } : {}),
    },
    { status: error.status },
  );
}

/** The caller's address, for the evidential record. Never an access decision. */
function callerIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const documentId = String(searchParams.get('documentId') ?? '');
  const token = String(searchParams.get('t') ?? '');

  if (!documentId || !token) {
    return NextResponse.json({ error: 'bad_link', message: 'That signing link is not valid.' }, { status: 400 });
  }

  const snapshot = await adminDb().collection('documents').doc(documentId).get();

  if (!snapshot.exists) {
    return NextResponse.json({ error: 'bad_link', message: 'That signing link is not valid.' }, { status: 404 });
  }

  const data = snapshot.data();
  const parties = Array.isArray(data.parties) ? data.parties : [];
  const digest = hashToken(token);
  const party = parties.find((p) => p.tokenHash && tokensMatch(p.tokenHash, digest));

  if (!party) {
    /* Same response for a wrong token and a spent one. Distinguishing them
       would tell someone probing whether a document exists. */
    return NextResponse.json(
      {
        error: 'bad_link',
        message:
          'That signing link is not valid, or it has already been used. If you ' +
          'have already signed, nothing more is needed from you.',
      },
      { status: 403 },
    );
  }

  const place = getJurisdiction(data.jurisdiction);
  const turn = nextParty(parties);
  const myTurn = Boolean(turn && turn.order === party.order);

  let documentUrl = null;
  if (myTurn) {
    const path = data.stampedPath ?? data.storagePath ?? null;
    if (path) documentUrl = await getSignedUrl(path, DOWNLOAD_TTL_MS);
  }

  return NextResponse.json({
    document: {
      id: documentId,
      name: data.name ?? 'Document',
      templateName: data.templateName ?? null,
      jurisdiction: place?.name ?? data.jurisdiction ?? null,
      statute: place?.statute ?? null,
      serviceType: data.serviceType ?? null,
      status: data.status ?? null,
      ownerName: data.ownerName ?? null,
    },
    me: {
      order: party.order,
      name: party.name,
      role: party.role,
      status: party.status,
      myTurn,
    },
    /* Names and positions only. Not email addresses — a forwarded link must
       not hand a stranger everyone's contact details. */
    others: parties
      .filter((p) => p.order !== party.order)
      .sort((a, b) => a.order - b.order)
      .map((p) => ({ order: p.order, name: p.name, role: p.role, status: p.status })),
    waitingFor:
      !myTurn && turn ? { order: turn.order, name: turn.name } : null,
    documentUrl,
  });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const documentId = String(body?.documentId ?? '');
  const token = String(body?.t ?? '');

  if (!documentId || !token) {
    return NextResponse.json({ error: 'bad_link', message: 'That signing link is not valid.' }, { status: 400 });
  }

  try {
    if (body?.decline === true) {
      const result = await declineToSign({
        documentId,
        token,
        reason: body?.reason ?? null,
      });

      await adminDb()
        .collection('auditLog')
        .add({
          type: 'party_declined_to_sign',
          documentId,
          partyOrder: result.order,
          actorUid: null,
          actorEmail: 'party',
          at: new Date().toISOString(),
        })
        .catch(() => {});

      return NextResponse.json({ ok: true, declined: true });
    }

    const outcome = await recordSignature({
      documentId,
      token,
      signatureName: body?.signatureName,
      ip: callerIp(request),
    });

    await adminDb()
      .collection('auditLog')
      .add({
        type: 'party_signed',
        documentId,
        complete: outcome.complete,
        actorUid: null,
        actorEmail: 'party',
        at: new Date().toISOString(),
      })
      .catch(() => {});

    /* Outside the signing transaction: creating the queue entry runs its own
       transaction and Firestore will not nest them. */
    const after = await afterSigningComplete({ documentId, outcome });

    return NextResponse.json({
      ok: true,
      complete: outcome.complete,
      next: outcome.next ? { order: outcome.next.order, name: outcome.next.name } : null,
      needsWitnessing: outcome.needsWitnessing,
      enqueued: after.enqueued,
    });
  } catch (error) {
    if (error instanceof SigningError) return signingError(error);
    throw error;
  }
}
