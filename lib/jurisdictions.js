/**
 * Jurisdiction rules.
 *
 * This file is a legal safety rail, not a lookup table. The jurisdiction
 * lockout required by the brief ("the session MUST NOT PROCEED") is enforced
 * against `notarizationEnabled` here — NOT against a bare string comparison of
 * the client's jurisdiction and the professional's.
 *
 * Why that matters: matching strings would happily route a notarisation to a
 * Trinidadian notary for a Trinidadian client, and the resulting instrument
 * would have no statutory effect, because Trinidad has no provision equivalent
 * to Guyana's s.14(3). A string match is not a legality check.
 *
 * SOURCE OF THESE FLAGS: the WiScribbles launch brief of 3 Sept 2026 and the
 * project's regulatory-compliance record. Several entries carry open counsel
 * questions — see `legalReview` on each. Do not flip a flag to true without a
 * written opinion; `legalReview` is the record of what is still outstanding.
 */

export const JURISDICTIONS = Object.freeze({
  GY: 'GY',
  JM: 'JM',
  TT: 'TT',
  BB: 'BB',
});

const REGISTRY = Object.freeze({
  [JURISDICTIONS.GY]: {
    code: JURISDICTIONS.GY,
    name: 'Guyana',
    statute: 'Electronic Communications and Transactions Act No. 12 of 2023',
    /**
     * s.14(3) expressly satisfies a requirement to notarise, acknowledge,
     * verify or swear by attaching the authorised person's electronic
     * signature.
     */
    notarizationEnabled: true,
    notarizationStatutoryBasis: 's.14(3)',
    eSignatureEnabled: true,
    /** Launch market. */
    launchEnabled: true,
    /**
     * s.4 and the Schedule. Documents in these categories cannot be executed
     * electronically at all and must be routed to the wet-ink
     * "Prepare & Register" product rather than to a notary.
     */
    excludedDocumentCategories: [
      'power_of_attorney',
      'last_will_and_testament',
      'trust_instrument',
      'agreement_of_sale',
      'lease_agreement',
      'promissory_note',
      'negotiable_instrument',
      'document_of_title',
      'interest_in_immovable_property',
      'court_document',
    ],
    legalReview: {
      outstanding: true,
      notes:
        'STILL OUTSTANDING, and here is exactly why. The gazetted Act (Official ' +
        'Gazette, Legal Supplement A, 16 August 2023) IS now in hand — but that ' +
        'PDF is an image scan with no text layer, so its body cannot be read ' +
        'mechanically; only the running page headers extract. The exclusion ' +
        'schedule below therefore still derives from the published BILL text via ' +
        'the Sept 2026 launch brief, NOT from the gazetted Act, and the two have ' +
        'not been compared. Someone has to read the scan with their eyes and ' +
        'confirm (a) the exclusion schedule is unchanged, (b) s.14(3) is ' +
        'unchanged, (c) no commencement order or regulations have since altered ' +
        'them. Until then every notarised instrument in Guyana rests on an ' +
        'unverified schedule. Separately, the accreditation regime is dormant — ' +
        'no Certifying Authority has been designated.',
    },
  },

  [JURISDICTIONS.JM]: {
    code: JURISDICTIONS.JM,
    name: 'Jamaica',
    statute: 'Electronic Transactions Act',
    /**
     * s.9 carries the enabling provision — but Jamaica's is NOT identical to
     * Guyana's, and the difference is operational. Guyana s.14(3) and Trinidad
     * s.18 are satisfied by the authorised person's signature plus "all other
     * information required by other applicable law". Jamaica s.9 spells out
     * THREE things that must be attached or logically associated:
     *
     *   (a) the encrypted signature of that person;
     *   (b) in the case of a signature or a document requiring a signature, a
     *       statement by that person attesting to his identity;
     *   (c) a statement by that person certifying the performance of all
     *       obligations imposed by any other law governing the legal validity
     *       of the document.
     *
     * So a Jamaican notarial certificate needs those two statements written
     * onto it in terms, not merely implied by the act of sealing. See
     * `certificateStatements` below, which lib/stamp.js reads.
     */
    notarizationEnabled: true,
    notarizationStatutoryBasis: 's.9',
    certificateStatements: [
      'I attest to my identity as the authorised person executing this ' +
        'certificate.',
      'I certify the performance of all obligations imposed by any other law ' +
        'governing the legal validity of this document.',
    ],
    eSignatureEnabled: true,
    /** Enabling provision confirmed, but the exclusion schedule is not yet mapped. */
    launchEnabled: false,
    excludedDocumentCategories: [],
    legalReview: {
      outstanding: true,
      notes:
        'Enabling provision at s.9 confirmed. The exclusion schedule is STILL NOT ' +
        'MAPPED: the Act is in hand but its PDF is poorly OCR\u2019d (section ' +
        'numbers and cross-references come out corrupted), and guessing an ' +
        'exclusion schedule from a bad scan is worse than admitting there is ' +
        'none recorded \u2014 an empty list reads as "nothing is excluded", which ' +
        'is what caused the Trinidad bug. Keep launchEnabled false until the ' +
        'schedule is read from a clean source and counsel has opined.',
    },
  },

  [JURISDICTIONS.TT]: {
    code: JURISDICTIONS.TT,
    name: 'Trinidad & Tobago',
    statute: 'Electronic Transactions Act, Chap. 22:05',
    /**
     * CORRECTION — AND IT IS A SIGNIFICANT ONE.
     *
     * This used to read "No provision equivalent to Guyana s.14(3). Electronic
     * notarisation has no statutory effect here." That is wrong, and it came
     * from the Sept launch brief, which states "Trinidad and Barbados have no
     * such provision — they are e-signature markets only."
     *
     * Trinidad HAS the provision. Chap. 22:05 s.18, headed "Electronic
     * notarisation", is word-for-word equivalent to Guyana s.14(3):
     *
     *   "Where information or a signature, document or record is required by a
     *    statutory provision or rule of law, or by contract or deed to be
     *    notarised, acknowledged or verified, the requirement shall be
     *    satisfied if ... the electronic signature of the person authorised to
     *    perform those acts, together with all other information required to
     *    be included by other applicable law, is attached to or logically
     *    associated with the electronic ... record to be notarized,
     *    acknowledged or verified."
     *
     * So notarisation is statutorily possible in Trinidad for any document NOT
     * caught by the s.6 exclusions. That is a materially larger market than
     * "e-signature only".
     *
     * IT IS STILL GATED OFF, and deliberately so. Flipping this flag is a
     * legal decision, not an engineering one, and two things have to happen
     * first:
     *
     *   1. Part V. s.33(1): "No person shall issue a qualified electronic
     *      authentication product to the public unless he is registered as an
     *      accredited Electronic Authentication Service Provider." This is the
     *      Trinidad analogue of the Barbados s.18 offence. s.31 and s.32
     *      suggest an UNaccredited signature can still be reliable — s.32 only
     *      *deems* accredited products to satisfy s.31 — so WiScribbles may
     *      well sit outside the accreditation requirement. "May well" is not
     *      good enough when the neighbouring jurisdiction attaches an
     *      indictable offence to getting it wrong.
     *   2. The text read is the Ministry of the Attorney General's
     *      consolidation, marked UNOFFICIAL VERSION, updated to 31 Dec 2016.
     *      Someone must confirm s.18 and s.6 are current.
     *
     * Set `notarizationEnabled: true` only on a written opinion covering both.
     */
    notarizationEnabled: false,
    notarizationStatutoryBasis: 's.18 (Electronic notarisation)',
    notarizationGatedPending:
      'Part V accreditation opinion (s.33(1)) and confirmation that s.18 and ' +
      's.6 are current. The provision exists — the question is licensing.',
    eSignatureEnabled: true,
    launchEnabled: true,
    /**
     * s.6 — "Inapplicability of Act". Verified against the Ministry of the
     * Attorney General's published text (Chap. 22:05, updated to 31 Dec 2016).
     *
     * THIS LIST WAS EMPTY AND THAT WAS A BUG. Trinidad is a LAUNCH market, so
     * an empty exclusion schedule meant the platform would have e-signed a will
     * or a promissory note there — documents the Act expressly does not apply
     * to. "E-signature only" describes the absence of a notarisation provision;
     * it says nothing about which documents may be signed electronically at
     * all, and conflating the two left the wider hole.
     *
     * Note that s.6(b) is wider than Guyana's: it covers real OR PERSONAL
     * property, so a sale of chattels is excluded in Trinidad while it is
     * permitted in Guyana. The same template is therefore lawful in one launch
     * market and not the other, which is exactly why this is per-jurisdiction
     * data and not a global list.
     */
    excludedDocumentCategories: [
      // s.6(a) making, execution or revocation of a will or testamentary instrument
      'last_will_and_testament',
      // s.6(b) conveyance of real OR PERSONAL property, or transfer of any interest
      'interest_in_immovable_property',
      'agreement_of_sale',
      'lease_agreement',
      'chattel_sale',
      // s.6(c) indenture, declaration of trust or power of attorney
      'power_of_attorney',
      'trust_instrument',
      // s.6(d) documents relating to immigration, citizenship or passport matters
      'passport_application',
      'immigration_document',
      // s.6(e) recognition or endorsement of negotiable instruments
      'promissory_note',
      'negotiable_instrument',
    ],
    legalReview: {
      outstanding: false,
      notes:
        'E-signature only — there is no provision equivalent to Guyana s.14(3), ' +
        'so notarisation and commissioning must not be offered. The s.6 exclusion ' +
        'schedule above is from the primary source and is WIDER than Guyana’s: ' +
        's.6(b) covers personal as well as real property, and s.6(d) excludes ' +
        'passport and immigration documents outright.',
    },
  },

  [JURISDICTIONS.BB]: {
    code: JURISDICTIONS.BB,
    name: 'Barbados',
    statute: 'Electronic Transactions Act, Cap. 308B',
    notarizationEnabled: false,
    eSignatureEnabled: true,
    /**
     * HARD GATE. Operating unlicensed as a certification service provider is an
     * indictable offence under s.18 as amended by Act 2014-8 (BBD 20,000 /
     * 12 months). Do not enable without a written opinion that WiScribbles falls
     * outside that definition.
     */
    launchEnabled: false,
    /**
     * s.3 — read from the L.R.O. 2002 text of Cap. 308B. Recorded now that the
     * primary source has been read, even though `launchEnabled` is false, so
     * that enabling Barbados later does not start from an empty list the way
     * Trinidad did.
     *
     * Note the carve-out in s.3(c): constructive and resulting trusts are NOT
     * excluded, only express ones. The platform has no way to tell them apart
     * from a category tick box, so the whole category stays excluded — the
     * safe direction when the distinction turns on facts the platform cannot see.
     */
    excludedDocumentCategories: [
      // s.3(1)(a) making, execution or revocation of a will or testamentary instrument
      'last_will_and_testament',
      // s.3(b) conveyance of real property or transfer of any interest in it
      'interest_in_immovable_property',
      'agreement_of_sale',
      'lease_agreement',
      // s.3(c) indenture, declaration of trust or power of attorney
      'power_of_attorney',
      'trust_instrument',
    ],
    legalReview: {
      outstanding: true,
      notes:
        'BLOCKING. s.18 as amended by Act 2014-8 makes unlicensed operation as a ' +
        'certification service provider an indictable offence (BBD 20,000 / 12 ' +
        'months). A written opinion on whether WiScribbles falls inside that ' +
        'definition is required before anything is offered in Barbados. The ' +
        's.3 exclusions above have since been read from the L.R.O. 2002 text, ' +
        'but the licensing question is the blocker and is unaffected by them.',
    },
  },
});

