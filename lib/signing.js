/**
 * Multi-party signing, one party at a time.
 *
 * Brief (18 Oct): "Have a function for multiple signatories, they do not need
 * to be all in at one time but rather can be included one at a time."
 *
 * WHY SEQUENTIAL IS BOTH EASIER AND BETTER
 *
 * Getting four people into one video call at one time is the hardest part of
 * remote execution and the most common reason a signing falls through. Nothing
 * in any of the four Acts requires simultaneity: a requirement for a signature
 * is satisfied by an electronic signature, and no Act says the signatures must
 * be contemporaneous. So each party signs when they can, in a defined order,
 * and the instrument completes when the last one is done.
 *
 * The order matters and is enforced. A guarantor signing before the principal
 * debtor, or a party signing a document another party has not yet agreed to,
 * produces a sequence that reads wrongly on the face of the instrument. The
 * order is set when the document is created and `nextParty` is the only way to
 * find out whose turn it is.
 *
 * WITNESSES — BUILT, AND REFUSED AT THE GATE
 *
 * The question asked was whether witnesses could e-sign while the principal
 * notarises. The capability is here; it is switched off in every jurisdiction.
 *
 * The reasoning is recorded in full at `REMOTE_WITNESSING_ENABLED` in
 * `lib/jurisdictions.js`. In short: a witnessing requirement is a PRESENCE
 * requirement, not a signature requirement. The witness attests that they saw
 * the signatory sign; the signature is only the record of that attestation.
 * All four Acts convert writing, signature, original form, retention,
 * admissibility and notarisation. None of them mentions presence, and where
 * other common-law jurisdictions have permitted remote witnessing they have
 * done it by express, narrow legislation — which is poor evidence that a
 * general e-signature clause already achieves it.
 *
 * So a witness party on a document in a jurisdiction where remote witnessing
 * is not enabled is marked `requiresInPersonWitnessing`, cannot sign through
 * the platform, and the document is told to route the witnessing in person.
 * Flipping the flag per jurisdiction takes a written opinion.
 *
 * AND AS OF 19 OCTOBER 2026 A WITNESS PARTY IS REFUSED OUTRIGHT, NOT PARKED
 *
 * Read the paragraph above and then read this one, because the position
 * changed and the machinery did not.
 *
 * Marking a witness `IN_PERSON_REQUIRED` and carrying on was wrong in a way
 * that is only visible from the end of the flow: the document completed every
 * signature it could, moved to `awaiting_in_person_witnessing`, and then
 * stopped there FOREVER. Nothing released it. No status transition out of that
 * state exists, no notification told the creator what to do, and the retention
 * rules (correctly) refuse to purge it. Adding a witness did not degrade the
 * document, it killed it — silently, after the client had paid attention to
 * four screens.
 *
 * The cross-reference that settled it: of the eleven document categories
 * Guyana permits, only sale of chattels clearly attracts a witness and only
 * property management agreement conditionally. Everything classically
 * witnessed — wills, powers of attorney, deeds of land, trusts, leases,
 * agreements of sale — is already OUTSIDE the permitted catalogue and already
 * routed to Prepare & Register. The witness-requiring work is almost entirely
 * on the paper route already, so the feature was buying nothing and costing
 * documents.
 *
 * So `buildParties` now REFUSES a witness party outright wherever
 * `remoteWitnessingEnabled` is false for the jurisdiction, with the honest
 * refusal and a pointer to Prepare & Register, instead of accepting one and
 * parking the instrument. The refusal happens at intake, where the client can
 * still do something about it.
 *
 * EVERYTHING BELOW IS DELIBERATELY UNREACHABLE FROM THE UI AS OF 19 OCT 2026,
 * AND IS DELIBERATELY NOT DELETED: `PARTY_ROLE.WITNESS`,
 * `PARTY_STATUS.IN_PERSON_REQUIRED`, the `nextParty` skip, the
 * `recordSignature` refusal and `needsInPersonWitnessing`. Three reasons.
 * (1) Documents already sitting in `awaiting_in_person_witnessing` must stay
 * readable and must never be purged — that needs the status to keep meaning
 * something. (2) The refusal is keyed to the jurisdiction flag, so the ONE
 * change that re-enables the whole path is setting
 * `REMOTE_WITNESSING_ENABLED[<code>] = true` in `lib/jurisdictions.js` on a
 * written opinion that the jurisdiction permits remote attestation — no code
 * change here, and no rebuild of machinery that is already correct. (3) The
 * Oct 2026 statutory research found the question is closer than it looks:
 * Trinidad's Judiciary has gazetted a Practice Direction (T&T Gazette Vol. 62
 * No. 179, 12 Dec 2023, para. 30(b)) accepting that an oath may be
 * administered VIRTUALLY, by video connection, to a Notary Public among
 * others. That is criminal-jurisdiction and platform-specific, so it does not
 * authorise anything here — but it is the first real evidence in any of the
 * four jurisdictions that "before" need not mean "physically present", and it
 * is the reason this code is being kept rather than removed.
 *
 * TOKENS, BECAUSE PARTIES USUALLY HAVE NO ACCOUNT
 *
 * The other side of a sale is not a WiScribbles user and should not have to
 * become one to sign. Each party gets a single-use token, and only its SHA-256
 * digest is stored — the same reasoning as `lib/signingLinks.js`: a leaked
 * database yields digests, not working links. A party who loses their link is
 * re-invited, not recovered.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { adminDb } from '@/lib/firebase-admin';
import { remoteWitnessingEnabled, REMOTE_WITNESSING_REFUSAL } from '@/lib/jurisdictions';
import { createEntryForDocument } from '@/lib/queue';
import { assertReviewed } from '@/lib/review';

export const PARTY_ROLE = Object.freeze({
  SIGNATORY: 'signatory',
  WITNESS: 'witness',
});

export const PARTY_STATUS = Object.freeze({
  /** Not yet their turn. */
  WAITING: 'waiting',
  /** Their turn; invitation sent. */
  INVITED: 'invited',
  /** Signed. */
  SIGNED: 'signed',
  /** Refused to sign. Stops the sequence. */
  DECLINED: 'declined',
  /** Must attend in person — remote witnessing not available here. */
  IN_PERSON_REQUIRED: 'in_person_required',
});

