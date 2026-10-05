import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

const ELEVATED_ROLES = ['notary', 'admin'];

function fail(message, status) {
  return { error: NextResponse.json({ success: false, error: message }, { status }) };
}

// Verifies the Firebase ID token in the Authorization header.
// Usage:  const { user, error } = await requireUser(request, { roles: ['notary','admin'] });
//         if (error) return error;
export async function requireUser(request, { roles } = {}) {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) return fail('Authentication required', 401);

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(match[1]);
  } catch {
    return fail('Invalid or expired token', 401);
  }

  let role = (decoded.role || '').toString().toLowerCase();
  if (!role) {
    // Fall back to the users/{uid} profile document. This is only trustworthy
    // if Firestore rules stop users editing their own signUpAs/role field.
    const snap = await adminDb.collection('users').doc(decoded.uid).get();
    const data = snap.exists ? snap.data() : {};
    role = (data.role || data.signUpAs || '').toString().toLowerCase();
  }

  if (roles && !roles.includes(role)) return fail('Forbidden', 403);
  return { user: { uid: decoded.uid, email: decoded.email, role } };
}

export const requireNotary = (request) => requireUser(request, { roles: ELEVATED_ROLES });

// Owner of the submission, or a notary/admin.
export function canAccessSubmission(user, submission) {
  if (ELEVATED_ROLES.includes(user.role)) return true;
  const owner = submission.userId || submission.uid || submission.step1?.userId;
  return Boolean(owner) && owner === user.uid;
}
