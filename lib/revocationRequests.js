/**
 * Client-initiated revocation.
 *
 * Brief, Stage 7: "Document revocation (paid)".
 *
 * WHY THIS IS A REQUEST AND NOT A BUTTON
 *
 * The obvious reading of "paid revocation" is: the client pays, the document is
 * revoked. That cannot be right, and building it would be a serious mistake.
 *
 * An executed instrument is relied on by people who are not the person asking.
 * A power of attorney is relied on by the bank that acted under it. An
 * agreement of sale is relied on by the other party. A statutory declaration
 * is relied on by whoever accepted it. Letting one signatory withdraw an
 * instrument on their own, by paying a fee, would let them destroy something
 * another party's position rests on — and do it with no notice to that party.
 *
 * So a client REQUESTS revocation, with a ground and a written reason, and the
 * Website Manager decides, using the same `revokeDocument` path as any
 * manager-initiated revocation. That keeps one audited route to a revoked
 * document and one place where the question "should this be withdrawn?" is
 * actually answered.
 *
 * The fee is charged for the request, not for the outcome. A refused request is
 * still work: somebody read it, checked the instrument and decided. That is
 * said plainly to the client before they pay, because "paid revocation" invites
 * the assumption that paying buys the result.
 */

import { adminDb } from '@/lib/firebase-admin';
import { REVOCATION_GROUNDS, isValidRevocationGround } from '@/lib/admin/documents';
import { prepareRegisterFee } from '@/lib/fees';
import { getPriceList } from '@/lib/pricing';
import { getBaseUrl } from '@/lib/apiUtils';
import {
  revocationAcknowledgedEmail,
  revocationRequestedEmail,
  sendEmail,
} from '@/lib/email/send';

export const REVOCATION_REQUESTS_COLLECTION = 'revocationRequests';

export const RR_STATUS = Object.freeze({
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  GRANTED: 'granted',
  REFUSED: 'refused',
  WITHDRAWN: 'withdrawn',
});

export const RR_STATUS_LABELS = Object.freeze({
  [RR_STATUS.SUBMITTED]: 'Received',
  [RR_STATUS.UNDER_REVIEW]: 'Under review',
  [RR_STATUS.GRANTED]: 'Granted — document revoked',
  [RR_STATUS.REFUSED]: 'Refused',
  [RR_STATUS.WITHDRAWN]: 'Withdrawn by you',
});

/**
 * The fee for making the request.
 *
 * Priced at the same figure as Prepare & Register for now, because both are a
 * fixed piece of human work on one document and no separate figure has been
 * decided. Flagged rather than silently assumed: if the fee should differ,
 * this is the one place to change it.
 */
export const revocationRequestFee = (prepareRegisterGyd = undefined) => ({
  ...prepareRegisterFee(prepareRegisterGyd),
  note:
    'Charged for the review, not for the outcome. A refused request is still ' +
    'work — somebody read it, checked the instrument and decided — so the fee ' +
    'is not refunded if the answer is no.',
});

/** Shown before the request is made. Versioned and recorded, like the others. */
export const RR_NOTICE_VERSION = '2026-10-18.1';

export const RR_NOTICE = Object.freeze({
  version: RR_NOTICE_VERSION,
  heading: 'Before you ask for a document to be revoked',
  points: Object.freeze([
    'Revoking an executed document withdraws it. Anyone who checks it ' +
      'afterwards is told it has been revoked and should not be relied on.',
    'You cannot revoke a document on your own. Other people may be relying ' +
      'on it — a bank that acted on a power of attorney, the other side of an ' +
      'agreement — and they are entitled to have that considered. WiScribbles ' +
      'decides, and may refuse.',
    'Every other party to the document is told that revocation has been ' +
      'requested, and may say why it should not happen.',
    'The fee pays for the review, not the result. It is not refunded if the ' +
      'request is refused.',
    'A revocation cannot be undone. If a document was revoked in error it is ' +
      'replaced by a new one, not restored — restoring it would put two ' +
      'contradictory answers into circulation.',
  ]),
});

