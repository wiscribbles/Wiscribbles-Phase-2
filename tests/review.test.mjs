/**
 * `assertReviewed` — the review-and-correct gate.
 *
 * Barbados ETA Cap. 308B s.12A and Jamaica ETA s.27(2) require that a party be
 * able to review the transaction, correct errors in it and withdraw before
 * being committed. In Barbados a material error made with no opportunity to
 * correct it leaves the transaction with **no legal effect** — so the thing
 * these tests protect is not a compliance checkbox but the enforceability of
 * every signature the platform collects.
 *
 * Two properties matter more than the rest:
 *
 *   1. The function THROWS rather than returning false. A caller that forgets
 *      to check a boolean would collect an unreviewed signature, which is the
 *      exact failure the module exists to prevent, and it would do it
 *      silently.
 *   2. The reviewed name must equal the signed name. If those can diverge, the
 *      artefact records a review of something other than what was committed —
 *      which is worse than having no artefact, because it is evidence that
 *      says the wrong thing.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ELECTRONIC_FORM_CONSENT_STATUTE,
  REVIEW_AND_CORRECT_STATUTE,
  REVIEW_DECLARATION,
  ReviewError,
  assertReviewed,
  describeReviewBasis,
} from '../lib/review.js';

const good = (name = 'Jane Smith') => ({
  documentReviewed: true,
  electronicFormConsent: true,
  signatureName: name,
  reviewedAt: '2026-10-26T12:00:00.000Z',
});

/* ---------------------------------------------------------------- refusals */

test('a missing acknowledgement is refused', () => {
  for (const review of [null, undefined, 'yes', 42, []]) {
    assert.throws(
      () => assertReviewed({ review, signatureName: 'Jane Smith' }),
      (error) => {
        assert.ok(error instanceof ReviewError);
        assert.equal(error.code, 'review_required');
        assert.equal(error.status, 422);
        return true;
      },
      `expected refusal for ${JSON.stringify(review)}`,
    );
  }
});

test('an array is not an acknowledgement even though it is an object', () => {
  /* `typeof [] === 'object'`, so a bare truthiness-and-typeof check would let
     an array through and then read `undefined` off it. It must land on a
     named refusal, not on a later one by accident. */
  assert.throws(
    () => assertReviewed({ review: [], signatureName: 'Jane Smith' }),
    (error) => {
      assert.equal(error.code, 'review_required');
      return true;
    },
  );
});

test('an unconfirmed document review is refused', () => {
  for (const value of [false, undefined, 'true', 1]) {
    assert.throws(
      () =>
        assertReviewed({
          review: { ...good(), documentReviewed: value },
          signatureName: 'Jane Smith',
        }),
      (error) => {
        assert.equal(error.code, 'document_not_reviewed');
        assert.equal(error.field, 'documentReviewed');
        return true;
      },
      `expected refusal for documentReviewed=${JSON.stringify(value)}`,
    );
  }
});

test('an unconfirmed consent to electronic form is refused, and says paper is an option', () => {
  assert.throws(
    () =>
      assertReviewed({
        review: { ...good(), electronicFormConsent: false },
        signatureName: 'Jane Smith',
      }),
    (error) => {
      assert.equal(error.code, 'electronic_form_not_consented');
      /* Nobody is obliged to accept an electronic signature — Guyana ECT
         s.5(1)(a), Barbados s.3(2). The refusal has to say so, or the platform
         is asserting an obligation the statute denies. */
      assert.match(error.message, /paper/i);
      return true;
    },
  );
});

test('only a literal true counts as consent', () => {
  /* Truthiness would accept 'false', 1, or {} — all of which a malformed or
     hostile client can send. */
  for (const value of ['true', 1, {}, 'on']) {
    assert.throws(
      () =>
        assertReviewed({
          review: { ...good(), electronicFormConsent: value },
          signatureName: 'Jane Smith',
        }),
      (error) => {
        assert.equal(error.code, 'electronic_form_not_consented');
        return true;
      },
      `expected refusal for electronicFormConsent=${JSON.stringify(value)}`,
    );
  }
});

/* ------------------------------------------- the name reviewed vs. signed */

test('a name changed after review is refused', () => {
  assert.throws(
    () =>
      assertReviewed({
        review: good('Jane Smith'),
        signatureName: 'John Smith',
      }),
    (error) => {
      assert.equal(error.code, 'corrected_after_review');
      assert.equal(error.status, 409);
      assert.equal(error.field, 'signatureName');
      return true;
    },
  );
});

test('the comparison is on meaning, not bytes', () => {
  /* A browser that adds a trailing space, or a party who capitalises
     differently between the two screens, has not changed their name. Refusing
     those would train people to distrust the correction step. */
  const accepted = [
    ['Jane Smith', ' Jane Smith '],
    ['Jane Smith', 'jane smith'],
    ['Jane  Smith', 'Jane Smith'],
    ['Jane Smith', 'JANE SMITH'],
  ];

  for (const [reviewed, signed] of accepted) {
    assert.doesNotThrow(
      () => assertReviewed({ review: good(reviewed), signatureName: signed }),
      `"${reviewed}" and "${signed}" are the same name`,
    );
  }
});

