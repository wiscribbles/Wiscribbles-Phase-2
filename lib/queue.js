/**
 * The service queue — clients waiting for a Notary or Commissioner of Oaths.
 *
 * Brief: "When live, the notary ... sees the waiting queue for their
 * jurisdiction(s) in real time" and "Accept Client / Decline Request".
 *
 * WHAT A PROFESSIONAL SEES BEFORE THEY ACCEPT
 *
 * Not the client. The queue is visible to every live professional holding the
 * jurisdiction, so anything in a queue card is effectively shown to a group of
 * strangers. Before acceptance a card carries the jurisdiction, the document
 * category, the template name and how long the client has been waiting — enough
 * to decide whether to take the work, and nothing that identifies anyone.
 * `redactForQueue` is the only shape that leaves the server for an unassigned
 * entry, and `lib/queue.js` is where that decision is recorded so it does not
 * get quietly undone by a later route that selects `*`.
 *
 * WHY ACCEPTING IS A TRANSACTION
 *
 * Two notaries looking at the same queue will sometimes press Accept within the
 * same second. Without a transaction both would succeed, both would open a
 * session, and the client would be in two places. `claimEntry` reads and writes
 * inside `runTransaction`, so the second one loses and is told why.
 */

import { adminDb } from '@/lib/firebase-admin';
import { ROLES, normalizeRole } from '@/lib/roles';
import { checkJurisdictionLockout } from '@/lib/jurisdictions';

export const QUEUE_COLLECTION = 'serviceQueue';

export const QUEUE_STATUS = Object.freeze({
  /** Client is waiting, nobody has taken it. */
  WAITING: 'waiting',
  /** A professional accepted; the session has not started yet. */
  ASSIGNED: 'assigned',
  /** Session in progress. */
  IN_SESSION: 'in_session',
  /** Finished normally. */
  COMPLETED: 'completed',
  /** Client withdrew. */
  CANCELLED: 'cancelled',
  /** Nobody took it in time. */
  EXPIRED: 'expired',
});

/** Statuses a professional may still act on. */
export const CLAIMABLE_STATUSES = Object.freeze([QUEUE_STATUS.WAITING]);

/**
 * How long an unanswered request stays in the queue.
 *
 * A request that has sat for an hour is almost certainly abandoned — the client
 * has closed the tab and gone elsewhere. Leaving it visible wastes the
 * professionals' attention and makes the queue look busier than it is.
 */
export const QUEUE_TTL_MS = 60 * 60 * 1000;

export const SERVICE_TYPE = Object.freeze({
  NOTARIZATION: 'notarization',
  COMMISSIONING: 'commissioning',
});

/** Which role serves which request type. */
export const ROLE_FOR_SERVICE = Object.freeze({
  [SERVICE_TYPE.NOTARIZATION]: ROLES.NOTARY,
  [SERVICE_TYPE.COMMISSIONING]: ROLES.COATH,
});