export const getJurisdiction = (code) => REGISTRY[code] ?? null;

export const listJurisdictions = () => Object.values(REGISTRY);

/** Jurisdictions the platform is currently open for business in. */
export const listLaunchJurisdictions = () =>
  Object.values(REGISTRY).filter((j) => j.launchEnabled);

/** Jurisdictions a notary or COath may be licensed in and take work from. */
export const listNotarizableJurisdictions = () =>
  Object.values(REGISTRY).filter((j) => j.launchEnabled && j.notarizationEnabled);

export const supportsNotarization = (code) =>
  Boolean(REGISTRY[code]?.launchEnabled && REGISTRY[code]?.notarizationEnabled);

export const supportsESignature = (code) =>
  Boolean(REGISTRY[code]?.launchEnabled && REGISTRY[code]?.eSignatureEnabled);

export const isDocumentCategoryExcluded = (code, category) =>
  Boolean(REGISTRY[code]?.excludedDocumentCategories?.includes(category));

/* ------------------------------------------------------------------------- */
/* The lockout                                                                */
/* ------------------------------------------------------------------------- */

export const LOCKOUT_REASON = Object.freeze({
  OK: 'ok',
  UNKNOWN_JURISDICTION: 'unknown_jurisdiction',
  JURISDICTION_NOT_LAUNCHED: 'jurisdiction_not_launched',
  NOTARIZATION_NOT_AVAILABLE: 'notarization_not_available',
  PROFESSIONAL_NOT_LICENSED_HERE: 'professional_not_licensed_here',
  DOCUMENT_CATEGORY_EXCLUDED: 'document_category_excluded',
});

/**
 * The check the brief requires before a notarisation session may begin.
 *
 *   "The session interface MUST display an explicit check that the Document
 *    Jurisdiction matches the Professional Jurisdiction. If they do not match,
 *    the session MUST NOT PROCEED."
 *
 * Call this on the SERVER before issuing a session token, and again in the
 * session UI for display. A client-side check alone is decoration.
 *
 * @param {object}   args
 * @param {string}   args.documentJurisdiction    ISO code the document belongs to
 * @param {string[]} args.professionalJurisdictions codes the notary/COath is licensed in
 * @param {string}  [args.documentCategory]       category for exclusion-schedule check
 * @returns {{ allowed: boolean, reason: string, message: string }}
 */
export function checkJurisdictionLockout({
  documentJurisdiction,
  professionalJurisdictions = [],
  documentCategory = null,
}) {
  const jurisdiction = getJurisdiction(documentJurisdiction);

  if (!jurisdiction) {
    return {
      allowed: false,
      reason: LOCKOUT_REASON.UNKNOWN_JURISDICTION,
      message: `Unknown jurisdiction "${documentJurisdiction}". The session cannot proceed.`,
    };
  }

  if (!jurisdiction.launchEnabled) {
    return {
      allowed: false,
      reason: LOCKOUT_REASON.JURISDICTION_NOT_LAUNCHED,
      message: `WiScribbles does not yet operate in ${jurisdiction.name}. The session cannot proceed.`,
    };
  }

  if (!jurisdiction.notarizationEnabled) {
    return {
      allowed: false,
      reason: LOCKOUT_REASON.NOTARIZATION_NOT_AVAILABLE,
      message:
        `${jurisdiction.name} law does not give electronic notarisation statutory ` +
        `effect (${jurisdiction.statute}). This document cannot be notarised ` +
        `electronically. The session cannot proceed.`,
    };
  }

  if (documentCategory && isDocumentCategoryExcluded(jurisdiction.code, documentCategory)) {
    return {
      allowed: false,
      reason: LOCKOUT_REASON.DOCUMENT_CATEGORY_EXCLUDED,
      message:
        `Documents of this type are excluded from electronic execution under ` +
        `${jurisdiction.statute}. The session cannot proceed.`,
    };
  }

  if (!professionalJurisdictions.includes(jurisdiction.code)) {
    return {
      allowed: false,
      reason: LOCKOUT_REASON.PROFESSIONAL_NOT_LICENSED_HERE,
      message:
        `This professional is not licensed in ${jurisdiction.name}. ` +
        `The session cannot proceed.`,
    };
  }

  return {
    allowed: true,
    reason: LOCKOUT_REASON.OK,
    message: `Jurisdiction confirmed: ${jurisdiction.name}.`,
  };
}

/* ------------------------------------------------------------------------- */
/* Two questions answered from the Acts, Oct 2026                             */
/* ------------------------------------------------------------------------- */

/**
 * DOES ANY OF THE FOUR ACTS REQUIRE THE SESSION TO BE RECORDED?
 *
 * No. Not one of them.
 *
 * This was checked because the live site's privacy policy claims recordings are
 * kept ("Documents and recordings are stored securely and retained for the
 * minimum period required by law"), and nothing in the platform records
 * anything. The question was whether that claim had to be made true or had to
 * be withdrawn. It has to be withdrawn.
 *
 * These are UNCITRAL-model e-transactions statutes. They do functional
 * equivalence — when does an electronic thing satisfy a legal requirement for
 * a written/signed/original/notarised thing — and they say nothing whatever
 * about notarial procedure. There is no audio-visual retention provision, no
 * journal requirement, no minimum retention period for a recording, because
 * there is no recording contemplated anywhere in any of them. (Trinidad s.14
 * mentions "audio or video playback", but it is about not HINDERING a
 * recipient's ability to retain a record, not about making one.)
 *
 * WHAT THEY DO REQUIRE, which is where the effort should go instead:
 *
 *   Retention of the record itself, accessible and in a format that accurately
 *   represents what was generated — Barbados s.10(1)(a),(b); Trinidad s.13.
 *
 *   Retention of the metadata identifying origin, destination and the date and
 *   time sent or received — Barbados s.10(1)(c).
 *
 *   Integrity: the test is whether the information "has remained complete and
 *   unaltered" — Barbados s.9(3)(a); Trinidad s.12(2).
 *
 *   Tamper-evidence as a reliability criterion for the signature itself: the
 *   signature must be "linked to the information to which it relates in such a
 *   manner that any subsequent change in the information is detectable" —
 *   Trinidad s.31(1)(d). And meeting s.31 has a real payoff: under s.31(2) the
 *   record is then "deemed to be unaltered since the time of its signing".
 *
 *   Identification of the originator is an express factor in evidential weight
 *   — Barbados s.11(2)(c); Trinidad s.17.
 *
 * So the statutory burden falls on the document's integrity and on the KYC
 * record, not on a video file. `lib/integrity.js` is the response to
 * Trinidad s.31(1)(d) and Barbados s.9(3)(a).
 *
 * NOTE WHAT THIS DOES NOT SAY. It does not say recording is pointless — a
 * recording is excellent evidence of what a signatory understood and whether
 * they were under pressure, and if WiScribbles ever operates in a jurisdiction
 * with a real RON statute (most US states) it will be mandatory there. It says
 * only that none of these four Acts compels it, so the privacy policy's claim
 * is not a legal obligation being met but an untrue statement to be removed.
 */
