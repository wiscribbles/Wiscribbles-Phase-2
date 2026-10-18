/**
 * Backfill `nameLower` on existing user documents.
 *
 *   node scripts/backfill-name-lower.mjs --dry-run
 *   node scripts/backfill-name-lower.mjs
 *
 * WHY THIS EXISTS
 *
 * The Website Manager's document repository filters by Account Name. Firestore
 * has no case-insensitive or substring matching, so that filter runs a prefix
 * query against a `nameLower` field. Sign-up writes it from now on; accounts
 * created before that change do not have it, and a prefix query simply will not
 * match them — silently, which is the worst way for a filter to be wrong.
 *
 * Run this once after deploying. It is idempotent: an account that already has
 * the right value is skipped, so running it twice costs two reads and no
 * writes.
 */

import { loadEnv, ok, bad, warn, info, heading } from './_env.mjs';

loadEnv();

const dryRun = process.argv.includes('--dry-run');

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
const { getFirestore } = await import('firebase-admin/firestore');

const app = initializeApp(
  { credential: cert(creds), projectId: creds.projectId },
  'backfill-name-lower',
);
const db = getFirestore(app);

heading(dryRun ? 'Backfill nameLower — dry run' : 'Backfill nameLower');
console.log(`  Project: ${creds.projectId}\n`);

const snapshot = await db.collection('users').get();

if (snapshot.empty) {
  warn('No user documents found.');
  process.exit(0);
}

let needed = 0;
let skipped = 0;
let noName = 0;

/* Batched, because a write per document would be one round-trip each and
   Firestore caps a batch at 500. */
let batch = db.batch();
let inBatch = 0;
const commits = [];

for (const doc of snapshot.docs) {
  const data = doc.data();
  const name = typeof data.name === 'string' ? data.name.trim() : '';

  if (!name) {
    noName += 1;
    continue;
  }

  const wanted = name.toLowerCase();
  if (data.nameLower === wanted) {
    skipped += 1;
    continue;
  }

  needed += 1;
  console.log(`  ${data.email ?? doc.id}  →  "${wanted}"`);

  if (dryRun) continue;

  batch.set(doc.ref, { nameLower: wanted }, { merge: true });
  inBatch += 1;

  if (inBatch === 450) {
    commits.push(batch.commit());
    batch = db.batch();
    inBatch = 0;
  }
}

if (!dryRun && inBatch > 0) commits.push(batch.commit());
if (commits.length) await Promise.all(commits);

console.log('');
if (needed === 0) {
  ok('Nothing to do — every account already has nameLower.');
} else if (dryRun) {
  info(`${needed} account${needed === 1 ? '' : 's'} would be updated. Re-run without --dry-run.`);
} else {
  ok(`Updated ${needed} account${needed === 1 ? '' : 's'}.`);
}

if (skipped) info(`${skipped} already correct.`);
if (noName) {
  warn(
    `${noName} account${noName === 1 ? ' has' : 's have'} no name recorded — ` +
      'those will only be findable by email in the Account Name filter.',
  );
}

process.exit(0);
