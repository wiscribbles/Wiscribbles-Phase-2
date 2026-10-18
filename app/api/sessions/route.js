/**
 * Sessions.
 *
 *   POST { entryId }  → open (or re-open) the session for an accepted request.
 *                       Professional only. Runs the jurisdiction lockout.
 *   GET  ?id=…        → the session, for a participant.
 *
 * Opening is idempotent. A professional whose browser reloaded mid-join gets
 * the same room back rather than a second one with the client in the first.
 */

import { NextResponse } from 'next/server';
import { authErrorResponse, requireApiUser, requireApprovedPartner } from '@/lib/auth/server';
import { ROLES } from '@/lib/roles';
import {
  SessionError,
  assertParticipant,
  openSession,
  shapeForParticipant,
} from '@/lib/sessions';
import { isVideoConfigured } from '@/lib/video/zego';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const professional = await requireApprovedPartner([ROLES.NOTARY, ROLES.COATH]);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const entryId = String(body?.entryId ?? '').trim();
    if (!entryId) {
      return NextResponse.json({ error: 'missing_entry' }, { status: 400 });
    }

    try {
      const { sessionId, created } = await openSession({ entryId, professional });
      return NextResponse.json({ ok: true, sessionId, created });
    } catch (error) {
      if (error instanceof SessionError) {
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: error.status },
        );
      }
      throw error;
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function GET(request) {
  try {
    const user = await requireApiUser();
    const id = new URL(request.url).searchParams.get('id');

    try {
      const session = await assertParticipant(id, user);

      return NextResponse.json({
        session: shapeForParticipant(session, user),
        /* Reported so the view can say "video is not configured" rather than
           showing an empty black panel and letting the professional wonder
           whether the client's camera is broken. */
        videoConfigured: isVideoConfigured(),
      });
    } catch (error) {
      if (error instanceof SessionError) {
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: error.status },
        );
      }
      throw error;
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}