export const PARTY_STATUS_LABELS = Object.freeze({
  [PARTY_STATUS.WAITING]: 'Waiting their turn',
  [PARTY_STATUS.INVITED]: 'Invited — their turn now',
  [PARTY_STATUS.SIGNED]: 'Signed',
  [PARTY_STATUS.DECLINED]: 'Declined',
  [PARTY_STATUS.IN_PERSON_REQUIRED]: 'Must witness in person',
});

/** How long a party's invitation stands before it has to be reissued. */
export const INVITATION_TTL_DAYS = 14;

const TOKEN_BYTES = 32;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class SigningError extends Error {
  constructor(code, message, status = 422, field = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

/* ------------------------------------------------------------------------- */
/* Tokens                                                                     */
/* ------------------------------------------------------------------------- */

export const hashToken = (token) =>
  createHash('sha256').update(String(token), 'utf8').digest('hex');

export function mintPartyToken() {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

export function tokensMatch(a, b) {
  const left = Buffer.from(String(a ?? ''), 'utf8');
  const right = Buffer.from(String(b ?? ''), 'utf8');
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/* ------------------------------------------------------------------------- */
/* Building the party list                                                    */
/* ------------------------------------------------------------------------- */

/**
 * Normalise and order the parties for a document.
 *
 * The creator is always party 1 unless they say otherwise — they are the one
 * who uploaded it and the one the fee is quoted to. Witnesses are placed after
 * all signatories, because a witness attests to a signature that has to exist
 * first.
 *
 * @param {object}   input
 * @param {object[]} input.parties   [{ name, email, role }]
 * @param {string}   input.jurisdiction
 * @param {object}   input.creator   session user, placed first
 */
export function buildParties({ parties = [], jurisdiction, creator }) {
  const cleaned = [];
  const seen = new Set();

  const witnessingAllowed = remoteWitnessingEnabled(jurisdiction);

  for (const raw of parties) {
    const email = String(raw?.email ?? '').trim().toLowerCase();
    const role = raw?.role === PARTY_ROLE.WITNESS ? PARTY_ROLE.WITNESS : PARTY_ROLE.SIGNATORY;

    /* The 19 Oct refusal. A witness is turned away at intake rather than
       accepted and parked at `awaiting_in_person_witnessing`, which was a
       state with no route onward. Keyed to the jurisdiction flag, so a written
       opinion that a jurisdiction permits remote attestation re-opens this
       path by itself — see the header note. */
    if (role === PARTY_ROLE.WITNESS && !witnessingAllowed) {
      throw new SigningError(
        'witness_not_accepted',
        `${REMOTE_WITNESSING_REFUSAL} So we cannot add a witness to a document ` +
          `signed here. If this document needs one, Prepare & Register is the ` +
          `route: we draft it, check it and verify the parties online, and you ` +
          `sign it on paper in front of your witness.`,
        422,
        'parties',
      );
    }

    if (!EMAIL.test(email)) {
      throw new SigningError(
        'bad_email',
        `"${raw?.email ?? ''}" is not a valid email address.`,
        422,
        'parties',
      );
    }

    /* One party per email address. The same person signing twice in different
       capacities is a real scenario, but it needs its own handling and
       silently de-duplicating would produce a document missing a signature. */
    if (seen.has(email)) {
      throw new SigningError(
        'duplicate_party',
        `${email} appears more than once. Each party needs their own email address.`,
        422,
        'parties',
      );
    }
    seen.add(email);

    cleaned.push({
      name: String(raw?.name ?? '').trim().slice(0, 120) || null,
      email,
      role,
    });
  }

  const creatorEmail = String(creator?.email ?? '').trim().toLowerCase();

  /*
   * The creator's own address is validated too — added 25 Oct 2026, when a
   * test asked what happens if it is missing.
   *
   * Every party supplied by the caller was already checked, but the creator is
   * added by THIS function and was not. The failure mode is the quiet kind: a
   * document whose party 1 has an empty email is created successfully, is
   * marked INVITED, and then sits there for ever, because the invitation has
   * nowhere to go and nothing else can sign until party 1 does. Exactly the
   * shape of the witness bug this file's header describes.
   *
   * In practice the creator comes from a verified session so this should never
   * fire. "Should never fire" is the reason to check it rather than the reason
   * not to: if it ever does, the caller has passed the wrong object, and a 422
   * naming the problem is far better than a document nobody can finish.
   */
  if (!EMAIL.test(creatorEmail)) {
    throw new SigningError(
      'bad_creator_email',
      'This account has no usable email address, so we cannot invite you to ' +
        'sign your own document.',
      422,
      'parties',
    );
  }

  const all = seen.has(creatorEmail)
    ? cleaned
    : [
        {
          name: creator?.name ?? null,
          email: creatorEmail,
          role: PARTY_ROLE.SIGNATORY,
          uid: creator?.uid ?? null,
        },
        ...cleaned,
      ];

  const signatories = all.filter((p) => p.role === PARTY_ROLE.SIGNATORY);
  const witnesses = all.filter((p) => p.role === PARTY_ROLE.WITNESS);

  if (signatories.length === 0) {
    throw new SigningError('no_signatory', 'A document needs at least one signatory.', 422, 'parties');
  }

  /* Signatories first, then witnesses, numbered from 1. Today `witnesses` is
     always empty — a witness cannot get past the refusal above while every
     `REMOTE_WITNESSING_ENABLED` flag is false. The ordering is kept because it
     is correct and because it is what the flag flip relies on. */
  return [...signatories, ...witnesses].map((party, index) => ({
    ...party,
    uid: party.uid ?? null,
    order: index + 1,
    status:
      party.role === PARTY_ROLE.WITNESS && !witnessingAllowed
        ? PARTY_STATUS.IN_PERSON_REQUIRED
        : index === 0
          ? PARTY_STATUS.INVITED
          : PARTY_STATUS.WAITING,
    tokenHash: null,
    invitedAt: null,
    signedAt: null,
    declinedAt: null,
    declineReason: null,
  }));
}

/** Does this document need somebody to witness it in person? */
export const needsInPersonWitnessing = (parties = []) =>
  parties.some((p) => p.status === PARTY_STATUS.IN_PERSON_REQUIRED);

/**
 * Whose turn is it?
 *
 * The lowest-ordered party who has not signed, skipping anyone who must attend
 * in person — a witness who cannot sign remotely must not block the
 * signatories from completing their part. A declined party stops everything
 * and returns null, because a document one party has refused is not one the
 * next party should be asked to sign.
 */
export function nextParty(parties = []) {
  const ordered = [...parties].sort((a, b) => a.order - b.order);

  if (ordered.some((p) => p.status === PARTY_STATUS.DECLINED)) return null;

  return (
    ordered.find(
      (p) =>
        p.status !== PARTY_STATUS.SIGNED &&
        p.status !== PARTY_STATUS.IN_PERSON_REQUIRED,
    ) ?? null
  );
}

/** Have all the parties who CAN sign remotely done so? */
export const remoteSigningComplete = (parties = []) =>
  parties.length > 0 &&
  parties.every(
    (p) => p.status === PARTY_STATUS.SIGNED || p.status === PARTY_STATUS.IN_PERSON_REQUIRED,
  );

/** Is the instrument fully executed — nobody outstanding at all? */
export const fullyExecuted = (parties = []) =>
  parties.length > 0 && parties.every((p) => p.status === PARTY_STATUS.SIGNED);

/* ------------------------------------------------------------------------- */
/* Inviting                                                                   */
/* ------------------------------------------------------------------------- */

/**
 * Issue a signing token to whoever's turn it is.
 *
 * Returns the token ONCE. Nothing stores it in readable form, so a lost link
 * is reissued rather than recovered — and reissuing rotates the digest, which
 * invalidates the old link. That is the desired behaviour: a signing link
 * forwarded to the wrong person stops working the moment the right person asks
 * for a new one.
 */
export async function inviteNextParty({ documentId }) {
  const db = adminDb();
  const ref = db.collection('documents').doc(String(documentId));

  const result = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists) {
      throw new SigningError('not_found', 'No such document.', 404);
    }

    const data = snapshot.data();
    const parties = Array.isArray(data.parties) ? data.parties : [];
    const turn = nextParty(parties);

    if (!turn) {
      throw new SigningError(
        'nobody_to_invite',
        remoteSigningComplete(parties)
          ? 'Every party who can sign remotely has signed.'
          : 'A party has declined, so the sequence has stopped.',
        409,
      );
    }

    const { token, tokenHash } = mintPartyToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(
      Date.now() + INVITATION_TTL_DAYS * 86400000,
    ).toISOString();

    const updated = parties.map((party) =>
      party.order === turn.order
        ? {
            ...party,
            status: PARTY_STATUS.INVITED,
            tokenHash,
            invitedAt: now,
            tokenExpiresAt: expiresAt,
          }
        : party,
    );

    transaction.update(ref, { parties: updated, updatedAt: now });

    return { token, party: { ...turn, invitedAt: now }, expiresAt };
  });

  return result;
}

/* ------------------------------------------------------------------------- */
/* Signing                                                                    */
/* ------------------------------------------------------------------------- */

/**
 * Record a party's signature.
 *
 * The token identifies the party — there is no account to authenticate. Found
 * BY digest rather than fetched and compared, so there is no comparison to
 * time. Out-of-turn signing is refused: the order on the instrument has to
 * mean something.
 *
 * @returns {{ complete: boolean, next: object|null, needsWitnessing: boolean }}
 */
export async function recordSignature({
  documentId,
  token,
  signatureName,
  ip = null,
  review = null,
}) {
  if (!token) {
    throw new SigningError('no_token', 'That signing link is not valid.', 403);
  }
  if (!String(signatureName ?? '').trim()) {
    throw new SigningError(
      'no_name',
      'Type your full name as your signature.',
      422,
      'signatureName',
    );
  }

  const digest = hashToken(token);
  const db = adminDb();
  const ref = db.collection('documents').doc(String(documentId));

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists) {
      throw new SigningError('not_found', 'No such document.', 404);
    }

    const data = snapshot.data();

    if (data.status === 'revoked') {
      throw new SigningError(
        'revoked',
        'This document has been revoked and cannot be signed.',
        409,
      );
    }

    const parties = Array.isArray(data.parties) ? data.parties : [];
    const party = parties.find((p) => p.tokenHash && tokensMatch(p.tokenHash, digest));

    if (!party) {
      throw new SigningError('bad_token', 'That signing link is not valid.', 403);
    }

    if (party.status === PARTY_STATUS.SIGNED) {
      throw new SigningError('already_signed', 'You have already signed this document.', 409);
    }

    if (party.status === PARTY_STATUS.IN_PERSON_REQUIRED) {
      throw new SigningError('in_person_required', REMOTE_WITNESSING_REFUSAL, 409);
    }

    const expires = Date.parse(party.tokenExpiresAt ?? '');
    if (!Number.isNaN(expires) && expires <= Date.now()) {
      throw new SigningError(
        'expired',
        'That signing link has expired. Ask whoever sent it for a new one.',
        410,
      );
    }

    /* Out of turn. The order was chosen when the document was created and a
       document signed in the wrong sequence reads wrongly on its face. */
    const turn = nextParty(parties);
    if (!turn || turn.order !== party.order) {
      throw new SigningError(
        'out_of_turn',
        turn
          ? 'It is not your turn yet — we will email you when it is.'
          : 'A party has declined this document, so it can no longer be signed.',
        409,
      );
    }

    /* THE REVIEW-AND-CORRECT GATE — Barbados s.12A, Jamaica s.27(2).
       The reasoning, and why it is not gated per jurisdiction, is in
       `lib/review.js`. The short version: a signature collected without an
       opportunity to review and correct is voidable by the person who gave
       it, and the evidence that the opportunity was given cannot be created
       afterwards.

       Enforced here rather than in the browser because this endpoint is
       token-authenticated by design — anyone holding a link can post to it
       directly, so a UI-only step would be missing from precisely the
       signatures most likely to be disputed.

       Placed last among the refusals deliberately. Asking someone to review
       the details when their link has in fact expired, or when it is not
       their turn, would be a worse message than the true one. */
    const reviewRecord = assertReviewed({
      review,
      signatureName,
      jurisdiction: data.jurisdiction ?? null,
      ip,
    });

    const now = new Date().toISOString();

    const updated = parties.map((candidate) =>
      candidate.order === party.order
        ? {
            ...candidate,
            status: PARTY_STATUS.SIGNED,
            signedAt: now,
            signatureName: String(signatureName).trim().slice(0, 160),
            /* Barbados s.11(2)(c) and Trinidad s.17 make the manner in which
               the originator was identified an express factor in evidential
               weight. For a token-identified party that is: the link they
               held, when they used it, and from where. Not identity
               verification — it is what it is, and it is recorded as such. */
            signedFromIp: ip,
            /* The review-and-correct artefact, stored on the party rather
               than on the document: the duty is owed to each party
               individually, and party 3 cannot rely on party 1 having been
               shown a confirmation screen. */
            review: reviewRecord,
            // The token is spent. Reissuing is a fresh invitation.
            tokenHash: null,
          }
        : candidate,
    );

    const next = nextParty(updated);
    const complete = remoteSigningComplete(updated);

    transaction.update(ref, {
      parties: updated,
      signerIds: updated.filter((p) => p.uid).map((p) => p.uid),
      ...(complete
        ? {
            /* All remote signatures in. Where a professional is needed the
               document now goes to the queue; where it is e-signature only it
               is done — unless a witness still has to attend in person, in
               which case it is not finished and must not say it is. */
            status: needsInPersonWitnessing(updated)
              ? 'awaiting_in_person_witnessing'
              : data.serviceType
                ? 'awaiting_notarisation'
                : 'signed',
            allPartiesSignedAt: now,
          }
        : {}),
      updatedAt: now,
    });

    return {
      complete,
      next: next ? { order: next.order, name: next.name, email: next.email } : null,
      needsWitnessing: needsInPersonWitnessing(updated),
      serviceType: data.serviceType ?? null,
    };
  });
}

