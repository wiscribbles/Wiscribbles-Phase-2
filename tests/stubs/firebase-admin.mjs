/**
 * Stub for `@/lib/firebase-admin`.
 *
 * By default every export THROWS WHEN CALLED rather than returning a fake. A
 * unit test that silently reached a real database would be worse than no test,
 * so accidental I/O fails loudly. Importing the module is fine — the real one
 * is lazy too — so modules under test import cleanly.
 *
 * A test that genuinely needs to exercise a Firestore-reading function calls
 * `__setFirestore(fake)` and `__reset()` afterwards. That is an explicit opt-in
 * per test, which is the point: the default stays "no I/O".
 */

let firestore = null;

const refuse = (name) => {
  throw new Error(
    `A unit test called ${name}() without installing a fake. These tests must ` +
      'not touch Firebase. Test the pure function, or call __setFirestore(fake).',
  );
};

export const adminDb = () => (firestore === null ? refuse('adminDb') : firestore);
export const adminAuth = () => refuse('adminAuth');
export const adminStorage = () => refuse('adminStorage');

/** Install a fake Firestore for one test. */
export function __setFirestore(fake) {
  firestore = fake;
}

/** Put the refusal back. Call this in a test's cleanup. */
export function __reset() {
  firestore = null;
}

export default { adminDb, adminAuth, adminStorage };
