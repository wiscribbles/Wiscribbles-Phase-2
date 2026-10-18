/**
 * The client's request for service — the five-step sequence.
 *
 * Brief, client workflow: terms and conditions checkpoint, disclaimer, choose
 * what is needed and where, upload the document, pay, then wait for a
 * professional.
 *
 * WHY THE CHECKPOINTS ARE RECORDED AND NOT JUST SHOWN
 *
 * A tick box that gates a button and is then forgotten proves nothing. If a
 * party later says they were never told that an electronically notarised
 * instrument has no effect in their jurisdiction, or that the platform is not
 * their lawyer, the only useful answer is a record: this text, this version, at
 * this time, from this account. So each acceptance is stored with the exact
 * text version it accepted, alongside the document it relates to.
 *
 * That is also why the disclaimer text lives here as versioned constants rather
 * than in a React component. Text in a component changes silently on deploy and
 * takes the meaning of every past acceptance with it.
 *
 * WHAT THE JURISDICTION STEP REFUSES
 *
 * A client in Trinidad asking for notarisation is refused with the statute
 * named, before they upload anything or pay anything. The alternative — taking
 * the document and the money and discovering it at the session — is the worst
 * possible order in which to find out.
 */

import { adminDb } from '@/lib/firebase-admin';
import {
  LOCKOUT_REASON,
  checkJurisdictionLockout,
  getJurisdiction,
  listLaunchJurisdictions,
} from '@/lib/jurisdictions';
import { FeeError, publishedPriceList, quote } from '@/lib/fees';
import { EXECUTION_MODE, canProfessionalHandle } from '@/lib/templates';
import { QUEUE_COLLECTION, QUEUE_STATUS, SERVICE_TYPE } from '@/lib/queue';

export const DOCUMENTS_COLLECTION = 'documents';
export const ACCEPTANCES_COLLECTION = 'acceptances';

/* ------------------------------------------------------------------------- */
/* The versioned text                                                        */
/* ------------------------------------------------------------------------- */

/**
 * Bump the version whenever the wording changes in a way that alters what is
 * being agreed. Past acceptances keep pointing at the version they accepted,
 * which is the whole purpose of versioning it.
 */
export const TERMS_VERSION = '2026-10-18.1';
export const DISCLAIMER_VERSION = '2026-10-18.1';

export const DISCLAIMER_TEXT = Object.freeze({
  version: DISCLAIMER_VERSION,
  heading: 'Before you continue',
  points: Object.freeze([
    'WiScribbles is a platform that connects you with an independent Notary ' +
      'Public or Commissioner of Oaths. We are not your attorney and nothing ' +
      'here is legal advice.',
    'The professional who attends your session is responsible for their own ' +
      'professional obligations. A completed identity check on this platform ' +
      'does not discharge their duty to satisfy themselves as to who you are.',
    'Electronic notarisation only has legal effect where the law of the ' +
      'jurisdiction gives it effect. The next step will tell you whether that ' +
      'is the case for what you are asking for, and will refuse the request if ' +
      'it is not.',
    'Some categories of document cannot be executed electronically at all and ' +
      'must be signed on paper — wills and powers of attorney among them in ' +
      'several jurisdictions. These are excluded rather than hidden, so you ' +
      'will be told which and why.',
    'Your document is stored encrypted and is visible to you, to the ' +
      'professional handling it, and to WiScribbles staff reviewing the ' +
      'platform. Every time it is opened is recorded.',
  ]),
});

/* ------------------------------------------------------------------------- */
/* Steps                                                                     */
/* ------------------------------------------------------------------------- */

export const STEP = Object.freeze({
  TERMS: 'terms',
  DISCLAIMER: 'disclaimer',
  SERVICE: 'service',
  DOCUMENT: 'document',
  PAYMENT: 'payment',
});

export const STEP_ORDER = Object.freeze([
  STEP.TERMS,
  STEP.DISCLAIMER,
  STEP.SERVICE,
  STEP.DOCUMENT,
  STEP.PAYMENT,
]);

export const STEP_LABELS = Object.freeze({
  [STEP.TERMS]: 'Terms',
  [STEP.DISCLAIMER]: 'What to know',
  [STEP.SERVICE]: 'What you need',
  [STEP.DOCUMENT]: 'Your document',
  [STEP.PAYMENT]: 'Payment',
});

