/**
 * Firebase Admin SDK — server only.
 *
 * Credentials come from environment variables. They are NEVER read from a file
 * in the repository: a service-account JSON was committed to the public repo
 * before Phase 2 and the key had to be revoked. Do not reintroduce that pattern.
 *
 * Required env:
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY   (literal "\n" sequences are unescaped below,
 *                                 so the key can live on one line in .env)
 *
 * Importing this module from a client component is a build error by design —
 * `server-only` guarantees it.
 */

import 'server-only';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const ADMIN_APP_NAME = 'wiscribbles-admin';

function readCredentials() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  const missing = [
    !projectId && 'FIREBASE_ADMIN_PROJECT_ID',
    !clientEmail && 'FIREBASE_ADMIN_CLIENT_EMAIL',
    !rawKey && 'FIREBASE_ADMIN_PRIVATE_KEY',
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(
      `Firebase Admin is not configured. Missing: ${missing.join(', ')}. ` +
        'Set these in the server environment — never in a committed file.',
    );
  }

  return {
    projectId,
    clientEmail,
    // .env files cannot hold real newlines, so the key is stored with literal
    // backslash-n and unescaped here.
    privateKey: rawKey.replace(/\\n/g, '\n'),
  };
}

function adminApp() {
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existing) return existing;

  const credentials = readCredentials();

  return initializeApp(
    {
      credential: cert(credentials),
      projectId: credentials.projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    },
    ADMIN_APP_NAME,
  );
}

export const getAdminApp = () => {
  try {
    return getApp(ADMIN_APP_NAME);
  } catch {
    return adminApp();
  }
};

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
export const adminStorage = () => getStorage(getAdminApp());
