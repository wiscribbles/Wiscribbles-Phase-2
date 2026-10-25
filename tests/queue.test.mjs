/**
 * `claimEntry` / `declineEntry` — the transactions that stop two notaries
 * taking the same client.
 *
 * WHAT THESE TESTS CAN AND CANNOT PROVE. The fake's `runTransaction` runs the
 * callback once against the live store, so it cannot reproduce Firestore's
 * contention retry and cannot prove that two genuinely simultaneous claims
 * serialise — only a real project can. What it does prove is the property this
 * code is responsible for: that the status is re-read INSIDE the transaction
 * and an entry already taken is refused. A guard that read the status before
 * opening the transaction, or cached it, would pass a careless test and fail
 * the second-claim test here, because the second call sees the first's write.
 *
 * The jurisdiction lockout is re-asserted inside the claim as well. That is
 * the second of its four call sites and the one that matters most, because
 * accepting a client is the point at which a professional commits to doing
 * something the law may not permit.
 */

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFirestore } from './fakes/firestore.mjs';
import { __reset, __setFirestore } from './stubs/firebase-admin.mjs';
import {
  QUEUE_COLLECTION,
  QUEUE_STATUS,
  QueueError,
  SERVICE_TYPE,
  claimEntry,
  declineEntry,
} from '@/lib/queue';
import { ROLES } from '@/lib/roles';

afterEach(() => __reset());

const NOTARY = { uid: 'notary-1', role: ROLES.NOTARY, jurisdictions: ['GY'] };
const OTHER_NOTARY = { uid: 'notary-2', role: ROLES.NOTARY, jurisdictions: ['GY'] };

const waitingEntry = (overrides = {}) => ({
  status: QUEUE_STATUS.WAITING,
  serviceType: SERVICE_TYPE.NOTARIZATION,
  jurisdiction: 'GY',
  documentCategory: 'affidavit',
  clientId: 'client-1',
  createdAt: '2026-10-25T10:00:00.000Z',
  ...overrides,
});

const seed = (entries) => {
  const db = createFirestore({ [QUEUE_COLLECTION]: entries });
  __setFirestore(db);
  return db;
};

test('a waiting entry can be claimed, and the claim is recorded', async () => {
  const db = seed({ e1: waitingEntry() });

  const { id, entry } = await claimEntry({ entryId: 'e1', professional: NOTARY });

  assert.equal(id, 'e1');
  assert.equal(entry.status, QUEUE_STATUS.ASSIGNED);
  assert.equal(entry.assignedTo, 'notary-1');

  const stored = db.__store[QUEUE_COLLECTION].e1;
  assert.equal(stored.status, QUEUE_STATUS.ASSIGNED);
  assert.equal(stored.assignedTo, 'notary-1');
  assert.equal(stored.assignedToRole, ROLES.NOTARY);
  assert.ok(stored.assignedAt, 'the time of the claim is part of the audit trail');
});

test('THE ONE THAT MATTERS: a second notary cannot claim an entry already taken', async () => {
  const db = seed({ e1: waitingEntry() });

  await claimEntry({ entryId: 'e1', professional: NOTARY });

  await assert.rejects(
    () => claimEntry({ entryId: 'e1', professional: OTHER_NOTARY }),
    (error) => {
      assert.ok(error instanceof QueueError);
      assert.equal(error.code, 'already_taken');
      assert.match(error.message, /already taken/i);
      return true;
    },
  );

  /* And the first claim is untouched — a refused second claim must not
     half-write over the first notary's assignment. */
  assert.equal(db.__store[QUEUE_COLLECTION].e1.assignedTo, 'notary-1');
});

test('the same notary cannot claim their own entry twice', async () => {
  /* A double-click, or a retried request. It must not re-stamp `assignedAt`,
     because that is the record of when the client was actually picked up. */
  const db = seed({ e1: waitingEntry() });
  await claimEntry({ entryId: 'e1', professional: NOTARY });
  const firstAssignedAt = db.__store[QUEUE_COLLECTION].e1.assignedAt;

  await assert.rejects(() => claimEntry({ entryId: 'e1', professional: NOTARY }), /already/i);
  assert.equal(db.__store[QUEUE_COLLECTION].e1.assignedAt, firstAssignedAt);
});