export const REQUEST_SERVICE_OPTIONS = Object.freeze([
  {
    value: EXECUTION_MODE.ESIGN,
    label: 'Signature only',
    description: 'You and any other parties sign. No professional attends.',
    serviceType: null,
  },
  {
    value: SERVICE_TYPE.NOTARIZATION,
    label: 'Notarisation',
    description: 'A Notary Public attends by video and seals the document.',
    serviceType: SERVICE_TYPE.NOTARIZATION,
  },
  {
    value: SERVICE_TYPE.COMMISSIONING,
    label: 'Oath or declaration',
    description: 'A Commissioner of Oaths administers the oath by video.',
    serviceType: SERVICE_TYPE.COMMISSIONING,
  },
]);

export class RequestError extends Error {
  constructor(code, message, status = 422, field = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

/* ------------------------------------------------------------------------- */
/* Choosing                                                                  */
/* ------------------------------------------------------------------------- */

/**
 * Which templates this client may choose, and why the others are unavailable.
 *
 * Returns the unavailable ones WITH their reason rather than filtering them out
 * silently. A client who came to notarise an affidavit in Trinidad should be
 * told that Trinidad law does not give electronic notarisation effect — not
 * shown an empty list that reads as a broken website.
 */
export async function selectableFor({ jurisdiction, requestedService }) {
  const place = getJurisdiction(jurisdiction);

  if (!place) {
    throw new RequestError('unknown_jurisdiction', 'Choose a jurisdiction.', 422, 'jurisdiction');
  }
  if (!place.launchEnabled) {
    throw new RequestError(
      'jurisdiction_not_launched',
      `WiScribbles does not operate in ${place.name} yet.`,
      422,
      'jurisdiction',
    );
  }

  const wantsProfessional = requestedService !== EXECUTION_MODE.ESIGN;
  const executionMode = wantsProfessional ? EXECUTION_MODE.NOTARIZED : EXECUTION_MODE.ESIGN;

  const snapshot = await adminDb()
    .collection('documentTemplates')
    .where('active', '==', true)
    .where('executionMode', '==', executionMode)
    .limit(200)
    .get();

  const available = [];
  const unavailable = [];

  for (const doc of snapshot.docs) {
    const template = doc.data();

    if (!(template.jurisdictions ?? []).includes(place.code)) continue;

    /* The service type has to match the role the template permits: a template
       only a Notary may handle is not available to someone asking for an oath
       to be administered. */
    if (wantsProfessional) {
      const wantedRole =
        requestedService === SERVICE_TYPE.NOTARIZATION ? 'notary' : 'coath';

      if (!(template.roles ?? []).includes(wantedRole)) {
        unavailable.push({
          id: doc.id,
          name: template.name,
          reason:
            requestedService === SERVICE_TYPE.NOTARIZATION
              ? 'This document is handled by a Commissioner of Oaths, not a Notary.'
              : 'This document is handled by a Notary, not a Commissioner of Oaths.',
        });
        continue;
      }
    }

    // The lockout, run before anything is uploaded or charged.
    const lockout = checkJurisdictionLockout({
      documentJurisdiction: place.code,
      // No professional yet, so the professional half is not being tested here;
      // what is being tested is whether this kind of document can be executed
      // this way in this place at all.
      professionalJurisdictions: [place.code],
      documentCategory: template.documentCategory ?? null,
    });

    if (wantsProfessional && !lockout.allowed) {
      /* An exclusion is not a dead end. Six of the eight documents the
         marketing site advertises are on the launch market's exclusion
         schedule, so "no" on its own would make the most prominent thing on
         the home page lead nowhere. Flag the ones that can go down the paper
         route so the UI can offer it instead of just refusing. */
      const excluded = lockout.reason === LOCKOUT_REASON.DOCUMENT_CATEGORY_EXCLUDED;

      unavailable.push({
        id: doc.id,
        name: template.name,
        documentCategory: template.documentCategory ?? null,
        reason: lockout.message,
        prepareRegisterEligible: excluded,
      });
      continue;
    }

    available.push({
      id: doc.id,
      name: template.name,
      description: template.description ?? null,
      documentCategory: template.documentCategory ?? null,
      executionMode: template.executionMode,
      roles: template.roles ?? [],
    });
  }

  const sort = (a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''));

  return {
    jurisdiction: { code: place.code, name: place.name, statute: place.statute },
    supportsNotarization: place.notarizationEnabled,
    available: available.sort(sort),
    unavailable: unavailable.sort(sort),
  };
}

export const requestOptions = () => ({
  services: REQUEST_SERVICE_OPTIONS,
  /* The published price list, so the wizard can quote as the client fills it
     in. The site's own Terms of Service clause 5 requires fees to be displayed
     before the transaction completes. */
  priceList: publishedPriceList(),
  jurisdictions: listLaunchJurisdictions().map((j) => ({
    code: j.code,
    name: j.name,
    supportsNotarization: j.notarizationEnabled,
  })),
  disclaimer: DISCLAIMER_TEXT,
  termsVersion: TERMS_VERSION,
  steps: STEP_ORDER.map((step) => ({ value: step, label: STEP_LABELS[step] })),
});

/* ------------------------------------------------------------------------- */
/* Submitting                                                               */
/* ------------------------------------------------------------------------- */

/**
 * Create the document and, where a professional is needed, the queue entry.
 *
 * Everything is validated again here even though the wizard validated it on
 * the way through. The wizard runs in a browser; this is the only validation
 * that exists as far as the platform is concerned.
 *
 * @param {object} input
 * @param {object} input.client          session user
 * @param {string} input.jurisdiction
 * @param {string} input.requestedService  one of REQUEST_SERVICE_OPTIONS values
 * @param {string} input.templateId
 * @param {string} input.storagePath     verified upload path
 * @param {string} input.name
 * @param {object} input.acceptances     { termsVersion, disclaimerVersion }
 */
export async function submitRequest({
  client,
  jurisdiction,
  requestedService,
  templateId,
  storagePath,
  name,
  sizeBytes = null,
  pageCount = null,
  signatories = 1,
  witnesses = 0,
  seals = 1,
  acceptances,
}) {
  /* ---- the checkpoints ------------------------------------------------- */
  if (acceptances?.termsVersion !== TERMS_VERSION) {
    throw new RequestError(
      'terms_not_accepted',
      'The terms and conditions have changed since you started. Please read ' +
        'them again before continuing.',
      409,
      'terms',
    );
  }
  if (acceptances?.disclaimerVersion !== DISCLAIMER_VERSION) {
    throw new RequestError(
      'disclaimer_not_accepted',
      'The notice has changed since you started. Please read it again.',
      409,
      'disclaimer',
    );
  }

  /* ---- the choice ------------------------------------------------------ */
  const { available } = await selectableFor({ jurisdiction, requestedService });
  const template = available.find((candidate) => candidate.id === templateId);

  if (!template) {
    throw new RequestError(
      'template_not_available',
      'That document type is not available for what you have chosen. Go back ' +
        'and pick again.',
      422,
      'templateId',
    );
  }

  /* ---- the file -------------------------------------------------------- */
  const expectedPrefix = `users/${client.uid}/`;
  if (!storagePath || !String(storagePath).startsWith(expectedPrefix)) {
    /* The path is checked against the SESSION's uid, not against anything in
       the request. A path from the request body pointing into another user's
       folder would otherwise attach their file to this request. */
    throw new RequestError(
      'bad_upload',
      'That upload could not be verified. Upload the document again.',
      422,
      'document',
    );
  }

  const serviceType =
    REQUEST_SERVICE_OPTIONS.find((option) => option.value === requestedService)?.serviceType ??
    null;

  /* The fee, recalculated here rather than trusted from the request.
   *
   * The wizard quotes as the client fills it in, which is what the site's own
   * Terms require ("fees are displayed before you complete a transaction").
   * But a total arriving in a request body is a number the client chose. This
   * is the one that counts, and it is STORED with its price-list version, so a
   * later dispute is settled by reading the record rather than re-running a
   * version of lib/fees.js that may have changed since. */
  let fee;
  try {
    fee = quote({
      notarized: Boolean(serviceType),
      signatories,
      witnesses,
      seals: serviceType ? seals : 1,
    });
  } catch (error) {
    if (error instanceof FeeError) {
      throw new RequestError('fee_invalid', error.message, 422, error.field);
    }
    throw error;
  }

  const db = adminDb();
  const now = new Date().toISOString();
  const place = getJurisdiction(jurisdiction);

  const documentRef = db.collection(DOCUMENTS_COLLECTION).doc();

  const document = {
    name: String(name ?? '').trim().slice(0, 200) || template.name,
    status: serviceType ? 'awaiting_notarisation' : 'awaiting_signature',

    ownerId: client.uid,
    ownerName: client.name ?? null,
    ownerEmail: client.email ?? null,
    ownerRole: client.role,
    signerIds: [client.uid],

    templateId: template.id,
    templateName: template.name,
    documentCategory: template.documentCategory ?? null,
    jurisdiction: place.code,
    jurisdictionStatute: place.statute ?? null,
    executionMode: template.executionMode,
    serviceType,

    storagePath,
    stampedPath: null,
    sizeBytes: sizeBytes ?? null,
    pageCount: pageCount ?? null,

    /* The parties and the seal count, which drive both the fee and how many
       people the session has to admit. A notarisation with two signatories and
       a witness is four people in the room, not two. */
    signatories: Number(signatories),
    witnesses: Number(witnesses),
    seals: serviceType ? Number(seals) : 0,

    /* The quote as agreed, itemised, with the price list that produced it. */
    fee: {
      lines: fee.lines,
      totalCents: fee.totalCents,
      currency: fee.currency,
      priceListVersion: fee.priceListVersion,
      quotedAt: now,
      paid: false,
    },

    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(documentRef, document);

  /* The acceptances, each with the version of the text it accepted. Written in
     the same batch as the document so there is never a document without them. */
  for (const [kind, version] of [
    ['terms', acceptances.termsVersion],
    ['disclaimer', acceptances.disclaimerVersion],
  ]) {
    batch.set(db.collection(ACCEPTANCES_COLLECTION).doc(), {
      kind,
      version,
      documentId: documentRef.id,
      uid: client.uid,
      email: client.email ?? null,
      at: now,
    });
  }

  let queueEntryId = null;

  if (serviceType) {
    const entryRef = db.collection(QUEUE_COLLECTION).doc();
    queueEntryId = entryRef.id;

    batch.set(entryRef, {
      status: QUEUE_STATUS.WAITING,
      serviceType,
      jurisdiction: place.code,
      documentCategory: template.documentCategory ?? null,
      templateId: template.id,
      templateName: template.name,
      documentId: documentRef.id,
      pageCount: pageCount ?? null,

      clientId: client.uid,
      clientName: client.name ?? null,
      clientEmail: client.email ?? null,

      declinedBy: [],
      assignedTo: null,
      assignedAt: null,
      sessionId: null,
      createdAt: now,
      updatedAt: now,
    });

    batch.update(documentRef, { queueEntryId });
  }

  await batch.commit();

  await db
    .collection('auditLog')
    .add({
      type: 'document_created',
      documentId: documentRef.id,
      entryId: queueEntryId,
      templateId: template.id,
      jurisdiction: place.code,
      serviceType,
      termsVersion: acceptances.termsVersion,
      disclaimerVersion: acceptances.disclaimerVersion,
      actorUid: client.uid,
      actorEmail: client.email,
      actorRole: client.role,
      at: now,
    })
    .catch((error) => console.error('[clientRequests] audit write failed', error));

  return {
    documentId: documentRef.id,
    queueEntryId,
    fee: { totalCents: fee.totalCents, currency: fee.currency },
    // An e-signature request goes straight to the document; a request needing
    // a professional goes to the waiting room.
    next: serviceType ? 'queue' : 'document',
  };
}

/** The client's own view of where their request stands. */
export async function requestStatusFor({ uid, documentId }) {
  const snapshot = await adminDb().collection(DOCUMENTS_COLLECTION).doc(documentId).get();

  if (!snapshot.exists) return null;

  const data = snapshot.data();
  if (data.ownerId !== uid) return null;

  let queue = null;

  if (data.queueEntryId) {
    const entry = await adminDb().collection(QUEUE_COLLECTION).doc(data.queueEntryId).get();
    if (entry.exists) {
      const value = entry.data();
      queue = {
        status: value.status ?? null,
        sessionId: value.sessionId ?? null,
        /* The client is told a professional has accepted and what kind, but
           not which one until the session opens — there is nothing they can do
           with the name beforehand, and it is the professional's to give. */
        professionalRole: value.assignedToRole ?? null,
        waitingSince: value.createdAt ?? null,
      };
    }
  }

  return {
    documentId,
    name: data.name ?? null,
    status: data.status ?? null,
    templateName: data.templateName ?? null,
    jurisdiction: data.jurisdiction ?? null,
    serviceType: data.serviceType ?? null,
    queue,
  };
}

export { canProfessionalHandle };
