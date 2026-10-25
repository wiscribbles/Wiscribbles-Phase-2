/**
 * `buildParties`, `nextParty` and `recordSignature` — order, tokens and the
 * witness refusal.
 *
 * Three things here have consequences on the face of the instrument. A
 * document signed out of sequence reads wrongly — a guarantor signing before
 * the principal debtor is a defect a court can see. A spent or expired token
 * that still works means a signing link is a bearer credential for ever. And
 * since 19 Oct 2026 a witness party must be REFUSED at intake rather than
 * accepted and parked: accepting one used to drive the finished document into
 * `awaiting_in_person_witnessing`, a status with no route onward, which killed
 * the document silently.
 */

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFirestore } from './fakes/firestore.mjs';
import { __reset, __setFirestore } from './stubs/firebase-admin.mjs';
import {
  PARTY_ROLE,
  PARTY_STATUS,
  SigningError,
  buildParties,
  fullyExecuted,
  hashToken,
  mintPartyToken,
  needsInPersonWitnessing,
  nextParty,
  recordSignature,
  tokensMatch,
} from '@/lib/signing';

afterEach(() => __reset());

const CREATOR = { uid: 'uid-1', name: 'A. Client', email: 'client@example.com' };

/* --------------------------------------------------------------------- */
/* The witness refusal — 19 October 2026                                  */
/* --------------------------------------------------------------------- */

test('a witness party is REFUSED, in every jurisdiction', () => {
  /* The behaviour change. Previously this returned a party list with the
     witness marked IN_PERSON_REQUIRED; now it throws at intake, where the
     client can still do something about it. */
  for (const jurisdiction of ['GY', 'JM', 'TT', 'BB']) {
    assert.throws(
      () =>
        buildParties({
          jurisdiction,
          creator: CREATOR,
          parties: [{ name: 'W. Witness', email: 'w@example.com', role: PARTY_ROLE.WITNESS }],
        }),
      (error) => {
        assert.ok(error instanceof SigningError);
        assert.equal(error.code, 'witness_not_accepted');
        assert.equal(error.field, 'parties');
        return true;
      },
      `a witness must be refused in ${jurisdiction}`,
    );
  }
});

test('the refusal explains the law and offers Prepare & Register', () => {
  /* A refusal with no route onward is what the old behaviour amounted to. The
     message has to carry the alternative, because this is the last point at
     which the client is still paying attention. */
  try {
    buildParties({
      jurisdiction: 'GY',
      creator: CREATOR,
      parties: [{ name: 'W', email: 'w@example.com', role: PARTY_ROLE.WITNESS }],
    });
    assert.fail('should have thrown');
  } catch (error) {
    assert.match(error.message, /presence/i, 'must say why');
    assert.match(error.message, /Prepare & Register/, 'must say what to do instead');
  }
});

test('NO DOCUMENT CAN NEWLY REACH awaiting_in_person_witnessing', () => {
  /* Stated as a property rather than a path: whatever `buildParties` returns,
     for any input it accepts, no party may carry IN_PERSON_REQUIRED — which is
     the only thing that sets that document status. */
  const accepted = buildParties({
    jurisdiction: 'GY',
    creator: CREATOR,
    parties: [
      { name: 'B', email: 'b@example.com', role: PARTY_ROLE.SIGNATORY },
      { name: 'C', email: 'c@example.com' },
    ],
  });

  assert.equal(needsInPersonWitnessing(accepted), false);
  for (const party of accepted) {
    assert.notEqual(party.status, PARTY_STATUS.IN_PERSON_REQUIRED);
    assert.equal(party.role, PARTY_ROLE.SIGNATORY);
  }
});

test('the dormant witness machinery is still present and still correct', () => {
  /* Deliberately not deleted: documents already parked in that status must
     stay readable, and re-enabling is meant to be a flag flip rather than a
     rebuild. So the constants and the skip logic must survive. */
  assert.equal(PARTY_ROLE.WITNESS, 'witness');
  assert.equal(PARTY_STATUS.IN_PERSON_REQUIRED, 'in_person_required');

  const legacy = [
    { order: 1, status: PARTY_STATUS.SIGNED, email: 'a@x.com' },
    { order: 2, status: PARTY_STATUS.IN_PERSON_REQUIRED, email: 'w@x.com' },
  ];
  assert.equal(needsInPersonWitnessing(legacy), true, 'an existing document still reads correctly');
  assert.equal(nextParty(legacy), null, 'and the witness is still skipped, not awaited');
});

/* --------------------------------------------------------------------- */
/* Building the party list                                                */
/* --------------------------------------------------------------------- */

