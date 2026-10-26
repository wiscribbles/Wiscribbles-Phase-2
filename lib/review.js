/**
 * REVIEW AND CORRECT, AND CONSENT TO ELECTRONIC FORM
 *
 * Two statutory duties that land on the same screen, which is why they live in
 * the same module.
 *
 * ── 1. THE OPPORTUNITY TO REVIEW AND CORRECT ────────────────────────────────
 *
 * Barbados Electronic Transactions Act Cap. 308B **s.12A** and Jamaica
 * Electronic Transactions Act **s.27(2)** both provide, in substance, that a
 * person must be given an opportunity to review the whole transaction, correct
 * errors in it, and withdraw from it before they are finally committed. The
 * Barbados provision is the sharper of the two: where a material error was
 * made, the system gave no opportunity to correct it, and the person promptly
 * notified the other side, the transaction has **no legal effect**.
 *
 * So the consequence of omitting this step is not a fine. It is that a
 * signature the platform collected is **voidable by the person who gave it**,
 * which for a platform whose entire product is enforceable documents is the
 * worst possible defect: invisible at the time, and fatal exactly when the
 * document matters.
 *
 * ── THIS BINDS THE PRIMARY LAUNCH MARKET, IN FORCE, TODAY ───────────────────
 *
 * CORRECTED 26 OCTOBER 2026. This module was written believing the duty
 * applied only in Barbados and Jamaica, both of which are gated off, and that
 * building it was therefore prudence rather than compliance. That was wrong.
 *
 * Guyana's Electronic Communications and Transactions Act 2023 **s.23(1)** —
 * read from the gazette, in force since 16 August 2023 — makes an electronic
 * contract or transaction **VOID** where the person made a material error, the
 * other party's electronic agent "did not provide an opportunity to prevent or
 * correct the error", the person notifies on becoming aware, the other party
 * takes no reasonable steps to correct it, and no material benefit was
 * retained. Void, not voidable. The limbs are conjunctive, and limb (b) is the
 * only one the platform controls — which makes this screen the thing that
 * defeats the claim.
 *
 * So the step is not optional in Guyana, and the artefact it produces is the
 * evidence that limb (b) was satisfied.
 *
 * WHY IT IS STILL NOT GATED PER JURISDICTION, unlike almost everything else
 * in this codebase:
 *
 *   (a) It is now required in the one market that is live, and in the two that
 *       are gated off. There is no jurisdiction here where it is unnecessary.
 *   (b) The artefact is unreconstructable after the fact. A gate flipped in
 *       twelve months does not retrospectively create evidence that a party
 *       signed in 2026 was offered a chance to correct their name.
 *   (c) Trinidad ETA Part VIII ss.55–58 impose consumer disclosure duties of
 *       the same family and are queued for proclamation.
 *
 * The citations below record where the duty bites and with what consequence.
 *
 * ── 2. PER-DOCUMENT CONSENT TO ELECTRONIC FORM ──────────────────────────────
 *
 * Guyana ECT **s.5(1)(a)**, Barbados **s.3(2)–(3)** and the Trinidad analogue
 * all provide that nobody is *required* to accept an electronic communication
 * or an electronic signature. Consent is therefore an element of validity, not
 * a courtesy.
 *
 * The platform already records acceptance of its terms per account, with a
 * version. That is the wrong artefact for this purpose: it proves the account
 * holder agreed to use WiScribbles, not that **this party** agreed that **this
 * instrument** could be executed electronically. A party signing from an email
 * link may have no account at all. So the consent is recorded per party, per
 * document, at the moment of signing, in the words they were shown.
 *
 * ── WHY THE SERVER ENFORCES THIS ────────────────────────────────────────────
 *
 * A review step implemented only in the browser is decoration. The signing
 * endpoint is token-authenticated and unauthenticated by design, so anyone
 * holding a link can post to it directly; a UI-only gate would be absent from
 * exactly the signatures most likely to be disputed. `assertReviewed` is
 * therefore called inside `recordSignature`, and a signature without a
 * well-formed acknowledgement is refused.
 *
 * The acknowledgement also carries the name the party *reviewed*. If that does
 * not match the name being signed, the review covered something other than
 * what is being committed, and the artefact would be a false record. That is
 * refused too, with a message that sends them back to the review rather than
 * failing obscurely.
 */

