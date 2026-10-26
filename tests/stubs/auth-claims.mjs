/**
 * Stub for `@/lib/auth/claims`.
 *
 * The real module reaches Firebase Auth through `adminAuth()`, which the
 * firebase-admin stub refuses outright. That refusal is right as a default,
 * but it makes two genuinely important functions untestable: the suspension
 * lapse in `lib/admin/sanctions.js` and the certificate expiry in
 * `lib/admin/credentials.js` both write claims, and both are code whose whole
 * job is to open or close someone's access.
 *
 * So this records calls instead of making them. The claim write is the thing
 * that actually grants or withdraws access — the Firestore field is for
 * display — which makes "was setUserClaims called, with what" the assertion
 * worth being able to make.
 *
 * `__failClaims(true)` makes `setUserClaims` throw, so a test can exercise the
 * failure path. That matters because the two callers fail in OPPOSITE
 * directions by design: a failed restore leaves an account suspended for one
 * more request, and a failed expiry must still withdraw access.
 */

let claimCalls = [];
let revokeCalls = [];
let shouldFail = false;

export async function setUserClaims(uid, claims) {
  if (shouldFail) throw new Error('stubbed claims failure');
  claimCalls.push({ uid, claims });
  return { uid, claims };
}

export async function revokeUserSessions(uid) {
  revokeCalls.push(uid);
  return true;
}

export const __claimCalls = () => [...claimCalls];
export const __revokeCalls = () => [...revokeCalls];
export const __failClaims = (value = true) => {
  shouldFail = value;
};

export function __resetClaims() {
  claimCalls = [];
  revokeCalls = [];
  shouldFail = false;
}
