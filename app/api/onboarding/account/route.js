/**
 * Partner onboarding — the Account tab.
 *
 *   GET   → current state of the application
 *   PATCH → save jurisdictions and the certificate reference
 *
 * Brief: "Form must capture Jurisdiction(s) of Practice and trigger the
 * selected Identity Verification flow." Certificate upload goes through
 * /api/uploads; this route records the path once that has succeeded.
 *
 * Jurisdictions are validated against `lib/jurisdictions`, not accepted as
 * given. A notary cannot register for a jurisdiction where electronic
 * notarisation has no statutory effect — letting them would produce sessions
 * that look valid and produce instruments that are not.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApiUser } from '@/lib/auth/server';
import {
  ACCOUNT_STATUS,
  ROLE_LABELS,
  isJurisdictionBound,
  isPartnerRole,
  isWorkingPartner,
} from '@/lib/roles';
import { listLaunchJurisdictions, listNotarizableJurisdictions } from '@/lib/jurisdictions';
import { KYC_STATUS } from '@/lib/kyc';
import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_IMAGE_TYPES,
  verifyUploadedObject,
} from '@/lib/storage/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Which jurisdictions this role may claim. */
function selectableJurisdictions(role) {
  return (isJurisdictionBound(role) ? listNotarizableJurisdictions() : listLaunchJurisdictions())
    .map((j) => ({ code: j.code, name: j.name }));
}

export async function GET() {
  try {
    const user = await requireApiUser();

    if (!isPartnerRole(user.role)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb().collection('users').doc(user.uid).get();
    const profile = snapshot.exists ? snapshot.data() : {};

    return NextResponse.json({
      role: user.role,
      roleLabel: ROLE_LABELS[user.role],
      status: user.status,
      jurisdictionBound: isJurisdictionBound(user.role),
      selectableJurisdictions: selectableJurisdictions(user.role),
      jurisdictions: profile.jurisdictions ?? [],
      certificatePath: profile.certificatePath ?? null,
      certificateUploadedAt: profile.certificateUploadedAt ?? null,
      kycStatus: profile.kycStatus ?? KYC_STATUS.NOT_STARTED,
      kycDeclineReason: profile.kycDeclineReason ?? null,
      adminFeedback: profile.adminFeedback ?? null,
      // What the certificate is called depends on the role — the brief
      // distinguishes a law-school certificate from a business registration.
      certificateLabel: isWorkingPartner(user.role)
        ? 'Professional certificate'
        : user.role === 'attorney'
          ? 'Law school certificate'
          : 'Certificate of business registration',
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const user = await requireApiUser();

    if (!isPartnerRole(user.role)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // An approved partner's jurisdictions are frozen — the brief calls for a
    // "profile freeze for jurisdiction use". Changing where you are licensed
    // after approval would bypass the Website Manager's review of exactly
    // that.
    if (user.status === ACCOUNT_STATUS.APPROVED) {
      return NextResponse.json(
        {
          error: 'profile_frozen',
          message:
            'Your jurisdictions are fixed once approved. Contact the Website ' +
            'Manager to change them.',
        },
        { status: 409 },
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const updates = { updatedAt: new Date().toISOString() };
    const errors = {};

    /* ---- jurisdictions ---------------------------------------------- */
    if (body.jurisdictions !== undefined) {
      const allowed = new Set(selectableJurisdictions(user.role).map((j) => j.code));
      const submitted = Array.isArray(body.jurisdictions) ? body.jurisdictions : [];
      const unique = [...new Set(submitted.map(String))];

      const invalid = unique.filter((code) => !allowed.has(code));
      if (invalid.length) {
        errors.jurisdictions =
          `Not available for your role: ${invalid.join(', ')}. ` +
          (isJurisdictionBound(user.role)
            ? 'Notaries and Commissioners of Oaths may only practise where ' +
              'electronic notarisation has statutory effect.'
            : '');
      } else if (isJurisdictionBound(user.role) && unique.length === 0) {
        errors.jurisdictions = 'Choose at least one jurisdiction.';
      } else {
        updates.jurisdictions = unique;
      }
    }

    /* ---- certificate ------------------------------------------------ */
    if (body.certificatePath !== undefined) {
      const path = String(body.certificatePath);

      // The client tells us where it uploaded. Confirm the object exists, is
      // the right type and size, and sits in THIS user's folder — otherwise a
      // caller could point at someone else's file.
      if (!path.startsWith(`users/${user.uid}/certificates/`)) {
        errors.certificatePath = 'That file does not belong to your account.';
      } else {
        const check = await verifyUploadedObject(path, {
          allowedTypes: [...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_IMAGE_TYPES],
        });
        if (!check.exists || check.error) {
          errors.certificatePath = check.error ?? 'We could not find that upload.';
        } else {
          updates.certificatePath = path;
          updates.certificateUploadedAt = new Date().toISOString();
          updates.certificateBytes = check.bytes;
          updates.certificateContentType = check.contentType;
        }
      }
    }

    if (Object.keys(errors).length) {
      return NextResponse.json({ error: 'validation_failed', errors }, { status: 422 });
    }

    /*
     * Resubmission. If the Website Manager asked for more information, saving
     * changes puts the application back in the queue and clears the feedback,
     * so a stale note is not left on screen beside corrected details.
     */
    if (user.status === ACCOUNT_STATUS.MORE_INFO_REQUESTED) {
      updates.status = ACCOUNT_STATUS.PENDING_REVIEW;
      updates.adminFeedback = null;
      updates.resubmittedAt = updates.updatedAt;
    }

    await adminDb().collection('users').doc(user.uid).set(updates, { merge: true });

    if (updates.status) {
      const { setUserClaims } = await import('@/lib/auth/claims');
      await setUserClaims(user.uid, { role: user.role, status: updates.status });
    }

    return NextResponse.json({ ok: true, status: updates.status ?? user.status });
  } catch (error) {
    return authErrorResponse(error);
  }
}
