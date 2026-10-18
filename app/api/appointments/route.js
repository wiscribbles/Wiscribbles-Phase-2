/**
 * Appointments.
 *
 *   GET    → this account's appointments, plus the bookable window and options
 *   POST   → create one
 *   PATCH  → cancel one  ({ id, status: 'cancelled' })
 *
 * The booking horizon is validated SERVER-SIDE, in `lib/appointments.js`. The
 * form also sets `min` and `max` on the datetime input, but that is a courtesy:
 * an input attribute is a suggestion to a browser, not a constraint on a
 * request, and the only check that counts is this one.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApprovedPartner } from '@/lib/auth/server';
import { ROLES } from '@/lib/roles';
import { listLaunchJurisdictions } from '@/lib/jurisdictions';
import {
  APPOINTMENTS_COLLECTION,
  APPOINTMENT_SERVICE_OPTIONS,
  APPOINTMENT_STATUS,
  bookingWindow,
  normalizeParticipants,
  professionalRoleFor,
  validateAppointment,
} from '@/lib/appointments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUBSCRIBERS = [ROLES.ATTORNEY, ROLES.BUSINESS];

function options() {
  return {
    serviceTypes: APPOINTMENT_SERVICE_OPTIONS,
    jurisdictions: listLaunchJurisdictions().map((j) => ({
      code: j.code,
      name: j.name,
      supportsNotarization: j.notarizationEnabled,
    })),
    window: bookingWindow(),
  };
}

export async function GET() {
  try {
    const user = await requireApprovedPartner(SUBSCRIBERS);

    const snapshot = await adminDb()
      .collection(APPOINTMENTS_COLLECTION)
      .where('createdBy', '==', user.uid)
      .orderBy('scheduledFor', 'desc')
      .limit(100)
      .get();

    const now = Date.now();

    const appointments = snapshot.docs.map((doc) => {
      const data = doc.data();
      const at = Date.parse(data.scheduledFor ?? '');

      return {
        id: doc.id,
        title: data.title ?? null,
        scheduledFor: data.scheduledFor ?? null,
        serviceType: data.serviceType ?? null,
        jurisdiction: data.jurisdiction ?? null,
        participants: data.participants ?? [],
        // A scheduled appointment whose time has passed is reported as missed
        // rather than still scheduled. Writing that back on read would be a
        // write on a GET; the sweep belongs in the session flow, so this is a
        // presentation-only correction.
        status:
          data.status === APPOINTMENT_STATUS.SCHEDULED && at && at < now - 3600000
            ? APPOINTMENT_STATUS.MISSED
            : (data.status ?? APPOINTMENT_STATUS.SCHEDULED),
        professionalRole: data.professionalRole ?? null,
        createdAt: data.createdAt ?? null,
      };
    });

    return NextResponse.json({ appointments, options: options() });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireApprovedPartner(SUBSCRIBERS);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const candidate = {
      title: String(body?.title ?? '').trim(),
      scheduledFor: String(body?.scheduledFor ?? ''),
      serviceType: String(body?.serviceType ?? ''),
      jurisdiction: String(body?.jurisdiction ?? ''),
      participants: normalizeParticipants(body?.participants),
    };

    const { valid, errors } = validateAppointment(candidate);
    if (!valid) {
      return NextResponse.json({ error: 'validation_failed', errors }, { status: 422 });
    }

    const now = new Date().toISOString();

    const created = await adminDb()
      .collection(APPOINTMENTS_COLLECTION)
      .add({
        ...candidate,
        // Stored in ISO so the string ordering the query relies on is also
        // chronological ordering.
        scheduledFor: new Date(candidate.scheduledFor).toISOString(),
        status: APPOINTMENT_STATUS.SCHEDULED,
        professionalRole: professionalRoleFor(candidate.serviceType),
        createdBy: user.uid,
        createdByEmail: user.email,
        createdByRole: user.role,
        participantIds: [user.uid],
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const user = await requireApprovedPartner(SUBSCRIBERS);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const id = String(body?.id ?? '');
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    // Cancelling is the only change permitted. An appointment whose time or
    // service type could be edited after invitations went out is an appointment
    // the participants cannot rely on; they can cancel and rebook instead.
    if (body?.status !== APPOINTMENT_STATUS.CANCELLED) {
      return NextResponse.json(
        {
          error: 'unsupported',
          message: 'An appointment can be cancelled, not edited. Cancel and book again.',
        },
        { status: 400 },
      );
    }

    const ref = adminDb().collection(APPOINTMENTS_COLLECTION).doc(id);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (snapshot.data().createdBy !== user.uid) {
      // Not 403 — a 403 confirms the appointment exists to someone who should
      // not know that.
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (snapshot.data().status === APPOINTMENT_STATUS.COMPLETED) {
      return NextResponse.json(
        { error: 'already_completed', message: 'That appointment has already taken place.' },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    await ref.set(
      { status: APPOINTMENT_STATUS.CANCELLED, cancelledAt: now, updatedAt: now },
      { merge: true },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