export class QueueError extends Error {
  constructor(code, message, status = 409) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/* ------------------------------------------------------------------------- */
/* Redaction                                                                  */
/* ------------------------------------------------------------------------- */

/**
 * The only shape of an unassigned queue entry that may leave the server.
 *
 * Deliberately an allow-list built field by field, not a delete-list applied to
 * the document. A delete-list silently starts leaking the moment someone adds a
 * field to the write path and forgets this file.
 */
export function redactForQueue(id, data, now = Date.now()) {
  const waitingSince = Date.parse(data?.createdAt ?? '') || now;

  return {
    id,
    status: data?.status ?? null,
    serviceType: data?.serviceType ?? null,
    jurisdiction: data?.jurisdiction ?? null,
    documentCategory: data?.documentCategory ?? null,
    templateName: data?.templateName ?? null,
    pageCount: data?.pageCount ?? null,
    waitingSeconds: Math.max(0, Math.round((now - waitingSince) / 1000)),
    /* No clientId, no client name, no document URL, no email. Those appear
       only in `detailForAssignee`, after this professional has the work. */
  };
}

/** The fuller shape, for the professional who actually holds the entry. */
export function detailForAssignee(id, data) {
  return {
    ...redactForQueue(id, data),
    clientName: data?.clientName ?? null,
    clientEmail: data?.clientEmail ?? null,
    documentId: data?.documentId ?? null,
    templateId: data?.templateId ?? null,
    assignedTo: data?.assignedTo ?? null,
    assignedAt: data?.assignedAt ?? null,
    sessionId: data?.sessionId ?? null,
    notes: data?.notes ?? null,
  };
}

/* ------------------------------------------------------------------------- */
/* Reading the queue                                                          */
/* ------------------------------------------------------------------------- */

/**
 * The queue as this professional should see it.
 *
 * Filtered by jurisdiction, by service type matching their role, and with
 * anything they have already declined removed — a declined request reappearing
 * on every poll is the fastest way to make a queue unusable.
 */
export async function listQueueFor({ uid, role, jurisdictions }) {
  const normalized = normalizeRole(role);
  const serviceType = Object.keys(ROLE_FOR_SERVICE).find(
    (type) => ROLE_FOR_SERVICE[type] === normalized,
  );

  if (!serviceType || !jurisdictions?.length) return [];

  const now = Date.now();

  /* Firestore allows at most 30 values in an `in` filter and will not combine
     two `in` filters on different fields in one query. Jurisdictions per
     professional are in the low single digits, so one query per jurisdiction is
     cheaper and simpler than fetching the whole collection and filtering. */
  const queries = jurisdictions.slice(0, 10).map((code) =>
    adminDb()
      .collection(QUEUE_COLLECTION)
      .where('status', '==', QUEUE_STATUS.WAITING)
      .where('serviceType', '==', serviceType)
      .where('jurisdiction', '==', code)
      .orderBy('createdAt', 'asc')
      .limit(50)
      .get(),
  );

  const snapshots = await Promise.all(queries);

  const entries = [];
  const seen = new Set();

  for (const snapshot of snapshots) {
    for (const doc of snapshot.docs) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);

      const data = doc.data();

      // Hide the ones this professional has already passed on.
      if (Array.isArray(data.declinedBy) && data.declinedBy.includes(uid)) continue;

      // Hide the ones that have timed out. They are swept lazily rather than by
      // a scheduled job, because a request nobody can see does no harm sitting
      // in the collection until the next sweep.
      const age = now - (Date.parse(data.createdAt ?? '') || now);
      if (age > QUEUE_TTL_MS) continue;

      entries.push(redactForQueue(doc.id, data, now));
    }
  }

  // Oldest first. The person who has waited longest is served first, which is
  // both fair and the only ordering a waiting client would accept.
  return entries.sort((a, b) => b.waitingSeconds - a.waitingSeconds);
}

/* ------------------------------------------------------------------------- */
/* Accepting                                                                  */
/* ------------------------------------------------------------------------- */

/**
 * Accept a queue entry.
 *
 * Runs the jurisdiction lockout again inside the transaction. It has already
 * run when the entry was created and when the queue was listed — but those were
 * both earlier moments, and the professional's licensed jurisdictions can
 * change in between (the Website Manager can amend or suspend an account at
 * any time). The check that counts is the one immediately before the work
 * starts.
 *
 * @returns {Promise<{ id: string, entry: object }>}
 * @throws {QueueError}
 */
export async function claimEntry({ entryId, professional }) {
  const db = adminDb();
  const ref = db.collection(QUEUE_COLLECTION).doc(entryId);
  const now = new Date().toISOString();

  const entry = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists) {
      throw new QueueError('not_found', 'That request is no longer in the queue.', 404);
    }

    const data = snapshot.data();

    if (!CLAIMABLE_STATUSES.includes(data.status)) {
      throw new QueueError(
        'already_taken',
        data.status === QUEUE_STATUS.CANCELLED
          ? 'The client withdrew that request.'
          : 'Another professional has already taken that request.',
      );
    }

    const expectedRole = ROLE_FOR_SERVICE[data.serviceType];
    if (normalizeRole(professional.role) !== expectedRole) {
      throw new QueueError(
        'wrong_role',
        'That request is for a different kind of professional.',
        403,
      );
    }

    // The lockout. Not advisory — the session does not open without it.
    const lockout = checkJurisdictionLockout({
      documentJurisdiction: data.jurisdiction,
      professionalJurisdictions: professional.jurisdictions ?? [],
      documentCategory: data.documentCategory ?? null,
    });

    if (!lockout.allowed) {
      throw new QueueError('jurisdiction_lockout', lockout.message, 403);
    }

    transaction.update(ref, {
      status: QUEUE_STATUS.ASSIGNED,
      assignedTo: professional.uid,
      assignedToRole: normalizeRole(professional.role),
      assignedAt: now,
      updatedAt: now,
    });

    return { ...data, status: QUEUE_STATUS.ASSIGNED, assignedTo: professional.uid, assignedAt: now };
  });

  return { id: entryId, entry };
}

