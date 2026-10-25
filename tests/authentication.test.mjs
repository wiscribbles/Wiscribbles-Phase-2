/**
 * `verify` — the public two-factor document lookup.
 *
 * The invariant this file exists to protect: A WRONG REFERENCE AND A WRONG
 * DATE MUST RETURN IDENTICAL RESPONSES. The whole point of asking for both is
 * that neither alone tells a caller anything. The moment "that reference
 * exists but the date is wrong" becomes distinguishable from "no such
 * reference", the two-factor check has collapsed into a one-factor one and the
 * endpoint becomes a reference-number oracle — on a public, unauthenticated
 * route.
 *
 * `normalizeReference` is tested alongside it because it decides what counts
 * as the same reference, and a verifier retyping from a printed certificate
 * must not be refused over punctuation.
 */

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFirestore } from './fakes/firestore.mjs';
import { __reset, __setFirestore } from './stubs/firebase-admin.mjs';
import {
  VERIFICATION,
  AuthenticationError,
  normalizeDate,
  normalizeReference,
  verify,
} from '@/lib/authentication';

afterEach(() => __reset());

const REFERENCE = 'WS-GY-26-7K4PQ2MN';

/** A document seeded as executed on the given day. */
const executedDocument = (overrides = {}) => ({
  referenceNumber: REFERENCE,
  executedAt: '2026-09-15T14:32:00.000Z',
  jurisdiction: 'GY',
  templateName: 'Affidavit of identity',
  status: 'notarised',
  executedBy: { name: 'A. Notary', role: 'notary' },
  signatories: 2,
  seals: 1,
  integrity: { algorithm: 'SHA-256', digest: 'a'.repeat(64) },
  ...overrides,
});

const seed = (documents) => {
  /* `authenticationAttempts` is seeded empty so the rate limiter has a
     collection to read; the limiter is not what these tests are about. */
  __setFirestore(createFirestore({ documents, authenticationAttempts: {} }));
};

/* --------------------------------------------------------------------- */
/* The invariant                                                          */
/* --------------------------------------------------------------------- */

test('a wrong date and a wrong reference return byte-identical responses', () => {
  /* THE test in this file. Compared with deepEqual rather than by checking
     each field, because any added field — a reason code, a hint, a different
     message — reintroduces the leak, and a field-by-field test would not
     notice. */
  return (async () => {
    seed({ doc1: executedDocument() });

    const wrongDate = await verify({ reference: REFERENCE, dateSigned: '2026-09-14' });

    seed({ doc1: executedDocument() });
    const wrongReference = await verify({
      reference: 'WS-GY-26-ZZZZZZZZ',
      dateSigned: '2026-09-15',
    });

    assert.equal(wrongDate.result, VERIFICATION.NOT_FOUND);
    assert.equal(wrongReference.result, VERIFICATION.NOT_FOUND);
    assert.deepEqual(
      wrongDate,
      wrongReference,
      'the two responses must be indistinguishable — otherwise the lookup is one-factor',
    );
  })();
});

test('neither response carries a certificate or any document field', () => {
  /* A refusal that leaked the document type or the jurisdiction would be a
     partial answer, which is the same failure in a smaller form. */
  return (async () => {
    seed({ doc1: executedDocument() });
    const result = await verify({ reference: REFERENCE, dateSigned: '2026-01-01' });
    assert.equal(result.certificate, undefined);
    assert.equal(Object.keys(result).sort().join(','), 'message,result');
  })();
});

test('the correct reference and date verify, and return the facts', () => {
  return (async () => {
    seed({ doc1: executedDocument() });
    const result = await verify({ reference: REFERENCE, dateSigned: '2026-09-15' });

    assert.equal(result.result, VERIFICATION.VALID);
    assert.equal(result.certificate.reference, REFERENCE);
    assert.equal(result.certificate.jurisdiction, 'Guyana');
    assert.match(result.certificate.statute, /Electronic Communications and Transactions/);
    assert.equal(result.certificate.documentType, 'Affidavit of identity');
    assert.equal(result.certificate.documentId, 'doc1');
  })();
});

