/**
 * Legacy notarisation submissions — the Website Manager's workflow controls.
 *
 * `formSubmissions` is a Phase 1 collection. Phase 2 work lives in
 * `documents`, and the two are not being merged here. What this module does is
 * make the existing admin screen work, because until Phase 1 submissions are
 * migrated the Website Manager still has to move real jobs through it, and the
 * buttons have been failing.
 *
 * WHY THIS IS A SERVER MODULE AT ALL. The page used to call `updateDoc` from
 * the browser. `firestore.rules` denies every client write to
 * `formSubmissions` — correctly, since Phase 1 left the collection open to any
 * signed-in user — so the write failed, the page caught the error and logged
 * it, and the manager saw a button that did nothing. Moving the write here is
 * what makes it possible for the rule to stay closed.
 *
 * WHY THE STATUS IS AN ALLOW-LIST AND THE UPDATE IS NOT A SPREAD. The old call
 * was `updateDoc(ref, { ...updates, lastUpdatedAt })` with `updates` coming
 * from the browser. On a server route that pattern is worse than it looks: the
 * route runs with Admin credentials and is not subject to the rules, so
 * whatever keys arrive get written. An allow-list of statuses and an explicit
 * field list mean a malformed or hostile request can only ever set the two
 * fields this screen is about.
 */

import 'server-only';
import { adminDb } from '@/lib/firebase-admin';

const COLLECTION = 'formSubmissions';

/**
 * The statuses this screen can set. `pending` is included because a job sent
 * back for reassignment has to be able to return to the queue; without it the
 * workflow is one-way and a mis-click is unrecoverable.
 */
export const SUBMISSION_STATUS = Object.freeze({
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  NOTARIZED: 'notarized',
});

export const SUBMISSION_STATUS_LABELS = Object.freeze({
  [SUBMISSION_STATUS.PENDING]: 'Waiting to be assigned',
  [SUBMISSION_STATUS.ASSIGNED]: 'Assigned',
  [SUBMISSION_STATUS.IN_PROGRESS]: 'In progress',
  [SUBMISSION_STATUS.COMPLETED]: 'Completed',
  [SUBMISSION_STATUS.NOTARIZED]: 'Notarised',
});

const ALLOWED = new Set(Object.values(SUBMISSION_STATUS));

export class SubmissionError extends Error {
  constructor(code, message, status = 422) {
    super(message);
    this.name = 'SubmissionError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Move one submission to a new status.
 *
 * @param {object} args
 * @param {string} args.submissionId
 * @param {string} args.status  one of SUBMISSION_STATUS
 * @param {object} args.actor   `{ uid, email }` of the Website Manager
 */
export async function updateSubmissionStatus({ submissionId, status, actor }) {
  const id = String(submissionId ?? '').trim();

  if (!id) {
    throw new SubmissionError('missing_id', 'No submission was identified.', 400);
  }

  if (!ALLOWED.has(status)) {
    throw new SubmissionError(
      'unknown_status',
      `"${status}" is not a status this screen can set.`,
      422,
    );
  }

  const ref = adminDb().collection(COLLECTION).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new SubmissionError('not_found', 'No such submission.', 404);
  }

  const previous = snapshot.data().status ?? null;
  const now = new Date().toISOString();

  /* `workflowStage` is written alongside `status` because the Phase 1 screen
     reads whichever it finds and the two drifting apart is how a job shows as
     assigned in one column and pending in another. Written explicitly, not
     spread from the request. */
  await ref.set(
    {
      status,
      workflowStage: status,
      lastUpdatedAt: now,
      lastUpdatedBy: { uid: actor.uid, email: actor.email },
    },
    { merge: true },
  );

  await adminDb()
    .collection('auditLog')
    .add({
      type: 'submission_status_changed',
      submissionId: id,
      /* Both ends of the transition. A trail that records only the new value
         cannot answer "who moved this back to pending". */
      from: previous,
      to: status,
      actorUid: actor.uid,
      actorEmail: actor.email,
      at: now,
    })
    .catch((error) => console.error('[submissions] audit write failed', error));

  return { id, status, previous };
}
