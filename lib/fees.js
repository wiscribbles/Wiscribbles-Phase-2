/**
 * Per-transaction fees — what a client pays for one document.
 *
 * WHY THIS EXISTS
 *
 * Phase 2 had subscription plans (`lib/plans.js`, Solo/Chambers/Enterprise) and
 * nothing else. There was no client-facing fee anywhere: the request flow's
 * payment step said "no charge" and moved on. That is a gap on two counts.
 *
 *   1. The live marketing site publishes a per-seal price list, so clients
 *      arrive expecting one.
 *   2. The site's own Terms of Service, clause 5, says "Fees for notarization
 *      services are displayed before you complete a transaction." A platform
 *      that shows no fee is not complying with its own terms.
 *
 * WHERE THE NUMBERS COME FROM
 *
 * Read off the published pricing panel, not invented:
 *
 *   "$15 / notary seal · + $10 / additional witness"
 *   "$25 / 2 signatories · + $10 / additional signatory · + $10 / witness
 *     · + $10 / additional notary seal"
 *
 * WHY THERE IS NO PACKAGE PICKER
 *
 * The site presents those as two packages to choose between. Choosing is a
 * trap: a client with two signatories who picks the $15 package has picked the
 * wrong one, and will either be surprised later or silently under-charged. The
 * base is therefore DERIVED from the signatory count — one signatory takes the
 * $15 base, two or more take the $25 base — and the client sees an itemised
 * total instead of a package name. Same prices, no wrong answer available.
 *
 * SUBSCRIPTIONS NEVER INCLUDE SEALS. The launch brief is explicit: half of
 * every seal fee leaves the business as the professional's share, so a plan
 * that bundled seals would sell the one thing with no margin in it.
 * `sealFeeIsNeverIncludedInPlan` exists to be imported by anything tempted to
 * do otherwise.
 */

import { BILLING_CURRENCY, formatPriceCents } from '@/lib/plans';

/* ------------------------------------------------------------------------- */
/* The price list                                                             */
/* ------------------------------------------------------------------------- */

/** All in cents, USD, matching lib/plans.js. */
export const FEES = Object.freeze({
  /** One signatory, one seal. */
  BASE_SINGLE_SIGNATORY: 1500,
  /** Two signatories, one seal. */
  BASE_TWO_SIGNATORIES: 2500,
  /** Each signatory beyond the two the base covers. */
  ADDITIONAL_SIGNATORY: 1000,
  /** Each witness. */
  WITNESS: 1000,
  /** Each seal beyond the one the base covers. */
  ADDITIONAL_SEAL: 1000,
});

/**
 * The same figures in the shape `quote()` and the admin editor both use.
 *
 * `FEES` is kept because it is referenced widely and reads well in prose.
 * This is the keyed form that can be overridden: the Website Manager's saved
 * prices are merged over this in `lib/pricing.js`, and the result is passed
 * into `quote()` as `prices`. Adding a fee means adding it here, to
 * `PRICE_FIELDS` in `lib/pricing.js`, and to the calculation below.
 */
export const DEFAULT_PRICES = Object.freeze({
  BASE_SINGLE_SIGNATORY: FEES.BASE_SINGLE_SIGNATORY,
  BASE_TWO_SIGNATORIES: FEES.BASE_TWO_SIGNATORIES,
  ADDITIONAL_SIGNATORY: FEES.ADDITIONAL_SIGNATORY,
  WITNESS: FEES.WITNESS,
  ADDITIONAL_SEAL: FEES.ADDITIONAL_SEAL,
  ESIGN: 0,
  PREPARE_REGISTER_GYD: 4500,
});

export const LIMITS = Object.freeze({
  MIN_SIGNATORIES: 1,
  MAX_SIGNATORIES: 10,
  MAX_WITNESSES: 4,
  MIN_SEALS: 1,
  MAX_SEALS: 5,
});

/**
 * E-signature only — no professional attends, so no seal fee arises.
 *
 * Priced at zero deliberately and NOT hidden: a client choosing "signature
 * only" should see a line saying it costs nothing rather than an empty summary
 * that looks like the page failed to load. If an e-signature fee is introduced
 * later this is the one constant to change.
 */
export const ESIGN_FEE = 0;

/**
 * Prepare & Register — the wet-ink route for excluded documents.
 *
 * The launch brief prices this at GYD 4,500. It is the one figure in the
 * product that is quoted in Guyana dollars while everything else here is USD,
 * because it is a local service delivered on paper. At the brief's working rate
 * of 1 USD = 209 GYD that is about USD 21.50.
 *
 * `PREPARE_REGISTER_FEE_GYD` is the authoritative number and the USD figure is
 * derived, not stored, so the two cannot drift apart. The rate is a snapshot
 * and will move — see the note on `prepareRegisterFee`.
 */
export const PREPARE_REGISTER_FEE_GYD = 4500;
export const GYD_PER_USD_AT_BRIEF = 209;

/**
 * A fee quoted in two currencies, with the conversion flagged as indicative.
 *
 * Quoting a converted price as though it were exact is how a platform ends up
 * charging a number it never agreed. The USD figure here is for display; the
 * charge is the GYD figure until somebody decides otherwise, and
 * `rateIsIndicative` says so to whatever renders it.
 */
export function prepareRegisterFee(amountGyd = PREPARE_REGISTER_FEE_GYD) {
  return {
    amount: amountGyd,
    currency: 'GYD',
    approxUsdCents: Math.round((amountGyd / GYD_PER_USD_AT_BRIEF) * 100),
    rateIsIndicative: true,
    rateNote:
      `Converted at the launch brief’s working rate of ${GYD_PER_USD_AT_BRIEF} ` +
      'GYD to 1 USD. The rate moves; the charge is the Guyana dollar amount.',
  };
}

/** A guard for anything tempted to bundle seals into a subscription. */
export function sealFeeIsNeverIncludedInPlan() {
  throw new Error(
    'Seal fees are never included in a subscription plan. Roughly half of ' +
      'every seal fee leaves the business as the professional’s share, so a ' +
      'plan that bundled seals would be selling the one line with no margin ' +
      'in it. Plans cover e-signature envelopes and discount seals instead.',
  );
}

/* ------------------------------------------------------------------------- */
/* The calculation                                                            */
/* ------------------------------------------------------------------------- */

export class FeeError extends Error {
  constructor(code, message, field = null) {
    super(message);
    this.code = code;
    this.field = field;
  }
}

/**
 * Quote one document.
 *
 * Returns an itemised breakdown, not just a total. A client who sees "$45"
 * with no explanation assumes a mistake; a client who sees the four lines that
 * make it up can check it. The same breakdown is stored against the document,
 * so a later dispute is settled by reading the record rather than
 * reconstructing the arithmetic from a version of this file that may have
 * changed since.
 *
 * @param {object}  input
 * @param {boolean} input.notarized      false for e-signature only
 * @param {number}  input.signatories    people signing, including the client
 * @param {number} [input.witnesses]
 * @param {number} [input.seals]         notarial seals required
 * @returns {{ lines: object[], totalCents: number, currency: string,
 *             formattedTotal: string }}
 */