test('the date compared is the day of execution, in UTC, not the timestamp', () => {
  /* `executedAt` is a full ISO timestamp and the caller supplies a day. The
     comparison takes the first ten characters, so a document executed at
     14:32 UTC verifies against its own date and not the day before or after. */
  return (async () => {
    seed({ doc1: executedDocument({ executedAt: '2026-09-15T23:59:59.000Z' }) });
    assert.equal((await verify({ reference: REFERENCE, dateSigned: '2026-09-15' })).result, VERIFICATION.VALID);

    seed({ doc1: executedDocument({ executedAt: '2026-09-15T00:00:01.000Z' }) });
    assert.equal((await verify({ reference: REFERENCE, dateSigned: '2026-09-16' })).result, VERIFICATION.NOT_FOUND);
  })();
});

test('a revoked document verifies as REVOKED, loudly', () => {
  /* The case Phase 1 could not report at all. Anyone relying on a revoked
     instrument needs to stop, so this must never read as "valid" and must
     never read as "not found" either. */
  return (async () => {
    seed({
      doc1: executedDocument({
        status: 'revoked',
        revocation: { at: '2026-10-01T09:00:00.000Z', ground: 'Identity not established' },
      }),
    });
    const result = await verify({ reference: REFERENCE, dateSigned: '2026-09-15' });

    assert.equal(result.result, VERIFICATION.REVOKED);
    assert.match(result.message, /REVOKED/);
    assert.match(result.message, /should not be relied on/);
    assert.equal(result.certificate.revokedAt, '2026-10-01T09:00:00.000Z');
    assert.equal(result.certificate.revocationGround, 'Identity not established');
  })();
});

test("the Website Manager's internal revocation note is never published", () => {
  /* The ground is public; the internal reason may name third parties or an
     investigation. */
  return (async () => {
    seed({
      doc1: executedDocument({
        status: 'revoked',
        revocation: {
          at: '2026-10-01T09:00:00.000Z',
          ground: 'Identity not established',
          reason: 'Police enquiry ref 12345, complainant J. Smith',
          reviewedBy: 'admin-uid-1',
        },
      }),
    });
    const result = await verify({ reference: REFERENCE, dateSigned: '2026-09-15' });
    const published = JSON.stringify(result);

    assert.equal(published.includes('Police enquiry'), false);
    assert.equal(published.includes('J. Smith'), false);
    assert.equal(published.includes('admin-uid-1'), false);
  })();
});

test('a document executed on paper verifies on its paper execution date', () => {
  /* Prepare & Register documents carry `executedOnPaperAt` rather than
     `executedAt`. Both are real executions and both must verify. */
  return (async () => {
    seed({
      doc1: executedDocument({
        executedAt: undefined,
        executedOnPaperAt: '2026-08-02T00:00:00.000Z',
      }),
    });
    const result = await verify({ reference: REFERENCE, dateSigned: '2026-08-02' });
    assert.equal(result.result, VERIFICATION.VALID);
  })();
});

test('an unexecuted document reports NOT_EXECUTED — see the note below', () => {
  /* DOCUMENTING CURRENT BEHAVIOUR, NOT ENDORSING IT.
   *
   * A reference that exists but has not been executed returns NOT_EXECUTED,
   * and it does so BEFORE the date is compared — so any date produces it. That
   * means an unexecuted reference is distinguishable from a non-existent one
   * WITHOUT knowing the date, which is a narrower version of the leak the
   * first test in this file guards against.
   *
   * It is narrower because it only discloses the existence of a draft, and
   * because the message is genuinely useful to a legitimate verifier holding a
   * document that was never completed. Whether that trade is right is a
   * product decision, not one to make silently inside a test, so this asserts
   * what the code does today and the finding is reported separately. If the
   * decision is to close it, this test is the one to change — and the change
   * is to return the same `notFound` object. */
  return (async () => {
    seed({ doc1: executedDocument({ executedAt: undefined, status: 'awaiting_signature' }) });
    const result = await verify({ reference: REFERENCE, dateSigned: '1999-01-01' });
    assert.equal(result.result, VERIFICATION.NOT_EXECUTED);
    assert.equal(result.certificate, undefined, 'at least no facts leak');
  })();
});