test('the creator is party 1 and is invited immediately', () => {
  const parties = buildParties({
    jurisdiction: 'GY',
    creator: CREATOR,
    parties: [{ name: 'B', email: 'b@example.com' }],
  });

  assert.equal(parties[0].email, 'client@example.com');
  assert.equal(parties[0].order, 1);
  assert.equal(parties[0].status, PARTY_STATUS.INVITED);
  assert.equal(parties[0].uid, 'uid-1');
  assert.equal(parties[1].status, PARTY_STATUS.WAITING, 'everyone else waits their turn');
});

test('the creator is not added twice if they are already in the list', () => {
  const parties = buildParties({
    jurisdiction: 'GY',
    creator: CREATOR,
    parties: [{ name: 'A. Client', email: 'CLIENT@example.com' }],
  });
  assert.equal(parties.length, 1, 'case-insensitively the same person');
});

test('emails are normalised and a duplicate party is refused, not de-duplicated', () => {
  /* Silently dropping a duplicate would produce a document missing a
     signature. The same person signing twice in different capacities is a real
     scenario, but it needs its own handling. */
  assert.throws(
    () =>
      buildParties({
        jurisdiction: 'GY',
        creator: CREATOR,
        parties: [
          { name: 'B', email: 'b@example.com' },
          { name: 'B again', email: 'B@EXAMPLE.COM' },
        ],
      }),
    (error) => {
      assert.equal(error.code, 'duplicate_party');
      return true;
    },
  );
});

test('an invalid email is refused with the offending value', () => {
  for (const email of ['', 'not-an-email', 'a@b', 'a@b.c', '@example.com', 'a b@example.com']) {
    assert.throws(
      () => buildParties({ jurisdiction: 'GY', creator: CREATOR, parties: [{ email }] }),
      (error) => {
        assert.equal(error.code, 'bad_email');
        assert.equal(error.field, 'parties');
        return true;
      },
      `"${email}" should be refused`,
    );
  }
});

test('an unrecognised role is treated as a signatory, not as a witness', () => {
  /* Fails in the safe direction: only the literal string 'witness' means
     witness, so a typo or an injected value cannot create a witness party —
     and after the 19 Oct change, cannot trigger the refusal either. */
  const parties = buildParties({
    jurisdiction: 'GY',
    creator: CREATOR,
    parties: [{ email: 'b@example.com', role: 'WITNESS' }, { email: 'c@example.com', role: 'guarantor' }],
  });
  assert.equal(parties.every((p) => p.role === PARTY_ROLE.SIGNATORY), true);
});

test("the creator's own email is validated, not assumed", () => {
  /* Found by writing this test, and fixed in `lib/signing.js` on 25 Oct 2026.
     Every party the CALLER supplies was validated; the creator, whom
     `buildParties` adds itself, was not. A creator with no email produced a
     document whose party 1 was marked INVITED with nowhere to send the
     invitation — and since nobody else can sign until party 1 does, the
     document was unfinishable from the moment it was created. */
  for (const creator of [{ email: '' }, { email: null }, {}, undefined, { email: 'not-an-email' }]) {
    assert.throws(
      () => buildParties({ jurisdiction: 'GY', creator, parties: [{ email: 'b@example.com' }] }),
      (error) => {
        assert.equal(error.code, 'bad_creator_email');
        assert.equal(error.status, 422);
        return true;
      },
      `creator ${JSON.stringify(creator)} should be refused`,
    );
  }
});

test('a document still needs at least one signatory', () => {
  /* With a valid creator this cannot currently fail — the creator IS a
     signatory — but the guard is the thing that makes that true, so it is
     asserted rather than assumed. */
  const parties = buildParties({ jurisdiction: 'GY', creator: CREATOR, parties: [] });
  assert.equal(parties.length, 1);
  assert.equal(parties[0].role, PARTY_ROLE.SIGNATORY);
});

test('a new party carries no token until they are invited', () => {
  /* Tokens are minted at invitation, one at a time. Pre-minting them all would
     mean every party held a working link from the moment the document was
     created, including before their turn. */
  const parties = buildParties({
    jurisdiction: 'GY',
    creator: CREATOR,
    parties: [{ email: 'b@example.com' }],
  });
  for (const party of parties) {
    assert.equal(party.tokenHash, null);
    assert.equal(party.signedAt, null);
    assert.equal(party.declinedAt, null);
  }
});

/* --------------------------------------------------------------------- */
/* Whose turn it is                                                       */
/* --------------------------------------------------------------------- */

test('nextParty returns the lowest-ordered party who has not signed', () => {
  const parties = [
    { order: 3, status: PARTY_STATUS.WAITING },
    { order: 1, status: PARTY_STATUS.SIGNED },
    { order: 2, status: PARTY_STATUS.INVITED },
  ];
  assert.equal(nextParty(parties).order, 2, 'order, not array position');
});

