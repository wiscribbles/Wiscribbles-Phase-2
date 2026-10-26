/**
 * THE LIVE PRICE LIST — set by the Website Manager, read everywhere.
 *
 * `lib/fees.js` holds the DEFAULTS and the arithmetic. This module holds the
 * manager's overrides and resolves the two into the list actually in force.
 * The split matters: `lib/fees.js` stays pure and synchronous, so it can be
 * unit-tested and imported anywhere, and nothing in the quote calculation has
 * to know that a database exists.
 *
 * ── WHY THE VERSION IS DERIVED AND NOT A CONSTANT ───────────────────────────
 *
 * Every quote is stored against the document with a `priceListVersion`, so a
 * dispute months later is settled by reading the record rather than
 * recalculating against whatever the prices happen to be by then. That only
 * works if the version changes when the prices change.
 *
 * `PRICE_LIST_VERSION` in `lib/fees.js` is a hand-bumped constant, which was
 * fine while prices only moved on a deploy. Now that the manager can change
 * them at 3pm on a Tuesday, a constant would mean two genuinely different
 * price lists sharing one version — and a stored quote that cannot be
 * reconciled with either. So the effective version is the code constant plus
 * the timestamp of the last override, and it moves on its own whenever the
 * manager saves.
 *
 * ── WHY OVERRIDES RATHER THAN A FULL STORED LIST ────────────────────────────
 *
 * The document holds only the figures that have been changed. A key that is
 * absent means "use the code default", which is the same pattern as
 * `getPlanSettings` and has the same payoff: adding a new fee in code gives
 * every existing deployment a sensible value without a migration, and
 * resetting a price to its default is a deletion rather than a second kind of
 * value to reason about.
 *
 * ── WHAT THIS MODULE DELIBERATELY DOES NOT DO ───────────────────────────────
 *
 * It does not touch the professional's share, and it cannot. Three of the four
 * jurisdictions cap or fix notarial fees — Guyana Cap. 4:02 s.5 at the figure
 * prescribed by rules of court, Jamaica by the published tariff under its
 * Notaries Public Act s.11, Barbados by the Seventh Schedule to its Notaries
 * Public Act 2024 — so what the officer receives is not the platform's to set.
 * Raising the client-facing price is a platform-fee decision; it must never be
 * implemented as a larger cut of a capped notarial fee. That constraint is a
 * legal one and no amount of admin UI makes it a product decision.
 */

import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { DEFAULT_PRICES as FEE_DEFAULTS, LIMITS, PRICE_LIST_VERSION } from '@/lib/fees';

const SETTINGS_COLLECTION = 'adminSettings';
const PRICING_DOC = 'pricing';

/**
 * Every settable figure, with the bounds it must stay inside.
 *
 * `max` is not arbitrary caution. A fat-fingered 150000 instead of 1500 is a
 * $1,500 notarisation fee quoted to a real client, and the cheapest place to
 * stop that is here. `min: 0` throughout because a free line is a legitimate
 * choice — the e-signature fee is zero today.
 */
export const PRICE_FIELDS = Object.freeze({
  BASE_SINGLE_SIGNATORY: Object.freeze({
    label: 'Notarisation — one signatory, one seal',
    unit: 'cents',
    min: 0,
    max: 50000,
  }),
  BASE_TWO_SIGNATORIES: Object.freeze({
    label: 'Notarisation — two signatories, one seal',
    unit: 'cents',
    min: 0,
    max: 50000,
  }),
  ADDITIONAL_SIGNATORY: Object.freeze({
    label: 'Each additional signatory',
    unit: 'cents',
    min: 0,
    max: 20000,
  }),
  WITNESS: Object.freeze({
    label: 'Each witness',
    unit: 'cents',
    min: 0,
    max: 20000,
    note:
      'Charged at zero while remote witnessing is switched off, whatever is ' +
      'set here — the platform cannot host a witnessing, and charging for ' +
      'something not supplied is not a pricing decision.',
  }),
  ADDITIONAL_SEAL: Object.freeze({
    label: 'Each additional seal',
    unit: 'cents',
    min: 0,
    max: 20000,
  }),
  ESIGN: Object.freeze({
    label: 'Electronic signature only',
    unit: 'cents',
    min: 0,
    max: 20000,
  }),
  PREPARE_REGISTER_GYD: Object.freeze({
    label: 'Prepare & Register (wet ink)',
    unit: 'GYD',
    min: 0,
    max: 100000,
    note:
      'Quoted in Guyana dollars, not cents. This is the one figure charged in ' +
      'local currency, because it is a local service delivered on paper.',
  }),
});

/**
 * The defaults, taken straight from `lib/fees.js`.
 *
 * Re-exported rather than re-declared: two lists of the same numbers in two
 * files is how the editor ends up showing a "default" that the calculation
 * does not actually use.
 */
export const PRICE_DEFAULTS = FEE_DEFAULTS;

