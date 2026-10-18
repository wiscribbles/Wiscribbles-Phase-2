/**
 * Document authentication — the public verification service.
 *
 * Someone holding a WiScribbles document wants to know it is real. A bank, an
 * employer, a registry, the other side of a transaction. They have the
 * reference number printed on the certificate page and the date it was signed,
 * and they are usually not an account holder.
 *
 * WHAT PHASE 1 DID, AND WHY IT HAD TO CHANGE
 *
 * `components/authenticatePage.jsx` ran the lookup IN THE BROWSER:
 *
 *     query(collection(db, 'formSubmissions'),
 *           where('referenceNumber', '==', referenceNumber))
 *
 * Three problems. The query is a client-side Firestore read, so reference
 * numbers can be enumerated from a console at whatever rate the browser
 * allows. It read `formSubmissions`, the Phase 1 collection that Stage 6
 * replaced. And it had no notion of revocation at all — a withdrawn instrument
 * verified exactly like a good one, which is the one thing a verification
 * service must never do.
 *
 * THE TWO-FACTOR DESIGN
 *
 * Reference number AND date signed, both required. The reference number alone
 * is a bearer credential printed on a document that gets photocopied and
 * emailed; the date is something only someone actually holding the document
 * knows. Neither is secret, but together they make enumeration impractical:
 * guessing a reference gets you nothing without the matching date.
 *
 * WHAT A VERIFICATION RETURNS, AND WHAT IT DOES NOT
 *
 * It returns facts ABOUT the instrument — type, jurisdiction, who executed it
 * and in what capacity, when, and whether it is still good. It does not return
 * the document. A verifier establishing that a power of attorney is genuine
 * has no business reading the contents of an unrelated affidavit they guessed
 * the reference of, and the contents are the part that would do damage. The
 * file is a separate, paid, authenticated step.
 */

import { createHash, randomInt } from 'node:crypto';
import { adminDb } from '@/lib/firebase-admin';
import { getJurisdiction } from '@/lib/jurisdictions';
import { PROFESSIONAL_LABEL } from '@/lib/sessions';

export const DOCUMENTS_COLLECTION = 'documents';
export const ATTEMPTS_COLLECTION = 'authenticationAttempts';

/**
 * Reference numbers.
 *
 * Shape: WS-<JUR>-<YY>-<8 chars>, e.g. WS-GY-26-7K4PQ2MN.
 *
 * Crockford's base32 alphabet, which drops I, L, O and U — so a reference read
 * off a printed page cannot be mistyped as a different VALID reference because
 * someone read 0 as O or 1 as I. That matters more here than the few bits of
 * entropy it costs: a typo should fail, not silently verify somebody else's
 * document.
 *
 * 32^8 is about 1.1 × 10^12, and a correct guess still needs the right date.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const SUFFIX_LENGTH = 8;

export function mintReferenceNumber(jurisdictionCode, now = new Date()) {
  const jurisdiction = String(jurisdictionCode ?? 'XX').toUpperCase().slice(0, 3);
  const year = String(now.getUTCFullYear()).slice(-2);

  let suffix = '';
  for (let index = 0; index < SUFFIX_LENGTH; index += 1) {
    // randomInt, not Math.random: a predictable reference number is a
    // predictable way into the verification service.
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }

  return `WS-${jurisdiction}-${year}-${suffix}`;
}

/** Accept what people actually type: spaces, lower case, missing hyphens. */
export function normalizeReference(input) {
  const cleaned = String(input ?? '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');

  if (cleaned.length < 8) return null;

  /* Reassemble from the canonical shape rather than trusting the hyphens the
     user typed — WS GY 26 7K4PQ2MN, ws-gy-26-7k4pq2mn and WSGY267K4PQ2MN are
     all the same reference, and a verifier retyping from a printed page should
     not be refused over punctuation. */
  const match = cleaned.match(/^WS([A-Z]{2,3})(\d{2})([0-9A-Z]{8})$/);
  if (!match) return null;

  return `WS-${match[1]}-${match[2]}-${match[3]}`;
}

/** Date signed, as three fields from the form. UTC day only. */
export function normalizeDate({ day, month, year }) {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return null;
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2020 || y > 2100) return null;

  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // Reject 31 February and friends, which would otherwise roll over silently.
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCDate() !== d) return null;

  return iso;
}

export const VERIFICATION = Object.freeze({
  VALID: 'valid',
  REVOKED: 'revoked',
  NOT_FOUND: 'not_found',
  NOT_EXECUTED: 'not_executed',
  RATE_LIMITED: 'rate_limited',
});

export class AuthenticationError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/* ------------------------------------------------------------------------- */
/* Rate limiting                                                              */
/* ------------------------------------------------------------------------- */

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 10;

/**
 * Throttle by caller, because this endpoint is unauthenticated by design.
 *
 * A verification service has to be open — the people who need it are banks and
 * registries, not account holders. Open and unthrottled, though, is an
 * enumeration oracle: ten thousand guesses an hour against a reference space
 * is a different proposition from ten.
 *
 * Keyed on a hash of the caller's address rather than the address itself. The
 * platform does not need to keep a log of who has been verifying documents,
 * and a hash is enough to count against.
 */