/**
 * Where the review-and-correct duty is a statutory duty rather than good
 * practice. Documentation, not control flow — nothing branches on this.
 */
export const REVIEW_AND_CORRECT_STATUTE = Object.freeze({
  BB: Object.freeze({
    citation: 'Electronic Transactions Act Cap. 308B s.12A (inserted by Act 2014-8)',
    /* SECONDARY SOURCE. The copy of Cap. 308B in hand is L.R.O. 2002, which
       predates Act 2014-8 and contains no s.12A at all — a search for it
       returns nothing. So this citation comes from research about the
       amendment rather than from the amended text. Marked true because the
       amendment is reported as enacted and Barbados is gated off anyway, so
       nothing turns on it today; it must not be presented to counsel as
       verified. See PRIMARY_SOURCE_VERIFICATION.BB in lib/jurisdictions.js. */
    inForce: true,
    primaryVerified: false,
    consequence:
      'No legal effect where a material error was made, no opportunity to ' +
      'correct it was given, and the person promptly notified.',
  }),
  JM: Object.freeze({
    citation: 'Electronic Transactions Act s.27(2)–(3)',
    inForce: true,
    /* PRIMARY. Read from the Act. s.27(2) requires the supplier to provide an
       opportunity to do four things "in the order of their occurrence
       herein": (a) review the entire electronic transaction; (b) correct any
       errors; (c) withdraw from the transaction before finally placing an
       order; and (d) access electronically and reproduce an accurate summary
       of the order and the terms, INCLUDING THE TOTAL COST.

       Limbs (a)-(c) are this screen. Limb (d) is NOT — the review stage shows
       the document and the signature, not the cost. (d) is met by the
       itemised quote in the request flow, which is a different screen. If
       those two are ever separated, or the quote stops being shown before
       commitment, limb (d) breaks and nothing here will notice. */
    primaryVerified: true,
    consequence:
      'Not voidness. s.27(3): where the supplier fails to comply with s.27(1) ' +
      'or (2), the consumer may CANCEL within fourteen days of receiving the ' +
      'goods, services or facilities. A softer remedy than Guyana s.23, with ' +
      'a longer tail.',
  }),
  TT: Object.freeze({
    citation: 'Electronic Transactions Act Chap. 22:05 Part VIII ss.55–58',
    inForce: false,
    consequence:
      'Consumer disclosure duties of the same family. NOT PROCLAIMED — the ' +
      '2024 Joint Select Committee report recommends proclaiming the ' +
      'outstanding Parts, so treat this as pending rather than absent.',
  }),
  GY: Object.freeze({
    citation: 'Electronic Communications and Transactions Act 2023 s.23(1)',
    inForce: true,
    consequence:
      'VOID — not voidable — where a material error was made, the electronic ' +
      'agent gave no opportunity to prevent or correct it, the person notifies ' +
      'on becoming aware, the other party takes no reasonable steps to correct ' +
      'it, and no material benefit was retained. Limb (b), the opportunity to ' +
      'correct, is the one the platform controls, and this screen is what ' +
      'supplies it. In force since 16 August 2023 in the primary launch ' +
      'market. Stacks with Consumer Affairs Act 2011 s.70 on electronic sales ' +
      'and with ECT s.51 pre-contract disclosure.',
  }),
});

/**
 * Where consent to electronic form is an element of validity.
 */
export const ELECTRONIC_FORM_CONSENT_STATUTE = Object.freeze({
  GY: 'ECT Act s.5(1)(a) — nobody is required to accept an electronic communication',
  BB: 'Cap. 308B s.3(2)–(3) — consent required, and may be inferred from conduct',
  TT: 'Chap. 22:05 s.5 — consent required',
  JM: 'ETA s.4 — consent required',
});

/**
 * The exact words a party is shown and confirms. Stored verbatim on the
 * artefact rather than referenced by id, because the wording is the substance
 * of the consent: a record saying "consented to v3" is worthless once v4 has
 * replaced it in the source, and a document signed in 2026 may be read in
 * 2036.
 */
export const REVIEW_DECLARATION = Object.freeze({
  version: '2026-10-26',
  documentReviewed:
    'I have read the document above and the details shown here, and they are ' +
    'correct.',
  electronicForm:
    'I agree that this document may be signed and kept in electronic form, ' +
    'and that my typed name is my signature on it.',
  correctionNotice:
    'If anything here is wrong, go back and correct it before you sign. Once ' +
    'you sign, your signature is recorded and this link stops working.',
});

