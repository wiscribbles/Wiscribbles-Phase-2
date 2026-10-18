/**
 * Bearer-token auth for the Phase 1 API routes.
 *
 * Kept because eight hardened API routes call `requireUser(request, { roles })`
 * and expect the `{ user, error }` shape. The contract is unchanged; what is
 * underneath it has been reconciled with the Phase 2 model:
 *
 *   - Roles come from `lib/roles.js`, so Commissioner of Oaths exists and the
 *     dropped Real Estate Agent role folds onto Business. The old hardcoded
 *     ELEVATED_ROLES = ['notary', 'admin'] silently excluded COaths, who do the
 *     same work as notaries.
 *   - `verifyIdToken(..., true)` checks revocation. Without it a suspended
 *     partner kept working until their token expired — up to an hour. The
 *     Website Manager's suspend and remove actions need to bite immediately.
 *   - Falls back to the Phase 2 session cookie when there is no Authorization
 *     header, so a route can be called from either a `fetch` carrying a bearer
 *     token (utils/authFetch.js) or an ordinary same-origin request from a
 *     page. One model, two transports.
 *
 * The original note on this file said the role fallback was "only trustworthy
 * if Firestore rules stop users editing their own signUpAs/role field". That
 * is now true: `firestore.rules` lists role and status among the fields a user
 * may never write to their own document, and the authoritative copy lives in
 * auth custom claims, which only the server can set.
 *
 * New code should prefer `lib/auth/server.js` directly.
 */

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/auth/server';
import {
  ACCOUNT_STATUS,
  BLOCKED_STATUSES,
  ROLES,
  WORKING_PARTNER_ROLES,
  isPartnerRole,
  normalizeRole,
  normalizeStatus,
} from '@/lib/roles';

/** Roles permitted to notarise, commission, approve and stamp. */
const ELEVATED_ROLES = [...WORKING_PARTNER_ROLES, ROLES.ADMIN];

function fail(message, status) {
  return { error: NextResponse.json({ success: false, error: message }, { status }) };
}

/**
 * @param {Request} request
 * @param {{ roles?: string[], requireApproved?: boolean }} [options]
 * @returns {Promise<{ user?: object, error?: Response }>}
 */
export async function requireUser(request, { roles, requireApproved = false } = {}) {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer (.+)$/i);

  let uid;
  let email;
  let role;
  let status;

  if (match) {
    let decoded;
    try {
      // checkRevoked — a revoked or disabled account must stop working now,
      // not when the token happens to expire.
      decoded = await adminAuth().verifyIdToken(match[1], true);
    } catch {
      return fail('Invalid or expired token', 401);
    }

    uid = decoded.uid;
    email = decoded.email;
    role = decoded.role;
    status = decoded.status;

    // Claims absent on accounts created before Phase 2. Fall back to the
    // profile document, which firestore.rules now protects.
    if (!role || !status) {
      const snapshot = await adminDb().collection('users').doc(uid).get();
      const profile = snapshot.exists ? snapshot.data() : {};
      role = role ?? profile.role ?? profile.signUpAs;
      status = status ?? profile.status;
    }
  } else {
    // No bearer token — try the Phase 2 session cookie.
    const sessionUser = await getSessionUser();
    if (!sessionUser) return fail('Authentication required', 401);

    ({ uid, email, role, status } = sessionUser);
  }

  role = normalizeRole(role);
  status = normalizeStatus(status);

  if (BLOCKED_STATUSES.includes(status)) {
    return fail('This account cannot perform that action', 403);
  }

  if (roles && !roles.map(normalizeRole).includes(role)) {
    return fail('Forbidden', 403);
  }

  // Approval gates PARTNERS only. The Website Manager is provisioned, not
  // reviewed, so an admin account is never held behind its own queue.
  if (
    requireApproved &&
    isPartnerRole(role) &&
    status !== ACCOUNT_STATUS.APPROVED
  ) {
    return fail('Your account is still awaiting approval', 403);
  }

  return { user: { uid, email, role, status } };
}

/**
 * Notary, Commissioner of Oaths, or Website Manager — and, for the two partner
 * roles, only once approved. An unapproved notary must not be able to stamp.
 */
export const requireNotary = (request) =>
  requireUser(request, { roles: ELEVATED_ROLES, requireApproved: true });

/** Owner of the submission, or an elevated role. */
export function canAccessSubmission(user, submission) {
  if (ELEVATED_ROLES.includes(normalizeRole(user.role))) return true;
  const owner = submission.userId || submission.uid || submission.step1?.userId;
  return Boolean(owner) && owner === user.uid;
}
