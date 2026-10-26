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
import { KYC_STATUS } from '@/lib/kyc/provider';
import {
  describeCredential,
  requiresCredentialExpiry,
  validateCredentialExpiry,
} from '@/lib/admin/credentials';

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

/**
 * Decisions that GRANT working access, and so carry the full vetting burden:
 * a verified identity, and for an officer a certificate with an expiry date.
 *
 * `REINSTATE` is in here as well as `APPROVE`, which matters more than it
 * looks. Reinstating is the path back from a suspension or a lapsed
 * certificate, and it is exactly where a check would be skipped if the set
 * only contained `APPROVE` — the account was approved once, so the
 * verification feels already done. It is not: the reason it stopped being
 * approved may be the reason the verification no longer holds.
 */
const GRANTS_ACCESS = new Set([DECISION.APPROVE, DECISION.REINSTATE]);

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
        /* The certificate's own expiry, and how it reads right now. The
           manager needs both: the raw date to correct it, and the derived
           state to see at a glance which approved officers are about to
           lapse or were approved before the field existed. */
        credentialExpiresAt: data.credentialExpiresAt ?? null,
        credential: describeCredential(data),
        requiresCredentialExpiry: requiresCredentialExpiry(
          normalizeRole(data.role ?? data.signUpAs),
        ),
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
  credentialExpiresAt = null,
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

  /* ---- gates that only apply to granting access ---------------------- */

  let expiryToStore = null;

  if (GRANTS_ACCESS.has(decision)) {
    /* IDENTITY MUST BE VERIFIED BEFORE APPROVAL, not merely before going
       live. Until now the only KYC check was in `checkEligibility`, which
       governs the Go Live toggle — so the Website Manager could approve an
       unverified professional, who then appeared in the directory as an
       approved notary and could not understand why no work reached them. The
       approval is the thing that confers standing, so it is where the check
       belongs.

       Reads the flat `kycStatus`, which is what `app/api/kyc/webhook` and
       `app/api/kyc/start` actually write. There is no nested `kyc` object on
       a user document; `lib/availability.js` assumed one for months and
       therefore refused everybody. */
    const kycState = profile.kycStatus ?? profile.kyc?.status ?? KYC_STATUS.NOT_STARTED;

    if (kycState !== KYC_STATUS.APPROVED) {
      throw new DecisionError(
        'kyc_incomplete',
        `This applicant's identity has not been verified — Didit reports ` +
          `"${kycState}". Approving them now would put an unverified ` +
          'professional in front of clients, and they would not be able to ' +
          'go live in any case. Ask them to complete identity verification, ' +
          'or request more information.',
      );
    }

    /* A notary or Commissioner of Oaths cannot be approved without the expiry
       date from their certificate. Acting after the commission ends is an
       offence in Guyana (Cap. 4:02 s.7) and Barbados (Notaries Public Act
       2024 s.16), and without a date there is nothing for the lapse check in
       `lib/admin/credentials.js` to enforce. */
    const check = validateCredentialExpiry(credentialExpiresAt, { role });

    if (!check.valid) {
      throw new DecisionError('credential_expiry_required', check.error);
    }

    expiryToStore = check.value;
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
    ...(GRANTS_ACCESS.has(decision)
      ? {
          approvedAt: now,
          rejectedAt: null,
          credentialExpiresAt: expiryToStore,
          /* Cleared on a fresh grant. A date left over from the previous term
             would make the account look as though it had already expired, or
             — worse, if the old date were later — extend the new term by
             accident. */
          credentialExpiredAt: null,
        }
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
      /* Recorded on the decision, not just on the user document. The user
         document holds only the latest state, so without this there is no way
         to answer "what expiry date was this officer approved against" after
         a renewal has overwritten it. */
      credentialExpiresAt: expiryToStore,
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
