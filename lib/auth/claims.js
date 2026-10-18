/**
 * Custom claims keep `role` and `status` inside the auth token, so server-side
 * checks do not need a Firestore read on every request and — more importantly —
 * so Firestore security rules can gate reads and writes on them directly.
 *
 * Claims are written ONLY here, server-side. A client can never set its own role.
 *
 * Claims live in the token, so they are stale until the token refreshes. Any
 * change that must bite immediately (suspension, removal) calls
 * `revokeUserSessions` as well, which forces re-authentication on the next
 * verification.
 */

import 'server-only';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { normalizeRole, normalizeStatus } from '@/lib/roles';

/**
 * Write role/status to both the auth token and the user document, so the two
 * never drift. Returns the normalised pair that was written.
 */
export async function setUserClaims(uid, { role, status }) {
  const normalizedRole = normalizeRole(role);
  const normalizedStatus = normalizeStatus(status);

  await adminAuth().setCustomUserClaims(uid, {
    role: normalizedRole,
    status: normalizedStatus,
  });

  await adminDb().collection('users').doc(uid).set(
    {
      role: normalizedRole,
      status: normalizedStatus,
      claimsUpdatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return { role: normalizedRole, status: normalizedStatus };
}

/**
 * Re-read the user document and push its role/status into the token.
 * Used after an admin decision, so the partner's next request sees it.
 */
export async function syncClaimsFromProfile(uid) {
  const snapshot = await adminDb().collection('users').doc(uid).get();
  if (!snapshot.exists) return null;

  const profile = snapshot.data();
  return setUserClaims(uid, {
    role: profile.role ?? profile.signUpAs,
    status: profile.status,
  });
}

/**
 * Invalidate every existing session for a user. Session cookies are verified
 * with `checkRevoked: true`, so this takes effect on the user's very next
 * request — which is what suspension and removal require.
 */
export async function revokeUserSessions(uid) {
  await adminAuth().revokeRefreshTokens(uid);
}
