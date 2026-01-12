/* eslint-disable no-console */
/**
 * Utility script to backfill missing fields in the `users` Firestore collection.
 *
 * Usage:
 *   1. Install firebase-admin if you don't already have it:
 *        npm install firebase-admin
 *   2. Provide a service account key JSON and point GOOGLE_APPLICATION_CREDENTIALS at it, e.g.:
 *        export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/serviceAccountKey.json"
 *   3. Run the script from the project root:
 *        node scripts/backfill-user-fields.js
 *
 * The script will only update documents that are missing the targeted fields.
 */

const path = require('path');
const admin = require('firebase-admin');

function loadServiceAccountCredential() {
  const explicitPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!explicitPath) {
    throw new Error(
      'Set GOOGLE_APPLICATION_CREDENTIALS to the absolute path of your Firebase service account key JSON file before running this script.',
    );
  }

  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(path.resolve(explicitPath));
  } catch (error) {
    throw new Error(`Unable to load service account JSON from ${explicitPath}: ${error.message}`);
  }
}

const serviceAccount = loadServiceAccountCredential();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const roleFromSignUpAs = (value) => {
  if (!value) return 'user';

  switch (value.toLowerCase()) {
    case 'notary':
      return 'notary';
    case 'attorney':
      return 'attorney';
    case 'business':
      return 'business';
    case 'real estate agent':
    case 'real_estate_agent':
      return 'real_estate_agent';
    case 'admin':
      return 'admin';
    default:
      return value.toLowerCase();
  }
};

const determineInitialStatus = (doc) => {
  if (doc.status) return doc.status;

  const signUpAs = (doc.signUpAs || '').toLowerCase();
  if (signUpAs === 'notary' || signUpAs === 'attorney') {
    return 'pending_review';
  }
  return 'active';
};

const nullableFields = ['approvedAt', 'rejectedAt'];
const defaultStrings = {
  reviewerId: null,
  reviewNotes: '',
};

async function backfillUsers() {
  const snapshot = await db.collection('users').get();
  if (snapshot.empty) {
    console.log('No user documents found.');
    return;
  }

  let processed = 0;
  let updated = 0;

  for (const doc of snapshot.docs) {
    processed += 1;
    const data = doc.data() || {};
    const updates = {};

    if (!data.role) {
      updates.role = roleFromSignUpAs(data.signUpAs);
    }

    if (!data.status) {
      updates.status = determineInitialStatus(data);
    }

    nullableFields.forEach((field) => {
      if (typeof data[field] === 'undefined') {
        updates[field] = null;
      }
    });

    Object.entries(defaultStrings).forEach(([field, defaultValue]) => {
      if (typeof data[field] === 'undefined') {
        updates[field] = defaultValue;
      }
    });

    if (typeof data.termsAgreed === 'undefined') {
      updates.termsAgreed = false;
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      updated += 1;
      console.log(`Updated ${doc.id}:`, updates);
    }
  }

  console.log(`Processed ${processed} user documents.`);
  console.log(`Updated ${updated} document(s) that were missing fields.`);
}

backfillUsers()
  .then(() => {
    console.log('Backfill complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });

