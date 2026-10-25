/**
 * `quote` — the itemised price.
 *
 * Two things here do real damage if wrong. The base is DERIVED from the
 * signatory count rather than chosen, so an off-by-one at the boundary
 * silently charges the wrong base on every two-signatory document. And the
 * witness line is zero-rated because the platform cannot host a witness —
 * charging for it would be charging for something not supplied.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FEES, LIMITS, FeeError, quote, publishedPriceList } from '@/lib/fees';

const lineFor = (result, key) => result.lines.find((l) => l.key === key);

test('one signatory takes the single-signatory base', () => {
  const result = quote({ notarized: true, signatories: 1 });
  assert.equal(lineFor(result, 'base').amountCents, FEES.BASE_SINGLE_SIGNATORY);
  assert.equal(result.totalCents, FEES.BASE_SINGLE_SIGNATORY);
  assert.equal(lineFor(result, 'additional_signatories'), undefined);
});

test('two signatories take the two-signatory base with no additional line', () => {
  /* The boundary. `people === 1` picks the single base; everything else picks
     the two base and charges `people - 2` extras — so at exactly two the
     extras must be zero and the line must be absent, not present-and-zero. */
  const result = quote({ notarized: true, signatories: 2 });
  assert.equal(lineFor(result, 'base').amountCents, FEES.BASE_TWO_SIGNATORIES);
  assert.equal(lineFor(result, 'additional_signatories'), undefined);
  assert.equal(result.totalCents, FEES.BASE_TWO_SIGNATORIES);
});

test('three signatories add exactly one extra, not three', () => {
  const result = quote({ notarized: true, signatories: 3 });
  const extra = lineFor(result, 'additional_signatories');
  assert.equal(extra.quantity, 1);
  assert.equal(extra.amountCents, FEES.ADDITIONAL_SIGNATORY);
  assert.equal(
    result.totalCents,
    FEES.BASE_TWO_SIGNATORIES + FEES.ADDITIONAL_SIGNATORY,
  );
});

test('the maximum signatory count prices correctly', () => {
  const n = LIMITS.MAX_SIGNATORIES;
  const result = quote({ notarized: true, signatories: n });
  assert.equal(
    result.totalCents,
    FEES.BASE_TWO_SIGNATORIES + (n - 2) * FEES.ADDITIONAL_SIGNATORY,
  );
});

test('a witness is listed at zero WITH a reason, not dropped', () => {
  /* Listed rather than dropped so the client can see the platform knows about
     the witness and is not charging for it. If this line ever disappears, the
     client has no way to tell whether the witness was understood. */
  const result = quote({ notarized: true, signatories: 2, witnesses: 2 });
  const line = lineFor(result, 'witnesses');
  assert.ok(line, 'the witness line must be present');
  assert.equal(line.quantity, 2);
  assert.equal(line.unitCents, 0);
  assert.equal(line.amountCents, 0, 'a witness the platform cannot host is not charged');
  assert.match(line.note, /physically present/);
  assert.equal(result.totalCents, FEES.BASE_TWO_SIGNATORIES, 'witnesses add nothing');
});

test('the witness charge returns if and only if witnessing becomes available', () => {
  /* Guards the flag rather than the price: the fee exists and is correct, and
     it is suppressed by `witnessingAvailable`. If someone deletes the flag to
     "simplify", this fails. */
  const result = quote({
    notarized: true,
    signatories: 2,
    witnesses: 2,
    witnessingAvailable: true,
  });
  const line = lineFor(result, 'witnesses');
  assert.equal(line.unitCents, FEES.WITNESS);
  assert.equal(line.amountCents, 2 * FEES.WITNESS);
  assert.equal(line.note, null);
  assert.equal(result.totalCents, FEES.BASE_TWO_SIGNATORIES + 2 * FEES.WITNESS);
});

test('an e-signature charges the flat fee and no seal fee, whatever the signatory count', () => {
  const one = quote({ notarized: false, signatories: 1 });
  const many = quote({ notarized: false, signatories: 6 });
  assert.equal(one.totalCents, many.totalCents, 'e-signature is flat');
  assert.equal(lineFor(many, 'base'), undefined, 'no notarisation base');
  assert.equal(lineFor(many, 'additional_seals'), undefined);
  assert.match(lineFor(many, 'esign').note, /no seal fee/);
});