/**
 * Signing finished — do whatever comes next.
 *
 * Separate from `recordSignature` because it must happen AFTER that
 * transaction commits, not inside it: `createEntryForDocument` runs its own
 * transaction, and Firestore will not nest them. Calling it inside would
 * either deadlock or silently read stale data.
 */
export async function afterSigningComplete({ documentId, outcome }) {
  if (!outcome?.complete) return { enqueued: false };

  /* A witness who still has to attend in person means the instrument is not
     ready for a notary: the notary would be sealing something that is not yet
     properly attested. It waits. */
  if (outcome.needsWitnessing) {
    return { enqueued: false, reason: 'awaiting_in_person_witnessing' };
  }

  if (!outcome.serviceType) {
    return { enqueued: false, reason: 'esign_only_complete' };
  }

  const { entryId, created } = await createEntryForDocument({ documentId });
  return { enqueued: true, entryId, created };
}

/** A party refusing to sign. Stops the sequence rather than skipping them. */
export async function declineToSign({ documentId, token, reason = null }) {
  const digest = hashToken(token);
  const db = adminDb();
  const ref = db.collection('documents').doc(String(documentId));

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new SigningError('not_found', 'No such document.', 404);

    const data = snapshot.data();
    const parties = Array.isArray(data.parties) ? data.parties : [];
    const party = parties.find((p) => p.tokenHash && tokensMatch(p.tokenHash, digest));

    if (!party) throw new SigningError('bad_token', 'That signing link is not valid.', 403);

    const now = new Date().toISOString();

    const updated = parties.map((candidate) =>
      candidate.order === party.order
        ? {
            ...candidate,
            status: PARTY_STATUS.DECLINED,
            declinedAt: now,
            declineReason: reason ? String(reason).trim().slice(0, 500) : null,
            tokenHash: null,
          }
        : candidate,
    );

    transaction.update(ref, {
      parties: updated,
      status: 'declined',
      updatedAt: now,
    });

    return { declined: true, order: party.order };
  });
}

/** The party list as the creator sees it. No tokens, no digests. */
export const shapeParties = (parties = []) =>
  [...parties]
    .sort((a, b) => a.order - b.order)
    .map((party) => ({
      order: party.order,
      name: party.name,
      email: party.email,
      role: party.role,
      status: party.status,
      statusLabel: PARTY_STATUS_LABELS[party.status] ?? party.status,
      invitedAt: party.invitedAt ?? null,
      signedAt: party.signedAt ?? null,
      declineReason: party.declineReason ?? null,
    }));
