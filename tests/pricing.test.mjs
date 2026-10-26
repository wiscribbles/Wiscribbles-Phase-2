/**
 * The live price list.
 *
 * These are the figures a client is actually charged, so the properties worth
 * testing are the ones that cost money when they break:
 *
 *   1. A quote uses the Website Manager's prices, not the code defaults. If
 *      this regresses, the admin screen appears to work and changes nothing —
 *      the worst kind of pricing bug, because it is invisible until a client
 *      disputes an amount.
 *   2. The VERSION changes when the prices change. Every quote is stored with
 *      its version so a dispute is settled by reading the record. A constant
 *      version across two different price lists makes a stored quote
 *      unreconcilable with either.
 *   3. Bounds are enforced. 150000 instead of 1500 is a $1,500 notarisation
 *      fee quoted to a real person, and this is the cheapest place to stop it.
 *   4. Clearing an override REMOVES the key rather than storing a zero.
 *      Blank means "use the default"; zero means "charge nothing". Conflating
 *      them makes a free notarisation one typo away.
 */

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFirestore } from './fakes/firestore.mjs';
import { __reset, __setFirestore } from './stubs/firebase-admin.mjs';
import {
  PRICE_DEFAULTS,
  PRICE_FIELDS,
  PricingError,
  getPriceList,
  setPrices,
  versionFor,
} from '../lib/pricing.js';
import { PRICE_LIST_VERSION, quote } from '../lib/fees.js';

afterEach(() => __reset());

const ACTOR = { uid: 'admin-1', email: 'manager@wiscribbles.com' };

/* ------------------------------------------------------------- defaults -- */

test('with no stored overrides the defaults are in force', async () => {
  __setFirestore(createFirestore({}));
  const { prices, overrides, version } = await getPriceList();

  assert.deepEqual(prices, { ...PRICE_DEFAULTS });
  assert.deepEqual(overrides, {});
  assert.equal(version, PRICE_LIST_VERSION, 'unversioned until somebody changes something');
});

test('an unreadable settings document falls back to the defaults rather than throwing', async () => {
  /* A pricing read happens on the checkout path. An unreachable settings
     document must not take the request flow down — the defaults are a correct
     price list, merely not the latest one. */
  __setFirestore({
    collection: () => ({
      doc: () => ({
        get: async () => {
          throw new Error('firestore unavailable');
        },
      }),
    }),
  });

  const { prices } = await getPriceList();
  assert.deepEqual(prices, { ...PRICE_DEFAULTS });
});

/* ------------------------------------------------------------ overrides -- */

test('a saved price is what a later quote charges', async () => {
  const db = createFirestore({});
  __setFirestore(db);

  await setPrices({ BASE_SINGLE_SIGNATORY: 2000 }, ACTOR);

  const { prices, version } = await getPriceList();
  assert.equal(prices.BASE_SINGLE_SIGNATORY, 2000);

  /* The point of the whole feature: the calculation uses it. */
  const result = quote({
    notarized: true,
    signatories: 1,
    seals: 1,
    prices,
    priceListVersion: version,
  });

  assert.equal(result.totalCents, 2000);
  assert.equal(result.lines[0].amountCents, 2000);
});

test('unchanged lines keep their defaults when one line is overridden', async () => {
  __setFirestore(createFirestore({}));
  await setPrices({ ADDITIONAL_SIGNATORY: 1500 }, ACTOR);

  const { prices } = await getPriceList();
  assert.equal(prices.ADDITIONAL_SIGNATORY, 1500);
  assert.equal(
    prices.BASE_TWO_SIGNATORIES,
    PRICE_DEFAULTS.BASE_TWO_SIGNATORIES,
    'an absent key means "use the default", not "zero"',
  );
});

test('the version changes when the prices change', async () => {
  __setFirestore(createFirestore({}));

  const before = (await getPriceList()).version;
  await setPrices({ WITNESS: 1200 }, ACTOR);
  const after = (await getPriceList()).version;

  assert.notEqual(before, after);
  assert.match(after, /\+admin\./, 'the version records that a manager changed it');
});

test('versionFor is stable for a given timestamp and distinct across timestamps', () => {
  assert.equal(versionFor(null), PRICE_LIST_VERSION);
  assert.equal(versionFor('2026-10-26T00:00:00.000Z'), versionFor('2026-10-26T00:00:00.000Z'));
  assert.notEqual(versionFor('2026-10-26T00:00:00.000Z'), versionFor('2026-10-27T00:00:00.000Z'));
});

/* -------------------------------------------------------------- bounds --- */

test('a price outside its bounds is refused', async () => {
  __setFirestore(createFirestore({}));

  await assert.rejects(
    () => setPrices({ BASE_SINGLE_SIGNATORY: 150000 }, ACTOR),
    (error) => {
      assert.ok(error instanceof PricingError);
      assert.equal(error.code, 'out_of_range');
      assert.equal(error.field, 'BASE_SINGLE_SIGNATORY');
      return true;
    },
  );

  await assert.rejects(
    () => setPrices({ BASE_SINGLE_SIGNATORY: -100 }, ACTOR),
    (error) => error.code === 'out_of_range',
  );
});

