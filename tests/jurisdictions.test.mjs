/**
 * `checkJurisdictionLockout` — the refusal that stops an instrument being
 * executed where it has no effect.
 *
 * Four server-side call sites gate on this: the client request, the notary's
 * accept, session creation and execution. If it returns `allowed: true` when
 * it should not, the platform issues a certificate saying a document was
 * properly notarised in a jurisdiction whose law gives that act no effect —
 * and nobody finds out until somebody relies on the instrument. That is why
 * this file is first and longest.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkJurisdictionLockout,
  LOCKOUT_REASON,
  REMOTE_WITNESSING_ENABLED,
  getJurisdiction,
  isDocumentCategoryExcluded,
  listLaunchJurisdictions,
  listNotarizableJurisdictions,
  recordingRequired,
  RECORDING_REQUIRED_BY_STATUTE,
  supportsNotarization,
} from '@/lib/jurisdictions';

/* --------------------------------------------------------------------- */
/* The flags themselves. These are legal positions, not configuration.    */
/* --------------------------------------------------------------------- */

test('the gates that carry criminal or statutory risk are shut', () => {
  /* Barbados attaches an INDICTABLE offence to unlicensed operation as a
     certification service provider (s.18 as amended by Act 2014-8, BBD 20,000
     / 12 months) with reverse-onus director liability under s.25, and the
     Notaries Public Act 2024 s.9(2) requires physical presence until
     regulations are made. Trinidad has no proclaimed Part V but does have the
     s.31(3) Schedule question. Both stay off without a written opinion.

     This test exists to make flipping one of these a DELIBERATE act that
     breaks a named test, rather than a one-character edit nobody reviews. */
  assert.equal(getJurisdiction('BB').launchEnabled, false, 'Barbados must stay gated');
  assert.equal(getJurisdiction('BB').notarizationEnabled, false);
  assert.equal(getJurisdiction('TT').notarizationEnabled, false, 'Trinidad notarisation stays gated');
  assert.equal(getJurisdiction('JM').launchEnabled, false, 'Jamaica stays gated');
});

test('remote witnessing is disabled in every jurisdiction', () => {
  /* A witnessing requirement is a PRESENCE requirement. None of the four Acts
     converts presence, and the Oct 2026 reading of the deeds, bills of sale,
     wills and POA statutes found two-witness and double-presence requirements
     throughout — plus, in Barbados, Parliament's own 2024 statement that
     notarial acts require physical presence until regulations say otherwise. */
  for (const code of ['GY', 'JM', 'TT', 'BB']) {
    assert.equal(REMOTE_WITNESSING_ENABLED[code], false, `${code} must not permit remote witnessing`);
  }
});

test('an unknown jurisdiction is refused, not defaulted', () => {
  for (const code of ['XX', '', null, undefined, 'gy', 'GUY']) {
    const result = checkJurisdictionLockout({
      documentJurisdiction: code,
      professionalJurisdictions: ['GY', 'XX', ''],
    });
    assert.equal(result.allowed, false, `"${code}" must be refused`);
    assert.equal(result.reason, LOCKOUT_REASON.UNKNOWN_JURISDICTION);
  }
});

/* Note the lower-case 'gy' case above: the registry is keyed on exact ISO
   codes, so a mis-cased code fails CLOSED. Worth having a test say so, because
   the opposite choice — normalising case — would be a reasonable-looking
   change that widened what the gate accepts. */

