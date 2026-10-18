/**
 * Notarisation sessions.
 *
 * A session is the live meeting: the video call, the document on screen, and
 * the professional's act of sealing it. This file owns who is in a session,
 * what state it is in, and — the part that matters most — whether it is
 * permitted to start at all.
 *
 * THE HOLE THIS CLOSES
 *
 * Phase 1 shipped `app/api/zego-token/route.js`, which mints a ZEGOCLOUD token
 * for any `roomId` the caller sends, for any signed-in user. Nothing checked
 * that the caller had anything to do with that room. A client who had been
 * through one notarisation — or anyone with an account and a guessable room id
 * — could join someone else's session: a live video call between a notary and
 * a stranger, with that stranger's identity documents on screen.
 *
 * `assertParticipant` below is the fix, and `app/api/sessions/token` is the
 * route that uses it. The old route is left in place but refuses to mint for a
 * room the caller is not in; see the note there.
 *
 * THE LOCKOUT
 *
 * Brief: "The session interface MUST display an explicit check that the
 * Document Jurisdiction matches the Professional Jurisdiction. If they do not
 * match, the session MUST NOT PROCEED."
 *
 * So the check runs twice, for two different purposes, and both are necessary:
 *   - at session creation, as a REFUSAL — no session document is written and no
 *     token can be minted, because a token is only issued to a participant of
 *     an existing session;
 *   - in the session view, as a DISPLAY — the brief asks for it to be visible,
 *     and a professional about to put their seal on something should be able to
 *     see on what authority they are doing it.
 *
 * The displayed check reads the result recorded at creation rather than
 * recomputing it in the browser, so what the professional sees is the decision
 * the server actually made.
 */

import { adminDb } from '@/lib/firebase-admin';
import { ROLES, isWorkingPartner, normalizeRole } from '@/lib/roles';
import { checkJurisdictionLockout, getJurisdiction } from '@/lib/jurisdictions';
import { QUEUE_COLLECTION, QUEUE_STATUS } from '@/lib/queue';

export const SESSIONS_COLLECTION = 'sessions';

export const SESSION_STATUS = Object.freeze({
  /** Created, nobody has joined. */
  READY: 'ready',
  /** At least one participant is in the room. */
  LIVE: 'live',
  /** The professional has executed the document. */
  EXECUTED: 'executed',
  /** Ended without execution. */
  ABANDONED: 'abandoned',
});

/** Statuses in which a token may still be issued. */
export const JOINABLE_STATUSES = Object.freeze([
  SESSION_STATUS.READY,
  SESSION_STATUS.LIVE,
]);

/**
 * How long a session token lasts.
 *
 * One hour was the Phase 1 value and is too long: a token is a bearer
 * credential for a live video call, and an hour of validity means an hour in
 * which a leaked token works. Twenty minutes with the client re-requesting is
 * long enough that nobody is interrupted mid-sentence by a refresh they cannot
 * see, and short enough that a leak expires while the call is still happening.
 */
export const TOKEN_TTL_SECONDS = 20 * 60;

