/**
 * Prepare & Register — the wet-ink route for documents that cannot be executed
 * electronically.
 *
 * WHY THE PLATFORM NEEDS THIS TO BE A PRODUCT AND NOT A REFUSAL
 *
 * The launch brief: "Excluded documents become a 'Prepare & Register' product
 * (drafted, verified and routed online, executed wet-ink) at GYD 4,500."
 *
 * Six of the eight documents the marketing site advertises as "Popular
 * Documents to Notarize" are on Guyana's exclusion schedule — powers of
 * attorney, wills, agreements of sale, leases, promissory notes. Those are the
 * most-clicked tiles on the home page. Until now the Phase 2 compliance engine
 * correctly refused all six, which meant the most prominent thing on the
 * website led to a dead end that read like a malfunction.
 *
 * A refusal is the right legal answer and the wrong commercial one. This is the
 * commercial one: the work that CAN be done online — drafting, checking,
 * verifying identity, collecting the parties' details — is done online, and
 * only the signature happens on paper, because only the signature is what the
 * statute reserves.
 *
 * WHAT THIS PRODUCT MUST NEVER DO
 *
 * Apply an electronic signature or a notarial seal. That is the entire point:
 * these documents are here precisely because doing so would produce an
 * instrument with no legal effect. `assertNoElectronicExecution` is called on
 * every state change so that a future contributor wiring the stamp module into
 * this flow hits an error with the reason, rather than shipping a nullity.
 */

import { adminDb } from '@/lib/firebase-admin';
import {
  getJurisdiction,
  isDocumentCategoryExcluded,
  listLaunchJurisdictions,
} from '@/lib/jurisdictions';
import { DOCUMENT_CATEGORIES, isValidCategory } from '@/lib/templates';
import { prepareRegisterFee } from '@/lib/fees';
import { getPriceList } from '@/lib/pricing';

export const PREPARE_REGISTER_COLLECTION = 'prepareRegisterRequests';

export const PR_STATUS = Object.freeze({
  /** Client has asked for it. */
  SUBMITTED: 'submitted',
  /** A WiScribbles agent is drafting or checking. */
  IN_PREPARATION: 'in_preparation',
  /** More information needed from the client. */
  INFORMATION_REQUESTED: 'information_requested',
  /** Document is drafted, verified, and ready to be signed on paper. */
  READY_FOR_EXECUTION: 'ready_for_execution',
  /** Signed on paper. Terminal and successful. */
  EXECUTED_ON_PAPER: 'executed_on_paper',
  /** Withdrawn by the client, or refused. */
  CANCELLED: 'cancelled',
});

export const PR_STATUS_LABELS = Object.freeze({
  [PR_STATUS.SUBMITTED]: 'Received',
  [PR_STATUS.IN_PREPARATION]: 'Being prepared',
  [PR_STATUS.INFORMATION_REQUESTED]: 'Waiting on you',
  [PR_STATUS.READY_FOR_EXECUTION]: 'Ready to sign on paper',
  [PR_STATUS.EXECUTED_ON_PAPER]: 'Signed',
  [PR_STATUS.CANCELLED]: 'Cancelled',
});

/** How the signed paper document gets to the client. */
export const DELIVERY = Object.freeze({
  COLLECT: 'collect',
  COURIER: 'courier',
  ATTEND: 'attend',
});

export const DELIVERY_OPTIONS = Object.freeze([
  {
    value: DELIVERY.COLLECT,
    label: 'I will collect it',
    description: 'Collect from the WiScribbles office in Georgetown and sign there.',
  },
  {
    value: DELIVERY.ATTEND,
    label: 'Arrange an appointment',
    description: 'A notary or commissioner attends in person at an agreed place and time.',
  },
  {
    value: DELIVERY.COURIER,
    label: 'Courier',
    description:
      'The prepared document is couriered to you for signature and returned. ' +
      'Courier charges are additional and quoted separately.',
  },
]);

/**
 * The text a client must see before this is bought.
 *
 * Versioned and recorded with the request, for the same reason the request
 * flow's terms are: a client who later says they thought they were buying an
 * online notarisation needs to be met with what they were actually shown.
 */
