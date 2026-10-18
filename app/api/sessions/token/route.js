/**
 * A ZEGOCLOUD token for one session.
 *
 *   POST { sessionId } → { token, appId, userId, roomId, ttlSeconds }
 *
 * THE DIFFERENCE FROM `app/api/zego-token`
 *
 * That route took a `roomId` from the request body and minted a token for it,
 * for any signed-in user, with no check that the caller had anything to do with
 * the room. This route takes a SESSION id, proves the caller is a participant
 * of that session, confirms the session is still open and that its recorded
 * jurisdiction check passed, and only then derives the room id itself. There is
 * no caller-supplied room id anywhere in the path.
 *
 * Tokens last twenty minutes and the page re-requests. An hour of validity —
 * the Phase 1 value — is an hour in which a leaked token still works.
 */

import { NextResponse } from 'next/server';
import { authErrorResponse, requireApiUser } from '@/lib/auth/server';
import {
  SessionError,
  TOKEN_TTL_SECONDS,
  assertJoinable,
  assertParticipant,
  markLive,
  roomIdFor,
} from '@/lib/sessions';
import { VideoConfigError, mintSessionToken } from '@/lib/video/zego';
import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await requireApiUser();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const sessionId = String(body?.sessionId ?? '').trim();

    try {
      const session = await assertParticipant(sessionId, user);
      assertJoinable(session);

      const roomId = roomIdFor(sessionId);

      const minted = mintSessionToken({
        userId: user.uid,
        roomId,
        ttlSeconds: TOKEN_TTL_SECONDS,
      });

      /* First join flips the session to live. Done after minting so a failure
         to record presence never stops someone joining a call. */
      await markLive(sessionId, session);

      /* Logged once per mint. A notarisation that is later challenged turns on
         who was actually present, and a video call leaves no other trace. The
         token itself is never logged. */
      await adminDb()
        .collection('auditLog')
        .add({
          type: 'session_token_issued',
          sessionId,
          documentId: session.documentId ?? null,
          actorUid: user.uid,
          actorEmail: user.email,
          actorRole: user.role,
          asProfessional: session.professionalId === user.uid,
          at: new Date().toISOString(),
        })
        .catch((error) => console.error('[sessions/token] audit write failed', error));

      return NextResponse.json(minted);
    } catch (error) {
      if (error instanceof SessionError) {
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: error.status },
        );
      }
      if (error instanceof VideoConfigError) {
        return NextResponse.json(
          {
            error: error.code,
            message:
              'The video service is not configured on this deployment. ' +
              'The session cannot start.',
            detail: error.message,
          },
          { status: 503 },
        );
      }
      throw error;
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}