export function quote({
  notarized,
  signatories = 1,
  witnesses = 0,
  seals = 1,
  /**
   * Can a witness actually attest through the platform?
   *
   * Defaults to FALSE, which is the position in all four jurisdictions: none
   * of the Acts converts a presence requirement into a video call. Charging
   * $10 for a witness the platform cannot host would be charging for
   * something not supplied, so while this is false the witness line is listed
   * at zero WITH the reason rather than quietly dropped. Flip it per
   * jurisdiction when remote witnessing is enabled and the charge returns.
   */
  witnessingAvailable = false,
  /**
   * The price list in force.
   *
   * Defaults to the published figures so every existing caller and every test
   * keeps working unchanged. A server caller resolves the Website Manager's
   * overrides with `getPriceList()` in `lib/pricing.js` and passes them here —
   * which is what makes an admin price change take effect on the next quote
   * without a deploy.
   */
  prices = DEFAULT_PRICES,
  /**
   * The version to stamp on the quote. Supplied by the resolver, because only
   * it knows when the prices were last changed; see the note on
   * `versionFor` in `lib/pricing.js`.
   */
  priceListVersion = PRICE_LIST_VERSION,
}) {
  const rate = { ...DEFAULT_PRICES, ...(prices ?? {}) };
  const people = Number(signatories);
  const watchers = Number(witnesses);
  const stamps = Number(seals);

  if (!Number.isInteger(people) || people < LIMITS.MIN_SIGNATORIES || people > LIMITS.MAX_SIGNATORIES) {
    throw new FeeError(
      'bad_signatories',
      `Choose between ${LIMITS.MIN_SIGNATORIES} and ${LIMITS.MAX_SIGNATORIES} signatories.`,
      'signatories',
    );
  }
  if (!Number.isInteger(watchers) || watchers < 0 || watchers > LIMITS.MAX_WITNESSES) {
    throw new FeeError(
      'bad_witnesses',
      `Up to ${LIMITS.MAX_WITNESSES} witnesses.`,
      'witnesses',
    );
  }

  const lines = [];

  /* ---- e-signature only ---------------------------------------------- */
  if (!notarized) {
    lines.push({
      key: 'esign',
      label:
        people === 1
          ? 'Electronic signature'
          : `Electronic signature, ${people} signatories`,
      quantity: people,
      unitCents: 0,
      amountCents: rate.ESIGN,
      note: 'No professional attends, so no seal fee arises.',
    });

    // A witness at an e-signature has no seal to witness, so the witness fee
    // does not apply either. Said rather than silently dropped.
    if (watchers > 0) {
      lines.push({
        key: 'witness_not_charged',
        label: `${watchers} witness${watchers === 1 ? '' : 'es'}`,
        quantity: watchers,
        unitCents: 0,
        amountCents: 0,
        note: 'Witnesses are not charged on an e-signature — there is no seal to witness.',
      });
    }

    return finish(lines, priceListVersion);
  }

  /* ---- notarised ------------------------------------------------------ */
  if (!Number.isInteger(stamps) || stamps < LIMITS.MIN_SEALS || stamps > LIMITS.MAX_SEALS) {
    throw new FeeError(
      'bad_seals',
      `Choose between ${LIMITS.MIN_SEALS} and ${LIMITS.MAX_SEALS} seals.`,
      'seals',
    );
  }

  /* The base is derived from the signatory count rather than chosen, so there
     is no wrong package to pick. */
  if (people === 1) {
    lines.push({
      key: 'base',
      label: 'Notarisation — one signatory, one seal',
      quantity: 1,
      unitCents: rate.BASE_SINGLE_SIGNATORY,
      amountCents: rate.BASE_SINGLE_SIGNATORY,
    });
  } else {
    lines.push({
      key: 'base',
      label: 'Notarisation — two signatories, one seal',
      quantity: 1,
      unitCents: rate.BASE_TWO_SIGNATORIES,
      amountCents: rate.BASE_TWO_SIGNATORIES,
    });

    const extra = people - 2;
    if (extra > 0) {
      lines.push({
        key: 'additional_signatories',
        label: `${extra} additional signator${extra === 1 ? 'y' : 'ies'}`,
        quantity: extra,
        unitCents: rate.ADDITIONAL_SIGNATORY,
        amountCents: extra * rate.ADDITIONAL_SIGNATORY,
      });
    }
  }

  if (watchers > 0) {
    lines.push({
      key: 'witnesses',
      label: `${watchers} witness${watchers === 1 ? '' : 'es'}`,
      quantity: watchers,
      unitCents: witnessingAvailable ? rate.WITNESS : 0,
      amountCents: witnessingAvailable ? watchers * rate.WITNESS : 0,
      note: witnessingAvailable
        ? null
        : 'Not charged — a witness has to be physically present, so the ' +
          'witnessing is not something we can host online yet.',
    });
  }

  const extraSeals = stamps - 1;
  if (extraSeals > 0) {
    lines.push({
      key: 'additional_seals',
      label: `${extraSeals} additional seal${extraSeals === 1 ? '' : 's'}`,
      quantity: extraSeals,
      unitCents: rate.ADDITIONAL_SEAL,
      amountCents: extraSeals * rate.ADDITIONAL_SEAL,
    });
  }

  return finish(lines, priceListVersion);
}

function finish(lines, version = PRICE_LIST_VERSION) {
  const totalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);

  return {
    lines,
    totalCents,
    currency: BILLING_CURRENCY,
    formattedTotal: formatPriceCents(totalCents),
    /* Stamped with the price list that produced it. A quote recalculated
       against a later price list would not match the one the client agreed,
       and this is what lets the difference be seen rather than argued about. */
    priceListVersion: version,
  };
}

/**
 * The version of the ARITHMETIC, not of the figures.
 *
 * Bump this when the shape of the calculation changes — a new line, a changed
 * derivation. The figures themselves are now set by the Website Manager, and
 * their version is this string plus the timestamp of the last change; see
 * `versionFor` in `lib/pricing.js`. Bumping this by hand because a price moved
 * is no longer necessary and no longer sufficient.
 */
export const PRICE_LIST_VERSION = '2026-10-26.1';

/**
 * The published list, for the pricing page and the request summary.
 *
 * Takes the resolved price list so the public page and the quote cannot
 * disagree. Called with no argument it reports the code defaults, which is
 * correct for a context with no database — and wrong to rely on anywhere a
 * client is about to be charged, which is why the pricing API resolves first.
 */
export const publishedPriceList = (prices = DEFAULT_PRICES, version = PRICE_LIST_VERSION) => {
  const rate = { ...DEFAULT_PRICES, ...(prices ?? {}) };

  return {
    version,
    currency: BILLING_CURRENCY,
    items: [
      { label: 'Notarisation, one signatory and one seal', cents: rate.BASE_SINGLE_SIGNATORY },
      { label: 'Notarisation, two signatories and one seal', cents: rate.BASE_TWO_SIGNATORIES },
      { label: 'Each additional signatory', cents: rate.ADDITIONAL_SIGNATORY },
      { label: 'Each witness', cents: rate.WITNESS },
      { label: 'Each additional seal', cents: rate.ADDITIONAL_SEAL },
      { label: 'Electronic signature only', cents: rate.ESIGN },
    ],
    prepareRegister: prepareRegisterFee(rate.PREPARE_REGISTER_GYD),
    limits: LIMITS,
  };
};
