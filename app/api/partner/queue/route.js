/**
 * The waiting queue, as a live professional sees it.
 *
 *   GET → { entries, active, isOnline }
 *
 * Entries are redacted (see `lib/queue.js`). The entry this professional has
 * already accepted comes back in full, because by then they are the one
 * handling it.
 *
 * WHY THIS IS A POLLED ROUTE AND NOT A FIRESTORE LISTENER
 *
 * The brief asks for the queue in real time, and `onSnapshot` would be the
 * obvious way to do it. It is the wrong way here. A listener reads documents
 * directly, so every field of every waiting request would reach every live
 * professional's browser — including the client's name and the document
 * reference, which nobody should see before they have the work. Redaction can
 * only happen on the server, so the queue is fetched from the server. Polling
 * every few seconds is indistinguishable from realtime for a human watching a
 * queue, and it keeps client identities server-side until acceptance.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApprovedPartner } from '@/lib/auth/server';
import { ROLES } from '@/lib/roles';
import { AVAILABILITY_COLLECTION, isLive } from '@/lib/availability';
import { activeEntryFor, listQueueFor } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Seconds between polls. Fast enough to feel live, slow enough to be cheap. */
export const POLL_INTERVAL_MS = 5000;

export async function GET() {
  try {
    const user = await requireApprovedPartner([ROLES.NOTARY, ROLES.COATH]);

    const [availabilitySnapshot, active] = await Promise.all([
      adminDb().collection(AVAILABILITY_COLLECTION).doc(user.uid).get(),
      activeEntryFor(user.uid),
    ]);

    const record = availabilitySnapshot.exists ? availabilitySnapshot.data() : null;
    const online = isLive(record);

    /* An offline professional sees no queue. Not for want of permission — the
       rules would allow it — but because a queue you cannot act on is an
       invitation to watch work go past, and the Go Live toggle is what the
       brief makes the gate. The entry they already hold is still returned:
       going offline must not strand a client mid-session. */
    const entries = online
      ? await listQueueFor({
          uid: user.uid,
          role: user.role,
          // The availability document's jurisdictions were written from the
          // approved profile; the session user's come from the profile too.
          // Intersect them so a profile amended since going live takes effect
          // immediately rather than at the next toggle.
          jurisdictions: (record?.jurisdictions ?? []).filter((code) =>
            (user.jurisdictions ?? []).includes(code),
          ),
        })
      : [];

    return NextResponse.json({
      isOnline: online,
      pollMs: POLL_INTERVAL_MS,
      entries,
      active,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
