/**
 * Public sign-up.
 *
 *   "Public endpoint must only collect full name, email, and password."
 *   — Phase 2 brief, Revision of the Sign-up Process
 *
 * Plus the role selector, confirmed with the client on 18 Oct 2026, because
 * "Partner Role Customization ... must correspond with role selected at Sign-up".
 *
 * Everything else the Phase 1 form collected — phone, date of birth,
 * jurisdiction, identification upload, professional certificate, and (worst of
 * all) raw card number, expiry and CVV written to Firestore in plaintext — is
 * gone from this endpoint. Card data never touches our servers again; it goes
 * to Stripe from the browser in Stage 2. Professional details move to the
 * Account tab behind email verification.
 *
 * The account is created with the ADMIN SDK rather than from the browser, so
 * `role` and `status` are decided here. A client cannot sign itself up as an
 * admin, or as an already-approved notary.
 */

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { setUserClaims } from '@/lib/auth/claims';
import { sendEmail, verificationEmail } from '@/lib/email/send';
import {
  ACCOUNT_STATUS,
  ROLES,
  ROLE_LABELS,
  SELECTABLE_ROLES,
  initialStatusFor,
  isPartnerRole,
} from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_PASSWORD_LENGTH = 10;
const MAX_NAME_LENGTH = 120;

/** RFC-5322-ish. Deliberately permissive — the verification email is the real test. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate({ name, email, password, role }) {
  const errors = {};

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (trimmedName.length < 2) {
    errors.name = 'Enter your full name.';
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.name = `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }

  const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  // ROLES.ADMIN is deliberately absent from SELECTABLE_ROLES. Website Manager
  // accounts are provisioned by an existing admin, never self-selected.
  if (!SELECTABLE_ROLES.includes(role)) {
    errors.role = 'Choose how you want to use WiScribbles.';
  }

  return { errors, value: { name: trimmedName, email: trimmedEmail, password, role } };
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { errors, value } = validate(body);
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: 'validation_failed', errors }, { status: 422 });
  }

  const { name, email, password, role } = value;

  let userRecord;
  try {
    userRecord = await adminAuth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });
  } catch (error) {
    if (error?.code === 'auth/email-already-exists') {
      /*
       * Do not confirm that the address is registered — that turns sign-up into
       * an account-enumeration oracle. Return the same shape as success and let
       * the (unsent) email be the signal. A real user who already has an account
       * will find out when no new mail arrives and they try to sign in.
       */
      return NextResponse.json({ ok: true, emailSent: true });
    }
    if (error?.code === 'auth/invalid-password') {
      return NextResponse.json(
        { error: 'validation_failed', errors: { password: 'That password is too weak.' } },
        { status: 422 },
      );
    }
    console.error('[auth/signup] createUser failed', error);
    return NextResponse.json({ error: 'signup_failed' }, { status: 500 });
  }

  const now = new Date().toISOString();

  /*
   * The profile document. Note what is NOT here: no card data, no identification
   * upload, no certificate, no jurisdiction. Those belong to the Account and
   * Financials/Invoice tabs, which only open after email verification.
   */
  const profile = {
    uid: userRecord.uid,
    name,
    /* Lower-cased copy, purely so the Website Manager's "Account Name" filter
       can work. Firestore has no case-insensitive or substring matching, so a
       prefix query needs a field already in the form being searched. Written
       here rather than computed at query time because there is nowhere to
       compute it — the query is the thing that needs it. */
    nameLower: name.toLowerCase(),
    email,
    role,
    status: initialStatusFor(),
    requiresApproval: isPartnerRole(role),
    jurisdictions: [],
    emailVerifiedAt: null,
    // Review trail — written by the Website Manager in Stage 3.
    adminFeedback: null,
    reviewedBy: null,
    reviewedAt: null,
    submittedForReviewAt: null,
    suspendedUntil: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await adminDb().collection('users').doc(userRecord.uid).set(profile);
    await setUserClaims(userRecord.uid, { role, status: profile.status });
  } catch (error) {
    // Do not leave an auth account with no profile — it would be a user who can
    // sign in but has no role, and no obvious way to repair itself.
    console.error('[auth/signup] profile write failed, rolling back auth user', error);
    await adminAuth()
      .deleteUser(userRecord.uid)
      .catch((cleanupError) =>
        console.error('[auth/signup] rollback failed', { uid: userRecord.uid, cleanupError }),
      );
    return NextResponse.json({ error: 'signup_failed' }, { status: 500 });
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? '';
  let emailSent = false;

  try {
    const link = await adminAuth().generateEmailVerificationLink(email, {
      url: `${origin}/en/auth/verify-email?completed=1`,
    });
    const result = await sendEmail({ to: email, ...verificationEmail({ name, link }) });
    emailSent = result.ok;
  } catch (error) {
    // The account exists and is usable; they can request a new link from the
    // verify-email screen. Not worth failing the sign-up over.
    console.error('[auth/signup] verification email failed', { uid: userRecord.uid, error });
  }

  return NextResponse.json({
    ok: true,
    emailSent,
    role,
    roleLabel: ROLE_LABELS[role],
    requiresApproval: isPartnerRole(role),
    // Useful hint for the UI copy; the real status transition happens on
    // verification, server-side.
    nextStatus: isPartnerRole(role) ? ACCOUNT_STATUS.PENDING_REVIEW : ACCOUNT_STATUS.APPROVED,
  });
}
