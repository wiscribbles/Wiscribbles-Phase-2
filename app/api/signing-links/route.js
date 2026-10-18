/**
 * Shareable signing links.
 *
 *   GET    → this account's links (never the tokens — only hashes are stored)
 *   POST   → mint one. The URL comes back ONCE and cannot be retrieved again.
 *   DELETE → revoke  (?id=…)
 *
 * The reasoning behind storing only the digest is in `lib/signingLinks.js`. The
 * consequence for this route is that there is no endpoint that returns an
 * existing link's URL, and there deliberately never will be: if the creator
 * loses it, they revoke and mint a new one.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApprovedPartner } from '@/lib/auth/server';
import { ROLES } from '@/lib/roles';
import {
  DEFAULT_TTL_DAYS,
  LINK_PURPOSE_OPTIONS,
  LINK_STATUS,
  MAX_TTL_DAYS,
  SIGNING_LINKS_COLLECTION,
  buildLinkUrl,
  expiryFrom,
  mintToken,
  redactLink,
  validateLinkRequest,
} from '@/lib/signingLinks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUBSCRIBERS = [ROLES.ATTORNEY, ROLES.BUSINESS];

/** Max live links per account, so a compromised session cannot mint hundreds. */
const ACTIVE_LINK_CAP = 50;

export async function GET() {
  try {
    const user = await requireApprovedPartner(SUBSCRIBERS);

    const [linkSnapshot, documentSnapshot] = await Promise.all([
      adminDb()
        .collection(SIGNING_LINKS_COLLECTION)
        .where('createdBy', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get(),
      // The documents a link can be made for. Only this account's own.
      adminDb()
        .collection('documents')
        .where('ownerId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get(),
    ]);

    const now = Date.now();

    return NextResponse.json({
      links: linkSnapshot.docs.map((doc) => redactLink(doc.id, doc.data(), now)),
      documents: documentSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name ?? doc.data().fileName ?? 'Untitled document',
        status: doc.data().status ?? null,
      })),
      options: {
        purposes: LINK_PURPOSE_OPTIONS,
        defaultTtlDays: DEFAULT_TTL_DAYS,
        maxTtlDays: MAX_TTL_DAYS,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireApprovedPartner(SUBSCRIBERS);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const candidate = {
      documentId: String(body?.documentId ?? '').trim(),
      purpose: String(body?.purpose ?? ''),
      ttlDays: body?.ttlDays ?? DEFAULT_TTL_DAYS,
      maxUses:
        body?.maxUses === '' || body?.maxUses === null || body?.maxUses === undefined
          ? null
          : Number(body.maxUses),
      label: String(body?.label ?? '').trim() || null,
    };

    const { valid, errors } = validateLinkRequest(candidate);
    if (!valid) {
      return NextResponse.json({ error: 'validation_failed', errors }, { status: 422 });
    }

    /* The document must exist and belong to this account. Without this check a
       valid session could mint a signing link for someone else's document,
       which is the worst thing this route could possibly do. */
    const documentSnapshot = await adminDb()
      .collection('documents')
      .doc(candidate.documentId)
      .get();

    if (!documentSnapshot.exists || documentSnapshot.data().ownerId !== user.uid) {
      return NextResponse.json(
        { error: 'validation_failed', errors: { documentId: 'That document was not found.' } },
        { status: 422 },
      );
    }

    const liveCount = await adminDb()
      .collection(SIGNING_LINKS_COLLECTION)
      .where('createdBy', '==', user.uid)
      .where('status', '==', LINK_STATUS.ACTIVE)
      .limit(ACTIVE_LINK_CAP + 1)
      .get();

    if (liveCount.size > ACTIVE_LINK_CAP) {
      return NextResponse.json(
        {
          error: 'too_many_links',
          message:
            `You have ${ACTIVE_LINK_CAP} live links. Revoke some before creating more.`,
        },
        { status: 429 },
      );
    }

    const { token, tokenHash } = mintToken();
    const now = new Date().toISOString();

    const created = await adminDb()
      .collection(SIGNING_LINKS_COLLECTION)
      .add({
        tokenHash,
        documentId: candidate.documentId,
        documentName:
          documentSnapshot.data().name ?? documentSnapshot.data().fileName ?? null,
        purpose: candidate.purpose,
        label: candidate.label,
        maxUses: candidate.maxUses,
        useCount: 0,
        status: LINK_STATUS.ACTIVE,
        expiresAt: expiryFrom(candidate.ttlDays),
        createdBy: user.uid,
        createdByEmail: user.email,
        createdAt: now,
        updatedAt: now,
      });

    await adminDb()
      .collection('auditLog')
      .add({
        type: 'signing_link_created',
        linkId: created.id,
        documentId: candidate.documentId,
        purpose: candidate.purpose,
        expiresAt: expiryFrom(candidate.ttlDays),
        actorUid: user.uid,
        actorEmail: user.email,
        at: now,
      })
      .catch((error) => console.error('[signing-links] audit write failed', error));

    /* The one and only time the token leaves the server. `request.nextUrl`
       rather than a configured base URL so the link works in development,
       preview and production without a third place to keep in sync. */
    const origin = request.nextUrl?.origin ?? new URL(request.url).origin;
    const locale = String(body?.locale ?? 'en');

    return NextResponse.json({
      ok: true,
      id: created.id,
      url: buildLinkUrl({ origin, locale, token }),
      expiresAt: expiryFrom(candidate.ttlDays),
      warning:
        'This is the only time this link will be shown. It is not stored in a ' +
        'readable form, so it cannot be recovered — copy it now. Anyone who ' +
        'has the link can use it until it expires or you revoke it.',
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    const user = await requireApprovedPartner(SUBSCRIBERS);

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    const ref = adminDb().collection(SIGNING_LINKS_COLLECTION).doc(id);
    const snapshot = await ref.get();

    if (!snapshot.exists || snapshot.data().createdBy !== user.uid) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    await ref.set(
      { status: LINK_STATUS.REVOKED, revokedAt: now, updatedAt: now },
      { merge: true },
    );

    await adminDb()
      .collection('auditLog')
      .add({
        type: 'signing_link_revoked',
        linkId: id,
        actorUid: user.uid,
        actorEmail: user.email,
        at: now,
      })
      .catch((error) => console.error('[signing-links] audit write failed', error));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
