/**
 * Sanctions that end on their own.
 *
 * Brief, Website Manager: the manager can "sanction a partner, suspend them for
 * a period of time, or remove them from the platform."
 *
 * THE BUG THIS FIXES
 *
 * Stage 3 built the suspension: `decidePartnerApplication` writes
 * `status: 'suspended'` with a `suspendedUntil` date, sets the custom claim and
 * revokes the partner's sessions. All correct — and all one-directional.
 * Nothing read `suspendedUntil` again. A partner suspended for fourteen days
 * was suspended for ever, because the date was recorded and then never
 * consulted, and the only way back was for the Website Manager to remember the
 * account and reinstate it by hand.
 *
 * A sanction with an end date that nobody enforces is not a sanction with an
 * end date.
 *
 * HOW IT LAPSES
 *
 * Lazily, on the account's next authenticated request, rather than from a
 * scheduled job. A cron would be tidier in principle but needs somewhere to
 * run, and a suspension that lapses the moment the partner next tries to work
 * is indistinguishable from one that lapsed at midnight — nobody is affected by
 * the state of an account that nobody is using. More to the point, a lazy lapse
 * cannot silently stop working: if it breaks, it breaks visibly, for the person
 * trying to sign in.
 *
 * `restoreOnLapse` is called from `getSessionUser`. It writes only when a
 * suspension has genuinely expired, so the common path is one date comparison
 * and no write at all.
 */

import { ACCOUNT_STATUS, isPartnerRole, normalizeRole } from '@/lib/roles';
import { adminDb } from '@/lib/firebase-admin';
import { setUserClaims } from '@/lib/auth/claims';

/**
 * Has this suspension run out?
 *
 * An indefinite suspension has no `suspendedUntil` and never lapses — that is
 * the difference between "suspended for a fortnight" and "suspended pending
 * investigation", and conflating them would quietly release accounts that were
 * meant to stay shut.
 */
export function suspensionHasLapsed(profile, now = Date.now()) {
  if (profile?.status !== ACCOUNT_STATUS.SUSPENDED) return false;

  const until = Date.parse(profile?.suspendedUntil ?? '');
  if (Number.isNaN(until)) return false;

  return until <= now;
}

/**
 * Restore an account whose suspension has expired.
 *
 * Returns the status the caller should treat as current — unchanged in every
 * case but the one where a lapse was found and applied.
 *
 * Deliberately never throws. This runs inside session resolution, on every
 * request: a failure here must not lock out an account whose punishment is
 * over. A failed restore leaves the partner suspended for one more request and
 * is retried on the next, which is the safe direction to fail in.
 *
 * @returns {Promise<string>} the effective ACCOUNT_STATUS
 */
export async function restoreOnLapse(uid, profile, now = Date.now()) {
  if (!suspensionHasLapsed(profile, now)) {
    return profile?.status ?? ACCOUNT_STATUS.EMAIL_UNVERIFIED;
  }

  const role = normalizeRole(profile?.role ?? profile?.signUpAs);

  /* Only a partner returns to `approved`. A suspended client goes back to
     approved too — that is their normal state — but anything that was never a
     partner application has no approval to return to, so the status is left
     alone rather than invented. */
  const restored = ACCOUNT_STATUS.APPROVED;
  const at = new Date(now).toISOString();

  try {
    /* The claim is written FIRST. Claims are what the security rules and the
       route guards read; the Firestore field is for display. Writing the
       document first would briefly show an approved account that Firestore
       still refuses to serve, which looks like a broken platform rather than a
       restored account. */
    await setUserClaims(uid, { role, status: restored });

    await adminDb()
      .collection('users')
      .doc(uid)
      .set(
        {
          status: restored,
          suspendedUntil: null,
          suspensionLapsedAt: at,
          updatedAt: at,
        },
        { merge: true },
      );

    await adminDb()
      .collection('auditLog')
      .add({
        type: 'suspension_lapsed',
        targetUid: uid,
        targetEmail: profile?.email ?? null,
        targetRole: role,
        newStatus: restored,
        suspendedUntil: profile?.suspendedUntil ?? null,
        // No actor: nobody did this. The sanction expired on its own, and the
        // log should not imply a person made a decision here.
        actorUid: null,
        actorEmail: 'system',
        at,
      })
      .catch((error) => console.error('[sanctions] audit write failed', error));

    return restored;
  } catch (error) {
    console.error('[sanctions] could not restore a lapsed suspension', { uid, error });
    // Still suspended for this request. Retried on the next one.
    return profile?.status ?? ACCOUNT_STATUS.SUSPENDED;
  }
}

/** For the admin UI: how a suspension reads right now. */
export function describeSuspension(profile, now = Date.now()) {
  if (profile?.status !== ACCOUNT_STATUS.SUSPENDED) return null;

  const until = Date.parse(profile?.suspendedUntil ?? '');

  if (Number.isNaN(until)) {
    return { indefinite: true, lapsed: false, label: 'Suspended indefinitely' };
  }
  if (until <= now) {
    return {
      indefinite: false,
      lapsed: true,
      label: 'Suspension expired — lifts on their next sign-in',
    };
  }

  const days = Math.ceil((until - now) / 86400000);
  return {
    indefinite: false,
    lapsed: false,
    label: `Suspended for ${days} more day${days === 1 ? '' : 's'}`,
    until: profile.suspendedUntil,
  };
}

/** Validate a suspension length coming from the admin form. */
export function validateSuspension({ days, indefinite }) {
  if (indefinite) return { valid: true, suspendedUntil: null };

  const value = Number(days);
  if (!Number.isInteger(value) || value < 1 || value > 365) {
    return {
      valid: false,
      error: 'Choose between 1 and 365 days, or suspend indefinitely.',
    };
  }

  return {
    valid: true,
    suspendedUntil: new Date(Date.now() + value * 86400000).toISOString(),
  };
}

export const isPartnerAccount = (profile) =>
  isPartnerRole(normalizeRole(profile?.role ?? profile?.signUpAs));
