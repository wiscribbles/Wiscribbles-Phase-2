/**
 * `assertPurgeable` — the guard that stops evidence being destroyed.
 *
 * A signed, notarised, revoked or awaiting-notarisation document is evidence
 * that parties OTHER than the account holder may need, possibly years later.
 * Storage pressure is never a reason to destroy one. This function throws
 * rather than returning false, and rather than skipping, so a caller cannot
 * ignore it by forgetting to check a return value.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PERMANENT_STATUSES,
  PURGEABLE_STATUSES,
  PURGE_GRACE_DAYS,
  RetentionError,
  assertPurgeable,
  deadlineFrom,
  readyToPurge,
  validateSigningWindow,
  windowHasClosed,
} from '@/lib/retention';

const DAY = 86400000;

test('every permanent status throws, individually', () => {
  /* Iterated over the exported list rather than hard-coded, so adding a
     permanent status without thinking about purging cannot pass silently. */
  for (const status of PERMANENT_STATUSES) {
    assert.throws(
      () => assertPurgeable({ status }),
      (error) => {
        assert.ok(error instanceof RetentionError);
        assert.equal(error.code, 'permanent_document');
        return true;
      },
      `status "${status}" must never be purgeable`,
    );
  }
});

test('the statuses that matter most are actually in the permanent list', () => {
  /* The list is the guard. If someone removes an entry, the loop above still
     passes while the document becomes destroyable — so the membership is
     asserted directly. */
  for (const status of ['signed', 'notarised', 'revoked', 'awaiting_notarisation']) {
    assert.ok(PERMANENT_STATUSES.includes(status), `${status} must be permanent`);
  }
});

test('a document awaiting in-person witnessing is still permanent', () => {
  /* The witness option came out of the UI on 19 Oct 2026, so nothing NEW can
     reach this status. Documents already in it must stay readable and must
     never be purged — which is exactly why the status was kept rather than
     deleted along with the UI. */
  assert.ok(PERMANENT_STATUSES.includes('awaiting_in_person_witnessing'));
  assert.throws(
    () => assertPurgeable({ status: 'awaiting_in_person_witnessing' }),
    /permanent|Refusing/i,
  );
});

test('a stamped file throws even when the status says it is purgeable', () => {
  /* Belt and braces. A stamped path means a seal was applied, whatever the
     status field happens to say — and a status field can be wrong, whereas the
     presence of sealed bytes cannot. */
  assert.throws(
    () => assertPurgeable({ status: 'draft', stampedPath: 'stamps/abc.pdf' }),
    (error) => {
      assert.equal(error.code, 'sealed_document');
      return true;
    },
  );
});

test('a seal beats the status for every purgeable status', () => {
  for (const status of PURGEABLE_STATUSES) {
    assert.throws(
      () => assertPurgeable({ status, stampedPath: 'stamps/x.pdf' }),
      /seal/i,
      `a sealed document with status "${status}" must not be purgeable`,
    );
  }
});

test('an unrecognised status throws rather than defaulting either way', () => {
  /* The important one. A status nobody has classified must not be treated as
     purgeable by default — that is how a new workflow state becomes a data
     loss bug. It also must not be silently treated as permanent, because then
     nobody notices the gap. It throws, naming both lists. */
  for (const status of ['awaiting_payment', 'in_session', '', null, undefined, 'SIGNED']) {
    assert.throws(
      () => assertPurgeable({ status }),
      (error) => {
        assert.equal(error.code, 'unknown_status', `"${status}" should be unknown_status`);
        assert.match(error.message, /PURGEABLE_STATUSES|PERMANENT_STATUSES/);
        return true;
      },
      `unclassified status "${status}" must throw`,
    );
  }
});

test('an absent document throws', () => {
  for (const document of [null, undefined, {}]) {
    assert.throws(() => assertPurgeable(document));
  }
});

test('the four genuinely purgeable statuses pass', () => {
  /* The other side: if this threw for everything the guard would be useless,
     and unsigned drafts would accumulate forever. */
  for (const status of PURGEABLE_STATUSES) {
    assert.equal(assertPurgeable({ status }), true, `${status} should be purgeable`);
  }
});

test('the two status lists do not overlap', () => {
  /* An overlap would make the outcome depend on check order. */
  for (const status of PURGEABLE_STATUSES) {
    assert.equal(PERMANENT_STATUSES.includes(status), false, `${status} is in both lists`);
  }
});

test('a permanent document never has its window treated as closed', () => {
  /* The upstream protection: an executed document with a long-past deadline
     must not even enter the purge path. */
  const past = new Date(Date.now() - 400 * DAY).toISOString();
  for (const status of PERMANENT_STATUSES) {
    assert.equal(windowHasClosed({ status, signingDeadline: past }), false, status);
    assert.equal(readyToPurge({ status, signingDeadline: past }), false, status);
  }
});

test('an expired draft is only purgeable after the grace period', () => {
  /* Not zero deliberately: a document vanishing at 00:00 on the deadline gives
     someone signing at 23:59 a broken link and no explanation. */
  const now = Date.now();
  const justClosed = { status: 'awaiting_signature', signingDeadline: new Date(now - DAY).toISOString() };
  assert.equal(windowHasClosed(justClosed, now), true);
  assert.equal(readyToPurge(justClosed, now), false, 'still inside the grace period');

  const wellPast = {
    status: 'awaiting_signature',
    signingDeadline: new Date(now - (PURGE_GRACE_DAYS + 2) * DAY).toISOString(),
  };
  assert.equal(readyToPurge(wellPast, now), true);
});

test('a missing or unparseable deadline does not close the window', () => {
  /* Fails safe: a corrupt date must not read as "expired long ago" and make a
     live document purgeable. */
  const now = Date.now();
  for (const signingDeadline of [undefined, null, '', 'not-a-date', 'yesterday']) {
    assert.equal(
      windowHasClosed({ status: 'awaiting_signature', signingDeadline }, now),
      false,
      `deadline "${signingDeadline}" must not close the window`,
    );
  }
});

test('the signing window is validated against its documented bounds', () => {
  assert.equal(validateSigningWindow(14).valid, true);
  assert.equal(validateSigningWindow(1).valid, true);
  assert.equal(validateSigningWindow(90).valid, true);
  for (const bad of [0, -1, 91, 1.5, 'fortnight', Infinity]) {
    assert.equal(validateSigningWindow(bad).valid, false, `${bad} should be rejected`);
  }
  /* Undefined takes the default rather than failing — the field is optional. */
  assert.equal(validateSigningWindow(undefined).valid, true);
});

test('deadlineFrom returns an ISO string the right distance out', () => {
  const now = Date.UTC(2026, 0, 1);
  assert.equal(deadlineFrom(14, now), new Date(now + 14 * DAY).toISOString());
});