export class SessionError extends Error {
  constructor(code, message, status = 409) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Room ids are derived, never supplied.
 *
 * The Phase 1 route took the room id from the request body, which is what made
 * it possible to ask for someone else's room. Here the room id is a function of
 * the session id, so there is no input to tamper with: a caller can only reach
 * a room by naming a session they are a participant of.
 */
export const roomIdFor = (sessionId) => `wis-${sessionId}`;

/* ------------------------------------------------------------------------- */
/* Creation                                                                   */
/* ------------------------------------------------------------------------- */

/**
 * Open a session for a queue entry the professional has already accepted.
 *
 * Idempotent: called again for the same entry it returns the existing session
 * rather than creating a second one. A professional whose browser reloaded
 * mid-join should not end up with two rooms and a client in the other one.
 *
 * @throws {SessionError} including the lockout refusal
 */
export async function openSession({ entryId, professional }) {
  if (!isWorkingPartner(professional.role)) {
    throw new SessionError('wrong_role', 'Only a Notary or Commissioner of Oaths opens a session.', 403);
  }

  const db = adminDb();
  const entryRef = db.collection(QUEUE_COLLECTION).doc(entryId);

  const { sessionId, created, payload } = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(entryRef);

    if (!snapshot.exists) {
      throw new SessionError('not_found', 'That request no longer exists.', 404);
    }

    const entry = snapshot.data();

    if (entry.assignedTo !== professional.uid) {
      // 404 rather than 403: a professional who does not hold this entry has
      // no business learning that it exists or who does hold it.
      throw new SessionError('not_found', 'That request is not assigned to you.', 404);
    }

    // Already open — hand back the same room.
    if (entry.sessionId) {
      return { sessionId: entry.sessionId, created: false, payload: null };
    }

    if (![QUEUE_STATUS.ASSIGNED, QUEUE_STATUS.IN_SESSION].includes(entry.status)) {
      throw new SessionError(
        'not_assigned',
        'That request is not in a state where a session can start.',
      );
    }

    /* THE REFUSAL. Last gate before a live notarisation. It has run at
       creation of the queue entry and again inside the accept transaction;
       this is the last moment at which it can stop an instrument being
       executed somewhere it has no effect. */
    const lockout = checkJurisdictionLockout({
      documentJurisdiction: entry.jurisdiction,
      professionalJurisdictions: professional.jurisdictions ?? [],
      documentCategory: entry.documentCategory ?? null,
    });

    if (!lockout.allowed) {
      throw new SessionError('jurisdiction_lockout', lockout.message, 403);
    }

    const ref = db.collection(SESSIONS_COLLECTION).doc();
    const now = new Date().toISOString();

    const participantIds = [professional.uid, entry.clientId].filter(Boolean);

    transaction.set(ref, {
      queueEntryId: entryId,
      documentId: entry.documentId ?? null,
      templateId: entry.templateId ?? null,
      templateName: entry.templateName ?? null,
      documentCategory: entry.documentCategory ?? null,
      jurisdiction: entry.jurisdiction ?? null,
      serviceType: entry.serviceType ?? null,

      professionalId: professional.uid,
      professionalName: professional.name ?? null,
      professionalRole: normalizeRole(professional.role),
      professionalJurisdictions: professional.jurisdictions ?? [],

      clientId: entry.clientId ?? null,
      clientName: entry.clientName ?? null,

      // The rule on /sessions/{id} keys reads off this.
      participantIds,

      /* The lockout result is RECORDED, not just acted on. The session view
         displays this rather than recomputing the check in the browser, so
         what the professional sees is the decision the server made — and a
         later audit can see what the platform believed at the time. */
      jurisdictionCheck: {
        documentJurisdiction: entry.jurisdiction ?? null,
        professionalJurisdictions: professional.jurisdictions ?? [],
        result: 'allowed',
        statute: getJurisdiction(entry.jurisdiction)?.statute ?? null,
        checkedAt: now,
      },

      status: SESSION_STATUS.READY,
      createdAt: now,
      updatedAt: now,
    });

    transaction.update(entryRef, {
      status: QUEUE_STATUS.IN_SESSION,
      sessionId: ref.id,
      updatedAt: now,
    });

    /* Stamp the professional onto the DOCUMENT as well as the session. This is
       what lets them open the file: the party test on /api/files and in
       firestore.rules reads `assignedProfessionalId`, so without this the
       notary would be in a session holding a document they cannot see. */
    if (entry.documentId) {
      transaction.update(db.collection('documents').doc(entry.documentId), {
        assignedProfessionalId: professional.uid,
        professionalName: professional.name ?? null,
        professionalRole: normalizeRole(professional.role),
        sessionId: ref.id,
        updatedAt: now,
      });
    }

    return {
      sessionId: ref.id,
      created: true,
      payload: { jurisdiction: entry.jurisdiction, documentId: entry.documentId ?? null },
    };
  });

  if (created) {
    await adminDb()
      .collection('auditLog')
      .add({
        type: 'session_opened',
        sessionId,
        entryId,
        documentId: payload?.documentId ?? null,
        jurisdiction: payload?.jurisdiction ?? null,
        actorUid: professional.uid,
        actorEmail: professional.email,
        actorRole: normalizeRole(professional.role),
        at: new Date().toISOString(),
      })
      .catch((error) => console.error('[sessions] audit write failed', error));
  }

  return { sessionId, created };
}

