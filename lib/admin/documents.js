/**
 * The Website Manager's document repository.
 *
 * Brief: "The website manager has access to all documents executed on the
 * platform, filterable by Jurisdiction, Partner Type and Account Name", and can
 * "audit a document, flag it as suspicious, or revoke a signed document."
 *
 * THREE THINGS THIS FILE TAKES A POSITION ON
 *
 * 1. THE ACCOUNT NAME FILTER IS A TWO-STEP LOOKUP, NOT A SEARCH.
 *    Firestore has no substring matching, so "find the Persaud documents"
 *    cannot be a query against the documents collection. Names are resolved
 *    against the users collection first and the documents are then fetched by
 *    owner id. That means the filter matches whole accounts rather than
 *    fragments of a document title, which is the honest behaviour for a filter
 *    labelled "Account Name" — and the UI says so.
 *
 * 2. FLAGGING AND REVOKING ARE DIFFERENT ACTS AND ARE KEPT APART.
 *    A flag is a note: this looks wrong, someone should look. It changes
 *    nothing about the document's validity. A revocation withdraws an executed
 *    instrument, which is a legal act affecting parties who are not the
 *    Website Manager. Collapsing them into one "problem" state would make the
 *    cheap action feel as grave as the serious one, with the predictable result
 *    that the serious one gets used casually.
 *
 * 3. A REVOKED DOCUMENT IS NOT DELETED, AND REVOCATION IS NOT REVERSIBLE HERE.
 *    The document, its template binding and its audit trail all survive —
 *    those are precisely what someone relying on the document will need. And
 *    there is no un-revoke: once parties have been told an instrument was
 *    withdrawn, quietly restoring it would leave two contradictory truths in
 *    circulation. A document revoked in error is superseded by a new one.
 */

import { adminDb } from '@/lib/firebase-admin';
import { PARTNER_ROLES, ROLE_LABELS, normalizeRole } from '@/lib/roles';
import { listLaunchJurisdictions } from '@/lib/jurisdictions';

const DOCUMENTS = 'documents';
const REVOCATIONS = 'revocations';
const PAGE_SIZE = 50;

export const DOCUMENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  AWAITING_SIGNATURE: 'awaiting_signature',
  AWAITING_NOTARISATION: 'awaiting_notarisation',
  SIGNED: 'signed',
  NOTARISED: 'notarised',
  REVOKED: 'revoked',
});

/** Statuses that represent an executed instrument — the revocable ones. */
export const EXECUTED_STATUSES = Object.freeze([
  DOCUMENT_STATUS.SIGNED,
  DOCUMENT_STATUS.NOTARISED,
]);

export const FLAG_REASONS = Object.freeze([
  { value: 'identity', label: 'Identity of a party in doubt' },
  { value: 'jurisdiction', label: 'Jurisdiction or statutory effect in doubt' },
  { value: 'duress', label: 'Possible duress or incapacity' },
  { value: 'alteration', label: 'Document appears altered after execution' },
  { value: 'fee', label: 'Fee or payment irregularity' },
  { value: 'complaint', label: 'Complaint received from a party' },
  { value: 'other', label: 'Other — described below' },
]);

export const REVOCATION_GROUNDS = Object.freeze([
  { value: 'fraud', label: 'Fraud or misrepresentation established' },
  { value: 'identity_failure', label: 'Identity verification found to have failed' },
  { value: 'no_statutory_effect', label: 'Executed where it has no statutory effect' },
  { value: 'professional_not_authorised', label: 'Professional was not authorised to act' },
  { value: 'court_order', label: 'Court order or direction of a regulator' },
  { value: 'party_request', label: 'Request of a party, accepted by the platform' },
  { value: 'other', label: 'Other — described below' },
]);

export class RepositoryError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const isValidFlagReason = (value) =>
  FLAG_REASONS.some((reason) => reason.value === value);

export const isValidRevocationGround = (value) =>
  REVOCATION_GROUNDS.some((ground) => ground.value === value);

/* ------------------------------------------------------------------------- */
/* Filter options                                                             */
/* ------------------------------------------------------------------------- */

export function repositoryFilterOptions() {
  return {
    jurisdictions: listLaunchJurisdictions().map((j) => ({ code: j.code, name: j.name })),
    partnerTypes: PARTNER_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
    statuses: Object.values(DOCUMENT_STATUS).map((value) => ({
      value,
      label: value
        .split('_')
        .map((word, index) => (index === 0 ? word[0].toUpperCase() + word.slice(1) : word))
        .join(' '),
    })),
    flagReasons: FLAG_REASONS,
    revocationGrounds: REVOCATION_GROUNDS,
  };
}