export class PricingError extends Error {
  constructor(code, message, field = null) {
    super(message);
    this.name = 'PricingError';
    this.code = code;
    this.status = 422;
    this.field = field;
  }
}

/**
 * The version string stored with every quote.
 *
 * Carries the code constant AND the override timestamp, so it says both which
 * arithmetic produced the quote and which figures it used.
 */
export function versionFor(updatedAt) {
  return updatedAt ? `${PRICE_LIST_VERSION}+admin.${updatedAt}` : PRICE_LIST_VERSION;
}

/**
 * The price list in force.
 *
 * @returns {Promise<{prices: object, overrides: object, version: string,
 *                    updatedAt: string|null, updatedBy: object|null}>}
 */
export async function getPriceList() {
  let data = {};

  try {
    const snapshot = await adminDb().collection(SETTINGS_COLLECTION).doc(PRICING_DOC).get();
    if (snapshot.exists) data = snapshot.data() ?? {};
  } catch (error) {
    /* Fails to the code defaults rather than throwing. A pricing read happens
       on the request flow and on the public pricing page; an unreachable
       settings document must not take the checkout down, and the defaults are
       a correct price list, merely not the latest one. */
    console.error('[pricing] could not read the price list, using defaults', error);
  }

  const overrides = {};
  for (const key of Object.keys(PRICE_DEFAULTS)) {
    const value = data?.prices?.[key];
    if (Number.isInteger(value)) overrides[key] = value;
  }

  return {
    prices: { ...PRICE_DEFAULTS, ...overrides },
    overrides,
    version: versionFor(data?.updatedAt ?? null),
    updatedAt: data?.updatedAt ?? null,
    updatedBy: data?.updatedBy ?? null,
  };
}

/**
 * Validate and save the manager's prices.
 *
 * An ALLOW-LIST keyed on `PRICE_FIELDS`, so an unrecognised key is ignored
 * rather than written. Passing a key as an empty string, null, or the literal
 * 'default' CLEARS the override and returns that line to the code default —
 * the same convention as `validateAllowance`, so the two admin screens behave
 * the same way.
 */
export async function setPrices(input, actor) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new PricingError('invalid_body', 'No prices were supplied.');
  }

  const next = {};
  const cleared = [];

  for (const [key, field] of Object.entries(PRICE_FIELDS)) {
    if (!(key in input)) continue;

    const raw = input[key];

    if (raw === '' || raw === null || raw === 'default') {
      cleared.push(key);
      continue;
    }

    const value = typeof raw === 'number' ? raw : Number(raw);

    if (!Number.isInteger(value)) {
      throw new PricingError(
        'not_an_integer',
        `"${field.label}" must be a whole number of ${field.unit}.`,
        key,
      );
    }
    if (value < field.min || value > field.max) {
      throw new PricingError(
        'out_of_range',
        `"${field.label}" must be between ${field.min} and ${field.max} ${field.unit}.`,
        key,
      );
    }

    next[key] = value;
  }

  if (Object.keys(next).length === 0 && cleared.length === 0) {
    throw new PricingError('nothing_to_save', 'No recognised prices were supplied.');
  }

  const current = await getPriceList();

  /* Merged here rather than with a Firestore merge, because clearing an
     override has to REMOVE the key. A `{merge: true}` write cannot delete a
     field without a sentinel, and spelling the whole map out keeps the stored
     document equal to the set of live overrides with nothing lingering. */
  const prices = { ...current.overrides, ...next };
  for (const key of cleared) delete prices[key];

  const updatedAt = new Date().toISOString();

  await adminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(PRICING_DOC)
    .set(
      { prices, updatedAt, updatedBy: { uid: actor.uid, email: actor.email } },
      { merge: false },
    );

  await adminDb()
    .collection('auditLog')
    .add({
      type: 'price_list_updated',
      changed: Object.keys(next),
      cleared,
      /* The figures, both before and after. A price change is the kind of
         thing a client disputes, and "the manager changed the base fee" does
         not answer "from what to what". */
      from: Object.fromEntries(
        [...Object.keys(next), ...cleared].map((key) => [key, current.prices[key]]),
      ),
      to: Object.fromEntries(
        [...Object.keys(next), ...cleared].map((key) => [
          key,
          prices[key] ?? PRICE_DEFAULTS[key],
        ]),
      ),
      version: versionFor(updatedAt),
      actorUid: actor.uid,
      actorEmail: actor.email,
      at: updatedAt,
    })
    .catch((error) => console.error('[pricing] audit write failed', error));

  return getPriceList();
}

/** Shaped for an editor: current value, default, bounds and whether overridden. */
export async function describePriceList() {
  const { prices, overrides, version, updatedAt, updatedBy } = await getPriceList();

  return {
    version,
    updatedAt,
    updatedBy,
    limits: LIMITS,
    fields: Object.entries(PRICE_FIELDS).map(([key, field]) => ({
      key,
      ...field,
      value: prices[key],
      default: PRICE_DEFAULTS[key],
      overridden: key in overrides,
    })),
  };
}
