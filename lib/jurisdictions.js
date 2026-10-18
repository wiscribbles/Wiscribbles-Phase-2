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
        'Act 12 of 2023 is not published in full online; section numbers and the ' +
        'exclusion schedule derive from the published Bill text. Guyanese counsel ' +
        'must confirm from the gazetted Act (DCRA) that the exclusion schedule and ' +
        's.14(3) are unchanged and that no commencement order or regulations have ' +
        'since altered them. The accreditation regime is dormant — no Certifying ' +
        'Authority has been designated.',
    },
  },

  [JURISDICTIONS.JM]: {
    code: JURISDICTIONS.JM,
    name: 'Jamaica',
    statute: 'Electronic Transactions Act',
    /** s.9 carries the provision identical to Guyana s.14(3). */
    notarizationEnabled: true,
    eSignatureEnabled: true,
    /** Enabling provision confirmed, but the exclusion schedule is not yet mapped. */
    launchEnabled: false,
    excludedDocumentCategories: [],
    legalReview: {
      outstanding: true,
      notes:
        'Enabling provision at s.9 confirmed. The exclusion schedule has not been ' +
        'mapped and no local counsel opinion has been obtained. Keep launchEnabled ' +
        'false until both are done.',
    },
  },

  [JURISDICTIONS.TT]: {
    code: JURISDICTIONS.TT,
    name: 'Trinidad & Tobago',
    statute: 'Electronic Transactions Act',
    /**
     * No provision equivalent to Guyana s.14(3). Electronic notarisation has no
     * statutory effect here. E-signature market only.
     */
    notarizationEnabled: false,
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