/**
 * Decline a queue entry.
 *
 * Records the decline against this professional rather than removing the entry,
 * so the client stays in the queue for everyone else. A client whose request
 * vanished because one notary passed on it would have no way to understand what
 * happened.
 */
export async function declineEntry({ entryId, professional, reason = null }) {
  const db = adminDb();
  const ref = db.collection(QUEUE_COLLECTION).doc(entryId);
  const now = new Date().toISOString();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists) {
      throw new QueueError('not_found', 'That request is no longer in the queue.', 404);
    }

    const data = snapshot.data();
    const declinedBy = Array.isArray(data.declinedBy) ? data.declinedBy : [];

    if (declinedBy.includes(professional.uid)) return;

    /* An entry already assigned to someone else is not this professional's to
       decline; one assigned to THEM is a withdrawal, which releases it. */
    if (data.status === QUEUE_STATUS.ASSIGNED && data.assignedTo === professional.uid) {
      transaction.update(ref, {
        status: QUEUE_STATUS.WAITING,
        assignedTo: null,
        assignedToRole: null,
        assignedAt: null,
        declinedBy: [...declinedBy, professional.uid],
        updatedAt: now,
      });
      return;
    }

    if (data.status !== QUEUE_STATUS.WAITING) {
      throw new QueueError('not_claimable', 'That request is no longer waiting.');
    }

    transaction.update(ref, {
      declinedBy: [...declinedBy, professional.uid],
      ...(reason ? { lastDeclineReason: String(reason).slice(0, 200) } : {}),
      updatedAt: now,
    });
  });

  return { ok: true };
}

/** The entry this professional currently holds, if any. */
export async function activeEntryFor(uid) {
  const snapshot = await adminDb()
    .collection(QUEUE_COLLECTION)
    .where('assignedTo', '==', uid)
    .where('status', 'in', [QUEUE_STATUS.ASSIGNED, QUEUE_STATUS.IN_SESSION])
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return detailForAssignee(doc.id, doc.data());
}

/* ------------------------------------------------------------------------- */
/* Entering the queue                                                        */
/* ------------------------------------------------------------------------- */

/**
 * Put a document into the professional queue.
 *
 * MOVED OUT OF THE REQUEST FLOW, deliberately. `submitRequest` used to create
 * the queue entry the moment a document was uploaded. That was wrong once
 * multi-party signing existed: a notary would be offered a document that none
 * of its parties had signed yet, and would sit in a session waiting for
 * signatures that might arrive days later.
 *
 * A document enters the queue when every party who can sign remotely has
 * signed — called from `recordSignature` in `lib/signing.js`. The practical
 * effect is also what the 18 Oct instruction asked for: nothing reaches the
 * queue until the people involved have actually turned up and signed.
 *
 * Idempotent: a document that already has an entry gets its existing one back,
 * so a double-submitted final signature cannot produce two queue entries for
 * one document.
 */
export async function createEntryForDocument({ documentId }) {
  const db = adminDb();
  const documentRef = db.collection('documents').doc(String(documentId));

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(documentRef);

    if (!snapshot.exists) {
      throw new QueueError('not_found', 'No such document.', 404);
    }

    const data = snapshot.data();

    if (data.queueEntryId) {
      return { entryId: data.queueEntryId, created: false };
    }

    if (!data.serviceType) {
      throw new QueueError(
        'no_professional_needed',
        'That document is e-signature only, so no professional is required.',
      );
    }

    const entryRef = db.collection(QUEUE_COLLECTION).doc();
    const now = new Date().toISOString();

    transaction.set(entryRef, {
      status: QUEUE_STATUS.WAITING,
      serviceType: data.serviceType,
      jurisdiction: data.jurisdiction ?? null,
      documentCategory: data.documentCategory ?? null,
      templateId: data.templateId ?? null,
      templateName: data.templateName ?? null,
      documentId: String(documentId),
      pageCount: data.pageCount ?? null,

      clientId: data.ownerId ?? null,
      clientName: data.ownerName ?? null,
      clientEmail: data.ownerEmail ?? null,

      declinedBy: [],
      assignedTo: null,
      assignedAt: null,
      sessionId: null,
      createdAt: now,
      updatedAt: now,
    });

    transaction.update(documentRef, { queueEntryId: entryRef.id, updatedAt: now });

    return { entryId: entryRef.id, created: true };
  });
}
