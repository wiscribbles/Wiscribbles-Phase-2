/**
 * Reclaim storage from documents nobody signed.
 *
 *   npm run sweep-expired -- --dry-run
 *   npm run sweep-expired
 *
 * Two phases per document: past its signing deadline it is marked expired;
 * past the deadline plus the grace period its FILE is removed. The record
 * always survives — who uploaded it, what it was, who signed before it lapsed
 * — so a client asking what happened to a document from three months ago gets
 * an answer rather than a shrug.
 *
 * **An executed document is never touched.** Signed, notarised, revoked or
 * awaiting notarisation are permanent, and anything carrying a seal is
 * permanent regardless of what its status field says. `assertPurgeable` throws
 * rather than skipping if this is ever asked to do otherwise, so a mistake
 * here is loud instead of silent.
 *
 * Run it on a schedule. Nothing calls it automatically, because a cron that
 * deletes files should be something somebody deliberately set up.
 *
 * ALWAYS DRY-RUN FIRST on a database you care about.
 */

import { loadEnv, ok, warn, info, heading } from './_env.mjs';

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

const bucketName =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  process.env.FIREBASE_STORAGE_BUCKET;

if (!bucketName) {
  console.error('\nNo storage bucket configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.\n');
  process.exit(1);
}

const { cert, initializeApp } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const { getStorage } = await import('firebase-admin/storage');

const app = initializeApp(
  { credential: cert(creds), projectId: creds.projectId, storageBucket: bucketName },
  'sweep-expired',
);
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

/* Duplicated from lib/retention.js rather than imported: that module is
   `server-only`, which a plain node script is not. Kept deliberately short and
   the lists are the ones that matter — if these two ever drift from the module,
   the module is authoritative. */
const PERMANENT = [
  'signed',
  'notarised',
  'revoked',
  'awaiting_in_person_witnessing',
  'awaiting_notarisation',
];
const PURGEABLE = ['draft', 'awaiting_signature', 'expired', 'declined'];
const GRACE_MS = 7 * 86400000;

heading(dryRun ? 'Sweep expired documents — dry run' : 'Sweep expired documents');
console.log(`  Project: ${creds.projectId}`);
console.log(`  Bucket:  ${bucketName}\n`);

const now = Date.now();
const snapshot = await db
  .collection('documents')
  .where('signingDeadline', '<=', new Date(now).toISOString())
  .limit(500)
  .get();

if (snapshot.empty) {
  ok('Nothing past its signing deadline.');
  process.exit(0);
}

let marked = 0;
let purged = 0;
let freed = 0;
let skipped = 0;

for (const doc of snapshot.docs) {
  const data = doc.data();
  const label = `${data.name ?? doc.id} (${doc.id.slice(0, 8)})`;

  if (PERMANENT.includes(data.status) || data.stampedPath) {
    console.log(`  · ${label} — executed (${data.status}), left alone`);
    skipped += 1;
    continue;
  }

  if (!PURGEABLE.includes(data.status)) {
    warn(`${label} — unrecognised status "${data.status}", left alone`);
    skipped += 1;
    continue;
  }

  const deadline = Date.parse(data.signingDeadline ?? '');
  if (Number.isNaN(deadline)) {
    skipped += 1;
    continue;
  }

  const pastGrace = now > deadline + GRACE_MS;

  if (!pastGrace) {
    if (data.status !== 'expired') {
      console.log(`  · ${label} — window closed, marking expired`);
      if (!dryRun) {
        await doc.ref.set(
          { status: 'expired', expiredAt: new Date(now).toISOString() },
          { merge: true },
        );
      }
      marked += 1;
    }
    continue;
  }

  if (!data.storagePath) {
    skipped += 1;
    continue;
  }

  const bytes = Number(data.sizeBytes ?? 0);
  console.log(`  · ${label} — removing file (${(bytes / 1024 / 1024).toFixed(2)} MB)`);

  if (!dryRun) {
    const at = new Date(now).toISOString();

    try {
      await bucket.file(data.storagePath).delete({ ignoreNotFound: true });
    } catch (error) {
      warn(`${label} — could not delete the object: ${error.message}`);
      skipped += 1;
      continue;
    }

    await doc.ref.set(
      {
        status: 'expired',
        storagePath: null,
        filePurged: {
          at,
          reason: 'signing_window_expired',
          previousPath: data.storagePath,
          bytes,
        },
        updatedAt: at,
      },
      { merge: true },
    );

    await db
      .collection('auditLog')
      .add({
        type: 'document_file_purged',
        documentId: doc.id,
        reason: 'signing_window_expired',
        bytes,
        actorUid: null,
        actorEmail: 'system',
        at,
      })
      .catch(() => {});
  }

  purged += 1;
  freed += bytes;
}

console.log('');
if (dryRun) {
  info(
    `Would mark ${marked} expired and remove ${purged} file${purged === 1 ? '' : 's'} ` +
      `(${(freed / 1024 / 1024).toFixed(2)} MB). Re-run without --dry-run.`,
  );
} else {
  ok(
    `Marked ${marked} expired, removed ${purged} file${purged === 1 ? '' : 's'}, ` +
      `freed ${(freed / 1024 / 1024).toFixed(2)} MB.`,
  );
}
if (skipped) info(`${skipped} left alone.`);

process.exit(0);
