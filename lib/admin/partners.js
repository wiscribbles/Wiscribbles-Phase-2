/**
 * Website Manager decisions on partner applications.
 *
 * Brief: "Regulate partners (Notaries, COaths, Attorneys and Businesses)
 * during their sign-up process; Interface must possess the ability to accept,
 * reject or request more information from partners."
 *
 * Every decision here does four things, and the order matters:
 *   1. writes the new status to the user document
 *   2. mirrors it into the auth custom claims, which is what the security
 *      rules and server guards actually read
 *   3. appends to the audit log, because a decision about someone's livelihood
 *      is evidence and the user document only holds the latest state
 *   4. emails the partner
 *
 * Steps 1 and 2 must not drift. A partner approved in Firestore but not in
 * their claims is still locked out and has no way to know why.
 */

import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { revokeUserSessions, setUserClaims } from '@/lib/auth/claims';
import { ACCOUNT_STATUS, ROLE_LABELS, isPartnerRole, normalizeRole, normalizeStatus } from '@/lib/roles';
import { approvalEmail, moreInfoRequestedEmail, sendEmail } from '@/lib/email/send';
import { getBaseUrl } from '@/lib/apiUtils';

export const DECISION = Object.freeze({
  APPROVE: 'approve',
  REJECT: 'reject',
  REQUEST_INFO: 'request_info',
  SUSPEND: 'suspend',
  REMOVE: 'remove',
  REINSTATE: 'reinstate',
});

const STATUS_FOR_DECISION = Object.freeze({
  [DECISION.APPROVE]: ACCOUNT_STATUS.APPROVED,
  [DECISION.REJECT]: ACCOUNT_STATUS.REJECTED,
  [DECISION.REQUEST_INFO]: ACCOUNT_STATUS.MORE_INFO_REQUESTED,
  [DECISION.SUSPEND]: ACCOUNT_STATUS.SUSPENDED,
  [DECISION.REMOVE]: ACCOUNT_STATUS.REMOVED,
  [DECISION.REINSTATE]: ACCOUNT_STATUS.APPROVED,
});

/** Decisions that cut off access and so must invalidate live sessions now. */
const REVOKES_ACCESS = new Set([DECISION.REJECT, DECISION.SUSPEND, DECISION.REMOVE]);

/** Decisions the partner must be told about in writing. */
const NOTIFIES = new Set([DECISION.APPROVE, DECISION.REQUEST_INFO, DECISION.REINSTATE]);

export class DecisionError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * List applications for the review queue.
 *
 * @param {object} [options]
 * @param {string} [options.status]  filter, or 'all'
 * @param {string} [options.role]    filter, or 'all'
 * @param {number} [options.limit]
 */
export async function listPartnerApplications({
  status = ACCOUNT_STATUS.PENDING_REVIEW,
  role = 'all',
  limit = 100,
} = {}) {
  let query = adminDb().collection('users');

  if (status && status !== 'all') {
    query = query.where('status', '==', status);
  }
  if (role && role !== 'all') {
    query = query.where('role', '==', normalizeRole(role));
  }

  const snapshot = await query.limit(limit).get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.name ?? null,
        email: data.email ?? null,
        role: normalizeRole(data.role ?? data.signUpAs),
        roleLabel: ROLE_LABELS[normalizeRole(data.role ?? data.signUpAs)],
        status: normalizeStatus(data.status),
        jurisdictions: data.jurisdictions ?? [],
        kycStatus: data.kycStatus ?? 'not_started',
        certificatePath: data.certificatePath ?? null,
        certificateUploadedAt: data.certificateUploadedAt ?? null,
        adminFeedback: data.adminFeedback ?? null,
        submittedForReviewAt: data.submittedForReviewAt ?? null,
        createdAt: data.createdAt ?? null,
        suspendedUntil: data.suspendedUntil ?? null,
      };
    })
    // Only partner roles belong in this queue; clients never need approving.
    .filter((row) => isPartnerRole(row.role))
    // Oldest first — a queue where the longest wait is at the bottom is a
    // queue where the longest wait keeps growing.
    .sort((a, b) => String(a.submittedForReviewAt ?? a.createdAt ?? '').localeCompare(
      String(b.submittedForReviewAt ?? b.createdAt ?? ''),
    ));
}

