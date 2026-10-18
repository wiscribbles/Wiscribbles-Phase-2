/**
 * Verifies the environment before anything else is attempted.
 *
 *   node scripts/check-setup.mjs
 *
 * Checks every variable the app needs, then actually CONNECTS with the Admin
 * SDK — reading the project, listing users, touching Firestore and Storage.
 * A variable that is merely present proves nothing; a key pasted with a broken
 * newline looks fine in a .env file and fails at the first real call.
 *
 * Exit code 0 means Stage 1 can run. Stage 2 variables are reported but do not
 * fail the check — they are not needed yet.
 */

import { loadEnv, ok, bad, warn, info, heading } from './_env.mjs';

const loaded = loadEnv();
let failures = 0;

console.log('\nWiScribbles — environment check');
console.log(
  loaded.length
    ? `Loaded: ${loaded.join(', ')}`
    : 'No .env file found. Copy .env.example to .env.local and fill it in.',
);

/* ------------------------------------------------------------------ */
/* 1. Variables                                                        */
/* ------------------------------------------------------------------ */

heading('1. Required variables');

const REQUIRED_CLIENT = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

for (const key of REQUIRED_CLIENT) {
  if (process.env[key]) ok(key);
  else {
    bad(`${key} is missing`);
    failures += 1;
  }
}

/* Admin credentials — either shape is acceptable. */
const hasServiceAccountJson = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
const hasDiscreteAdmin =
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY;

let adminCredentials = null;

if (hasServiceAccountJson) {
  try {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      bad('FIREBASE_SERVICE_ACCOUNT parsed, but is missing project_id, client_email or private_key');
      failures += 1;
    } else if (!parsed.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
      bad('FIREBASE_SERVICE_ACCOUNT private_key does not look like a PEM key');
      failures += 1;
    } else {
      ok('FIREBASE_SERVICE_ACCOUNT (valid JSON, key present)');
      adminCredentials = {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    }
  } catch {
    bad('FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON');
    info('It must be the ENTIRE service-account file on one line.');
    info('If you pasted it across several lines, your .env file has broken it.');
    failures += 1;
  }
} else if (hasDiscreteAdmin) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    bad('FIREBASE_ADMIN_PRIVATE_KEY does not look like a PEM key');
    info('Keep the literal \\n sequences from the JSON, and wrap the value in double quotes.');
    failures += 1;
  } else {
    ok('FIREBASE_ADMIN_* (three discrete variables)');
    adminCredentials = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    };
  }
} else {
  bad('No Admin SDK credentials');
  info('Set FIREBASE_SERVICE_ACCOUNT, or all three FIREBASE_ADMIN_* variables.');
  failures += 1;
}

if (!process.env.NEXT_PUBLIC_BASE_URL && !process.env.NEXT_PUBLIC_SITE_URL) {
  bad('NEXT_PUBLIC_BASE_URL / NEXT_PUBLIC_SITE_URL are both missing');
  info('Email verification links are built from these.');
  failures += 1;
} else {
  ok('Base URL');
}

/* ------------------------------------------------------------------ */
/* 2. Consistency                                                      */
/* ------------------------------------------------------------------ */

heading('2. Consistency');

if (adminCredentials && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  if (adminCredentials.projectId === process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    ok(`Client and Admin both point at "${adminCredentials.projectId}"`);
  } else {
    bad('Client and Admin credentials are for DIFFERENT projects');
    info(`client: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
    info(`admin:  ${adminCredentials.projectId}`);
    failures += 1;
  }
}

/* A NEXT_PUBLIC_ prefix on a secret ships it to every browser. */
for (const key of Object.keys(process.env)) {
  if (!key.startsWith('NEXT_PUBLIC_')) continue;
  if (/SECRET|PRIVATE_KEY|SERVICE_ACCOUNT|_API_KEY$/.test(key)) {
    // The Firebase web API key is genuinely public; everything else is not.
    if (key === 'NEXT_PUBLIC_FIREBASE_API_KEY') continue;
    bad(`${key} is PUBLIC — this secret is being shipped to every browser`);
    info('Remove the NEXT_PUBLIC_ prefix.');
    failures += 1;
  }
}

/* ------------------------------------------------------------------ */
/* 3. Live connection                                                  */
/* ------------------------------------------------------------------ */

heading('3. Live connection');

if (!adminCredentials) {
  warn('Skipped — no usable Admin credentials');
} else {
  try {
    const { cert, initializeApp } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');
    const { getFirestore } = await import('firebase-admin/firestore');

    const app = initializeApp(
      { credential: cert(adminCredentials), projectId: adminCredentials.projectId },
      `check-${Date.now()}`,
    );

    try {
      const { users } = await getAuth(app).listUsers(5);
      ok(`Authentication reachable — ${users.length} user(s) so far`);
      if (users.length === 0) {
        info('No accounts yet. Sign up through the app, then run scripts/grant-admin.mjs.');
      }
    } catch (error) {
      bad(`Authentication unreachable: ${error.message}`);
      if (String(error.message).includes('Could not load the default credentials')) {
        info('The credentials were rejected. Re-copy them from the service-account file.');
      }
      failures += 1;
    }

    try {
      const db = getFirestore(app);
      // Read a document that need not exist — proves the database is
      // provisioned and the credentials can reach it.
      await db.collection('_setupCheck').doc('ping').get();
      ok('Firestore reachable');
    } catch (error) {
      bad(`Firestore unreachable: ${error.message}`);
      if (/NOT_FOUND|does not exist/i.test(error.message)) {
        info('The database has not been created yet — Firestore Database → Create database.');
      }
      failures += 1;
    }

    if (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
      try {
        const { getStorage } = await import('firebase-admin/storage');
        const [exists] = await getStorage(app)
          .bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
          .exists();
        if (exists) ok('Storage bucket reachable');
        else {
          warn('Storage bucket not found — check the name, or enable Storage');
          info(`looked for: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`);
        }
      } catch (error) {
        warn(`Storage check inconclusive: ${error.message}`);
      }
    }
  } catch (error) {
    bad(`Could not initialise the Admin SDK: ${error.message}`);
    failures += 1;
  }
}

/* ------------------------------------------------------------------ */
/* 4. Stage 2 (informational)                                          */
/* ------------------------------------------------------------------ */

heading('4. Stage 2 — not required yet');

const STAGE_2 = {
  RESEND_API_KEY: 'verification and approval emails actually send',
  STRIPE_SECRET_KEY: 'subscriptions (Attorneys and Businesses)',
  WIPAY_API_KEY: 'Caribbean card collection — sandbox works without it',
  DIDIT_API_KEY: 'identity verification',
  ZEGOCLOUD_SERVER_SECRET: 'video sessions',
};

for (const [key, purpose] of Object.entries(STAGE_2)) {
  if (process.env[key]) ok(`${key} — ${purpose}`);
  else info(`${key} not set — ${purpose}`);
}

info('None of the above block the app from running. Leave them blank for now.');

if (!process.env.RESEND_API_KEY) {
  warn('Without RESEND_API_KEY, verification emails are logged to the console, not sent.');
  info('Fine for local testing. Not fine in production.');
}

/* ------------------------------------------------------------------ */

heading(failures === 0 ? 'Ready' : `${failures} problem(s) to fix`);

if (failures === 0) {
  console.log('  Environment looks good. Next: npm run build\n');
} else {
  console.log('  Fix the ✗ items above, then run this again.\n');
}

process.exit(failures === 0 ? 0 : 1);