test('a jurisdiction that has not launched is refused before anything else', () => {
  const result = checkJurisdictionLockout({
    documentJurisdiction: 'BB',
    professionalJurisdictions: ['BB'],
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, LOCKOUT_REASON.JURISDICTION_NOT_LAUNCHED);
});

test('Trinidad refuses notarisation even for a Trinidadian professional', () => {
  /* The exact case a bare string comparison of the two jurisdictions would
     have allowed, and the reason this function exists rather than `===`. */
  const result = checkJurisdictionLockout({
    documentJurisdiction: 'TT',
    professionalJurisdictions: ['TT'],
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, LOCKOUT_REASON.NOTARIZATION_NOT_AVAILABLE);
  assert.match(result.message, /cannot proceed/);
  assert.match(result.message, /Chap\. 22:05/, 'the refusal must name the statute');
});

test('an excluded document category is refused in a launched, notarising jurisdiction', () => {
  for (const category of [
    'last_will_and_testament',
    'power_of_attorney',
    'interest_in_immovable_property',
    'negotiable_instrument',
    'court_document',
  ]) {
    const result = checkJurisdictionLockout({
      documentJurisdiction: 'GY',
      professionalJurisdictions: ['GY'],
      documentCategory: category,
    });
    assert.equal(result.allowed, false, `${category} must be refused in GY`);
    assert.equal(result.reason, LOCKOUT_REASON.DOCUMENT_CATEGORY_EXCLUDED);
  }
});

test('sale of chattels is refused in Guyana — Bills of Sale Act Cap. 90:12 s.8(1)(a)', () => {
  /* Added 25 Oct 2026. A bill of sale requires attestation by TWO credible
     non-party witnesses, who must then swear to the execution. The platform
     refuses witness parties outright, so this document cannot be executed here
     at all. A second, independent ground is still open: the gazetted Act may
     exclude "movable" property outright, which would put chattel transfers
     outside the Act entirely.

     This was the strongest remaining commercial item in the Guyana catalogue,
     so the exclusion is the kind of thing a later reader might "fix". The test
     is here to make them read the reason first. */
  const result = checkJurisdictionLockout({
    documentJurisdiction: 'GY',
    professionalJurisdictions: ['GY'],
    documentCategory: 'chattel_sale',
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, LOCKOUT_REASON.DOCUMENT_CATEGORY_EXCLUDED);
});

test('Trinidad excludes personal property where Guyana does not — s.6(b) is wider', () => {
  /* The same template is lawful in one launch market and not the other, which
     is the whole reason this is per-jurisdiction data rather than a global
     list. If these two ever return the same answer, someone has merged the
     schedules. */
  assert.equal(isDocumentCategoryExcluded('TT', 'chattel_sale'), true);
  assert.equal(isDocumentCategoryExcluded('TT', 'passport_application'), true, 's.6(d)');
  assert.equal(isDocumentCategoryExcluded('GY', 'passport_application'), false, 'no GY source excludes these');
});

test("Jamaica's exclusion schedule is not empty, and is not Trinidad's", () => {
  /* An empty list reads as "nothing is excluded" — exactly the bug that was
     found in Trinidad, where a launch market would have e-signed a will.
     Jamaica's First Schedule has four items and is much SHORTER than
     Trinidad's, so copying Trinidad's across would over-exclude. */
  const jm = getJurisdiction('JM').excludedDocumentCategories;
  assert.ok(jm.length > 0, 'Jamaica must not have an empty exclusion schedule');
  assert.ok(jm.includes('last_will_and_testament'), 'First Schedule item 1');
  assert.ok(jm.includes('interest_in_immovable_property'), 'item 2');
  assert.ok(jm.includes('trust_instrument'), 'item 3(a)');
  assert.ok(jm.includes('power_of_attorney'), 'item 3(b)');
  assert.ok(jm.includes('court_document'), 'item 4');
  /* Not in Jamaica's First Schedule, and must not be imported from Trinidad. */
  assert.equal(jm.includes('negotiable_instrument'), false);
  assert.equal(jm.includes('chattel_sale'), false);
  assert.equal(jm.includes('passport_application'), false);
});

test('every launch jurisdiction has a non-empty exclusion schedule', () => {
  /* The general form of the Trinidad bug. A jurisdiction open for business
     with nothing excluded will happily execute a will. */
  for (const j of listLaunchJurisdictions()) {
    assert.ok(
      j.excludedDocumentCategories.length > 0,
      `${j.code} is a launch market with an empty exclusion schedule`,
    );
  }
});

test('a professional not licensed in the jurisdiction is refused', () => {
  const result = checkJurisdictionLockout({
    documentJurisdiction: 'GY',
    professionalJurisdictions: ['TT', 'BB'],
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, LOCKOUT_REASON.PROFESSIONAL_NOT_LICENSED_HERE);
});

test('an absent or malformed professional jurisdiction list is refused', () => {
  /* The default parameter is `[]`, so omitting it must not read as "licensed
     everywhere". A caller that forgets the argument gets a refusal. */
  const omitted = checkJurisdictionLockout({ documentJurisdiction: 'GY' });
  assert.equal(omitted.allowed, false);
  assert.equal(omitted.reason, LOCKOUT_REASON.PROFESSIONAL_NOT_LICENSED_HERE);

  const empty = checkJurisdictionLockout({
    documentJurisdiction: 'GY',
    professionalJurisdictions: [],
  });
  assert.equal(empty.allowed, false);
});

test('the one allowed case is allowed', () => {
  const result = checkJurisdictionLockout({
    documentJurisdiction: 'GY',
    professionalJurisdictions: ['GY', 'TT'],
    documentCategory: 'affidavit',
  });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, LOCKOUT_REASON.OK);
  assert.match(result.message, /Guyana/);
});

test('a permitted category with no category given is still allowed', () => {
  /* `documentCategory` is optional: the accept and session gates call this
     before a template is bound. Omitting it must not refuse, and must not
     skip the other three checks either. */
  const result = checkJurisdictionLockout({
    documentJurisdiction: 'GY',
    professionalJurisdictions: ['GY'],
  });
  assert.equal(result.allowed, true);
});

test('the refusal order puts the cheapest and most informative check first', () => {
  /* A professional licensed nowhere, asking about a will, in Barbados. The
     client should be told Barbados is closed — the most fundamental reason —
     rather than being told about the will or their licence. Getting this order
     wrong produces technically-true but misleading refusals. */
  const result = checkJurisdictionLockout({
    documentJurisdiction: 'BB',
    professionalJurisdictions: [],
    documentCategory: 'last_will_and_testament',
  });
  assert.equal(result.reason, LOCKOUT_REASON.JURISDICTION_NOT_LAUNCHED);
});

test('supportsNotarization requires BOTH launch and notarisation', () => {
  /* Jamaica has a confirmed enabling provision at s.9 but is not launched.
     A helper that checked only `notarizationEnabled` would open it. */
  assert.equal(getJurisdiction('JM').notarizationEnabled, true);
  assert.equal(supportsNotarization('JM'), false, 'not launched, so not available');
  assert.equal(supportsNotarization('GY'), true);
  assert.equal(supportsNotarization('TT'), false);
  assert.equal(supportsNotarization('XX'), false);
});

test('only Guyana is currently notarizable', () => {
  assert.deepEqual(
    listNotarizableJurisdictions().map((j) => j.code),
    ['GY'],
  );
});

test("Jamaica's certificate statements cover all of s.9's limbs", () => {
  /* s.9 requires the encrypted signature PLUS a statement attesting identity
     PLUS a statement certifying performance of other legal obligations PLUS
     all other information required under any other law. Limbs (b), (c) and
     (d) have to be written onto the certificate in terms. (d) was missing
     until 25 Oct 2026. */
  const statements = getJurisdiction('JM').certificateStatements;
  assert.equal(statements.length, 3, 's.9 limbs (b), (c) and (d)');
  assert.ok(statements.some((s) => /attest/i.test(s)), 'limb (b)');
  assert.ok(statements.some((s) => /certify the performance/i.test(s)), 'limb (c)');
  assert.ok(statements.some((s) => /other information required/i.test(s)), 'limb (d)');
});

test('no Act requires a session recording', () => {
  /* Checked because the live privacy policy claims recordings are kept and
     nothing records anything. The claim has to be withdrawn, not made true —
     and `recordingRequired` must never answer true by default for a code it
     does not know. */
  for (const code of ['GY', 'JM', 'TT', 'BB']) {
    assert.equal(RECORDING_REQUIRED_BY_STATUTE[code], false);
    assert.equal(recordingRequired(code), false);
  }
  assert.equal(recordingRequired('XX'), false);
});