export const PR_NOTICE_VERSION = '2026-10-18.1';

export const PR_NOTICE = Object.freeze({
  version: PR_NOTICE_VERSION,
  heading: 'This document has to be signed on paper',
  points: Object.freeze([
    'The law of the jurisdiction you have chosen does not give electronic ' +
      'execution any effect for this kind of document. Signing it ' +
      'electronically would produce a document that looks valid and is not, ' +
      'so WiScribbles will not do it.',
    'What we can do online is everything up to the signature: draft the ' +
      'document, check it, verify who the parties are, and collect what is ' +
      'needed. That is this service.',
    'The signature itself happens in person, on paper, in front of whoever ' +
      'the law requires. We arrange that and tell you exactly what to bring.',
    'No electronic signature and no notarial seal is applied to a document ' +
      'prepared this way, at any point.',
    'If the law changes, documents of this kind become available for online ' +
      'notarisation automatically — the platform reads the exclusion schedule ' +
      'rather than a hard-coded list.',
  ]),
});

export class PrepareRegisterError extends Error {
  constructor(code, message, status = 422, field = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

/**
 * The guard that keeps this product honest.
 *
 * Called on creation and on every status change. If someone later wires the
 * seal module into this flow — a reasonable-looking change, since both deal in
 * documents — this throws with the reason instead of quietly producing an
 * instrument with no legal effect.
 */
export function assertNoElectronicExecution(request) {
  if (request?.stampedPath || request?.electronicSignature || request?.sealApplied) {
    throw new PrepareRegisterError(
      'illegal_electronic_execution',
      'A Prepare & Register document must never carry an electronic signature ' +
        'or notarial seal. These documents are in this flow precisely because ' +
        'the statute gives electronic execution no effect for them, so sealing ' +
        'one would produce a nullity that looks valid. Execution is on paper.',
      500,
    );
  }
  return true;
}

/* ------------------------------------------------------------------------- */
/* Eligibility                                                                */
/* ------------------------------------------------------------------------- */

/**
 * Should this request be routed here?
 *
 * Only when the category is actually excluded in that jurisdiction. Offering
 * the paper route for a document that could have been notarised online would
 * be selling someone a slower, more expensive service they did not need.
 */
export function checkEligibility({
  jurisdiction,
  documentCategory,
  /* The live Prepare & Register price, in GYD. Passed in rather than read
     here, because this function is synchronous and used by
     `validateRequest`, which has no business awaiting a settings read just
     to check whether a category is eligible. Callers that will SHOW the fee
     resolve it; callers that only need eligibility leave it alone. */
  prepareRegisterGyd = undefined,
}) {
  const place = getJurisdiction(jurisdiction);

  if (!place) {
    return { eligible: false, reason: 'Unknown jurisdiction.' };
  }
  if (!place.launchEnabled) {
    return { eligible: false, reason: `WiScribbles does not operate in ${place.name} yet.` };
  }
  if (!isValidCategory(documentCategory)) {
    return { eligible: false, reason: 'Choose a document type.' };
  }

  if (!isDocumentCategoryExcluded(place.code, documentCategory)) {
    return {
      eligible: false,
      reason:
        `Documents of this type CAN be executed electronically in ${place.name}, ` +
        'so there is no need for the paper route — use the ordinary request flow.',
      useOnlineInstead: true,
    };
  }

  return {
    eligible: true,
    reason: null,
    jurisdiction: { code: place.code, name: place.name, statute: place.statute },
    fee: prepareRegisterFee(prepareRegisterGyd),
  };
}

/** For the entry page: which jurisdiction excludes what. */
export function excludedCatalogue() {
  const labels = new Map(DOCUMENT_CATEGORIES.map((c) => [c.value, c.label]));

  return listLaunchJurisdictions().map((place) => ({
    code: place.code,
    name: place.name,
    statute: place.statute,
    excluded: (place.excludedDocumentCategories ?? [])
      .filter((value) => labels.has(value))
      .map((value) => ({ value, label: labels.get(value) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  }));
}

/* ------------------------------------------------------------------------- */
/* Creating                                                                   */
/* ------------------------------------------------------------------------- */

export function validateRequest({ documentCategory, jurisdiction, delivery, details, noticeVersion }) {
  const errors = {};

  const eligibility = checkEligibility({ jurisdiction, documentCategory });
  if (!eligibility.eligible) {
    errors[eligibility.useOnlineInstead ? 'documentCategory' : 'jurisdiction'] = eligibility.reason;
  }

  if (!Object.values(DELIVERY).includes(delivery)) {
    errors.delivery = 'Choose how you would like to sign.';
  }

  if (!details || String(details).trim().length < 20) {
    // A one-word brief cannot be drafted from, and the cost of discovering
    // that is a round of emails. Twenty characters is a low bar that still
    // rules out "POA".
    errors.details =
      'Describe what the document needs to do, and who the parties are. ' +
      'The more you give us, the fewer questions we come back with.';
  } else if (String(details).length > 4000) {
    errors.details = 'Keep this under 4000 characters — attach anything longer.';
  }

  if (noticeVersion !== PR_NOTICE_VERSION) {
    errors.notice =
      'The notice about paper signature has changed since you started. ' +
      'Please read it again.';
  }

  return { valid: Object.keys(errors).length === 0, errors, eligibility };
}

export async function createRequest({ client, documentCategory, jurisdiction, delivery, details, noticeVersion }) {
  const { valid, errors, eligibility } = validateRequest({
    documentCategory,
    jurisdiction,
    delivery,
    details,
    noticeVersion,
  });

  if (!valid) {
    const field = Object.keys(errors)[0];
    throw new PrepareRegisterError('validation_failed', errors[field], 422, field);
  }

  const now = new Date().toISOString();
  const fee = prepareRegisterFee((await getPriceList()).prices.PREPARE_REGISTER_GYD);

  const record = {
    status: PR_STATUS.SUBMITTED,

    documentCategory,
    jurisdiction: eligibility.jurisdiction.code,
    jurisdictionStatute: eligibility.jurisdiction.statute,
    /* WHY this is a paper job, recorded at creation. A client asking in a year
       why they could not do this online gets the statute, not a guess. */
    excludedUnder: eligibility.jurisdiction.statute,

    delivery,
    details: String(details).trim().slice(0, 4000),

    clientId: client.uid,
    clientName: client.name ?? null,
    clientEmail: client.email ?? null,

    feeAmount: fee.amount,
    feeCurrency: fee.currency,
    feePaid: false,

    noticeVersion,

    /* Explicit and permanent. Read by `assertNoElectronicExecution`, and by
       anyone reading the record wondering why there is no stamped file. */
    electronicExecutionProhibited: true,
    stampedPath: null,

    createdAt: now,
    updatedAt: now,
  };

  assertNoElectronicExecution(record);

  const created = await adminDb().collection(PREPARE_REGISTER_COLLECTION).add(record);

  await adminDb()
    .collection('auditLog')
    .add({
      type: 'prepare_register_created',
      prepareRegisterId: created.id,
      documentCategory,
      jurisdiction: eligibility.jurisdiction.code,
      noticeVersion,
      actorUid: client.uid,
      actorEmail: client.email,
      actorRole: client.role,
      at: now,
    })
    .catch((error) => console.error('[prepareRegister] audit write failed', error));

  return { id: created.id, fee, status: PR_STATUS.SUBMITTED };
}

/* ------------------------------------------------------------------------- */
/* Working them                                                               */
/* ------------------------------------------------------------------------- */

const ALLOWED_TRANSITIONS = Object.freeze({
  [PR_STATUS.SUBMITTED]: [PR_STATUS.IN_PREPARATION, PR_STATUS.INFORMATION_REQUESTED, PR_STATUS.CANCELLED],
  [PR_STATUS.IN_PREPARATION]: [PR_STATUS.INFORMATION_REQUESTED, PR_STATUS.READY_FOR_EXECUTION, PR_STATUS.CANCELLED],
  [PR_STATUS.INFORMATION_REQUESTED]: [PR_STATUS.IN_PREPARATION, PR_STATUS.CANCELLED],
  [PR_STATUS.READY_FOR_EXECUTION]: [PR_STATUS.EXECUTED_ON_PAPER, PR_STATUS.CANCELLED],
  // Terminal.
  [PR_STATUS.EXECUTED_ON_PAPER]: [],
  [PR_STATUS.CANCELLED]: [],
});

export async function advance({ id, toStatus, note = null, actor }) {
  if (!Object.values(PR_STATUS).includes(toStatus)) {
    throw new PrepareRegisterError('unknown_status', 'Unknown status.', 400);
  }

  const ref = adminDb().collection(PREPARE_REGISTER_COLLECTION).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new PrepareRegisterError('not_found', 'No such request.', 404);
  }

  const current = snapshot.data();
  assertNoElectronicExecution(current);

  const permitted = ALLOWED_TRANSITIONS[current.status] ?? [];

  if (!permitted.includes(toStatus)) {
    /* A state machine rather than a free-for-all, because "executed on paper"
       is a claim about the physical world. Being able to set it from
       "submitted" would let a mis-click assert that a document nobody has
       drafted has been signed. */
    throw new PrepareRegisterError(
      'illegal_transition',
      `A request that is "${PR_STATUS_LABELS[current.status] ?? current.status}" ` +
        `cannot move straight to "${PR_STATUS_LABELS[toStatus] ?? toStatus}".`,
      409,
    );
  }

  if (toStatus === PR_STATUS.INFORMATION_REQUESTED && !String(note ?? '').trim()) {
    throw new PrepareRegisterError(
      'note_required',
      'Say what information is needed — the client sees this.',
      422,
      'note',
    );
  }

  const now = new Date().toISOString();

  await ref.set(
    {
      status: toStatus,
      agentNote: toStatus === PR_STATUS.INFORMATION_REQUESTED ? String(note).trim() : null,
      ...(toStatus === PR_STATUS.EXECUTED_ON_PAPER ? { executedOnPaperAt: now } : {}),
      updatedBy: { uid: actor.uid, email: actor.email },
      updatedAt: now,
    },
    { merge: true },
  );

  await adminDb()
    .collection('auditLog')
    .add({
      type: 'prepare_register_advanced',
      prepareRegisterId: id,
      fromStatus: current.status,
      toStatus,
      note: note ? String(note).trim() : null,
      actorUid: actor.uid,
      actorEmail: actor.email,
      at: now,
    })
    .catch((error) => console.error('[prepareRegister] audit write failed', error));

  return { id, status: toStatus };
}

/** The client's own requests. */
export async function listForClient(uid) {
  const snapshot = await adminDb()
    .collection(PREPARE_REGISTER_COLLECTION)
    .where('clientId', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => shape(doc.id, doc.data()));
}

/** The Website Manager's queue, oldest first — the people waiting longest. */
export async function listForAdmin({ status = null } = {}) {
  let query = adminDb().collection(PREPARE_REGISTER_COLLECTION);
  if (status) query = query.where('status', '==', status);

  const snapshot = await query.orderBy('createdAt', 'asc').limit(100).get();
  return snapshot.docs.map((doc) => shape(doc.id, doc.data(), { forAdmin: true }));
}

function shape(id, data, { forAdmin = false } = {}) {
  const base = {
    id,
    status: data?.status ?? null,
    statusLabel: PR_STATUS_LABELS[data?.status] ?? data?.status ?? null,
    documentCategory: data?.documentCategory ?? null,
    jurisdiction: data?.jurisdiction ?? null,
    jurisdictionStatute: data?.jurisdictionStatute ?? null,
    delivery: data?.delivery ?? null,
    feeAmount: data?.feeAmount ?? null,
    feeCurrency: data?.feeCurrency ?? null,
    feePaid: Boolean(data?.feePaid),
    agentNote: data?.agentNote ?? null,
    createdAt: data?.createdAt ?? null,
    updatedAt: data?.updatedAt ?? null,
    executedOnPaperAt: data?.executedOnPaperAt ?? null,
  };

  if (!forAdmin) return base;

  return {
    ...base,
    clientName: data?.clientName ?? null,
    clientEmail: data?.clientEmail ?? null,
    details: data?.details ?? null,
  };
}