test('a witness on an e-signature is zero-rated for its own reason', () => {
  /* Different reason from the notarised case: there is no seal to witness at
     all. The note must say so, because "not charged" without a reason reads
     like a bug. */
  const result = quote({ notarized: false, signatories: 2, witnesses: 1 });
  const line = lineFor(result, 'witness_not_charged');
  assert.ok(line);
  assert.equal(line.amountCents, 0);
  assert.match(line.note, /no seal to witness/);
});

test('an e-signature never validates the seal count', () => {
  /* Seals are meaningless without a professional, so an absurd seal count on
     an e-signature must not raise — the early return happens first. A change
     that hoisted seal validation above that return would start rejecting
     valid e-signature requests. */
  assert.doesNotThrow(() => quote({ notarized: false, signatories: 1, seals: 99 }));
});

test('extra seals are charged beyond the first', () => {
  const result = quote({ notarized: true, signatories: 1, seals: 3 });
  const line = lineFor(result, 'additional_seals');
  assert.equal(line.quantity, 2);
  assert.equal(
    result.totalCents,
    FEES.BASE_SINGLE_SIGNATORY + 2 * FEES.ADDITIONAL_SEAL,
  );
});

test('one seal adds no additional-seal line', () => {
  assert.equal(lineFor(quote({ notarized: true, signatories: 1, seals: 1 }), 'additional_seals'), undefined);
});

test('out-of-range and non-integer inputs are refused with a field name', () => {
  const cases = [
    [{ notarized: true, signatories: 0 }, 'bad_signatories', 'signatories'],
    [{ notarized: true, signatories: LIMITS.MAX_SIGNATORIES + 1 }, 'bad_signatories', 'signatories'],
    [{ notarized: true, signatories: 1.5 }, 'bad_signatories', 'signatories'],
    [{ notarized: true, signatories: 'two' }, 'bad_signatories', 'signatories'],
    [{ notarized: true, signatories: 2, witnesses: -1 }, 'bad_witnesses', 'witnesses'],
    [{ notarized: true, signatories: 2, witnesses: LIMITS.MAX_WITNESSES + 1 }, 'bad_witnesses', 'witnesses'],
    [{ notarized: true, signatories: 1, seals: 0 }, 'bad_seals', 'seals'],
    [{ notarized: true, signatories: 1, seals: LIMITS.MAX_SEALS + 1 }, 'bad_seals', 'seals'],
  ];

  for (const [input, code, field] of cases) {
    assert.throws(
      () => quote(input),
      (error) => {
        assert.ok(error instanceof FeeError, `${code} must be a FeeError`);
        assert.equal(error.code, code);
        assert.equal(error.field, field, 'the field is what the form needs to highlight');
        return true;
      },
      `${JSON.stringify(input)} should be refused`,
    );
  }
});

test('the total always equals the sum of the lines', () => {
  /* The itemisation is shown to the client and stored against the document to
     settle later disputes. If the total and the lines can disagree, the stored
     record is not evidence of anything. */
  const inputs = [
    { notarized: true, signatories: 1 },
    { notarized: true, signatories: 2, witnesses: 1, seals: 2 },
    { notarized: true, signatories: 10, witnesses: 4, seals: 5, witnessingAvailable: true },
    { notarized: false, signatories: 4, witnesses: 2 },
  ];

  for (const input of inputs) {
    const result = quote(input);
    const summed = result.lines.reduce((total, line) => total + line.amountCents, 0);
    assert.equal(result.totalCents, summed, JSON.stringify(input));
    assert.ok(result.formattedTotal.length > 0);
  }
});

test('the published price list matches the constants it advertises', () => {
  /* The client sees this before choosing. If it drifts from FEES, the platform
     advertises one price and charges another. */
  const list = publishedPriceList();
  const flat = JSON.stringify(list);
  for (const cents of Object.values(FEES)) {
    assert.ok(flat.includes(String(cents)), `price list omits ${cents}`);
  }
});