test('only a waiting entry is claimable — every other status is refused', async () => {
  for (const status of [
    QUEUE_STATUS.ASSIGNED,
    QUEUE_STATUS.IN_SESSION,
    QUEUE_STATUS.COMPLETED,
    QUEUE_STATUS.CANCELLED,
    QUEUE_STATUS.EXPIRED,
  ]) {
    seed({ e1: waitingEntry({ status }) });
    await assert.rejects(
      () => claimEntry({ entryId: 'e1', professional: NOTARY }),
      (error) => {
        assert.equal(error.code, 'already_taken');
        return true;
      },
      `status "${status}" must not be claimable`,
    );
  }
});

test('a withdrawn request says the client withdrew, not that someone took it', async () => {
  /* Same refusal code, different message. A notary told "another professional
     took it" when the client actually left will go looking for a colleague who
     does not exist. */
  seed({ e1: waitingEntry({ status: QUEUE_STATUS.CANCELLED }) });
  await assert.rejects(
    () => claimEntry({ entryId: 'e1', professional: NOTARY }),
    /client withdrew/i,
  );
});

test('a missing entry is a 404, not a crash', async () => {
  seed({});
  await assert.rejects(
    () => claimEntry({ entryId: 'nope', professional: NOTARY }),
    (error) => {
      assert.equal(error.code, 'not_found');
      assert.equal(error.status, 404);
      return true;
    },
  );
});

test('a Commissioner of Oaths cannot take a notarisation, and vice versa', async () => {
  /* The two roles are distinct in law and the queue must not blur them. */
  seed({ e1: waitingEntry({ serviceType: SERVICE_TYPE.NOTARIZATION }) });
  await assert.rejects(
    () => claimEntry({ entryId: 'e1', professional: { ...NOTARY, role: ROLES.COATH } }),
    (error) => {
      assert.equal(error.code, 'wrong_role');
      assert.equal(error.status, 403);
      return true;
    },
  );

  seed({ e1: waitingEntry({ serviceType: SERVICE_TYPE.COMMISSIONING }) });
  await assert.rejects(
    () => claimEntry({ entryId: 'e1', professional: NOTARY }),
    /different kind of professional/i,
  );
});

test('an attorney or a client cannot claim anything', async () => {
  for (const role of [ROLES.ATTORNEY, ROLES.BUSINESS, ROLES.USER, ROLES.ADMIN, undefined, 'nonsense']) {
    seed({ e1: waitingEntry() });
    await assert.rejects(
      () => claimEntry({ entryId: 'e1', professional: { uid: 'x', role, jurisdictions: ['GY'] } }),
      (error) => {
        assert.equal(error.code, 'wrong_role', `role "${role}" must not claim`);
        return true;
      },
    );
  }
});

test('the jurisdiction lockout is enforced inside the claim, not just at request time', async () => {
  /* A notary licensed only in Trinidad must not be able to accept a Guyanese
     client, however the entry reached the queue. */
  seed({ e1: waitingEntry({ jurisdiction: 'GY' }) });
  await assert.rejects(
    () => claimEntry({ entryId: 'e1', professional: { ...NOTARY, jurisdictions: ['TT'] } }),
    (error) => {
      assert.equal(error.code, 'jurisdiction_lockout');
      assert.equal(error.status, 403);
      assert.match(error.message, /not licensed in Guyana/);
      return true;
    },
  );
});

test('an entry for an excluded document category cannot be claimed', async () => {
  /* Defence in depth: if a will reached the queue through some other path, the
     notary still cannot pick it up. */
  seed({ e1: waitingEntry({ documentCategory: 'last_will_and_testament' }) });
  await assert.rejects(
    () => claimEntry({ entryId: 'e1', professional: NOTARY }),
    (error) => {
      assert.equal(error.code, 'jurisdiction_lockout');
      return true;
    },
  );
});

test('an entry in a jurisdiction that does not permit notarisation cannot be claimed', async () => {
  seed({ e1: waitingEntry({ jurisdiction: 'TT' }) });
  await assert.rejects(
    () => claimEntry({ entryId: 'e1', professional: { ...NOTARY, jurisdictions: ['TT'] } }),
    (error) => {
      assert.equal(error.code, 'jurisdiction_lockout');
      return true;
    },
  );
});