export class ReviewError extends Error {
  constructor(code, message, status = 422, field = null) {
    super(message);
    this.name = 'ReviewError';
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

/** Collapse whitespace and case so a review comparison is not defeated by a
 *  trailing space the browser added. Compares meaning, not bytes. */
const normaliseName = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();

/**
 * Validate the acknowledgement a party submits with their signature, and
 * return the artefact to store. Throws `ReviewError` rather than returning a
 * boolean: a caller that forgets to check a boolean collects an unreviewed
 * signature, which is the failure this module exists to prevent.
 *
 * @param {object}  args
 * @param {object}  args.review          what the client submitted
 * @param {string}  args.signatureName   the name actually being signed
 * @param {string}  args.jurisdiction    two-letter code, for the citation
 * @param {string?} args.ip              caller address, for the record
 */
export function assertReviewed({ review, signatureName, jurisdiction = null, ip = null }) {
  /* `Array.isArray` explicitly: `typeof [] === 'object'`, so an array would
     otherwise pass this guard, read `undefined` off itself and land on
     `document_not_reviewed` — a refusal that misdescribes what was wrong to
     whoever is reading the logs. */
  if (!review || typeof review !== 'object' || Array.isArray(review)) {
    throw new ReviewError(
      'review_required',
      'Please review the details and confirm them before signing.',
      422,
      'review',
    );
  }

  if (review.documentReviewed !== true) {
    throw new ReviewError(
      'document_not_reviewed',
      'Please confirm that you have read the document and that the details ' +
        'shown are correct.',
      422,
      'documentReviewed',
    );
  }

  if (review.electronicFormConsent !== true) {
    throw new ReviewError(
      'electronic_form_not_consented',
      'Please confirm that you agree to sign this document electronically. ' +
        'Nobody is obliged to — if you would rather sign on paper, decline ' +
        'here and whoever sent this to you can arrange it.',
      422,
      'electronicFormConsent',
    );
  }

  /* The name reviewed must be the name signed. A mismatch means the review
     covered something other than what is being committed, so the artefact
     would record a review that did not happen. */
  if (normaliseName(review.signatureName) !== normaliseName(signatureName)) {
    throw new ReviewError(
      'corrected_after_review',
      'Your name has changed since you reviewed it. Please check it and ' +
        'confirm again — this is the correction step working as intended, not ' +
        'an error.',
      409,
      'signatureName',
    );
  }

  /* The client's clock is recorded as *claimed*, never trusted: it is attacker
     -controlled and routinely wrong by minutes. The server's own timestamp is
     the one that counts, and both are kept so a dispute can see the gap. */
  const claimedAt =
    typeof review.reviewedAt === 'string' && !Number.isNaN(Date.parse(review.reviewedAt))
      ? review.reviewedAt
      : null;

  return Object.freeze({
    declarationVersion: REVIEW_DECLARATION.version,
    documentReviewed: true,
    electronicFormConsent: true,
    /* Verbatim, for the reason given on REVIEW_DECLARATION. */
    declarations: Object.freeze({
      documentReviewed: REVIEW_DECLARATION.documentReviewed,
      electronicForm: REVIEW_DECLARATION.electronicForm,
    }),
    reviewedNameAsShown: String(review.signatureName ?? '').trim().slice(0, 160),
    confirmedAt: new Date().toISOString(),
    clientClaimedAt: claimedAt,
    fromIp: ip,
    statutoryBasis: jurisdiction
      ? (REVIEW_AND_CORRECT_STATUTE[jurisdiction]?.citation ?? null)
      : null,
    electronicFormBasis: jurisdiction
      ? (ELECTRONIC_FORM_CONSENT_STATUTE[jurisdiction] ?? null)
      : null,
  });
}

/**
 * What the review screen should state about the jurisdiction's position, for
 * display. Returns null where there is nothing specific worth saying, so the
 * UI shows the general wording rather than an empty panel.
 */
export function describeReviewBasis(jurisdiction) {
  const entry = REVIEW_AND_CORRECT_STATUTE[jurisdiction];
  if (!entry) return null;
  return {
    citation: entry.citation,
    inForce: entry.inForce,
  };
}
