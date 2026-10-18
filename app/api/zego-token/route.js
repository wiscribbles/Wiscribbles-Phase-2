/**
 * WITHDRAWN. Use `POST /api/sessions/token` instead.
 *
 * WHAT THIS ROUTE DID
 *
 * It accepted a `roomId` in the request body and minted a ZEGOCLOUD token for
 * it, for any signed-in, email-verified user. Nothing checked that the caller
 * had any connection to that room.
 *
 * A notarisation session is a live video call in which a client shows a notary
 * their identity documents and signs an instrument. Anyone with an account and
 * a room id — from a session of their own, from a shared screenshot, from a URL
 * in a browser history — could join one. There is no legitimate use of this
 * endpoint that `/api/sessions/token` does not cover.
 *
 * It is left here, refusing, rather than deleted, so that any call site still
 * pointing at it gets an explanation instead of a 404 that looks like a
 * deployment problem.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GONE = {
  error: 'endpoint_withdrawn',
  message:
    'This endpoint has been withdrawn because it issued video tokens for any ' +
    'room to any signed-in user. Use POST /api/sessions/token with a ' +
    'sessionId: the server proves you are a participant of that session and ' +
    'derives the room itself.',
};

export async function POST() {
  return NextResponse.json(GONE, { status: 410 });
}

export async function GET() {
  return NextResponse.json(GONE, { status: 410 });
}
