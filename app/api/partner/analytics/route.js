/**
 * The Analytics tab, for every partner role.
 *
 *   GET → counts for this partner over the chosen window
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * It does not invent numbers. An analytics panel full of plausible-looking
 * figures is worse than an empty one, because the empty one tells you the truth
 * about how much work has gone through the platform. Every figure below is
 * counted from documents that exist; where a figure cannot be counted yet —
 * earnings, which need the payment ledger that is parked pending the
 * money-transmission decision — the response says so rather than returning a
 * zero that reads as "you have earned nothing".
 *
 * Counting is done with Firestore aggregation queries (`count()`) where
 * possible, which bill per query rather than per document read.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApprovedPartner } from '@/lib/auth/server';
import { isWorkingPartner } from '@/lib/roles';
import { QUEUE_COLLECTION, QUEUE_STATUS } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOWS = Object.freeze({
  '7d': { label: 'Last 7 days', days: 7 },
  '30d': { label: 'Last 30 days', days: 30 },
  '90d': { label: 'Last 90 days', days: 90 },
  all: { label: 'All time', days: null },
});

const since = (days) =>
  days === null ? null : new Date(Date.now() - days * 86400000).toISOString();

/** `count()` with a fallback, because an aggregation needs its index in place. */
async function countOf(query) {
  try {
    const snapshot = await query.count().get();
    return snapshot.data().count;
  } catch {
    // Missing index, or an emulator without aggregation support. Fall back to
    // a bounded read rather than failing the whole panel.
    const snapshot = await query.limit(1000).get();
    return snapshot.size;
  }
}

async function workingPartnerFigures(uid, from) {
  const base = () => {
    let query = adminDb().collection(QUEUE_COLLECTION).where('assignedTo', '==', uid);
    if (from) query = query.where('assignedAt', '>=', from);
    return query;
  };

  const [accepted, completed, inProgress] = await Promise.all([
    countOf(base()),
    countOf(base().where('status', '==', QUEUE_STATUS.COMPLETED)),
    countOf(
      base().where('status', 'in', [QUEUE_STATUS.ASSIGNED, QUEUE_STATUS.IN_SESSION]),
    ),
  ]);

  return {
    cards: [
      { key: 'accepted', label: 'Requests accepted', value: accepted },
      { key: 'completed', label: 'Sessions completed', value: completed },
      { key: 'in_progress', label: 'Open right now', value: inProgress },
      {
        key: 'completion_rate',
        label: 'Completion rate',
        value: accepted === 0 ? null : `${Math.round((completed / accepted) * 100)}%`,
        empty: 'No accepted requests in this period.',
      },
    ],
    pending: [
      {
        key: 'earnings',
        label: 'Earnings',
        note:
          'Earnings appear here once the payment ledger is live. Service-fee ' +
          'distribution is on hold pending the money-transmission question, ' +
          'so there is nothing to report rather than nothing earned.',
      },
    ],
  };
}

async function subscriberFigures(uid, from) {
  const documents = () => {
    let query = adminDb().collection('documents').where('ownerId', '==', uid);
    if (from) query = query.where('createdAt', '>=', from);
    return query;
  };

  const appointments = () => {
    let query = adminDb().collection('appointments').where('createdBy', '==', uid);
    if (from) query = query.where('createdAt', '>=', from);
    return query;
  };

  const [uploaded, signed, booked, completedAppointments] = await Promise.all([
    countOf(documents()),
    countOf(documents().where('status', '==', 'signed')),
    countOf(appointments()),
    countOf(appointments().where('status', '==', 'completed')),
  ]);

  return {
    cards: [
      { key: 'documents', label: 'Documents created', value: uploaded },
      { key: 'signed', label: 'Fully signed', value: signed },
      { key: 'appointments', label: 'Appointments booked', value: booked },
      { key: 'appointments_done', label: 'Appointments completed', value: completedAppointments },
    ],
    pending: [
      {
        key: 'spend',
        label: 'Subscription and usage',
        note:
          'Billing figures appear on the Invoice tab once payment collection ' +
          'is switched on.',
      },
    ],
  };
}

export async function GET(request) {
  try {
    const user = await requireApprovedPartner();

    const { searchParams } = new URL(request.url);
    const requested = searchParams.get('window') ?? '30d';
    const window = WINDOWS[requested] ? requested : '30d';
    const from = since(WINDOWS[window].days);

    const figures = isWorkingPartner(user.role)
      ? await workingPartnerFigures(user.uid, from)
      : await subscriberFigures(user.uid, from);

    return NextResponse.json({
      window,
      windowLabel: WINDOWS[window].label,
      windows: Object.entries(WINDOWS).map(([value, { label }]) => ({ value, label })),
      ...figures,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