/* ------------------------------------------------------------------------- */
/* Participation                                                              */
/* ------------------------------------------------------------------------- */

/**
 * Load a session and assert that this user belongs in it.
 *
 * THE function this file exists for. Every path into a session — the view, the
 * token, the execution — goes through here, so there is one place that decides
 * who is in a room and it cannot be forgotten by a route that only needed the
 * session id.
 *
 * The Website Manager is NOT admitted by this. An admin can read a session's
 * record from the repository; silently joining a live call between a notary and
 * a client is a different act, and one neither party has been told about.
 */
export async function assertParticipant(sessionId, user) {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new SessionError('invalid_session', 'No session named.', 400);
  }

  const snapshot = await adminDb().collection(SESSIONS_COLLECTION).doc(sessionId).get();

  if (!snapshot.exists) {
    throw new SessionError('not_found', 'No such session.', 404);
  }

  const session = snapshot.data();
  const participants = Array.isArray(session.participantIds) ? session.participantIds : [];

  if (!participants.includes(user.uid)) {
    // Deliberately 404. A 403 would confirm the session exists to someone
    // probing for other people's sessions.
    throw new SessionError('not_found', 'No such session.', 404);
  }

  return { id: sessionId, ...session };
}

/** Is this user the professional conducting the session? */
export const isConductingProfessional = (session, user) =>
  session.professionalId === user.uid &&
  isWorkingPartner(user.role) &&
  normalizeRole(user.role) === normalizeRole(session.professionalRole);

/**
 * May a token be minted for this session right now?
 *
 * Separate from `assertParticipant` because being a party to a session is not
 * the same as that session being open. A finished session's participants
 * should not be able to re-enter the room weeks later.
 */
export function assertJoinable(session) {
  if (!JOINABLE_STATUSES.includes(session.status)) {
    throw new SessionError(
      'session_closed',
      session.status === SESSION_STATUS.EXECUTED
        ? 'That session has finished and the document has been executed.'
        : 'That session has ended.',
    );
  }

  /* The recorded lockout is re-read rather than trusted blindly. If a session
     somehow exists with a refused check — a bug, or a hand-edited document —
     no token is issued. Belt and braces, but the thing being braced is a live
     notarisation. */
  if (session.jurisdictionCheck && session.jurisdictionCheck.result !== 'allowed') {
    throw new SessionError(
      'jurisdiction_lockout',
      'This session cannot proceed: the jurisdiction check did not pass.',
      403,
    );
  }

  return true;
}

/** Mark a session live on first join. Cheap, idempotent, best-effort. */
export async function markLive(sessionId, session) {
  if (session.status !== SESSION_STATUS.READY) return;

  await adminDb()
    .collection(SESSIONS_COLLECTION)
    .doc(sessionId)
    .set(
      {
        status: SESSION_STATUS.LIVE,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    )
    .catch((error) => console.error('[sessions] could not mark live', { sessionId, error }));
}

/** The session as the view needs it. No storage paths; no other party's email. */
export function shapeForParticipant(session, user) {
  const asProfessional = isConductingProfessional(session, user);

  return {
    id: session.id,
    status: session.status,
    role: asProfessional ? 'professional' : 'client',

    documentId: session.documentId ?? null,
    templateName: session.templateName ?? null,
    documentCategory: session.documentCategory ?? null,
    jurisdiction: session.jurisdiction ?? null,
    serviceType: session.serviceType ?? null,

    professionalName: session.professionalName ?? null,
    professionalRole: session.professionalRole ?? null,
    clientName: session.clientName ?? null,

    /* The brief's explicit check, as recorded by the server at creation. */
    jurisdictionCheck: session.jurisdictionCheck ?? null,

    executedAt: session.executedAt ?? null,
    startedAt: session.startedAt ?? null,
  };
}

export const SERVICE_LABEL = Object.freeze({
  notarization: 'Notarisation',
  commissioning: 'Commissioning of oaths',
});

export const PROFESSIONAL_LABEL = Object.freeze({
  [ROLES.NOTARY]: 'Notary Public',
  [ROLES.COATH]: 'Commissioner of Oaths',
});
