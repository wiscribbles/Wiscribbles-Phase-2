/**
 * Identity verification webhook.
 *
 * This is the endpoint that decides whether someone is verified, so it is the
 * one worth being careful about. It is PUBLIC — no session, no cookie — and
 * the only thing standing between it and an attacker marking themselves
 * verified is the signature check.
 *
 * Four properties it has to hold:
 *
 *   1. RAW BODY. The signature covers the exact bytes. `request.text()` is
 *      read first and parsed only after verification, because parsing and
 *      re-encoding changes byte order and breaks the comparison.
 *   2. NEVER TRUST THE BODY FIRST. Nothing is read out of the payload until
 *      the signature has passed.
 *   3. IDEMPOTENT. Didit retries, and the same event can arrive repeatedly.
 *      `event_id` is recorded and replays are discarded.
 *   4. ALWAYS 200 ON A VERIFIED EVENT. A 500 triggers more retries. Genuine
 *      processing failures are logged and acknowledged; only an unverifiable
 *      request gets a 4xx.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getKycProvider, KYC_STATUS } from '@/lib/kyc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  // 1. Raw bytes, before anything else touches them.
  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'unreadable_body' }, { status: 400 });
  }

  // 2. Verify before reading.
  let result;
  try {
    result = await getKycProvider().verifyWebhook({ rawBody, headers: request.headers });
  } catch (error) {
    console.error('[kyc/webhook] verification threw', error);
    return NextResponse.json({ error: 'verification_error' }, { status: 500 });
  }

  if (!result.verified) {
    // Deliberately terse. An attacker probing this endpoint learns nothing
    // about which part of their forgery failed.
    console.warn('[kyc/webhook] rejected', { reason: result.declineReason });
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  const { reference, status, providerRef, eventId, declineReason } = result;

  if (!reference) {
    console.error('[kyc/webhook] verified event carried no reference', { providerRef });
    return NextResponse.json({ ok: true, ignored: 'no_reference' });
  }

  // 3. Idempotency. Recorded before the work, so a retry arriving while the
  // first is still in flight is also caught.
  if (eventId) {
    const eventRef = adminDb().collection('kycEvents').doc(eventId);
    const seen = await eventRef.get();
    if (seen.exists) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    await eventRef.set({
      reference,
      status,
      providerRef: providerRef ?? null,
      receivedAt: new Date().toISOString(),
    });
  }

  try {
    // The reference is ours, built as kyc_<uid>_<ts>_<rand>, so the uid is the
    // second segment. Matching on the stored kycReference as well means a
    // forged-but-somehow-signed reference cannot touch a different account.
    const uid = String(reference).split('_')[1];
    if (!uid) {
      return NextResponse.json({ ok: true, ignored: 'unparseable_reference' });
    }

    const userRef = adminDb().collection('users').doc(uid);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      console.error('[kyc/webhook] no such user', { uid });
      return NextResponse.json({ ok: true, ignored: 'unknown_user' });
    }

    if (snapshot.data().kycReference !== reference) {
      console.error('[kyc/webhook] reference does not match the stored one', { uid });
      return NextResponse.json({ ok: true, ignored: 'stale_reference' });
    }

    const now = new Date().toISOString();

    await userRef.set(
      {
        kycStatus: status,
        kycSessionId: providerRef ?? snapshot.data().kycSessionId ?? null,
        kycVerifiedAt: status === KYC_STATUS.APPROVED ? now : null,
        kycDeclineReason: declineReason ?? null,
        kycUpdatedAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

    // Admin-visible trail. A verification outcome is evidence, and the user
    // document only holds the latest state.
    await adminDb()
      .collection('auditLog')
      .add({
        type: 'kyc_status_changed',
        targetUid: uid,
        status,
        provider: getKycProvider().id,
        providerRef: providerRef ?? null,
        at: now,
      })
      .catch((error) => console.error('[kyc/webhook] audit write failed', error));

    return NextResponse.json({ ok: true });
  } catch (error) {
    // 4. Acknowledge. The event is recorded; retrying will not help, and a 500
    // would make Didit retry a failure that is ours, not theirs.
    console.error('[kyc/webhook] processing failed after verification', error);
    return NextResponse.json({ ok: true, processingError: true });
  }
}
