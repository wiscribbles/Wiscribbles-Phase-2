/**
 * Server-side authorisation.
 *
 * Phase 1 of the platform guarded routes with five overlapping CLIENT components
 * (`AdminGuard.jsx`, `AdminRoute.js`, `AuthRoute.js`, `ProtectedRoute.js`,
 * `ProtectedRoute.jsx`). A client-side guard is advisory: it hides UI, it does
 * not deny access. Anyone could read the data by calling Firestore directly.
 *
 * Phase 2 enforces in three places, all reading from `lib/roles.js`:
 *   1. `middleware.js`   — cheap cookie presence check, unauthenticated bounce.
 *   2. THIS FILE         — real verification in server components / route handlers.
 *   3. firestore.rules   — the data layer, which is the one that actually counts.
 *
 * The client guards remain only for render-time UX. They are not security.
 */

import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import {
  ACCOUNT_STATUS,
  BLOCKED_STATUSES,
  ROLES,
  canAccessTab,
  isAdmin,
  isPartnerRole,
  normalizeRole,
  normalizeStatus,
} from '@/lib/roles';
import { restoreOnLapse, suspensionHasLapsed } from '@/lib/admin/sanctions';
import { credentialHasExpired, expireOnLapse } from '@/lib/admin/credentials';

export const SESSION_COOKIE = 'wis_session';
/** 5 days, the Firebase maximum for a session cookie. */
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;

/**
 * Resolve the current user from the session cookie, or null.
 *
 * Returns the merged auth record and Firestore profile, with role and status
 * normalised through `lib/roles.js` so legacy documents behave.
 *
 * `checkRevoked: true` means a disabled or signed-out account stops working
 * immediately rather than at cookie expiry — necessary because the Website
 * Manager can suspend or remove a partner at any moment.
 */
export async function getSessionUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let claims;
  try {
    claims = await adminAuth().verifySessionCookie(token, true);
  } catch {
    // Expired, revoked, or tampered with. Treat as signed out.
    return null;
  }

  const snapshot = await adminDb().collection('users').doc(claims.uid).get();
  const profile = snapshot.exists ? snapshot.data() : {};

  let status = normalizeStatus(profile.status);

  /* A suspension "for a period of time" has to end when that period is up.
     Stage 3 recorded `suspendedUntil` and never read it again, which made every
     timed suspension permanent in practice. This is where it lapses: one date
     comparison on the common path, a write only when a suspension has actually
     expired. See lib/admin/sanctions.js. */
  if (suspensionHasLapsed({ ...profile, status })) {
    status = normalizeStatus(await restoreOnLapse(claims.uid, { ...profile, status }));
  }

  /* A notary's or Commissioner of Oaths' access ends when their commission
     does. Checked AFTER the suspension lapse, deliberately: a lapsed
     suspension restores the account to `approved`, and an officer restored to
     approved with an expired certificate must then be stopped by this check
     rather than let through on the strength of the restore. Running these the
     other way round would leave exactly that gap.

     Guyana Cap. 4:02 s.7 and Barbados Notaries Public Act 2024 s.16 make
     acting after the appointment ends an offence, so this fails closed —
     see lib/admin/credentials.js. */
  if (credentialHasExpired({ ...profile, status })) {
    status = normalizeStatus(await expireOnLapse(claims.uid, { ...profile, status }));
  }

  return {
    uid: claims.uid,
    email: claims.email ?? profile.email ?? null,
    emailVerified: Boolean(claims.email_verified),
    name: profile.name ?? null,
    // The custom claim is authoritative when present — it is set by the admin
    // SDK and cannot be written by the client. The profile field is the
    // fallback for accounts created before claims were introduced.
    role: normalizeRole(claims.role ?? profile.role ?? profile.signUpAs),
    status,
    jurisdictions: Array.isArray(profile.jurisdictions) ? profile.jurisdictions : [],
    adminFeedback: profile.adminFeedback ?? null,
    suspendedUntil: profile.suspendedUntil ?? null,
    profileExists: snapshot.exists,
  };
}

/* ------------------------------------------------------------------------- */
/* Server-component guards (redirecting)                                      */
/* ------------------------------------------------------------------------- */

const path = (locale, to) => `/${locale}${to}`;

