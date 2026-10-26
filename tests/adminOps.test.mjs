/**
 * The admin writes that were dead on arrival.
 *
 * Five admin actions used to write to Firestore straight from the browser,
 * against collections `firestore.rules` denies. Every one of them failed, the
 * pages logged the error, and the Website Manager saw a button that did
 * nothing. They now go through server routes, and these tests cover the two
 * modules behind them.
 *
 * What is actually being protected here is not "the write works" but the two
 * properties that made moving the write worthwhile:
 *
 *   1. THE UPDATE IS AN ALLOW-LIST, NOT A SPREAD. The old client code did
 *      `updateDoc(ref, { ...updates })` with `updates` from the browser. On a
 *      route running with Admin credentials — which is not subject to the
 *      security rules at all — that pattern writes whatever keys arrive. A
 *      test that only checked the happy path would pass against it.
 *   2. AUTOMATIC APPROVAL IS REFUSED. Approval is where a professional is
 *      checked against the register of notaries, and in Guyana performing
 *      notarial acts for reward while off that register is an offence
 *      (Cap. 4:02 s.7). A switch that skips it should not be settable.
 */

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFirestore } from './fakes/firestore.mjs';
import { __reset, __setFirestore } from './stubs/firebase-admin.mjs';
import {
  SUBMISSION_STATUS,
  SubmissionError,
  updateSubmissionStatus,
} from '../lib/admin/submissions.js';
import {
  OPERATIONAL_SETTING_DEFAULTS,
  SettingsError,
  getOperationalSettings,
  setOperationalSettings,
} from '../lib/settings.js';

afterEach(() => __reset());

const ACTOR = { uid: 'admin-1', email: 'manager@wiscribbles.com' };

const seedSubmission = (data = {}) =>
  createFirestore({
    formSubmissions: {
      sub1: { type: 'notary', status: 'pending', ...data },
    },
  });

/* ------------------------------------------------- submission status ----- */

test('a status change writes status and workflowStage together', async () => {
  const db = seedSubmission();
  __setFirestore(db);

  const result = await updateSubmissionStatus({
    submissionId: 'sub1',
    status: SUBMISSION_STATUS.ASSIGNED,
    actor: ACTOR,
  });

  const stored = db.__store.formSubmissions.sub1;
  assert.equal(stored.status, 'assigned');
  /* The two drifting apart is how a job shows as assigned in one column and
     pending in another. The server sets both; the browser sets neither. */
  assert.equal(stored.workflowStage, 'assigned');
  assert.ok(stored.lastUpdatedAt);
  assert.deepEqual(stored.lastUpdatedBy, { uid: ACTOR.uid, email: ACTOR.email });
  assert.equal(result.previous, 'pending');
});

test('the audit entry records both ends of the transition', async () => {
  const db = seedSubmission({ status: 'in_progress' });
  __setFirestore(db);

  await updateSubmissionStatus({
    submissionId: 'sub1',
    status: SUBMISSION_STATUS.PENDING,
    actor: ACTOR,
  });

  const entries = Object.values(db.__store.auditLog ?? {});
  assert.equal(entries.length, 1);
  /* A trail that records only the new value cannot answer "who moved this
     back to pending". */
  assert.equal(entries[0].from, 'in_progress');
  assert.equal(entries[0].to, 'pending');
  assert.equal(entries[0].actorUid, ACTOR.uid);
});

test('pending is a settable status, so the workflow is not one-way', async () => {
  /* Without it a mis-click is unrecoverable: a job assigned by accident could
     never be returned to the queue. */
  __setFirestore(seedSubmission({ status: 'assigned' }));
  await assert.doesNotReject(() =>
    updateSubmissionStatus({ submissionId: 'sub1', status: 'pending', actor: ACTOR }),
  );
});