/**
 * Record a decision.
 *
 * @param {object} args
 * @param {string} args.uid
 * @param {string} args.decision      one of DECISION
 * @param {string} [args.feedback]    required for REQUEST_INFO and REJECT
 * @param {string} [args.suspendedUntil] ISO date, for SUSPEND
 * @param {{uid: string, email: string}} args.actor
 */
export async function decidePartnerApplication({
  uid,
  decision,
  feedback = null,
  suspendedUntil = null,
  actor,
}) {
  const nextStatus = STATUS_FOR_DECISION[decision];
  if (!nextStatus) {
    throw new DecisionError('unknown_decision', `Unknown decision "${decision}".`);
  }

  // Asking for more information without saying what is missing leaves the
  // partner guessing, and the brief requires the feedback be displayed to
  // them. Rejection without a reason is worse.
  if ((decision === DECISION.REQUEST_INFO || decision === DECISION.REJECT) && !feedback?.trim()) {
    throw new DecisionError(
      'feedback_required',
      decision === DECISION.REQUEST_INFO
        ? 'Say what further information is needed.'
        : 'Give a reason for the rejection.',
    );
  }

  const userRef = adminDb().collection('users').doc(uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    throw new DecisionError('not_found', 'No such account.');
  }

  const profile = snapshot.data();
  const role = normalizeRole(profile.role ?? profile.signUpAs);

  if (!isPartnerRole(role)) {
    throw new DecisionError('not_a_partner', 'That account is not a partner application.');
  }

  const now = new Date().toISOString();

  const updates = {
    status: nextStatus,
    reviewedBy: { uid: actor.uid, email: actor.email },
    reviewedAt: now,
    updatedAt: now,
    // Feedback is cleared on anything other than a request for more
    // information, so an old note never sits beside a new decision.
    adminFeedback: decision === DECISION.REQUEST_INFO ? feedback.trim() : null,
    suspendedUntil: decision === DECISION.SUSPEND ? suspendedUntil : null,
    ...(decision === DECISION.APPROVE || decision === DECISION.REINSTATE
      ? { approvedAt: now, rejectedAt: null }
      : {}),
    ...(decision === DECISION.REJECT ? { rejectedAt: now, rejectionReason: feedback.trim() } : {}),
  };

  await userRef.set(updates, { merge: true });

  // The claims are what the guards and security rules read. If this fails the
  // Firestore write above is already done, so the two have drifted — loudly
  // logged rather than swallowed, because the partner will be locked out of
  // an account that says it is approved.
  try {
    await setUserClaims(uid, { role, status: nextStatus });
  } catch (error) {
    console.error('[admin/partners] CLAIMS DRIFT — status written but claims not set', {
      uid,
      nextStatus,
      error,
    });
    throw new DecisionError(
      'claims_failed',
      'The decision was saved but could not be applied to the account. Try again.',
    );
  }

  if (REVOKES_ACCESS.has(decision)) {
    // Claims live in the token. Without this, a suspended partner keeps
    // working until their token expires — up to an hour.
    await revokeUserSessions(uid).catch((error) =>
      console.error('[admin/partners] session revoke failed', { uid, error }),
    );
  }

  await adminDb()
    .collection('auditLog')
    .add({
      type: 'partner_decision',
      decision,
      targetUid: uid,
      targetEmail: profile.email ?? null,
      targetRole: role,
      newStatus: nextStatus,
      feedback: feedback?.trim() ?? null,
      suspendedUntil,
      actorUid: actor.uid,
      actorEmail: actor.email,
      at: now,
    })
    .catch((error) => console.error('[admin/partners] audit write failed', error));

  if (NOTIFIES.has(decision) && profile.email) {
    const link = `${getBaseUrl()}/en/onboarding/verification`;
    const name = profile.name ?? 'there';
    const roleLabel = ROLE_LABELS[role];

    const message =
      decision === DECISION.REQUEST_INFO
        ? moreInfoRequestedEmail({ name, feedback: feedback.trim(), link })
        : approvalEmail({ name, roleLabel, link: `${getBaseUrl()}/en/dashboard` });

    await sendEmail({ to: profile.email, ...message });
  }

  return { uid, status: nextStatus };
}