/**
 * Require a signed-in, email-verified user.
 *
 * The brief: "Consequent access to any dashboard route is granted only upon
 * successful email verification." That is enforced here, not in the UI.
 */
export async function requireVerifiedUser(locale, { returnTo } = {}) {
  const user = await getSessionUser();

  if (!user) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : '';
    redirect(path(locale, `/auth/signin${next}`));
  }

  if (!user.emailVerified) {
    redirect(path(locale, '/auth/verify-email'));
  }

  if (BLOCKED_STATUSES.includes(user.status)) {
    redirect(path(locale, '/account/blocked'));
  }

  return user;
}

/**
 * Guard for the partner dashboard shell.
 *
 * A partner whose application has not cleared the Website Manager is sent to
 * the restricted onboarding route, exactly as the brief requires:
 *   "Redirect users with role: Notary and status: pending_review to a
 *    restricted route: /onboarding/verification."
 *
 * `allowPending` is for the onboarding route itself, which must obviously be
 * reachable by a pending partner.
 */
export async function requirePartner(locale, { allowPending = false } = {}) {
  const user = await requireVerifiedUser(locale);

  if (!isPartnerRole(user.role)) {
    redirect(path(locale, '/dashboard'));
  }

  const awaitingApproval =
    user.status === ACCOUNT_STATUS.PENDING_REVIEW ||
    user.status === ACCOUNT_STATUS.MORE_INFO_REQUESTED;

  if (awaitingApproval && !allowPending) {
    redirect(path(locale, '/onboarding/verification'));
  }

  // An approved partner has no business on the holding route.
  if (!awaitingApproval && allowPending) {
    redirect(path(locale, '/dashboard'));
  }

  return user;
}

/** Guard a specific dashboard tab against the role/status tab matrix. */
export async function requireTab(locale, tab) {
  const user = await requireVerifiedUser(locale);

  if (!canAccessTab(user.role, user.status, tab)) {
    redirect(path(locale, '/dashboard'));
  }

  return user;
}

/** Website Manager only. */
export async function requireAdmin(locale) {
  const user = await requireVerifiedUser(locale);

  if (!isAdmin(user.role)) {
    // Deliberately a redirect to the user's own dashboard and not a 403 page:
    // the admin surface should not confirm its own existence to non-admins.
    redirect(path(locale, '/dashboard'));
  }

  return user;
}

/* ------------------------------------------------------------------------- */
/* Route-handler guards (status codes, no redirect)                           */
/* ------------------------------------------------------------------------- */

export class AuthError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Throws AuthError. Wrap route handlers in `withAuthErrors`. */
export async function requireApiUser({ verified = true } = {}) {
  const user = await getSessionUser();

  if (!user) {
    throw new AuthError(401, 'unauthenticated', 'Sign in to continue.');
  }
  if (verified && !user.emailVerified) {
    throw new AuthError(403, 'email_unverified', 'Verify your email address to continue.');
  }
  if (BLOCKED_STATUSES.includes(user.status)) {
    throw new AuthError(403, 'account_blocked', 'This account cannot perform that action.');
  }

  return user;
}

export async function requireApiRole(roles) {
  const allowed = (Array.isArray(roles) ? roles : [roles]).map(normalizeRole);
  const user = await requireApiUser();

  if (!allowed.includes(user.role)) {
    throw new AuthError(403, 'forbidden', 'You do not have access to that.');
  }

  return user;
}

export const requireApiAdmin = () => requireApiRole(ROLES.ADMIN);

/**
 * Require an APPROVED partner — the gate for anything operational
 * (going live, accepting clients, stamping, payouts).
 */
export async function requireApprovedPartner(roles = null) {
  const user = roles ? await requireApiRole(roles) : await requireApiUser();

  if (!isPartnerRole(user.role)) {
    throw new AuthError(403, 'forbidden', 'Partner accounts only.');
  }
  if (user.status !== ACCOUNT_STATUS.APPROVED) {
    throw new AuthError(
      403,
      'not_approved',
      'Your account is still awaiting approval by the Website Manager.',
    );
  }

  return user;
}

/** Turns a thrown AuthError into a JSON response; rethrows anything else. */
export function authErrorResponse(error) {
  if (error instanceof AuthError) {
    return Response.json(
      { error: error.code, message: error.message },
      { status: error.status },
    );
  }
  throw error;
}