/* ------------------------------------------------------------------------- */
/* Listing                                                                    */
/* ------------------------------------------------------------------------- */

/**
 * Resolve an "Account Name" filter to owner ids.
 *
 * Case-insensitive prefix matching on a `nameLower` field, which is what
 * Firestore can actually do. Two queries — one on name, one on email — because
 * a Website Manager looking for an account will have one or the other.
 *
 * @returns {Promise<string[]|null>} uids, or null when no filter was given
 */
export async function resolveAccountFilter(accountName) {
  const needle = String(accountName ?? '').trim().toLowerCase();
  if (!needle) return null;

  const end = `${needle}`;

  const [byName, byEmail] = await Promise.all([
    adminDb()
      .collection('users')
      .where('nameLower', '>=', needle)
      .where('nameLower', '<=', end)
      .limit(25)
      .get()
      .catch(() => ({ docs: [] })),
    adminDb()
      .collection('users')
      .where('email', '>=', needle)
      .where('email', '<=', end)
      .limit(25)
      .get()
      .catch(() => ({ docs: [] })),
  ]);

  const uids = new Set();
  for (const doc of [...byName.docs, ...byEmail.docs]) uids.add(doc.id);

  // An empty array is meaningfully different from null: null means "no filter",
  // an empty array means "filtered, and nothing matched".
  return [...uids];
}

/**
 * The repository listing.
 *
 * @param {object}  filters
 * @param {string} [filters.jurisdiction]
 * @param {string} [filters.partnerType]   a PARTNER_ROLES value
 * @param {string} [filters.accountName]
 * @param {string} [filters.status]
 * @param {boolean}[filters.flaggedOnly]
 */
export async function listDocuments(filters = {}) {
  const ownerIds = await resolveAccountFilter(filters.accountName);

  if (ownerIds !== null && ownerIds.length === 0) {
    return { documents: [], truncated: false, matchedAccounts: 0 };
  }

  let query = adminDb().collection(DOCUMENTS);

  if (filters.jurisdiction) query = query.where('jurisdiction', '==', filters.jurisdiction);
  if (filters.status) query = query.where('status', '==', filters.status);

  /* Firestore allows `in` with up to 30 values. More matching accounts than
     that and the filter is too broad to be useful anyway, so it is truncated
     and the UI reports how many accounts matched. */
  if (ownerIds !== null) {
    query = query.where('ownerId', 'in', ownerIds.slice(0, 30));
  }

  const snapshot = await query.orderBy('createdAt', 'desc').limit(PAGE_SIZE * 2).get();

  let documents = snapshot.docs.map((doc) => shapeForAdmin(doc.id, doc.data()));

  /* Partner type and the flag filter are applied in memory. Both would
     otherwise multiply the composite-index table by the number of combinations
     of the filters above, and the page is small. */
  if (filters.partnerType) {
    const wanted = normalizeRole(filters.partnerType);
    documents = documents.filter(
      (document) =>
        normalizeRole(document.ownerRole) === wanted ||
        normalizeRole(document.professionalRole) === wanted,
    );
  }

  if (filters.flaggedOnly) {
    documents = documents.filter((document) => document.flagged);
  }

  return {
    documents: documents.slice(0, PAGE_SIZE),
    truncated: snapshot.size >= PAGE_SIZE * 2,
    matchedAccounts: ownerIds?.length ?? null,
  };
}

/** The admin's view of a document. No storage paths — downloads are signed. */
export function shapeForAdmin(id, data) {
  return {
    id,
    name: data?.name ?? data?.fileName ?? 'Untitled document',
    status: data?.status ?? DOCUMENT_STATUS.DRAFT,
    jurisdiction: data?.jurisdiction ?? null,
    documentCategory: data?.documentCategory ?? null,
    templateId: data?.templateId ?? null,
    templateName: data?.templateName ?? null,

    ownerId: data?.ownerId ?? null,
    ownerName: data?.ownerName ?? null,
    ownerEmail: data?.ownerEmail ?? null,
    ownerRole: data?.ownerRole ?? null,

    professionalId: data?.assignedProfessionalId ?? null,
    professionalName: data?.professionalName ?? null,
    professionalRole: data?.professionalRole ?? null,

    flagged: Boolean(data?.flag),
    flag: data?.flag
      ? {
          reason: data.flag.reason ?? null,
          note: data.flag.note ?? null,
          at: data.flag.at ?? null,
          by: data.flag.byEmail ?? null,
        }
      : null,

    revoked: data?.status === DOCUMENT_STATUS.REVOKED,
    revocation: data?.revocation
      ? {
          ground: data.revocation.ground ?? null,
          note: data.revocation.note ?? null,
          at: data.revocation.at ?? null,
          by: data.revocation.byEmail ?? null,
        }
      : null,

    hasFile: Boolean(data?.stampedPath || data?.storagePath),
    createdAt: data?.createdAt ?? null,
    executedAt: data?.executedAt ?? null,
  };
}