export const RECORDING_REQUIRED_BY_STATUTE = Object.freeze({
  GY: false,
  JM: false,
  TT: false,
  BB: false,
});

export const recordingRequired = (code) =>
  RECORDING_REQUIRED_BY_STATUTE[code] === true;

/**
 * MAY A WITNESS ATTEST REMOTELY — e-signing over video while the notary acts?
 *
 * Not safely, in any of these four jurisdictions, and this is gated off
 * everywhere as a result.
 *
 * The Acts validate electronic SIGNATURES, and a witness's electronic
 * signature is a perfectly good signature under all four. That is not the
 * problem. The problem is that a witnessing requirement is not a signature
 * requirement — it is a PRESENCE requirement. When a statute or a deed says an
 * instrument must be signed "in the presence of" a witness, the witness is
 * attesting that they saw the signatory sign. The signature is only the record
 * of that attestation.
 *
 * None of the four Acts touches presence. Each enumerates what it converts:
 * writing, signature, original form, retention, admissibility, and
 * notarisation/acknowledgement/verification. Attestation and presence appear
 * in none of those lists. An Act that carefully says "a requirement for a
 * signature is satisfied by an electronic signature" and never mentions
 * presence has not converted presence.
 *
 * The comparative position supports reading it narrowly rather than
 * generously. Where common-law jurisdictions have permitted remote witnessing
 * they have done it by EXPRESS legislation, and narrowly — England and Wales
 * allowed video witnessing of wills only through a specific temporary
 * instrument, confined to wills, with conditions. Legislatures treating remote
 * witnessing as something that needs its own statute is poor evidence that a
 * general e-signature provision already achieves it.
 *
 * The consequence of getting this wrong is not a rejected upload. It is an
 * instrument that is defective on its face years later, when somebody relies
 * on it and the attestation is challenged — by which time the platform has
 * issued a certificate saying it was properly executed.
 *
 * So: the capability is built (`lib/signing.js` handles witness parties and
 * their signatures), and it is refused at the jurisdiction gate. Enabling it
 * takes a written opinion per jurisdiction, exactly like notarisation in
 * Trinidad. The honest offer in the meantime is the one Prepare & Register
 * already makes: do everything online except the bit the law reserves.
 */
export const REMOTE_WITNESSING_ENABLED = Object.freeze({
  GY: false,
  JM: false,
  TT: false,
  BB: false,
});

export const remoteWitnessingEnabled = (code) =>
  REMOTE_WITNESSING_ENABLED[code] === true;

export const REMOTE_WITNESSING_REFUSAL =
  'A witness has to be present when the document is signed, and none of the ' +
  'electronic transactions Acts in our jurisdictions converts "in the presence ' +
  'of" into "over video". A witness can sign electronically — but only once ' +
  'they have actually witnessed the signing. Where a document needs a witness, ' +
  'the witnessing happens in person and the rest of the work still happens ' +
  'here.';
