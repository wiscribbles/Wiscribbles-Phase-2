/**
 * Support tickets.
 *
 * Brief: "This tab allows notaries to connect with WiScribbles Technical
 * Support team for any issues they may be facing."
 *
 *   GET  → this user's own tickets
 *   POST → open a new one
 *
 * Tickets are written server-side rather than straight from the browser so
 * that `openedBy` is taken from the session and the status cannot be set by
 * the person opening it.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApiUser } from '@/lib/auth/server';
import { ROLE_LABELS } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const TICKET_CATEGORIES = Object.freeze([
  { value: 'session', label: 'Problem during a session' },
  { value: 'document', label: 'Document or stamping issue' },
  { value: 'account', label: 'Account or approval' },
  { value: 'payment', label: 'Payments or payouts' },
  { value: 'other', label: 'Something else' },
]);

const MAX_SUBJECT = 140;
const MAX_BODY = 4000;
/** Stops a frustrated user turning a broken session into fifty tickets. */
const MAX_OPEN_TICKETS = 10;

export async function GET() {
  try {
    const user = await requireApiUser();

    const snapshot = await adminDb()
      .collection('supportTickets')
      .where('openedBy', '==', user.uid)
      .limit(50)
      .get();

    const tickets = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));

    return NextResponse.json({ tickets, categories: TICKET_CATEGORIES });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireApiUser();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const subject = String(body?.subject ?? '').trim();
    const message = String(body?.message ?? '').trim();
    const category = String(body?.category ?? 'other');

    const errors = {};
    if (subject.length < 4) errors.subject = 'Give the issue a short title.';
    if (subject.length > MAX_SUBJECT) errors.subject = `Keep it under ${MAX_SUBJECT} characters.`;
    if (message.length < 10) errors.message = 'Describe what happened.';
    if (message.length > MAX_BODY) errors.message = `Keep it under ${MAX_BODY} characters.`;
    if (!TICKET_CATEGORIES.some((c) => c.value === category)) {
      errors.category = 'Choose a category.';
    }

    if (Object.keys(errors).length) {
      return NextResponse.json({ error: 'validation_failed', errors }, { status: 422 });
    }

    const openCount = await adminDb()
      .collection('supportTickets')
      .where('openedBy', '==', user.uid)
      .where('status', '==', 'open')
      .count()
      .get()
      .then((result) => result.data().count)
      .catch(() => 0);

    if (openCount >= MAX_OPEN_TICKETS) {
      return NextResponse.json(
        {
          error: 'too_many_open',
          message:
            'You already have several open tickets. Please reply on an existing ' +
            'one rather than opening another.',
        },
        { status: 429 },
      );
    }

    const now = new Date().toISOString();

    const ticket = {
      openedBy: user.uid,
      openedByEmail: user.email,
      openedByName: user.name ?? null,
      openedByRole: user.role,
      openedByRoleLabel: ROLE_LABELS[user.role] ?? user.role,
      subject,
      message,
      category,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };

    const created = await adminDb().collection('supportTickets').add(ticket);

    return NextResponse.json({ ok: true, id: created.id, ticket });
  } catch (error) {
    return authErrorResponse(error);
  }
}
