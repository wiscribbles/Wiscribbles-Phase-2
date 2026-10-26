/**
 * Admin-controlled settings, stored in Firestore at `adminSettings/plans`.
 *
 * Only the Website Manager writes these, and only through a server route —
 * `firestore.rules` denies all client writes to `adminSettings`.
 *
 * Defaults live in code (`lib/plans.js`); this document holds OVERRIDES. A
 * key that is absent means "use the default", which is what makes resetting a
 * plan back to its default a deletion rather than a second kind of value to
 * reason about.
 */

import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { PLAN_IDS, isValidPlan } from '@/lib/plans';

const SETTINGS_COLLECTION = 'adminSettings';
const PLANS_DOC = 'plans';

/** -1 means unlimited. 0 means none. */
export const UNLIMITED = -1;
const MAX_ALLOWANCE = 10000;

export async function getPlanSettings() {
  const snapshot = await adminDb().collection(SETTINGS_COLLECTION).doc(PLANS_DOC).get();

  if (!snapshot.exists) {
    return { planAllowances: {}, updatedAt: null, updatedBy: null };
  }

  const data = snapshot.data();
  return {
    planAllowances: data.planAllowances ?? {},
    updatedAt: data.updatedAt ?? null,
    updatedBy: data.updatedBy ?? null,
  };
}

/**
 * Validate a submitted allowance.
 * @returns {{ valid: boolean, value?: number|null, error?: string }}
 */
export function validateAllowance(input) {
  // Empty, null or the string 'default' clears the override.
  if (input === null || input === undefined || input === '' || input === 'default') {
    return { valid: true, value: null };
  }

  const value = typeof input === 'number' ? input : Number(input);

  if (!Number.isInteger(value)) {
    return { valid: false, error: 'Allowance must be a whole number.' };
  }
  if (value < UNLIMITED) {
    return { valid: false, error: 'Allowance cannot be below -1.' };
  }
  if (value > MAX_ALLOWANCE) {
    return { valid: false, error: `Allowance cannot exceed ${MAX_ALLOWANCE}.` };
  }

  return { valid: true, value };
}

/**
 * Set or clear per-plan template allowances.
 *
 * @param {Record<string, number|null>} allowances  planId → allowance, or null to reset
 * @param {{ uid: string, email: string }} actor
 */
export async function setPlanAllowances(allowances, actor) {
  const updates = {};
  const errors = {};

  for (const [planId, raw] of Object.entries(allowances)) {
    if (!isValidPlan(planId)) {
      errors[planId] = 'Unknown plan.';
      continue;
    }
    const result = validateAllowance(raw);
    if (!result.valid) {
      errors[planId] = result.error;
      continue;
    }
    updates[planId] = result.value;
  }

  if (Object.keys(errors).length) {
    const error = new Error('Invalid allowances');
    error.fieldErrors = errors;
    throw error;
  }

  const docRef = adminDb().collection(SETTINGS_COLLECTION).doc(PLANS_DOC);
  const now = new Date().toISOString();

  // A transaction, because two managers saving at once would otherwise let the
  // later write clobber the earlier one's untouched plans.
  await adminDb().runTransaction(async (tx) => {
    const snapshot = await tx.get(docRef);
    const current = snapshot.exists ? (snapshot.data().planAllowances ?? {}) : {};
    const merged = { ...current };

    for (const [planId, value] of Object.entries(updates)) {
      if (value === null) delete merged[planId];
      else merged[planId] = value;
    }

    tx.set(
      docRef,
      {
        planAllowances: merged,
        updatedAt: now,
        updatedBy: { uid: actor.uid, email: actor.email },
      },
      { merge: true },
    );
  });

  // Separate audit entry — the settings document holds only the latest state,
  // and who changed an allowance to what, and when, is the thing a dispute
  // actually turns on.
  await adminDb()
    .collection('auditLog')
    .add({
      type: 'plan_allowance_changed',
      actorUid: actor.uid,
      actorEmail: actor.email,
      changes: updates,
      at: now,
    })
    .catch((error) => console.error('[settings] audit write failed', error));

  return getPlanSettings();
}

/**
 * Per-account override, which beats the per-plan value.
 * Used when the Website Manager grants one firm extra templates without
 * changing anyone else's plan.
 */
export async function setAccountTemplateAllowance(uid, rawAllowance, actor) {
  const result = validateAllowance(rawAllowance);
  if (!result.valid) {
    const error = new Error(result.error);
    error.fieldErrors = { allowance: result.error };
    throw error;
  }

  const now = new Date().toISOString();

  await adminDb()
    .collection('users')
    .doc(uid)
    .set({ templateAllowanceOverride: result.value, updatedAt: now }, { merge: true });

  await adminDb()
    .collection('auditLog')
    .add({
      type: 'account_allowance_changed',
      actorUid: actor.uid,
      actorEmail: actor.email,
      targetUid: uid,
      allowance: result.value,
      at: now,
    })
    .catch((error) => console.error('[settings] audit write failed', error));

  return result.value;
}

export const ALL_PLAN_IDS = Object.values(PLAN_IDS);

/* ========================================================================== */
/* Operational settings — `adminSettings/global`                              */
/* ========================================================================== */

