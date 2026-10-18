/**
 * Email verification state.
 *
 *   GET  → report whether the address is confirmed, and promote the account's
 *          status the first time it is.
 *   POST → send a fresh verification link.
 *
 * Firebase flips `emailVerified` on the auth record when the user follows the
 * link; nothing tells our Firestore profile about it. This route is where that
 * transition is reconciled, server-side. The promotion is what opens dashboard
 * routes, so it must never be driven by anything the client asserts — we read
 * the auth record ourselves and ignore the request body entirely.
 */

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { setUserClaims } from '@/lib/auth/claims';
import { AuthError, authErrorResponse, requireApiUser } from '@/lib/auth/server';
import { sendEmail, verificationEmail, partnerSubmittedEmail } from '@/lib/email/send';
import {
  ACCOUNT_STATUS,
  ROLE_LABELS,
  isPartnerRole,
  statusAfterEmailVerification,
} from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Minimum gap between verification emails, to stop the endpoint being a mail cannon. */
const RESEND_COOLDOWN_MS = 60 * 1000;

export async function GET() {
  try {
    // `verified: false` — this is the one authenticated route an unverified
    // user must be able to reach.
    const user = await requireApiUser({ verified: false });
    const record = await adminAuth().getUser(user.uid);

    if (!record.emailVerified) {
      return NextResponse.json({ emailVerified: false, status: user.status });
    }

    // Already promoted on a previous call.
    if (user.status !== ACCOUNT_STATUS.EMAIL_UNVERIFIED) {
      return NextResponse.json({ emailVerified: true, status: user.status });
    }

    const nextStatus = statusAfterEmailVerification(user.role);
    const now = new Date().toISOString();

    await adminDb()
      .collection('users')
      .doc(user.uid)
      .set(
        {
          emailVerifiedAt: now,
          submittedForReviewAt: isPartnerRole(user.role) ? now : null,
          updatedAt: now,
        },
        { merge: true },
      );

    await setUserClaims(user.uid, { role: user.role, status: nextStatus });

    if (isPartnerRole(user.role)) {
      await sendEmail({
        to: user.email,
        ...partnerSubmittedEmail({
          name: user.name ?? 'there',
          roleLabel: ROLE_LABELS[user.role],
        }),
      });
    }

    return NextResponse.json({
      emailVerified: true,
      status: nextStatus,
      promoted: true,
      // The token the browser holds still carries the old claims, so it must
      // refresh before the new routes will open to it.
      refreshToken: true,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireApiUser({ verified: false });
    const record = await adminAuth().getUser(user.uid);

    if (record.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const profileSnapshot = await adminDb().collection('users').doc(user.uid).get();
    const lastSentAt = profileSnapshot.data()?.verificationEmailSentAt;

    if (lastSentAt && Date.now() - new Date(lastSentAt).getTime() < RESEND_COOLDOWN_MS) {
      throw new AuthError(
        429,
        'too_many_requests',
        'Please wait a minute before requesting another email.',
      );
    }

    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? '';
    const link = await adminAuth().generateEmailVerificationLink(user.email, {
      url: `${origin}/en/auth/verify-email?completed=1`,
    });

    const result = await sendEmail({
      to: user.email,
      ...verificationEmail({ name: user.name ?? 'there', link }),
    });

    if (!result.ok) {
      return NextResponse.json({ error: 'email_failed' }, { status: 502 });
    }

    await adminDb()
      .collection('users')
      .doc(user.uid)
      .set({ verificationEmailSentAt: new Date().toISOString() }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