test('an unrecognised status is refused and nothing is written', async () => {
  const db = seedSubmission();
  __setFirestore(db);

  for (const status of ['notarised', 'APPROVED', 'deleted', '', null, undefined, 'admin']) {
    await assert.rejects(
      () => updateSubmissionStatus({ submissionId: 'sub1', status, actor: ACTOR }),
      (error) => {
        assert.ok(error instanceof SubmissionError);
        assert.equal(error.code, 'unknown_status');
        return true;
      },
      `expected refusal for status=${JSON.stringify(status)}`,
    );
  }

  assert.equal(db.__store.formSubmissions.sub1.status, 'pending', 'untouched');
  assert.equal(db.__store.auditLog, undefined, 'no audit entry for a refusal');
});

test('"notarised" is refused even though "notarized" is valid', async () => {
  /* The collection is Phase 1 and spells it with a z. Accepting both would
     put two values in the same field for the same state, and every filter
     downstream would have to know. */
  __setFirestore(seedSubmission());
  await assert.rejects(
    () => updateSubmissionStatus({ submissionId: 'sub1', status: 'notarised', actor: ACTOR }),
    (error) => error.code === 'unknown_status',
  );
  await assert.doesNotReject(() =>
    updateSubmissionStatus({ submissionId: 'sub1', status: 'notarized', actor: ACTOR }),
  );
});

test('a missing submission is a 404, and a missing id a 400', async () => {
  __setFirestore(seedSubmission());

  await assert.rejects(
    () => updateSubmissionStatus({ submissionId: 'nope', status: 'assigned', actor: ACTOR }),
    (error) => {
      assert.equal(error.code, 'not_found');
      assert.equal(error.status, 404);
      return true;
    },
  );

  for (const id of ['', '   ', null, undefined]) {
    await assert.rejects(
      () => updateSubmissionStatus({ submissionId: id, status: 'assigned', actor: ACTOR }),
      (error) => {
        assert.equal(error.code, 'missing_id');
        assert.equal(error.status, 400);
        return true;
      },
    );
  }
});

/* ----------------------------------------------- operational settings ---- */

test('unset settings read back as the documented defaults, never undefined', async () => {
  __setFirestore(createFirestore({}));
  const settings = await getOperationalSettings();

  for (const [key, value] of Object.entries(OPERATIONAL_SETTING_DEFAULTS)) {
    assert.equal(settings[key], value, `${key} falls back to its default`);
  }
  assert.equal(settings.updatedAt, null);
});

test('a document written before a setting existed still reads the default', async () => {
  /* Otherwise the field arrives as `undefined`, renders as an unchecked box,
     and the next save writes a value nobody chose. */
  __setFirestore(
    createFirestore({ adminSettings: { global: { autoAssignNotaries: true } } }),
  );

  const settings = await getOperationalSettings();
  assert.equal(settings.autoAssignNotaries, true, 'the stored value wins');
  assert.equal(
    settings.notifyOnLargePayments,
    OPERATIONAL_SETTING_DEFAULTS.notifyOnLargePayments,
    'the absent value falls back',
  );
});

test('automatic approval of attorneys is refused, and the refusal says why', async () => {
  __setFirestore(createFirestore({}));

  await assert.rejects(
    () => setOperationalSettings({ autoApproveAttorneys: true }, ACTOR),
    (error) => {
      assert.ok(error instanceof SettingsError);
      assert.equal(error.code, 'auto_approval_refused');
      /* The reason has to be in the message: this is the one refusal a
         Website Manager will want to argue with. */
      assert.match(error.message, /register/i);
      return true;
    },
  );
});

test('turning automatic approval off is allowed', async () => {
  /* The page must be able to write the safe value, and to correct a document
     that somehow holds the unsafe one. */
  const db = createFirestore({ adminSettings: { global: { autoApproveAttorneys: true } } });
  __setFirestore(db);

  const saved = await setOperationalSettings({ autoApproveAttorneys: false }, ACTOR);
  assert.equal(saved.autoApproveAttorneys, false);
});

