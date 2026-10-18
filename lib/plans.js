/**
 * Subscription plans and who pays what.
 *
 * THE CENTRAL RULE OF THIS FILE — the platform has two kinds of partner and
 * money moves in opposite directions for each:
 *
 *   Attorneys and Businesses  PAY   a monthly subscription.
 *   Notaries and COaths       ARE PAID from the service fee. They are never
 *                             charged, have no plan, and no card is ever
 *                             captured from them. Their Financials tab exists
 *                             only to collect payout details.
 *
 * `assertNotCharged` below makes the second half enforceable rather than
 * merely documented, because a billing bug that charges a notary is both a
 * refund and a broken relationship with the scarcest resource on the platform.
 *
 * Prices confirmed by Thomas on 18 Oct 2026, in USD.
 */

import { ROLES, SUBSCRIBER_ROLES, WORKING_PARTNER_ROLES, normalizeRole } from '@/lib/roles';

export const BILLING_CURRENCY = 'USD';

export const PLAN_IDS = Object.freeze({
  SOLO: 'solo',
  CHAMBERS: 'chambers',
  ENTERPRISE: 'enterprise',
});

/**
 * Amounts are in CENTS. Never store money as a float — 50.1 + 0.2 is not 50.3
 * in binary floating point, and a cent of drift per invoice compounds.
 */
export const PLANS = Object.freeze({
  [PLAN_IDS.SOLO]: {
    id: PLAN_IDS.SOLO,
    name: 'Solo',
    description: 'For an individual attorney or a single-location business.',
    monthlyPriceCents: 5000, // USD 50.00
    /**
     * How many document templates this plan may hold. The Website Manager can
     * override this per plan, and per account, from the admin dashboard —
     * `resolveTemplateAllowance` applies the overrides.
     */
    documentTemplateAllowance: 5,
    /**
     * Personal repository size, in megabytes.
     *
     * Brief (18 Oct): the personal repository is "limited in size so it does
     * not get too crowded". A cap is also the only thing that makes the
     * repository usable — an unbounded folder of five years' documents is not
     * a repository, it is a drawer.
     *
     * Executed instruments count toward this and are NEVER purged to make
     * room; when the cap is reached the account archives or upgrades. The
     * standard forms library does not count: those are the platform's files,
     * held once and shared, not copies in each account.
     */
    storageQuotaMb: 500,
    seats: 1,
    features: [
      '5 document templates',
      '500 MB document repository',
      'Unlimited e-signature requests',
      'Client signing links',
      'Email support',
    ],
  },
  [PLAN_IDS.CHAMBERS]: {
    id: PLAN_IDS.CHAMBERS,
    name: 'Chambers',
    description: 'For a practice with several fee earners.',
    monthlyPriceCents: 15000, // USD 150.00
    documentTemplateAllowance: 25,
    storageQuotaMb: 2048,
    seats: 5,
    features: [
      '25 document templates',
      '2 GB document repository',
      'Unlimited e-signature requests',
      'Client signing links',
      'Appointment scheduling',
      'Social media signing links',
      'Priority support',
    ],
  },
  [PLAN_IDS.ENTERPRISE]: {
    id: PLAN_IDS.ENTERPRISE,
    name: 'Enterprise',
    description: 'For firms and organisations operating at volume.',
    monthlyPriceCents: 35000, // USD 350.00
    documentTemplateAllowance: 100,
    storageQuotaMb: 10240,
    seats: 25,
    features: [
      '100 document templates',
      '10 GB document repository',
      'Unlimited e-signature requests',
      'Client signing links',
      'Appointment scheduling',
      'Social media signing links',
      'Full analytics',
      'Dedicated support',
    ],
  },
});

/**
 * What an account gets with no plan.
 *
 * Every client, and — while subscription billing is switched off — every
 * attorney and business too. Generous enough that nobody is blocked during
 * testing, small enough that it is not a free unlimited tier by accident.
 */
export const DEFAULT_STORAGE_QUOTA_MB = 250;

export const storageQuotaMbFor = (planId) =>
  getPlan(planId)?.storageQuotaMb ?? DEFAULT_STORAGE_QUOTA_MB;