test('a different name is still caught when it differs only by a word', () => {
  assert.throws(
    () =>
      assertReviewed({
        review: good('Jane Smith'),
        signatureName: 'Jane Smithe',
      }),
    (error) => {
      assert.equal(error.code, 'corrected_after_review');
      return true;
    },
  );
});

/* ---------------------------------------------------------- the artefact */

test('the artefact records the declarations verbatim', () => {
  const artefact = assertReviewed({
    review: good(),
    signatureName: 'Jane Smith',
    jurisdiction: 'BB',
  });

  /* Stored as text, not as a version pointer. A record saying "consented to
     v3" is worthless once v4 has replaced v3 in the source, and a document
     signed today may be read in ten years. */
  assert.equal(artefact.declarations.electronicForm, REVIEW_DECLARATION.electronicForm);
  assert.equal(artefact.declarations.documentReviewed, REVIEW_DECLARATION.documentReviewed);
  assert.equal(artefact.declarationVersion, REVIEW_DECLARATION.version);
});

test('the server keeps its own timestamp and treats the client clock as a claim', () => {
  const artefact = assertReviewed({
    review: { ...good(), reviewedAt: '2026-10-26T12:00:00.000Z' },
    signatureName: 'Jane Smith',
  });

  assert.equal(artefact.clientClaimedAt, '2026-10-26T12:00:00.000Z');
  assert.ok(artefact.confirmedAt, 'the server timestamp is present');
  assert.notEqual(
    artefact.confirmedAt,
    artefact.clientClaimedAt,
    'the two are recorded separately, not copied from one another',
  );
});

test('a garbage client timestamp is dropped rather than stored', () => {
  for (const value of ['yesterday', '', null, 12345, 'not-a-date']) {
    const artefact = assertReviewed({
      review: { ...good(), reviewedAt: value },
      signatureName: 'Jane Smith',
    });
    assert.equal(
      artefact.clientClaimedAt,
      null,
      `expected null for reviewedAt=${JSON.stringify(value)}`,
    );
    assert.ok(artefact.confirmedAt, 'the server timestamp survives regardless');
  }
});

test('the statutory basis is recorded for the jurisdiction, and is null for an unknown one', () => {
  assert.equal(
    assertReviewed({ review: good(), signatureName: 'Jane Smith', jurisdiction: 'BB' })
      .statutoryBasis,
    REVIEW_AND_CORRECT_STATUTE.BB.citation,
  );
  assert.equal(
    assertReviewed({ review: good(), signatureName: 'Jane Smith', jurisdiction: 'JM' })
      .electronicFormBasis,
    ELECTRONIC_FORM_CONSENT_STATUTE.JM,
  );

  for (const code of ['ZZ', '', null, undefined]) {
    const artefact = assertReviewed({
      review: good(),
      signatureName: 'Jane Smith',
      jurisdiction: code,
    });
    assert.equal(artefact.statutoryBasis, null);
    assert.equal(artefact.electronicFormBasis, null);
  }
});

test('the caller address is recorded, and absent means null not undefined', () => {
  assert.equal(
    assertReviewed({ review: good(), signatureName: 'Jane Smith', ip: '203.0.113.7' }).fromIp,
    '203.0.113.7',
  );
  /* Firestore rejects an undefined value, so a missing address must be an
     explicit null or the whole write fails at the moment of signing. */
  assert.equal(assertReviewed({ review: good(), signatureName: 'Jane Smith' }).fromIp, null);
});

test('the artefact is frozen', () => {
  const artefact = assertReviewed({ review: good(), signatureName: 'Jane Smith' });
  assert.throws(() => {
    'use strict';
    artefact.documentReviewed = false;
  });
});

/* ------------------------------------------------------- the registry itself */

test('every jurisdiction in the registry has a citation and a consequence', () => {
  for (const [code, entry] of Object.entries(REVIEW_AND_CORRECT_STATUTE)) {
    assert.ok(entry.citation?.length > 5, `${code} has a citation`);
    assert.ok(entry.consequence?.length > 20, `${code} says what follows from it`);
    assert.equal(typeof entry.inForce, 'boolean', `${code} states whether it is in force`);
  }
});

test('Trinidad Part VIII is recorded as not in force', () => {
  /* ss.55–58 were never proclaimed. Recording them as in force would be a
     false statement in the one place someone would look to check. */
  assert.equal(REVIEW_AND_CORRECT_STATUTE.TT.inForce, false);
  assert.match(REVIEW_AND_CORRECT_STATUTE.TT.consequence, /NOT PROCLAIMED/);
});

test('describeReviewBasis returns null for a jurisdiction it has nothing to say about', () => {
  assert.equal(describeReviewBasis('ZZ'), null);
  assert.deepEqual(describeReviewBasis('BB'), {
    citation: REVIEW_AND_CORRECT_STATUTE.BB.citation,
    inForce: true,
  });
});

test('every launch jurisdiction has an electronic-form consent citation', () => {
  /* Consent is an element of validity in all four. A jurisdiction missing
     here would produce an artefact with a null basis, which reads in an audit
     as "no statute required this" rather than "nobody filled it in". */
  for (const code of ['GY', 'TT', 'JM', 'BB']) {
    assert.ok(
      ELECTRONIC_FORM_CONSENT_STATUTE[code]?.length > 10,
      `${code} has a consent citation`,
    );
  }
});