export async function checkRateLimit(callerKey, now = Date.now()) {
  if (!callerKey) return { allowed: true, remaining: MAX_ATTEMPTS_PER_WINDOW };

  const key = createHash('sha256').update(String(callerKey)).digest('hex').slice(0, 32);
  const ref = adminDb().collection(ATTEMPTS_COLLECTION).doc(key);

  try {
    const result = await adminDb().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const data = snapshot.exists ? snapshot.data() : null;

      const windowStart = Date.parse(data?.windowStart ?? '') || 0;
      const fresh = now - windowStart > ATTEMPT_WINDOW_MS;

      const count = fresh ? 1 : (data?.count ?? 0) + 1;

      transaction.set(
        ref,
        {
          count,
          windowStart: fresh ? new Date(now).toISOString() : data.windowStart,
          lastAttemptAt: new Date(now).toISOString(),
        },
        { merge: true },
      );

      return count;
    });

    return {
      allowed: result <= MAX_ATTEMPTS_PER_WINDOW,
      remaining: Math.max(0, MAX_ATTEMPTS_PER_WINDOW - result),
      retryAfterMs: ATTEMPT_WINDOW_MS,
    };
  } catch (error) {
    /* Fail OPEN, deliberately. A verification service that stops answering
       because its own counter is broken is worse than one that briefly allows
       more attempts than intended — the people turned away are banks trying to
       check a real document. The failure is logged loudly instead. */
    console.error('[authentication] rate limit check failed, allowing', error);
    return { allowed: true, remaining: MAX_ATTEMPTS_PER_WINDOW, degraded: true };
  }
}

/* ------------------------------------------------------------------------- */
/* Verification                                                               */
/* ------------------------------------------------------------------------- */

/**
 * Verify a document from its reference number and date signed.
 *
 * Returns the same shape whether the document is missing or the date is wrong,
 * with no hint which it was. Telling a caller "that reference exists but the
 * date is wrong" would turn the two-factor check back into a one-factor one.
 */
export async function verify({ reference, dateSigned, callerKey = null }) {
  const normalizedReference = normalizeReference(reference);

  if (!normalizedReference) {
    throw new AuthenticationError(
      'bad_reference',
      'That is not a WiScribbles reference number. It looks like ' +
        'WS-GY-26-7K4PQ2MN and is printed on the certificate page.',
      422,
    );
  }

  if (!dateSigned) {
    throw new AuthenticationError('bad_date', 'Enter the date the document was signed.', 422);
  }

  const limit = await checkRateLimit(callerKey);
  if (!limit.allowed) {
    return {
      result: VERIFICATION.RATE_LIMITED,
      message:
        'Too many verification attempts from this connection. Try again in ' +
        'about fifteen minutes.',
    };
  }

  const snapshot = await adminDb()
    .collection(DOCUMENTS_COLLECTION)
    .where('referenceNumber', '==', normalizedReference)
    .limit(1)
    .get();

  /* One response for "no such reference" and for "wrong date". The difference
     between them is exactly what an enumeration attack is looking for. */
  const notFound = {
    result: VERIFICATION.NOT_FOUND,
    message:
      'No document matches that reference number and date. Check both — the ' +
      'date must be the date the document was signed, not the date it was ' +
      'issued or received.',
  };

  if (snapshot.empty) return notFound;

  const document = snapshot.docs[0].data();
  const executedAt = document.executedAt ?? document.executedOnPaperAt ?? null;

  if (!executedAt) {
    return {
      result: VERIFICATION.NOT_EXECUTED,
      message:
        'That reference belongs to a document that has not been executed. It ' +
        'carries no seal and no signature.',
    };
  }

  if (executedAt.slice(0, 10) !== dateSigned) return notFound;

  const place = getJurisdiction(document.jurisdiction);

  /* The facts about the instrument. Not its contents — see the note at the top
     of this file. */
  const certificate = {
    reference: normalizedReference,
    documentType: document.templateName ?? document.documentCategory ?? null,
    jurisdiction: place?.name ?? document.jurisdiction ?? null,
    statute: place?.statute ?? null,
    executedAt,
    executedBy: document.executedBy?.name ?? null,
    capacity: PROFESSIONAL_LABEL[document.executedBy?.role] ?? null,
    signatories: document.signatories ?? null,
    witnesses: document.witnesses ?? null,
    seals: document.seals ?? null,
    documentId: snapshot.docs[0].id,
  };

  if (document.status === 'revoked') {
    /* THE CASE PHASE 1 COULD NOT REPORT. A revoked instrument must verify as
       revoked, loudly, with the date — anyone relying on it needs to stop. The
       ground is given in general terms; the Website Manager's internal note is
       not, because it may name third parties or an investigation. */
    return {
      result: VERIFICATION.REVOKED,
      message:
        'This document has been REVOKED and should not be relied on. A revoked ' +
        'instrument has been withdrawn by WiScribbles and no longer has the ' +
        'effect it appears to have.',
      certificate: {
        ...certificate,
        revokedAt: document.revocation?.at ?? null,
        revocationGround: document.revocation?.ground ?? null,
      },
    };
  }

  return {
    result: VERIFICATION.VALID,
    message:
      'This document was executed through WiScribbles and has not been ' +
      'revoked.',
    certificate,
  };
}

/** Attach a reference number to a document at execution. Idempotent. */
export async function assignReferenceNumber({ documentId, jurisdiction }) {
  const ref = adminDb().collection(DOCUMENTS_COLLECTION).doc(documentId);

  return adminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists) {
      throw new AuthenticationError('not_found', 'No such document.', 404);
    }

    // Already has one — executing twice must not change the reference printed
    // on a certificate someone is already holding.
    const existing = snapshot.data().referenceNumber;
    if (existing) return existing;

    const reference = mintReferenceNumber(jurisdiction);
    transaction.update(ref, { referenceNumber: reference });
    return reference;
  });
}
