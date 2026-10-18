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
