/**
 * Firebase Admin SDK — server only. The single Admin entry point.
 *
 * Supersedes `lib/firebaseAdmin.js` from the hardening branch. Two differences
 * worth knowing, because they change how callers write code:
 *
 *   1. Initialisation is LAZY. The old module built the app at import time,
 *      which meant importing it anywhere — including from a file Next touches
 *      during `next build` — failed the build when credentials were absent.
 *      Exports are therefore functions: `adminAuth()`, not `adminAuth`.
 *   2. `server-only` makes importing this from a client component a build
 *      error rather than a runtime surprise.
 *
 * Credentials NEVER come from a file in the repository. A service-account JSON
 * was committed to the public Phase 1 repo and had to be treated as
 * compromised. Both accepted env shapes are documented in `.env.example`.
 */

import 'server-only';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const ADMIN_APP_NAME = 'wiscribbles-admin';

/**
 * Shape (A): FIREBASE_SERVICE_ACCOUNT holding the whole downloaded JSON.
 * Shape (B): the three fields separately.
 * Returns null when neither is configured, so callers can raise a useful error.
 */
function readCredentials() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (raw) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON. It must be the ' +
          'entire service-account file on a single line.',
      );
    }
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT is missing project_id, client_email or private_key.',
      );
    }
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      // JSON.parse has already turned the file's \n escapes into real
      // newlines, so no further unescaping is needed here.
      privateKey: parsed.private_key,
    };
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      // .env files cannot hold real newlines, so the key is stored with
      // literal backslash-n and unescaped here.
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

function createApp() {
  const credentials = readCredentials();

  if (!credentials) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT (the whole ' +
        'service-account JSON on one line), or FIREBASE_ADMIN_PROJECT_ID, ' +
        'FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY. See .env.example. ' +
        'Never commit a key file.',
    );
  }

  const app = initializeApp(
    {
      credential: cert(credentials),
      projectId: credentials.projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    },
    ADMIN_APP_NAME,
  );

  try {
    /*
     * Firestore rejects `undefined` field values by default. The Phase 1 client
     * SDK code was lenient about this and the migrated API routes still rely on
     * it, so keep the behaviour rather than hunting every optional field.
     */
    getFirestore(app).settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings() may only be called once; harmless on hot reload.
  }

  return app;
}

export function getAdminApp() {
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existing) return existing;
  try {
    return getApp(ADMIN_APP_NAME);
  } catch {
    return createApp();
  }
}

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
export const adminStorage = () => getStorage(getAdminApp());