/* ------------------------------------------------------------------------- */
/* Audit                                                                      */
/* ------------------------------------------------------------------------- */

/**
 * Everything the platform recorded about one document.
 *
 * Reads the audit log rather than reconstructing a history from the document's
 * own fields, because the document only holds its current state. The log is
 * what shows the sequence — who accepted, what the jurisdiction check decided,
 * who downloaded it and when.
 */
export async function auditTrailFor(documentId) {
  const snapshot = await adminDb()
    .collection('auditLog')
    .where('documentId', '==', documentId)
    .limit(200)
    .get()
    .catch(() => ({ docs: [] }));

  /* Also pick up the queue entry's own events, which are keyed by entryId
     rather than documentId — the accept, the decline and any lockout refusal
     happened before a document id existed on those records. */
  const document = await adminDb().collection(DOCUMENTS).doc(documentId).get();
  const entryId = document.exists ? document.data().queueEntryId : null;

  const queueEvents = entryId
    ? await adminDb()
        .collection('auditLog')
        .where('entryId', '==', entryId)
        .limit(100)
        .get()
        .catch(() => ({ docs: [] }))
    : { docs: [] };

  const seen = new Set();
  const events = [];

  for (const doc of [...snapshot.docs, ...queueEvents.docs]) {
    if (seen.has(doc.id)) continue;
    seen.add(doc.id);
    const data = doc.data();
    events.push({
      id: doc.id,
      type: data.type ?? 'event',
      at: data.at ?? null,
      actor: data.actorEmail ?? null,
      actorRole: data.actorRole ?? null,
      detail: summariseEvent(data),
    });
  }

  return events.sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

/** One readable line per audit entry, rather than a dump of raw fields. */
function summariseEvent(data) {
  switch (data.type) {
    case 'queue_accepted':
      return `Accepted in ${data.jurisdiction ?? 'an unrecorded jurisdiction'}; ` +
        `jurisdiction check ${data.jurisdictionCheck?.result ?? 'not recorded'}.`;
    case 'queue_declined':
      return 'Declined by a professional; returned to the queue.';
    case 'queue_lockout_refused':
      return `Refused by the jurisdiction lockout: ${data.reason ?? 'no reason recorded'}`;
    case 'document_downloaded':
      return 'Document opened.';
    case 'document_flagged':
      return `Flagged (${data.reason ?? 'no reason'})${data.note ? `: ${data.note}` : ''}`;
    case 'document_unflagged':
      return 'Flag cleared.';
    case 'document_revoked':
      return `Revoked (${data.ground ?? 'no ground recorded'})${data.note ? `: ${data.note}` : ''}`;
    case 'signing_link_created':
      return 'A shareable signing link was created for this document.';
    case 'signing_link_revoked':
      return 'A shareable signing link was revoked.';
    default:
      return data.type ?? 'Event';
  }
}

/* ------------------------------------------------------------------------- */
/* Flagging                                                                   */
/* ------------------------------------------------------------------------- */

export async function flagDocument({ documentId, reason, note, actor }) {
  if (!isValidFlagReason(reason)) {
    throw new RepositoryError('invalid_reason', 'Choose why this is being flagged.', 422);
  }
  if (reason === 'other' && !String(note ?? '').trim()) {
    throw new RepositoryError('note_required', 'Describe the concern.', 422);
  }

  const ref = adminDb().collection(DOCUMENTS).doc(documentId);
  if (!(await ref.get()).exists) {
    throw new RepositoryError('not_found', 'No such document.', 404);
  }

  const at = new Date().toISOString();

  await ref.set(
    {
      flag: {
        reason,
        note: String(note ?? '').trim().slice(0, 1000) || null,
        at,
        byUid: actor.uid,
        byEmail: actor.email,
      },
      updatedAt: at,
    },
    { merge: true },
  );

  await writeAudit({
    type: 'document_flagged',
    documentId,
    reason,
    note: String(note ?? '').trim() || null,
    actor,
    at,
  });

  return { ok: true, flagged: true };
}

export async function unflagDocument({ documentId, actor }) {
  const ref = adminDb().collection(DOCUMENTS).doc(documentId);
  if (!(await ref.get()).exists) {
    throw new RepositoryError('not_found', 'No such document.', 404);
  }

  const at = new Date().toISOString();

  // The flag is removed from the document, but the audit log keeps both the
  // flagging and the clearing. A concern that was raised and then dismissed is
  // part of the document's history whatever the outcome.
  await ref.set({ flag: null, updatedAt: at }, { merge: true });

  await writeAudit({ type: 'document_unflagged', documentId, actor, at });

  return { ok: true, flagged: false };
}

/* ------------------------------------------------------------------------- */
/* Revocation                                                                 */
/* ------------------------------------------------------------------------- */

/**
 * Revoke an executed document.
 *
 * Refuses anything not actually executed: a draft needs no revoking, and
 * offering the action anyway invites it to be used as a delete button. Refuses
 * a second revocation of the same document for the same reason.
 *
 * Writes a record to `revocations` as well as marking the document, because the
 * parties need something that says *this instrument was withdrawn, on these
 * grounds, on this date* — a status field on a document they can no longer open
 * does not serve that purpose.
 */
export async function revokeDocument({ documentId, ground, note, actor }) {
  if (!isValidRevocationGround(ground)) {
    throw new RepositoryError('invalid_ground', 'Choose the ground for revocation.', 422);
  }
  if (!String(note ?? '').trim()) {
    // Always required, not only for "other". A revocation with no written
    // reason is useless to the party who has to be told about it.
    throw new RepositoryError(
      'note_required',
      'Set out the reason. This is recorded and may be shown to the parties.',
      422,
    );
  }

  const db = adminDb();
  const ref = db.collection(DOCUMENTS).doc(documentId);
  const at = new Date().toISOString();

  const result = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists) {
      throw new RepositoryError('not_found', 'No such document.', 404);
    }

    const data = snapshot.data();

    if (data.status === DOCUMENT_STATUS.REVOKED) {
      throw new RepositoryError(
        'already_revoked',
        'That document has already been revoked.',
        409,
      );
    }

    if (!EXECUTED_STATUSES.includes(data.status)) {
      throw new RepositoryError(
        'not_executed',
        'Only a signed or notarised document can be revoked. This one has not ' +
          'been executed, so there is nothing to withdraw.',
        409,
      );
    }

    transaction.update(ref, {
      status: DOCUMENT_STATUS.REVOKED,
      // The pre-revocation status is kept: it is the difference between
      // withdrawing a signature and withdrawing a notarial act.
      statusBeforeRevocation: data.status,
      revocation: {
        ground,
        note: String(note).trim().slice(0, 2000),
        at,
        byUid: actor.uid,
        byEmail: actor.email,
      },
      updatedAt: at,
    });

    return {
      ownerId: data.ownerId ?? null,
      professionalId: data.assignedProfessionalId ?? null,
      signerIds: Array.isArray(data.signerIds) ? data.signerIds : [],
      previousStatus: data.status,
      name: data.name ?? data.fileName ?? null,
    };
  });

  const partyIds = [
    result.ownerId,
    result.professionalId,
    ...result.signerIds,
  ].filter(Boolean);

  await db.collection(REVOCATIONS).add({
    documentId,
    documentName: result.name,
    ground,
    note: String(note).trim().slice(0, 2000),
    previousStatus: result.previousStatus,
    // The rule on /revocations/{id} lets a party read their own record.
    partyIds: [...new Set(partyIds)],
    revokedByUid: actor.uid,
    revokedByEmail: actor.email,
    at,
  });

  await writeAudit({ type: 'document_revoked', documentId, ground, note: String(note).trim(), actor, at });

  return { ok: true, revoked: true, previousStatus: result.previousStatus };
}

/* ------------------------------------------------------------------------- */

async function writeAudit({ type, documentId, actor, at, ...rest }) {
  await adminDb()
    .collection('auditLog')
    .add({
      type,
      documentId,
      ...rest,
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role ?? 'admin',
      at,
    })
    .catch((error) => console.error('[admin/documents] AUDIT WRITE FAILED', { type, documentId, error }));
}
