/**
 * Promote an existing account to Website Manager.
 *
 *   node scripts/grant-admin.mjs someone@example.com
 *   node scripts/grant-admin.mjs someone@example.com --revoke
 *
 * `admin` is deliberately absent from SELECTABLE_ROLES, so nobody can sign up
 * as a Website Manager — which also means the FIRST one has to be made here,
 * with the Admin SDK, by someone holding the service-account key. That is the
 * intended bootstrap: possession of the key is the authority.
 *
 * Sign up through the app normally, verify the email, then run this.
 *
 * Promotion writes the role to BOTH the auth custom claims and the Firestore
 * profile, and revokes existing sessions so the new claims are picked up on
 * the next request rather than up to an hour later.
 */

import { loadEnv, ok, bad, warn, info, heading } from './_env.mjs';

loadEnv();

const args = process.argv.slice(2);
const revoking = args.includes('--revoke');
const email = args.find((arg) => !arg.startsWith('--'));

if (!email) {
  console.error('\nUsage: node scripts/grant-admin.mjs <email> [--revoke]\n');
  process.exit(1);
}

/* Resolve Admin credentials from either accepted shape. */
function credentials() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    const parsed = JSON.parse(raw);
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    };
  }
  if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }
  return null;
}

const creds = credentials();
if (!creds) {
  console.error('\nNo Admin SDK credentials. Run: node scripts/check-setup.mjs\n');
  process.exit(1);
}

const { cert, initializeApp } = await import('firebase-admin/app');
const { getAuth } = await import('firebase-admin/auth');
const { getFirestore } = await import('firebase-admin/firestore');

const app = initializeApp(
  { credential: cert(creds), projectId: creds.projectId },
  'grant-admin',
);
const auth = getAuth(app);
const db = getFirestore(app);

heading(revoking ? 'Revoke Website Manager' : 'Grant Website Manager');
console.log(`  Project: ${creds.projectId}`);
console.log(`  Account: ${email}\n`);

let user;
try {
  user = await auth.getUserByEmail(email);
} catch (error) {
  if (error.code === 'auth/user-not-found') {
    bad(`No account for ${email}`);
    info('Sign up through the app first, then run this again.');
  } else {
    bad(error.message);
  }
  process.exit(1);
}

if (!user.emailVerified && !revoking) {
  // Not fatal, but every dashboard guard checks emailVerified, so a Website
  // Manager who has not confirmed their address cannot open the admin area.
  warn('This address is not verified yet.');
  info('The role will be set, but the admin dashboard stays closed until it is.');
}

const role = revoking ? 'client' : 'admin';
const status = 'approved';
const now = new Date().toISOString();

try {
  // Preserve any unrelated claims already on the account.
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role, status });
  ok(`Custom claims set — role: ${role}`);

  await db.collection('users').doc(user.uid).set(
    {
      uid: user.uid,
      email: user.email,
      name: user.displayName ?? null,
      role,
      status,
      requiresApproval: false,
      claimsUpdatedAt: now,
      updatedAt: now,
    },
    { merge: true },
  );
  ok('Firestore profile updated');

  // Claims live in the token, so an existing session would keep the old role
  // until it expired. Force re-authentication.
  await auth.revokeRefreshTokens(user.uid);
  ok('Existing sessions revoked');
} catch (error) {
  bad(error.message);
  process.exit(1);
}

console.log(
  revoking
    ? `\n  ${email} is no longer a Website Manager.\n`
    : `\n  ${email} is now a Website Manager.\n  Sign out and back in, then open /en/admin.\n`,
);

process.exit(0);