/**
 * The switchboard behind `/admin/settings`.
 *
 * TWO THINGS TO KNOW BEFORE RELYING ON ANY OF THIS.
 *
 * 1. NOTHING IN THE PRODUCT READS THESE VALUES YET. They were written by the
 *    Phase 1 settings page, which wrote them straight from the browser into a
 *    collection `firestore.rules` denies, so the writes failed and the page
 *    appeared to do nothing. The write now works. What it does not do is
 *    change any behaviour, because no consumer reads the document. Saving a
 *    setting here records an intention, not an effect, and the page says so.
 *    Whoever wires a consumer should delete that sentence from the page in the
 *    same commit.
 *
 * 2. `autoApproveAttorneys` IS REFUSED, deliberately, and is not merely
 *    unimplemented. Approval of a partner has to go through
 *    `decidePartnerApplication`, which syncs the custom claims the security
 *    rules read; an approval that skipped it would produce an account marked
 *    approved that cannot actually do anything, which is the drift that
 *    function's own comments warn about. Worse, Guyana Public Notaries Act
 *    Cap. 4:02 s.7 makes performing notarial acts for reward while not on the
 *    Registrar's register an offence, so automatic approval would mean nobody
 *    ever checked the register. A switch that turns that check off should not
 *    exist, so this one refuses to be set.
 */
const GLOBAL_DOC = 'global';

const PAYOUT_CURRENCIES = Object.freeze(['USD', 'GYD', 'TTD', 'JMD', 'BBD']);

const MAX_PAYMENT_THRESHOLD = 1_000_000;

export const OPERATIONAL_SETTING_DEFAULTS = Object.freeze({
  autoAssignNotaries: false,
  autoApproveAttorneys: false,
  notifyOnLargePayments: true,
  largePaymentThreshold: 1000,
  defaultPayoutCurrency: 'USD',
});

export class SettingsError extends Error {
  constructor(code, message, status = 422, field = null) {
    super(message);
    this.name = 'SettingsError';
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

export async function getOperationalSettings() {
  const snapshot = await adminDb().collection(SETTINGS_COLLECTION).doc(GLOBAL_DOC).get();

  if (!snapshot.exists) {
    return { ...OPERATIONAL_SETTING_DEFAULTS, updatedAt: null, updatedBy: null };
  }

  const data = snapshot.data();

  /* Merged over the defaults rather than returned raw: a document written
     before a setting existed must not read back as `undefined` and render as
     an unchecked box that then saves a value nobody chose. */
  return {
    ...OPERATIONAL_SETTING_DEFAULTS,
    ...Object.fromEntries(
      Object.keys(OPERATIONAL_SETTING_DEFAULTS)
        .filter((key) => data[key] !== undefined)
        .map((key) => [key, data[key]]),
    ),
    updatedAt: data.updatedAt ?? null,
    updatedBy: data.updatedBy ?? null,
  };
}

/**
 * Validate and write the operational settings.
 *
 * An ALLOW-LIST, built field by field. The Phase 1 version spread whatever the
 * browser sent into the document, which on a server route would let an admin —
 * or anything that reached the route — write arbitrary keys into a document
 * other code may later trust. A delete-list leaks the moment somebody adds a
 * field; this cannot.
 */
export async function setOperationalSettings(input, actor) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new SettingsError('invalid_body', 'No settings were supplied.', 400);
  }

  const next = {};

  for (const key of ['autoAssignNotaries', 'notifyOnLargePayments']) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== 'boolean') {
      throw new SettingsError('not_a_boolean', `"${key}" must be true or false.`, 422, key);
    }
    next[key] = input[key];
  }

  /* See the note at the top of this section. Accepting `false` keeps the page
     able to write the safe value and to correct a document that somehow holds
     the unsafe one. */
  if (input.autoApproveAttorneys !== undefined) {
    if (input.autoApproveAttorneys !== false) {
      throw new SettingsError(
        'auto_approval_refused',
        'Attorneys and notaries cannot be approved automatically. Approval ' +
          'syncs the permissions the security rules read, and it is where the ' +
          'professional is checked against the register of notaries — ' +
          'performing notarial acts for reward while off that register is an ' +
          'offence in Guyana (Cap. 4:02 s.7). Approve each application from ' +
          'the partner review screen.',
        422,
        'autoApproveAttorneys',
      );
    }
    next.autoApproveAttorneys = false;
  }

  if (input.largePaymentThreshold !== undefined) {
    const value =
      typeof input.largePaymentThreshold === 'number'
        ? input.largePaymentThreshold
        : Number(input.largePaymentThreshold);

    if (!Number.isInteger(value) || value < 0 || value > MAX_PAYMENT_THRESHOLD) {
      throw new SettingsError(
        'bad_threshold',
        `The large-payment threshold must be a whole number between 0 and ${MAX_PAYMENT_THRESHOLD}.`,
        422,
        'largePaymentThreshold',
      );
    }
    next.largePaymentThreshold = value;
  }

  if (input.defaultPayoutCurrency !== undefined) {
    const value = String(input.defaultPayoutCurrency).toUpperCase();
    if (!PAYOUT_CURRENCIES.includes(value)) {
      throw new SettingsError(
        'bad_currency',
        `Currency must be one of ${PAYOUT_CURRENCIES.join(', ')}.`,
        422,
        'defaultPayoutCurrency',
      );
    }
    next.defaultPayoutCurrency = value;
  }

  if (Object.keys(next).length === 0) {
    throw new SettingsError('nothing_to_save', 'No recognised settings were supplied.', 422);
  }

  const now = new Date().toISOString();

  await adminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(GLOBAL_DOC)
    .set({ ...next, updatedAt: now, updatedBy: { uid: actor.uid, email: actor.email } }, { merge: true });

  await adminDb()
    .collection('auditLog')
    .add({
      type: 'admin_settings_updated',
      changed: Object.keys(next),
      /* The values, not just the field names. "Someone changed the payout
         threshold" is not an audit trail; "changed it to 50,000" is. */
      values: next,
      actorUid: actor.uid,
      actorEmail: actor.email,
      at: now,
    })
    .catch((error) => console.error('[settings] audit write failed', error));

  return getOperationalSettings();
}

export const ALL_PAYOUT_CURRENCIES = PAYOUT_CURRENCIES;