test('unknown keys are ignored rather than written', async () => {
  const db = createFirestore({});
  __setFirestore(db);

  await setOperationalSettings(
    {
      autoAssignNotaries: true,
      /* The whole point of an allow-list. A delete-list leaks the moment
         somebody adds a field, and this route runs with Admin credentials. */
      role: 'admin',
      status: 'approved',
      isStaff: true,
      planAllowances: { pro: -1 },
    },
    ACTOR,
  );

  const stored = db.__store.adminSettings.global;
  assert.equal(stored.autoAssignNotaries, true);
  for (const key of ['role', 'status', 'isStaff', 'planAllowances']) {
    assert.equal(stored[key], undefined, `${key} was not written`);
  }
});

test('a payload with nothing recognisable is refused', async () => {
  __setFirestore(createFirestore({}));

  for (const body of [{}, { nonsense: 1 }, { role: 'admin' }]) {
    await assert.rejects(
      () => setOperationalSettings(body, ACTOR),
      (error) => {
        assert.equal(error.code, 'nothing_to_save');
        return true;
      },
      `expected refusal for ${JSON.stringify(body)}`,
    );
  }

  for (const body of [null, undefined, [], 'settings']) {
    await assert.rejects(
      () => setOperationalSettings(body, ACTOR),
      (error) => {
        assert.equal(error.code, 'invalid_body');
        return true;
      },
      `expected refusal for ${JSON.stringify(body)}`,
    );
  }
});

test('booleans must be booleans', async () => {
  __setFirestore(createFirestore({}));

  for (const value of ['true', 1, 0, 'on', null]) {
    await assert.rejects(
      () => setOperationalSettings({ autoAssignNotaries: value }, ACTOR),
      (error) => {
        assert.equal(error.code, 'not_a_boolean');
        assert.equal(error.field, 'autoAssignNotaries');
        return true;
      },
      `expected refusal for ${JSON.stringify(value)}`,
    );
  }
});

test('the payment threshold is bounded, and accepts a numeric string', async () => {
  const db = createFirestore({});
  __setFirestore(db);

  for (const bad of [-1, 1_000_001, 1.5, 'lots', NaN]) {
    await assert.rejects(
      () => setOperationalSettings({ largePaymentThreshold: bad }, ACTOR),
      (error) => {
        assert.equal(error.code, 'bad_threshold');
        return true;
      },
      `expected refusal for ${JSON.stringify(bad)}`,
    );
  }

  /* A form sends a string. Refusing it would make the field unusable. */
  const saved = await setOperationalSettings({ largePaymentThreshold: '2500' }, ACTOR);
  assert.equal(saved.largePaymentThreshold, 2500);

  const zero = await setOperationalSettings({ largePaymentThreshold: 0 }, ACTOR);
  assert.equal(zero.largePaymentThreshold, 0, 'zero means alert on everything, not unset');
});

test('the payout currency is an allow-list and is case-insensitive', async () => {
  __setFirestore(createFirestore({}));

  const saved = await setOperationalSettings({ defaultPayoutCurrency: 'gyd' }, ACTOR);
  assert.equal(saved.defaultPayoutCurrency, 'GYD');

  for (const bad of ['EUR', 'XYZ', '', 'US']) {
    await assert.rejects(
      () => setOperationalSettings({ defaultPayoutCurrency: bad }, ACTOR),
      (error) => {
        assert.equal(error.code, 'bad_currency');
        return true;
      },
      `expected refusal for ${JSON.stringify(bad)}`,
    );
  }
});

test('the audit entry records the values, not just which fields changed', async () => {
  const db = createFirestore({});
  __setFirestore(db);

  await setOperationalSettings({ largePaymentThreshold: 50_000 }, ACTOR);

  const entries = Object.values(db.__store.auditLog ?? {});
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0].changed, ['largePaymentThreshold']);
  /* "Someone changed the payout threshold" is not an audit trail. */
  assert.equal(entries[0].values.largePaymentThreshold, 50_000);
  assert.equal(entries[0].actorEmail, ACTOR.email);
});