/* --------------------------------------------------------------------- */
/* Input handling — before any lookup happens                             */
/* --------------------------------------------------------------------- */

test('a malformed reference is refused without touching the database', () => {
  /* No Firestore is installed here on purpose: if `verify` reached the
     database before validating, the stub would throw and this test would fail
     with a message saying so. That is the assertion. */
  return (async () => {
    for (const reference of ['', 'hello', 'WS-GY', 'WS-GY-26-SHORT', null, undefined, 'WS-GY-2026-7K4PQ2MN']) {
      await assert.rejects(
        () => verify({ reference, dateSigned: '2026-09-15' }),
        (error) => {
          assert.ok(error instanceof AuthenticationError);
          assert.equal(error.code, 'bad_reference');
          assert.equal(error.status, 422);
          return true;
        },
        `"${reference}" should be refused as malformed`,
      );
    }
  })();
});

test('a missing date is refused separately from a missing reference', () => {
  /* These two ARE distinguishable, and should be: they are both the caller's
     own input, so no information about anyone's document is disclosed. */
  return (async () => {
    await assert.rejects(
      () => verify({ reference: REFERENCE, dateSigned: null }),
      (error) => {
        assert.equal(error.code, 'bad_date');
        return true;
      },
    );
  })();
});

test('a reference is normalised the way people actually type it', () => {
  const canonical = 'WS-GY-26-7K4PQ2MN';
  for (const typed of [
    'WS-GY-26-7K4PQ2MN',
    'ws-gy-26-7k4pq2mn',
    'WS GY 26 7K4PQ2MN',
    'WSGY267K4PQ2MN',
    '  ws gy 26 7k4pq2mn  ',
    'WS/GY/26/7K4PQ2MN',
  ]) {
    assert.equal(normalizeReference(typed), canonical, `"${typed}" should normalise`);
  }
});

test('normalisation refuses what is not a reference rather than guessing', () => {
  for (const bad of [
    null,
    undefined,
    '',
    'WS-GY-26-7K4PQ2M',       // seven in the suffix
    'WS-GY-26-7K4PQ2MNX',     // nine
    'WS-G-26-7K4PQ2MN',       // one-letter jurisdiction
    'WS-GY-2026-7K4PQ2MN',    // four-digit year
    'XX-GY-26-7K4PQ2MN',      // wrong prefix
  ]) {
    assert.equal(normalizeReference(bad), null, `"${bad}" must not normalise`);
  }
});

test('the date form rejects impossible days instead of rolling them over', () => {
  /* 31 February would otherwise become 2 or 3 March and silently verify
     against the wrong document. */
  assert.equal(normalizeDate({ day: 15, month: 9, year: 2026 }), '2026-09-15');
  assert.equal(normalizeDate({ day: 1, month: 1, year: 2026 }), '2026-01-01');
  assert.equal(normalizeDate({ day: 29, month: 2, year: 2024 }), '2024-02-29', 'a real leap day');

  for (const bad of [
    { day: 31, month: 2, year: 2026 },
    { day: 29, month: 2, year: 2026 },
    { day: 0, month: 9, year: 2026 },
    { day: 32, month: 9, year: 2026 },
    { day: 15, month: 13, year: 2026 },
    { day: 15, month: 0, year: 2026 },
    { day: 15, month: 9, year: 1999 },
    { day: 'x', month: 9, year: 2026 },
  ]) {
    assert.equal(normalizeDate(bad), null, `${JSON.stringify(bad)} must be rejected`);
  }
});
