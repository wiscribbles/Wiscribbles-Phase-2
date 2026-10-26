/**
 * Certificate expiry — access that ends when the commission does.
 *
 * Guyana Public Notaries Act Cap. 4:02 s.7 makes it an offence to perform
 * notarial acts for reward while off the Registrar's register; Barbados
 * Notaries Public Act 2024 s.16 is to the same effect for a suspended or
 * revoked notary. So the thing these tests protect is not a stale field but
 * whether the platform puts work in front of somebody who commits an offence
 * by doing it.
 *
 * Three properties matter more than the rest:
 *
 *   1. The day boundary. A certificate expiring on 1 March is valid THROUGH
 *      1 March. Cutting an officer off at midnight at the START of that day
 *      would be a day early, every time.
 *   2. An approved officer with NO date recorded is NOT treated as expired.
 *      That is deliberate and counter-intuitive: officers approved before the
 *      field existed have no date, and failing them closed on deploy would be
 *      an outage caused by a safety feature. New approvals cannot omit it.
 *   3. `expireOnLapse` FAILS CLOSED, unlike the suspension lapse it mirrors.
 *      A write that cannot be made must still withdraw access for this
 *      request.
 */

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFirestore } from './fakes/firestore.mjs';
import { __reset, __setFirestore } from './stubs/firebase-admin.mjs';
import {
  CREDENTIAL_REQUIRED_ROLES,
  credentialHasExpired,
  describeCredential,
  expireOnLapse,
  expiryInstant,
  requiresCredentialExpiry,
  validateCredentialExpiry,
} from '../lib/admin/credentials.js';

afterEach(() => __reset());

const DAY = 86400000;
const NOW = Date.parse('2026-10-26T12:00:00.000Z');

const approvedNotary = (extra = {}) => ({
  status: 'approved',
  role: 'notary',
  email: 'notary@example.com',
  ...extra,
});

/* ----------------------------------------------------- which roles bind -- */

test('only notaries and commissioners of oaths require an expiry', () => {
  assert.deepEqual([...CREDENTIAL_REQUIRED_ROLES].sort(), ['coath', 'notary']);
  assert.equal(requiresCredentialExpiry('notary'), true);
  assert.equal(requiresCredentialExpiry('coath'), true);
  /* Attorneys and businesses are subscribers here, not officers acting under
     a commission. An expiry is accepted for them but never demanded. */
  assert.equal(requiresCredentialExpiry('attorney'), false);
  assert.equal(requiresCredentialExpiry('business'), false);
  assert.equal(requiresCredentialExpiry('client'), false);
  assert.equal(requiresCredentialExpiry(undefined), false);
});

/* --------------------------------------------------- the day boundary ---- */

test('a bare date is valid through the end of that day, not its start', () => {
  const at = expiryInstant('2026-03-01');
  assert.equal(new Date(at).toISOString(), '2026-03-01T23:59:59.999Z');

  /* The whole point: somebody whose certificate says 1 March can still work
     during 1 March. */
  assert.equal(
    credentialHasExpired(
      approvedNotary({ credentialExpiresAt: '2026-03-01' }),
      Date.parse('2026-03-01T09:00:00.000Z'),
    ),
    false,
    'still valid during the stated day',
  );

  assert.equal(
    credentialHasExpired(
      approvedNotary({ credentialExpiresAt: '2026-03-01' }),
      Date.parse('2026-03-02T00:00:01.000Z'),
    ),
    true,
    'expired the following day',
  );
});

test('a full timestamp is honoured as given', () => {
  assert.equal(
    expiryInstant('2026-03-01T08:30:00.000Z'),
    Date.parse('2026-03-01T08:30:00.000Z'),
  );
});

test('a missing or unparseable date yields NaN rather than 0', () => {
  /* `Date.parse('')` is NaN but a sloppy `new Date(undefined).getTime()` path
     could produce 0, which is 1970 — i.e. "expired", for everybody. */
  for (const value of ['', null, undefined, 'soon', 'not-a-date']) {
    assert.ok(Number.isNaN(expiryInstant(value)), `NaN for ${JSON.stringify(value)}`);
  }
});

/* ----------------------------------------------------------- validation -- */

test('an officer cannot be approved without a date', () => {
  for (const value of ['', '   ', null, undefined]) {
    const result = validateCredentialExpiry(value, { role: 'notary', now: NOW });
    assert.equal(result.valid, false);
    assert.match(result.error, /cannot be approved without one/i);
  }
});

test('a non-officer may be approved without a date', () => {
  const result = validateCredentialExpiry('', { role: 'attorney', now: NOW });
  assert.equal(result.valid, true);
  assert.equal(result.value, null);
});

test('a date already past is refused', () => {
  const result = validateCredentialExpiry('2026-10-01', { role: 'notary', now: NOW });
  assert.equal(result.valid, false);
  assert.match(result.error, /already passed/i);
});

test('today is still acceptable, because it is valid through today', () => {
  const result = validateCredentialExpiry('2026-10-26', { role: 'notary', now: NOW });
  assert.equal(result.valid, true, 'end of today is in the future at noon');
});

test('an implausibly distant date is refused as a typo', () => {
  const result = validateCredentialExpiry('2099-01-01', { role: 'notary', now: NOW });
  assert.equal(result.valid, false);
  assert.match(result.error, /more than 10 years/i);
});

test('a malformed date is refused with something a person can act on', () => {
  const result = validateCredentialExpiry('next March', { role: 'notary', now: NOW });
  assert.equal(result.valid, false);
  assert.match(result.error, /YYYY-MM-DD/);
});