test('a non-integer price is refused', async () => {
  __setFirestore(createFirestore({}));

  for (const value of [15.5, 'fifteen', NaN, {}]) {
    await assert.rejects(
      () => setPrices({ WITNESS: value }, ACTOR),
      (error) => {
        assert.equal(error.code, 'not_an_integer');
        return true;
      },
      `expected refusal for ${JSON.stringify(value)}`,
    );
  }
});

test('a numeric string is accepted, because a form sends one', async () => {
  __setFirestore(createFirestore({}));
  const saved = await setPrices({ ADDITIONAL_SEAL: '1250' }, ACTOR);
  assert.equal(saved.prices.ADDITIONAL_SEAL, 1250);
});

test('zero is a legitimate price', async () => {
  /* The e-signature fee is zero today. A validator that treated 0 as missing
     would make it unsettable. */
  __setFirestore(createFirestore({}));
  const saved = await setPrices({ ESIGN: 0 }, ACTOR);
  assert.equal(saved.prices.ESIGN, 0);
  assert.equal(saved.overrides.ESIGN, 0);
});

/* ------------------------------------------------------------- clearing -- */

test('clearing an override removes the key rather than storing zero', async () => {
  const db = createFirestore({});
  __setFirestore(db);

  await setPrices({ BASE_TWO_SIGNATORIES: 3000 }, ACTOR);
  assert.equal((await getPriceList()).prices.BASE_TWO_SIGNATORIES, 3000);

  for (const blank of ['', null, 'default']) {
    await setPrices({ BASE_TWO_SIGNATORIES: 3000 }, ACTOR);
    await setPrices({ BASE_TWO_SIGNATORIES: blank }, ACTOR);

    const { prices, overrides } = await getPriceList();
    assert.equal(
      prices.BASE_TWO_SIGNATORIES,
      PRICE_DEFAULTS.BASE_TWO_SIGNATORIES,
      `${JSON.stringify(blank)} returns the line to its default`,
    );
    assert.equal(
      'BASE_TWO_SIGNATORIES' in overrides,
      false,
      'and the stored override is gone, not set to 0',
    );
  }
});

/* --------------------------------------------------------- allow-listing -- */

test('unknown keys are ignored rather than written', async () => {
  const db = createFirestore({});
  __setFirestore(db);

  await setPrices(
    { WITNESS: 1100, role: 'admin', status: 'approved', TOTALLY_MADE_UP: 9 },
    ACTOR,
  );

  const stored = db.__store.adminSettings.pricing.prices;
  assert.equal(stored.WITNESS, 1100);
  for (const key of ['role', 'status', 'TOTALLY_MADE_UP']) {
    assert.equal(stored[key], undefined, `${key} was not written`);
  }
});

test('a payload with nothing recognisable is refused', async () => {
  __setFirestore(createFirestore({}));

  await assert.rejects(
    () => setPrices({ nonsense: 1 }, ACTOR),
    (error) => error.code === 'nothing_to_save',
  );

  for (const body of [null, undefined, [], 'prices']) {
    await assert.rejects(
      () => setPrices(body, ACTOR),
      (error) => error.code === 'invalid_body',
      `expected refusal for ${JSON.stringify(body)}`,
    );
  }
});

/* ------------------------------------------------------------- the audit -- */

test('the audit entry records the figures before and after', async () => {
  const db = createFirestore({});
  __setFirestore(db);

  await setPrices({ BASE_SINGLE_SIGNATORY: 1800 }, ACTOR);

  const entries = Object.values(db.__store.auditLog ?? {});
  assert.equal(entries.length, 1);
  assert.equal(entries[0].type, 'price_list_updated');
  assert.equal(entries[0].from.BASE_SINGLE_SIGNATORY, PRICE_DEFAULTS.BASE_SINGLE_SIGNATORY);
  assert.equal(entries[0].to.BASE_SINGLE_SIGNATORY, 1800);
  assert.equal(entries[0].actorEmail, ACTOR.email);
});

/* ------------------------------------------------------- the field table -- */

test('every settable field has a label, a unit and sane bounds', () => {
  for (const [key, field] of Object.entries(PRICE_FIELDS)) {
    assert.ok(field.label?.length > 3, `${key} has a label`);
    assert.ok(['cents', 'GYD'].includes(field.unit), `${key} has a known unit`);
    assert.equal(typeof field.min, 'number');
    assert.equal(typeof field.max, 'number');
    assert.ok(field.max > field.min, `${key} bounds make sense`);
    assert.ok(key in PRICE_DEFAULTS, `${key} has a default`);
  }
});

test('every default has a settable field, so nothing is editable-but-invisible', () => {
  for (const key of Object.keys(PRICE_DEFAULTS)) {
    assert.ok(key in PRICE_FIELDS, `${key} appears in the editor`);
  }
});

test('the witness line is still zero-rated while remote witnessing is off', async () => {
  /* Whatever the manager sets. The platform cannot host a witnessing, and
     charging for something not supplied is not a pricing decision. */
  __setFirestore(createFirestore({}));
  await setPrices({ WITNESS: 5000 }, ACTOR);
  const { prices, version } = await getPriceList();

  const result = quote({
    notarized: true,
    signatories: 2,
    witnesses: 2,
    seals: 1,
    witnessingAvailable: false,
    prices,
    priceListVersion: version,
  });

  const witnessLine = result.lines.find((line) => line.key === 'witnesses');
  assert.equal(witnessLine.amountCents, 0);
  assert.equal(result.totalCents, prices.BASE_TWO_SIGNATORIES);
});
