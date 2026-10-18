/**
 * Go Live / Offline, and the presence heartbeat.
 *
 *   GET  → current state plus whether this professional is allowed to go live
 *   POST → { isOnline: boolean }        toggle
 *          { heartbeat: true }          refresh presence without changing state
 *
 * The availability document is written only here. The jurisdictions it carries
 * are read from the approved profile and never from the request body, because
 * the queue match is by jurisdiction: a professional who could name their own
 * jurisdictions could receive work in a country they are not licensed in.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApprovedPartner } from '@/lib/auth/server';
import { ROLES, normalizeStatus } from '@/lib/roles';
import {
  AVAILABILITY_COLLECTION,
  HEARTBEAT_INTERVAL_MS,
  checkEligibility,
  isLive,
} from '@/lib/availability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The profile as the eligibility check needs it — claims alone are not enough. */
async function loadProfile(uid, sessionUser) {
  const snapshot = await adminDb().collection('users').doc(uid).get();
  const data = snapshot.exists ? snapshot.data() : {};

  return {
    ...data,
    // Claims win over the document for role and status, as everywhere else.
    role: sessionUser.role,
    status: normalizeStatus(data.status ?? sessionUser.status),
    jurisdictions: Array.isArray(data.jurisdictions) ? data.jurisdictions : [],
  };
}

export async function GET() {
  try {
    const user = await requireApprovedPartner([ROLES.NOTARY, ROLES.COATH]);

    const [profile, snapshot] = await Promise.all([
      loadProfile(user.uid, user),
      adminDb().collection(AVAILABILITY_COLLECTION).doc(user.uid).get(),
    ]);

    const eligibility = checkEligibility(profile);
    const record = snapshot.exists ? snapshot.data() : null;

    return NextResponse.json({
      isOnline: isLive(record),
      // Distinguish "they turned it off" from "we stopped hearing from them",
      // because only the second one needs explaining in the UI.
      stale: Boolean(record?.isOnline) && !isLive(record),
      jurisdictions: eligibility.jurisdictions,
      eligible: eligibility.eligible,
      reason: eligibility.reason,
      message: eligibility.message,
      heartbeatMs: HEARTBEAT_INTERVAL_MS,
      lastSeenAt: record?.lastSeenAt ?? null,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireApprovedPartner([ROLES.NOTARY, ROLES.COATH]);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const profile = await loadProfile(user.uid, user);
    const eligibility = checkEligibility(profile);
    const ref = adminDb().collection(AVAILABILITY_COLLECTION).doc(user.uid);
    const now = new Date().toISOString();

    /* ---- heartbeat ---------------------------------------------------- */
    if (body?.heartbeat === true) {
      // A heartbeat from someone who has since become ineligible — suspended
      // mid-shift, say — takes them offline rather than silently extending
      // presence they no longer qualify for.
      if (!eligibility.eligible) {
        await ref.set(
          { isOnline: false, offlineReason: eligibility.reason, updatedAt: now },
          { merge: true },
        );
        return NextResponse.json(
          { isOnline: false, eligible: false, reason: eligibility.reason, message: eligibility.message },
          { status: 409 },
        );
      }

      const snapshot = await ref.get();
      if (!snapshot.exists || snapshot.data()?.isOnline !== true) {
        // Nothing to refresh. Not an error — the tab may have been open while
        // the professional went offline in another one.
        return NextResponse.json({ isOnline: false, eligible: true });
      }

      await ref.set({ lastSeenAt: now, updatedAt: now }, { merge: true });
      return NextResponse.json({ isOnline: true, eligible: true, lastSeenAt: now });
    }

    /* ---- toggle -------------------------------------------------------- */
    if (typeof body?.isOnline !== 'boolean') {
      return NextResponse.json(
        { error: 'invalid_body', message: 'Send isOnline as a boolean, or heartbeat: true.' },
        { status: 400 },
      );
    }

    // Going offline is always permitted. Blocking it would be absurd: an
    // ineligible professional is exactly who should be able to stop working.
    if (body.isOnline === false) {
      await ref.set(
        { isOnline: false, jurisdictions: eligibility.jurisdictions, offlineReason: 'manual', updatedAt: now },
        { merge: true },
      );
      return NextResponse.json({ isOnline: false });
    }

    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: 'not_eligible',
          reason: eligibility.reason,
          message: eligibility.message,
        },
        { status: 403 },
      );
    }

    await ref.set(
      {
        isOnline: true,
        // Copied from the approved profile. See the note at the top.
        jurisdictions: eligibility.jurisdictions,
        role: user.role,
        lastSeenAt: now,
        wentLiveAt: now,
        offlineReason: null,
        updatedAt: now,
      },
      { merge: true },
    );

    return NextResponse.json({
      isOnline: true,
      jurisdictions: eligibility.jurisdictions,
      heartbeatMs: HEARTBEAT_INTERVAL_MS,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
