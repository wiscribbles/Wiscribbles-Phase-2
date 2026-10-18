/**
 * Start an identity check.
 *
 * Creates a provider session and hands back a hosted URL. The reference we
 * send is `kyc_<uid>_<timestamp>`, which comes back on every webhook and is
 * how a result is tied to an account — never a value the browser supplies.
 *
 * Identity documents and selfies are captured on the provider's origin and
 * never reach our servers, which is a meaningfully smaller surface to defend.
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApiUser } from '@/lib/auth/server';
import { getKycProvider, KYC_STATUS, RESTARTABLE_KYC_STATUSES, KycError } from '@/lib/kyc';
import { getBaseUrl } from '@/lib/apiUtils';
import { isPartnerRole } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await requireApiUser();

    if (!isPartnerRole(user.role)) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Identity verification is for partner accounts.' },
        { status: 403 },
      );
    }

    const snapshot = await adminDb().collection('users').doc(user.uid).get();
    const profile = snapshot.exists ? snapshot.data() : {};
    const currentStatus = profile.kycStatus ?? KYC_STATUS.NOT_STARTED;

    // Don't let a partner restart a check that is already passed or in flight.
    // Each attempt costs money and a duplicate in-flight session confuses the
    // webhook reconciliation.
    if (!RESTARTABLE_KYC_STATUSES.includes(currentStatus)) {
      return NextResponse.json(
        {
          error: 'already_started',
          status: currentStatus,
          message:
            currentStatus === KYC_STATUS.APPROVED
              ? 'Your identity has already been verified.'
              : 'A verification is already in progress.',
        },
        { status: 409 },
      );
    }

    const provider = getKycProvider();
    const reference = `kyc_${user.uid}_${Date.now()}_${randomUUID().slice(0, 8)}`;

    let session;
    try {
      session = await provider.createSession({
        reference,
        userId: user.uid,
        email: user.email,
        fullName: profile.name ?? user.name ?? null,
        returnUrl: `${getBaseUrl()}/en/onboarding/verification?kyc=returned`,
      });
    } catch (error) {
      if (error instanceof KycError) {
        console.error('[kyc/start] provider error', { code: error.code, uid: user.uid });
        return NextResponse.json(
          {
            error: error.code,
            message:
              error.code === 'not_configured'
                ? 'Identity verification is not configured yet. Please try again later.'
                : 'We could not start the identity check. Please try again shortly.',
          },
          { status: 502 },
        );
      }
      throw error;
    }

    const now = new Date().toISOString();

    await adminDb()
      .collection('users')
      .doc(user.uid)
      .set(
        {
          kycStatus: KYC_STATUS.PENDING,
          kycProvider: provider.id,
          kycReference: reference,
          kycSessionId: session.providerRef,
          kycStartedAt: now,
          kycVerifiedAt: null,
          updatedAt: now,
        },
        { merge: true },
      );

    return NextResponse.json({ url: session.url, status: KYC_STATUS.PENDING });
  } catch (error) {
    return authErrorResponse(error);
  }
}