export const PLAN_LIST = Object.freeze(Object.values(PLANS));

export const getPlan = (planId) => PLANS[planId] ?? null;
export const isValidPlan = (planId) => Object.hasOwn(PLANS, planId);

/* ------------------------------------------------------------------------- */
/* Who pays                                                                   */
/* ------------------------------------------------------------------------- */

/** True when this role is billed a subscription. */
export const roleRequiresSubscription = (role) =>
  SUBSCRIBER_ROLES.includes(normalizeRole(role));

/** True when this role RECEIVES money rather than paying it. */
export const roleReceivesPayouts = (role) =>
  WORKING_PARTNER_ROLES.includes(normalizeRole(role));

/**
 * Guard before any charge, subscription, or card capture.
 *
 * Call this at the top of every billing path. It throws rather than returning
 * false so that a forgotten check cannot silently fall through to a charge.
 *
 * @throws {Error} if the role must never be billed.
 */
export function assertNotCharged(role) {
  const normalized = normalizeRole(role);

  if (roleReceivesPayouts(normalized)) {
    throw new Error(
      `Refusing to bill a ${normalized}. Notaries and Commissioners of Oaths are ` +
        'paid from the service fee and are never charged a subscription. ' +
        'This is a billing bug — see lib/plans.js.',
    );
  }

  if (normalized === ROLES.ADMIN) {
    throw new Error('Refusing to bill a Website Manager account.');
  }

  return true;
}

/* ------------------------------------------------------------------------- */
/* Template allowance                                                         */
/* ------------------------------------------------------------------------- */

/**
 * Resolve how many document templates an account may hold.
 *
 * Three layers, most specific wins:
 *   1. a per-account override set by the Website Manager   (account.templateAllowanceOverride)
 *   2. a per-plan override set by the Website Manager      (settings.planAllowances[planId])
 *   3. the plan default from this file
 *
 * A null or undefined override means "not set" and falls through. `0` is a
 * real value meaning no templates, and `-1` means unlimited — so this must
 * test for null explicitly rather than relying on falsiness, or `0` would be
 * silently treated as unset.
 *
 * @param {object}  args
 * @param {string}  args.planId
 * @param {object} [args.settings]         admin settings document
 * @param {number} [args.accountOverride]  per-account override, or null
 * @returns {{ allowance: number, unlimited: boolean, source: string }}
 */
export function resolveTemplateAllowance({ planId, settings = null, accountOverride = null }) {
  const UNLIMITED = -1;

  const describe = (value, source) => ({
    allowance: value,
    unlimited: value === UNLIMITED,
    source,
  });

  if (accountOverride !== null && accountOverride !== undefined) {
    return describe(accountOverride, 'account');
  }

  const planOverride = settings?.planAllowances?.[planId];
  if (planOverride !== null && planOverride !== undefined) {
    return describe(planOverride, 'plan-override');
  }

  const plan = getPlan(planId);
  if (!plan) return describe(0, 'unknown-plan');

  return describe(plan.documentTemplateAllowance, 'plan-default');
}

/**
 * @returns {{ allowed: boolean, reason: string|null }}
 */
export function canCreateTemplate({ planId, settings, accountOverride, currentCount }) {
  const { allowance, unlimited } = resolveTemplateAllowance({
    planId,
    settings,
    accountOverride,
  });

  if (unlimited) return { allowed: true, reason: null };

  if (currentCount >= allowance) {
    return {
      allowed: false,
      reason:
        allowance === 0
          ? 'Your plan does not include document templates.'
          : `You have used all ${allowance} document templates on your plan. ` +
            'Delete one, or move to a larger plan.',
    };
  }

  return { allowed: true, reason: null };
}

/* ------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* ------------------------------------------------------------------------- */

export const formatPriceCents = (cents, currency = BILLING_CURRENCY) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);

/** WiPay takes a decimal string with exactly two places, not cents. */
export const centsToDecimalString = (cents) => (cents / 100).toFixed(2);

export const formatAllowance = (allowance) =>
  allowance === -1 ? 'Unlimited' : String(allowance);