export class RevocationRequestError extends Error {
  constructor(code, message, status = 422, field = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

/* ------------------------------------------------------------------------- */
/* Making one                                                                 */
/* ------------------------------------------------------------------------- */

/**
 * Who may ask?
 *
 * A party to the document — the owner, a signatory, or the professional who
 * executed it. The professional is included deliberately: a notary who
 * discovers after the fact that they were deceived has a professional
 * obligation to raise it, and making them email support instead would be a
 * worse system than letting them file it here.
 */
function isParty(document, user) {
  const signers = Array.isArray(document.signerIds) ? document.signerIds : [];

  return (
    document.ownerId === user.uid ||
    signers.includes(user.uid) ||
    document.assignedProfessionalId === user.uid
  );
}

export async function createRequest({ documentId, ground, reason, noticeVersion, requester }) {
  if (noticeVersion !== RR_NOTICE_VERSION) {
    throw new RevocationRequestError(
      'notice_changed',
      'The notice about revocation has changed since you started. Please read it again.',
      409,
      'notice',
    );
  }

  if (!isValidRevocationGround(ground)) {
    throw new RevocationRequestError('bad_ground', 'Choose a ground.', 422, 'ground');
  }

  if (!String(reason ?? '').trim() || String(reason).trim().length < 20) {
    throw new RevocationRequestError(
      'reason_required',
      'Set out why this document should be withdrawn. This is read by the ' +
        'Website Manager and shown to the other parties.',
      422,
      'reason',
    );
  }

  const documentRef = adminDb().collection('documents').doc(String(documentId));
  const snapshot = await documentRef.get();

  if (!snapshot.exists) {
    throw new RevocationRequestError('not_found', 'No such document.', 404);
  }

  const document = snapshot.data();

  if (!isParty(document, requester)) {
    // 404 rather than 403: someone who is not a party should not learn that
    // the document exists.
    throw new RevocationRequestError('not_found', 'No such document.', 404);
  }

  if (document.status === 'revoked') {
    throw new RevocationRequestError(
      'already_revoked',
      'That document has already been revoked.',
      409,
    );
  }

  if (!['signed', 'notarised'].includes(document.status)) {
    throw new RevocationRequestError(
      'not_executed',
      'That document has not been executed, so there is nothing to withdraw. ' +
        'An unexecuted document can simply be abandoned.',
      409,
    );
  }

  /* One open request per document. Two people asking at once would otherwise
     produce two reviews of the same question and, worse, two fees. */
  const open = await adminDb()
    .collection(REVOCATION_REQUESTS_COLLECTION)
    .where('documentId', '==', String(documentId))
    .where('status', 'in', [RR_STATUS.SUBMITTED, RR_STATUS.UNDER_REVIEW])
    .limit(1)
    .get();

  if (!open.empty) {
    throw new RevocationRequestError(
      'already_requested',
      'Revocation of this document has already been requested and is being ' +
        'reviewed. You will be told the outcome.',
      409,
    );
  }

  const now = new Date().toISOString();
  const fee = revocationRequestFee((await getPriceList()).prices.PREPARE_REGISTER_GYD);

  const signers = Array.isArray(document.signerIds) ? document.signerIds : [];
  const partyIds = [
    document.ownerId,
    document.assignedProfessionalId,
    ...signers,
  ].filter(Boolean);

  const created = await adminDb()
    .collection(REVOCATION_REQUESTS_COLLECTION)
    .add({
      documentId: String(documentId),
      documentName: document.name ?? null,
      documentReference: document.referenceNumber ?? null,
      documentStatus: document.status,

      ground,
      reason: String(reason).trim().slice(0, 2000),

      requestedByUid: requester.uid,
      requestedByEmail: requester.email,
      requestedByRole: requester.role,
      /* Every party can read the request. The brief's "other parties may say
         why it should not happen" depends on them being able to see it. */
      partyIds: [...new Set(partyIds)],

      feeAmount: fee.amount,
      feeCurrency: fee.currency,
      feePaid: false,

      noticeVersion,
      status: RR_STATUS.SUBMITTED,
      createdAt: now,
      updatedAt: now,
    });

  await adminDb()
    .collection('auditLog')
    .add({
      type: 'revocation_requested',
      documentId: String(documentId),
      revocationRequestId: created.id,
      ground,
      actorUid: requester.uid,
      actorEmail: requester.email,
      actorRole: requester.role,
      at: now,
    })
    .catch((error) => console.error('[revocationRequests] audit write failed', error));

  /* Tell everybody. This is the part that makes letting WiScribbles decide,
     rather than the requester, mean anything: the other parties are entitled
     to object, and they cannot object to something nobody told them about.
     Best-effort and after the write — a mail failure must not lose a recorded
     request — but logged loudly, because a silent failure here quietly removes
     a party's chance to be heard. */
  await notifyParties({
    requestId: created.id,
    documentName: document.name ?? 'a document',
    ground,
    reason: String(reason).trim(),
    requester,
    partyIds: [...new Set(partyIds)],
  });

  return { id: created.id, status: RR_STATUS.SUBMITTED, fee };
}

/**
 * Email every party, and acknowledge to the requester.
 *
 * Addresses are read from the user records rather than from the document, so a
 * party who has since changed their email hears about it at the address they
 * actually use.
 */
async function notifyParties({ requestId, documentName, ground, reason, requester, partyIds }) {
  const groundLabel =
    REVOCATION_GROUNDS.find((g) => g.value === ground)?.label ?? ground;
  const link = `${getBaseUrl()}/en/revoke`;

  const requesterLabel = requester.name ?? requester.email ?? 'A party';

  const others = partyIds.filter((uid) => uid && uid !== requester.uid);

  const recipients = await Promise.all(
    others.map(async (uid) => {
      try {
        const snapshot = await adminDb().collection('users').doc(uid).get();
        if (!snapshot.exists) return null;
        const data = snapshot.data();
        return data.email ? { email: data.email, name: data.name ?? 'there' } : null;
      } catch {
        return null;
      }
    }),
  );

  await Promise.all(
    recipients.filter(Boolean).map((recipient) =>
      sendEmail({
        to: recipient.email,
        ...revocationRequestedEmail({
          name: recipient.name,
          documentName,
          requestedBy: requesterLabel,
          ground: groundLabel,
          reason,
          link,
        }),
      }).catch((error) =>
        console.error('[revocationRequests] COULD NOT NOTIFY A PARTY', {
          requestId,
          error,
        }),
      ),
    ),
  );

  if (requester.email) {
    await sendEmail({
      to: requester.email,
      ...revocationAcknowledgedEmail({
        name: requester.name ?? 'there',
        documentName,
        link,
      }),
    }).catch((error) =>
      console.error('[revocationRequests] could not acknowledge to requester', error),
    );
  }
}

/* ------------------------------------------------------------------------- */
/* Reading                                                                    */
/* ------------------------------------------------------------------------- */

export async function listForParty(uid) {
  const snapshot = await adminDb()
    .collection(REVOCATION_REQUESTS_COLLECTION)
    .where('partyIds', 'array-contains', uid)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => shape(doc.id, doc.data()));
}

export async function listForAdmin({ status = null } = {}) {
  let query = adminDb().collection(REVOCATION_REQUESTS_COLLECTION);
  if (status) query = query.where('status', '==', status);

  const snapshot = await query.orderBy('createdAt', 'asc').limit(100).get();
  return snapshot.docs.map((doc) => shape(doc.id, doc.data(), { forAdmin: true }));
}

function shape(id, data, { forAdmin = false } = {}) {
  const base = {
    id,
    documentId: data?.documentId ?? null,
    documentName: data?.documentName ?? null,
    documentReference: data?.documentReference ?? null,
    ground: data?.ground ?? null,
    groundLabel:
      REVOCATION_GROUNDS.find((g) => g.value === data?.ground)?.label ?? data?.ground ?? null,
    status: data?.status ?? null,
    statusLabel: RR_STATUS_LABELS[data?.status] ?? data?.status ?? null,
    feeAmount: data?.feeAmount ?? null,
    feeCurrency: data?.feeCurrency ?? null,
    feePaid: Boolean(data?.feePaid),
    decisionNote: data?.decisionNote ?? null,
    createdAt: data?.createdAt ?? null,
    decidedAt: data?.decidedAt ?? null,
  };

  // The reason is visible to every party, by design: the other parties cannot
  // argue against a request they are not allowed to read.
  base.reason = data?.reason ?? null;

  if (!forAdmin) return base;

  return {
    ...base,
    requestedByEmail: data?.requestedByEmail ?? null,
    requestedByRole: data?.requestedByRole ?? null,
    partyIds: data?.partyIds ?? [],
  };
}

export const revocationGrounds = () => REVOCATION_GROUNDS;
