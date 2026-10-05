import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Server-only. Credentials come from the FIREBASE_SERVICE_ACCOUNT env var
// (the full service-account JSON as a single-line string), or fall back to
// Application Default Credentials. Never commit a key file.
function createApp() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    const account = JSON.parse(raw);
    if (account.private_key) {
      account.private_key = account.private_key.replace(/\n/g, '\n');
    }
    return initializeApp({ credential: cert(account) });
  }
  return initializeApp({ credential: applicationDefault() });
}

const app = getApps()[0] || createApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

try {
  // Firestore rejects `undefined` field values by default; the client SDK code
  // this replaced did the same, so keep the lenient behaviour callers rely on.
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // settings() may only be called once (hot reload) - safe to ignore
}