test('a professional with no recorded jurisdictions claims nothing', async () => {
  /* The default is `[]`, so a partner whose jurisdictions were never captured
     fails closed rather than being treated as licensed everywhere. */
  for (const jurisdictions of [undefined, null, []]) {
    seed({ e1: waitingEntry() });
    await assert.rejects(
      () => claimEntry({ entryId: 'e1', professional: { uid: 'n', role: ROLES.NOTARY, jurisdictions } }),
      (error) => {
        assert.equal(error.code, 'jurisdiction_lockout');
        return true;
      },
    );
  }
});

/* --------------------------------------------------------------------- */
/* Declining                                                              */
/* --------------------------------------------------------------------- */

test('declining a waiting entry records who declined it', async () => {
  const db = seed({ e1: waitingEntry() });
  await declineEntry({ entryId: 'e1', professional: NOTARY, reason: 'Out of my area' });

  const stored = db.__store[QUEUE_COLLECTION].e1;
  assert.ok(stored.declinedBy.includes('notary-1'));
});

test('declining twice is harmless and does not duplicate the record', async () => {
  /* Idempotent by design: the early return on an existing decline. A second
     decline that appended again would make the list useless for "who has
     already seen this". */
  const db = seed({ e1: waitingEntry() });
  await declineEntry({ entryId: 'e1', professional: NOTARY });
  await declineEntry({ entryId: 'e1', professional: NOTARY });

  const declined = db.__store[QUEUE_COLLECTION].e1.declinedBy;
  assert.equal(declined.filter((uid) => uid === 'notary-1').length, 1);
});

test('a notary withdrawing from their OWN claim releases it back to waiting', async () => {
  /* The distinction that makes the queue work: declining someone else's
     assignment is not allowed, but withdrawing from your own must release the
     client rather than stranding them. */
  const db = seed({ e1: waitingEntry() });
  await claimEntry({ entryId: 'e1', professional: NOTARY });
  await declineEntry({ entryId: 'e1', professional: NOTARY });

  const stored = db.__store[QUEUE_COLLECTION].e1;
  assert.equal(stored.status, QUEUE_STATUS.WAITING, 'the client must go back in the queue');
  assert.equal(stored.assignedTo, null);
  assert.equal(stored.assignedToRole, null);
  assert.equal(stored.assignedAt, null);
  assert.ok(stored.declinedBy.includes('notary-1'), 'and must not be offered to them again');
});

test('a released entry can then be claimed by somebody else', async () => {
  /* The whole point of releasing it. */
  const db = seed({ e1: waitingEntry() });
  await claimEntry({ entryId: 'e1', professional: NOTARY });
  await declineEntry({ entryId: 'e1', professional: NOTARY });
  await claimEntry({ entryId: 'e1', professional: OTHER_NOTARY });

  assert.equal(db.__store[QUEUE_COLLECTION].e1.assignedTo, 'notary-2');
});

test("a notary cannot decline an entry assigned to someone else", async () => {
  seed({ e1: waitingEntry() });
  await claimEntry({ entryId: 'e1', professional: NOTARY });
  await assert.rejects(
    () => declineEntry({ entryId: 'e1', professional: OTHER_NOTARY }),
    (error) => {
      assert.equal(error.code, 'not_claimable');
      return true;
    },
  );
});

test('declining a missing entry is a 404', async () => {
  seed({});
  await assert.rejects(
    () => declineEntry({ entryId: 'nope', professional: NOTARY }),
    (error) => {
      assert.equal(error.code, 'not_found');
      assert.equal(error.status, 404);
      return true;
    },
  );
});

test('a malformed declinedBy field does not throw', async () => {
  /* It comes from Firestore and could be anything; the code coerces a
     non-array to `[]`. Without that, one bad document would make the entry
     permanently undeclinable. */
  for (const declinedBy of [null, undefined, 'notary-1', 42, {}]) {
    const db = seed({ e1: waitingEntry({ declinedBy }) });
    await declineEntry({ entryId: 'e1', professional: NOTARY });
    assert.ok(Array.isArray(db.__store[QUEUE_COLLECTION].e1.declinedBy));
  }
});
