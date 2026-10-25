/**
 * `resolveTemplateAllowance` — three layers where the SAME value means three
 * different things.
 *
 * `null`/`undefined` mean "not set, fall through". `0` means "no templates".
 * `-1` means "unlimited". So the layer checks must test for null explicitly;
 * a `!value` or `value || fallback` would treat a deliberate `0` as unset and
 * silently hand an account its plan default instead of the nil the Website
 * Manager chose — and would treat `-1` as merely truthy.
 *
 * `assertNotCharged` is in here too: notaries and Commissioners of Oaths are
 * never charged, they are paid from the service fee.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAN_IDS, assertNotCharged, getPlan, resolveTemplateAllowance } from '@/lib/plans';
import { ROLES } from '@/lib/roles';

test('with nothing set, the plan default applies', () => {
  const result = resolveTemplateAllowance({ planId: PLAN_IDS.SOLO });
  assert.equal(result.allowance, getPlan(PLAN_IDS.SOLO).documentTemplateAllowance);
  assert.equal(result.source, 'plan-default');
  assert.equal(result.unlimited, false);
});

test('an account override of 0 means NO templates and must not fall through', () => {
  /* The headline case. `0` is falsy, so any falsiness check here would hand
     this account the Solo plan's five templates instead of none. */
  const result = resolveTemplateAllowance({
    planId: PLAN_IDS.SOLO,
    accountOverride: 0,
  });
  assert.equal(result.allowance, 0);
  assert.equal(result.source, 'account', 'a zero override must WIN, not fall through');
  assert.equal(result.unlimited, false);
});

test('a plan override of 0 means NO templates and must not fall through', () => {
  const result = resolveTemplateAllowance({
    planId: PLAN_IDS.SOLO,
    settings: { planAllowances: { [PLAN_IDS.SOLO]: 0 } },
  });
  assert.equal(result.allowance, 0);
  assert.equal(result.source, 'plan-override');
});

test('-1 means unlimited, at both override layers', () => {
  const account = resolveTemplateAllowance({ planId: PLAN_IDS.SOLO, accountOverride: -1 });
  assert.equal(account.unlimited, true);
  assert.equal(account.allowance, -1);
  assert.equal(account.source, 'account');

  const plan = resolveTemplateAllowance({
    planId: PLAN_IDS.SOLO,
    settings: { planAllowances: { [PLAN_IDS.SOLO]: -1 } },
  });
  assert.equal(plan.unlimited, true);
  assert.equal(plan.source, 'plan-override');
});

test('null and undefined both mean "not set" and fall through', () => {
  /* Both have to work: `null` is what Firestore stores for a cleared override,
     `undefined` is what a missing field reads as. */
  for (const unset of [null, undefined]) {
    const result = resolveTemplateAllowance({
      planId: PLAN_IDS.SOLO,
      accountOverride: unset,
      settings: { planAllowances: { [PLAN_IDS.SOLO]: unset } },
    });
    assert.equal(result.source, 'plan-default', `${unset} must fall through both layers`);
  }
});

test('the account override beats the plan override beats the default', () => {
  const result = resolveTemplateAllowance({
    planId: PLAN_IDS.SOLO,
    accountOverride: 3,
    settings: { planAllowances: { [PLAN_IDS.SOLO]: 7 } },
  });
  assert.equal(result.allowance, 3);
  assert.equal(result.source, 'account');
});

test('a cleared account override falls to the plan override, not the default', () => {
  /* The middle layer. Clearing the per-account value must expose the per-plan
     value, not skip past it. */
  const result = resolveTemplateAllowance({
    planId: PLAN_IDS.SOLO,
    accountOverride: null,
    settings: { planAllowances: { [PLAN_IDS.SOLO]: 7 } },
  });
  assert.equal(result.allowance, 7);
  assert.equal(result.source, 'plan-override');
});

test('a plan override for a DIFFERENT plan does not leak across', () => {
  const result = resolveTemplateAllowance({
    planId: PLAN_IDS.SOLO,
    settings: { planAllowances: { [PLAN_IDS.ENTERPRISE]: 0 } },
  });
  assert.equal(result.source, 'plan-default');
  assert.equal(result.allowance, getPlan(PLAN_IDS.SOLO).documentTemplateAllowance);
});

test('an unknown plan gets zero, not the first plan or a crash', () => {
  /* Failing closed: an account on a plan this file does not know about gets no
     templates rather than someone else's allowance. */
  const result = resolveTemplateAllowance({ planId: 'legacy-plan-that-no-longer-exists' });
  assert.equal(result.allowance, 0);
  assert.equal(result.source, 'unknown-plan');
  assert.equal(result.unlimited, false);
});

test('a malformed settings document does not throw', () => {
  /* `settings` comes from Firestore and can be anything. Optional chaining is
     load-bearing here. */
  for (const settings of [null, undefined, {}, { planAllowances: null }, { planAllowances: {} }]) {
    assert.doesNotThrow(() =>
      resolveTemplateAllowance({ planId: PLAN_IDS.SOLO, settings }),
    );
  }
});

test('a notary or Commissioner of Oaths is never charged', () => {
  /* They are paid from the service fee. Billing one would take money from the
     people the platform owes money to. */
  for (const role of [ROLES.NOTARY, ROLES.COATH]) {
    assert.throws(() => assertNotCharged(role), /refus|never|not/i, `${role} must not be billable`);
  }
});

test('a Website Manager is never charged either', () => {
  assert.throws(() => assertNotCharged(ROLES.ADMIN));
});

test('a subscriber role IS billable', () => {
  /* The other side of the guard: if it refused everyone, nobody could
     subscribe and the refusal above would prove nothing. */
  assert.equal(assertNotCharged(ROLES.ATTORNEY), true);
  assert.equal(assertNotCharged(ROLES.BUSINESS), true);
});
