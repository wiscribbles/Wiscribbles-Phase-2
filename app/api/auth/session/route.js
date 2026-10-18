/**
 * Session exchange.
 *
 * The browser signs in with the Firebase client SDK and gets an ID token.
 * That token is short-lived and lives in JS, where middleware cannot see it and
 * XSS can steal it. This route trades it for an httpOnly session cookie, which
 * the server can verify on every request and script cannot read.
 *
 *   POST   { idToken }  → set the session cookie
 *   DELETE              → clear it and revoke every refresh token
 */

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { SESSION_COOKIE, SESSION_MAX_AGE_MS, getSessionUser } from '@/lib/auth/server';
import { syncClaimsFromProfile } from '@/lib/auth/claims';

export const runtime = 'nodejs';
/** Never cached — it reads and writes credentials. */
export const dynamic = 'force-dynamic';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export async function POST(request) {
  let idToken;
  try {
    ({ idToken } = await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  if (typeof idToken !== 'string' || !idToken) {
    return NextResponse.json({ error: 'missing_id_token' }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(idToken, true);
  } catch {
    return NextResponse.json({ error: 'invalid_id_token' }, { status: 401 });
  }

  /*
   * Reject a token minted more than five minutes ago. A session cookie is a
   * long-lived credential, so it should only ever be issued against a fresh
   * sign-in — not against a token lifted from a stale client.
   */
  const tokenAgeSeconds = Date.now() / 1000 - decoded.auth_time;
  if (tokenAgeSeconds > 5 * 60) {
    return NextResponse.json({ error: 'stale_sign_in' }, { status: 401 });
  }

  /*
   * Make sure the token carries current role/status before the cookie is cut,
   * otherwise the first request after an admin decision still sees the old one.
   * Failure here is not fatal — the server guards fall back to the Firestore
   * profile — so a claims hiccup must not block sign-in.
   */
  try {
    await syncClaimsFromProfile(decoded.uid);
  } catch (error) {
    console.error('[auth/session] claim sync failed', { uid: decoded.uid, error });
  }

  let sessionCookie;
  try {
    sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });
  } catch {
    return NextResponse.json({ error: 'session_creation_failed' }, { status: 401 });
  }

  // Record the sign-in for the admin audit trail. Best-effort.
  try {
    await adminDb()
      .collection('users')
      .doc(decoded.uid)
      .set({ lastSignInAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error('[auth/session] lastSignInAt write failed', { uid: decoded.uid, error });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, sessionCookie, {
    ...cookieOptions,
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
  return response;
}

export async function DELETE() {
  // Clear the cookie regardless of what happens below, so a broken session
  // can always be signed out of.
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });

  try {
    const user = await getSessionUser();
    if (user) await adminAuth().revokeRefreshTokens(user.uid);
  } catch (error) {
    console.error('[auth/session] revoke on sign-out failed', error);
  }

  return response;
}