test('nextParty does not mutate the list it is given', () => {
  /* It sorts internally. Sorting in place would reorder the caller's array,
     and the caller is usually about to write it back to Firestore. */
  const parties = [
    { order: 3, status: PARTY_STATUS.WAITING },
    { order: 1, status: PARTY_STATUS.INVITED },
  ];
  nextParty(parties);
  assert.equal(parties[0].order, 3, 'the caller’s array must be untouched');
});

test('a single decline stops the sequence for everyone', () => {
  /* A refusal to sign is not a gap to route around. The document stops. */
  const parties = [
    { order: 1, status: PARTY_STATUS.SIGNED },
    { order: 2, status: PARTY_STATUS.DECLINED },
    { order: 3, status: PARTY_STATUS.WAITING },
  ];
  assert.equal(nextParty(parties), null);
  assert.equal(fullyExecuted(parties), false);
});

test('a decline by a LATER party still stops an earlier one signing', () => {
  const parties = [
    { order: 1, status: PARTY_STATUS.INVITED },
    { order: 2, status: PARTY_STATUS.DECLINED },
  ];
  assert.equal(nextParty(parties), null);
});

test('nextParty is null when everyone has signed, and the document is executed', () => {
  const parties = [
    { order: 1, status: PARTY_STATUS.SIGNED },
    { order: 2, status: PARTY_STATUS.SIGNED },
  ];
  assert.equal(nextParty(parties), null);
  assert.equal(fullyExecuted(parties), true);
});

test('an empty party list is never "fully executed"', () => {
  /* Vacuous truth would mean a document with no parties counted as executed —
     which is how an unsigned document gets a seal. */
  assert.equal(fullyExecuted([]), false);
  assert.equal(nextParty([]), null);
});

/* --------------------------------------------------------------------- */
/* Tokens                                                                 */
/* --------------------------------------------------------------------- */

test('only the digest is derivable from the token, and it is stable', () => {
  const { token, tokenHash } = mintPartyToken();
  assert.equal(hashToken(token), tokenHash);
  assert.notEqual(token, tokenHash);
  assert.equal(tokenHash.length, 64, 'SHA-256 hex');
});

test('two minted tokens differ', () => {
  const a = mintPartyToken();
  const b = mintPartyToken();
  assert.notEqual(a.token, b.token);
  assert.notEqual(a.tokenHash, b.tokenHash);
});

test('tokensMatch refuses empty, mismatched-length and differing values', () => {
  const { tokenHash } = mintPartyToken();
  assert.equal(tokensMatch(tokenHash, tokenHash), true);
  assert.equal(tokensMatch(tokenHash, mintPartyToken().tokenHash), false);
  assert.equal(tokensMatch('', ''), false, 'empty must never match');
  assert.equal(tokensMatch(null, null), false);
  assert.equal(tokensMatch(undefined, undefined), false);
  assert.equal(tokensMatch(tokenHash, tokenHash.slice(0, 32)), false);
});

/* --------------------------------------------------------------------- */
/* Recording a signature                                                  */
/* --------------------------------------------------------------------- */

const documentWith = (parties, overrides = {}) => ({
  documents: {
    doc1: {
      status: 'awaiting_signature',
      jurisdiction: 'GY',
      parties,
      ...overrides,
    },
  },
});

const invitedParty = (order, token, extra = {}) => ({
  order,
  email: `p${order}@example.com`,
  name: `Party ${order}`,
  role: PARTY_ROLE.SIGNATORY,
  status: PARTY_STATUS.INVITED,
  tokenHash: hashToken(token),
  tokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
  ...extra,
});

test('a party signing in turn is recorded', async () => {
  const token = 'token-one';
  const db = createFirestore(documentWith([invitedParty(1, token)]));
  __setFirestore(db);

  const outcome = await recordSignature({
    documentId: 'doc1',
    token,
    signatureName: 'Party One',
  });

  assert.equal(outcome.complete, true, 'the only party has signed');
  const stored = db.__store.documents.doc1.parties[0];
  assert.equal(stored.status, PARTY_STATUS.SIGNED);
  assert.ok(stored.signedAt);
});

test('signing out of turn is refused and tells the party to wait', async () => {
  const second = 'token-two';
  __setFirestore(
    createFirestore(
      documentWith([
        invitedParty(1, 'token-one'),
        invitedParty(2, second, { status: PARTY_STATUS.WAITING }),
      ]),
    ),
  );

  await assert.rejects(
    () => recordSignature({ documentId: 'doc1', token: second, signatureName: 'Party Two' }),
    (error) => {
      assert.equal(error.code, 'out_of_turn');
      assert.equal(error.status, 409);
      assert.match(error.message, /not your turn/i);
      return true;
    },
  );
});