test('the stored value is the date as given, not a derived instant', () => {
  /* So that changing the end-of-day rule later does not require rewriting
     every stored value. */
  const result = validateCredentialExpiry('2027-06-30', { role: 'notary', now: NOW });
  assert.equal(result.value, '2027-06-30');
});

/* ------------------------------------------------------------- expiry ---- */

test('only an approved account can expire', () => {
  for (const status of ['pending_review', 'rejected', 'removed', 'suspended', 'more_info_requested']) {
    assert.equal(
      credentialHasExpired(
        approvedNotary({ status, credentialExpiresAt: '2020-01-01' }),
        NOW,
      ),
      false,
      `${status} is not let through on a certificate, so there is nothing to withdraw`,
    );
  }
});

test('an approved officer with no date recorded is NOT treated as expired', () => {
  /* Counter-intuitive and deliberate — see the header. Officers approved
     before the field existed would otherwise all be locked out on deploy. */
  assert.equal(credentialHasExpired(approvedNotary(), NOW), false);
  assert.equal(describeCredential(approvedNotary(), NOW).state, 'missing');
});

test('a non-officer never expires even with a past date', () => {
  assert.equal(
    credentialHasExpired(
      { status: 'approved', role: 'attorney', credentialExpiresAt: '2020-01-01' },
      NOW,
    ),
    false,
  );
});

test('an expired certificate sets the account back to pending, not suspended', async () => {
  const db = createFirestore({
    users: { 'n1': approvedNotary({ credentialExpiresAt: '2026-01-01' }) },
  });
  __setFirestore(db);

  const status = await expireOnLapse('n1', approvedNotary({ credentialExpiresAt: '2026-01-01' }), NOW);

  /* `more_info_requested`, because the officer has done nothing wrong — their
     term ended — and because that status reopens the upload fields, which is
     exactly the route back. */
  assert.equal(status, 'more_info_requested');

  const stored = db.__store.users.n1;
  assert.equal(stored.status, 'more_info_requested');
  assert.ok(stored.credentialExpiredAt, 'the withdrawal is dated');
  assert.match(stored.adminFeedback, /upload a current certificate/i);
});

test('the audit entry names no actor, because nobody did it', async () => {
  const db = createFirestore({
    users: { 'n1': approvedNotary({ credentialExpiresAt: '2026-01-01' }) },
  });
  __setFirestore(db);

  await expireOnLapse('n1', approvedNotary({ credentialExpiresAt: '2026-01-01' }), NOW);

  const entries = Object.values(db.__store.auditLog ?? {});
  assert.equal(entries.length, 1);
  assert.equal(entries[0].type, 'credential_expired');
  assert.equal(entries[0].actorUid, null);
  assert.equal(entries[0].actorEmail, 'system');
  assert.equal(entries[0].credentialExpiresAt, '2026-01-01');
});

test('a still-valid certificate is left completely alone', async () => {
  const profile = approvedNotary({ credentialExpiresAt: '2027-01-01' });
  const db = createFirestore({ users: { n1: profile } });
  __setFirestore(db);

  const status = await expireOnLapse('n1', profile, NOW);

  assert.equal(status, 'approved');
  assert.equal(db.__writes.length, 0, 'the common path writes nothing at all');
});

/* ----------------------------------------------------------- describe ---- */

test('describeCredential warns before expiry, not only after', () => {
  const soon = new Date(NOW + 10 * DAY).toISOString().slice(0, 10);
  const described = describeCredential(approvedNotary({ credentialExpiresAt: soon }), NOW);

  assert.equal(described.state, 'expiring');
  assert.equal(described.daysRemaining, 10);
  assert.match(described.label, /Expires in 10 days/);
});

test('describeCredential returns null for a role that needs no certificate', () => {
  assert.equal(describeCredential({ status: 'approved', role: 'business' }, NOW), null);
});

test('describeCredential reports an expired certificate as expired', () => {
  const described = describeCredential(
    approvedNotary({ credentialExpiresAt: '2026-01-01' }),
    NOW,
  );
  assert.equal(described.state, 'expired');
  assert.match(described.label, /access ends/i);
});

test('a failed claims write still withdraws access — fails CLOSED', async () => {
  /* The opposite direction from `restoreOnLapse`, deliberately. A lapsed
     suspension that cannot be written leaves the account suspended for one
     more request, which is safe. An expired certificate that cannot be
     written must NOT leave the officer working, because every act they
     perform is an offence under Cap. 4:02 s.7. */
  const { __failClaims, __resetClaims } = await import('./stubs/auth-claims.mjs');
  __failClaims(true);

  const profile = approvedNotary({ credentialExpiresAt: '2026-01-01' });
  __setFirestore(createFirestore({ users: { n1: profile } }));

  const status = await expireOnLapse('n1', profile, NOW);

  assert.equal(
    status,
    'more_info_requested',
    'reported as withdrawn even though nothing could be written',
  );

  __resetClaims();
});

test('the claim is written before the document, because the claim is what bites', async () => {
  const { __claimCalls, __revokeCalls, __resetClaims } = await import('./stubs/auth-claims.mjs');
  __resetClaims();

  const profile = approvedNotary({ credentialExpiresAt: '2026-01-01' });
  __setFirestore(createFirestore({ users: { n1: profile } }));

  await expireOnLapse('n1', profile, NOW);

  const calls = __claimCalls();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].uid, 'n1');
  assert.equal(calls[0].claims.status, 'more_info_requested');
  assert.equal(calls[0].claims.role, 'notary');

  /* Claims live in the token for up to an hour, so without a revoke an
     expired officer keeps working until it refreshes — which is the entire
     window this is meant to close. */
  assert.deepEqual(__revokeCalls(), ['n1']);

  __resetClaims();
});