test('a spent token cannot sign again', async () => {
  const token = 'token-one';
  __setFirestore(
    createFirestore(
      documentWith([
        invitedParty(1, token, { status: PARTY_STATUS.SIGNED, signedAt: '2026-10-01T00:00:00.000Z' }),
        invitedParty(2, 'token-two', { status: PARTY_STATUS.WAITING }),
      ]),
    ),
  );

  await assert.rejects(
    () => recordSignature({ documentId: 'doc1', token, signatureName: 'Party One' }),
    (error) => {
      assert.equal(error.code, 'already_signed');
      return true;
    },
  );
});

test('an expired token is refused with 410 and told to ask for a new link', async () => {
  const token = 'token-one';
  __setFirestore(
    createFirestore(
      documentWith([
        invitedParty(1, token, {
          tokenExpiresAt: new Date(Date.now() - 1000).toISOString(),
        }),
      ]),
    ),
  );

  await assert.rejects(
    () => recordSignature({ documentId: 'doc1', token, signatureName: 'Party One' }),
    (error) => {
      assert.equal(error.code, 'expired');
      assert.equal(error.status, 410);
      assert.match(error.message, /new one/i);
      return true;
    },
  );
});

test('an unknown token is refused with the same message as a missing one', async () => {
  /* Both are "that signing link is not valid". A different message for a
     well-formed-but-unknown token would confirm which documents exist. */
  __setFirestore(createFirestore(documentWith([invitedParty(1, 'token-one')])));

  await assert.rejects(
    () => recordSignature({ documentId: 'doc1', token: 'not-a-real-token', signatureName: 'X' }),
    (error) => {
      assert.equal(error.code, 'bad_token');
      assert.equal(error.status, 403);
      assert.match(error.message, /not valid/);
      return true;
    },
  );
});

test('a revoked document cannot be signed', async () => {
  const token = 'token-one';
  __setFirestore(
    createFirestore(documentWith([invitedParty(1, token)], { status: 'revoked' })),
  );

  await assert.rejects(
    () => recordSignature({ documentId: 'doc1', token, signatureName: 'Party One' }),
    (error) => {
      assert.equal(error.code, 'revoked');
      assert.equal(error.status, 409);
      return true;
    },
  );
});

test('a party already parked as in-person-required cannot sign remotely', async () => {
  /* The dormant path, exercised against a legacy document. It must still
     refuse — this is why the status was kept. */
  const token = 'token-witness';
  __setFirestore(
    createFirestore(
      documentWith([
        invitedParty(1, 'token-one', { status: PARTY_STATUS.SIGNED }),
        invitedParty(2, token, { status: PARTY_STATUS.IN_PERSON_REQUIRED, role: PARTY_ROLE.WITNESS }),
      ]),
    ),
  );

  await assert.rejects(
    () => recordSignature({ documentId: 'doc1', token, signatureName: 'W. Witness' }),
    (error) => {
      assert.equal(error.code, 'in_person_required');
      assert.match(error.message, /presence/i);
      return true;
    },
  );
});

test('a missing token or an empty signature name is refused before any read', async () => {
  /* No Firestore installed: if these reached the database the stub would throw
     a different error and the assertion on `code` would fail. */
  for (const token of ['', null, undefined]) {
    await assert.rejects(
      () => recordSignature({ documentId: 'doc1', token, signatureName: 'X' }),
      (error) => {
        assert.equal(error.code, 'no_token');
        return true;
      },
    );
  }

  for (const signatureName of ['', '   ', null, undefined]) {
    await assert.rejects(
      () => recordSignature({ documentId: 'doc1', token: 'token-one', signatureName }),
      (error) => {
        assert.equal(error.code, 'no_name');
        assert.equal(error.field, 'signatureName');
        return true;
      },
    );
  }
});

test('a missing document is a 404', async () => {
  __setFirestore(createFirestore({ documents: {} }));
  await assert.rejects(
    () => recordSignature({ documentId: 'nope', token: 'token-one', signatureName: 'X' }),
    (error) => {
      assert.equal(error.code, 'not_found');
      assert.equal(error.status, 404);
      return true;
    },
  );
});

test('a document with a malformed parties field refuses rather than throwing', async () => {
  /* It comes from Firestore. A non-array coerces to `[]`, which means no party
     matches the token, which is a clean 403 rather than a crash. */
  for (const parties of [null, undefined, 'nonsense', 42, {}]) {
    __setFirestore(createFirestore(documentWith(parties)));
    await assert.rejects(
      () => recordSignature({ documentId: 'doc1', token: 'token-one', signatureName: 'X' }),
      (error) => {
        assert.equal(error.code, 'bad_token');
        return true;
      },
    );
  }
});
