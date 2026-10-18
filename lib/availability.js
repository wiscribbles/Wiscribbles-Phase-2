/**
 * Professional availability — the "Go Live" state.
 *
 * Brief, Notary dashboard: "The notary can toggle their status between Go Live
 * and Offline. When live, the notary enters the pool of available professionals
 * and sees the waiting queue for their jurisdiction(s) in real time."
 *
 * TWO THINGS WORTH KNOWING ABOUT THIS FILE
 *
 * 1. The availability document is SERVER-WRITTEN ONLY. It would be simpler to
 *    let the client write `isOnline` straight to Firestore, and the first draft
 *    of the security rules did allow that. It is wrong. The document carries
 *    `jurisdictions`, and the queue match is by jurisdiction — so a notary who
 *    could write their own availability document could list a jurisdiction they
 *    are not licensed in and receive work there. The jurisdictions written here
 *    are copied from the approved profile, never taken from the request.
 *
 * 2. Going live is not just a flag. A professional is only eligible if they are
 *    approved, hold at least one launched jurisdiction, and have cleared KYC.
 *    `checkEligibility` is the single place those conditions live, so the
 *    toggle and the queue agree about who is allowed to work.
 */

import { ACCOUNT_STATUS, isWorkingPartner, normalizeRole } from '@/lib/roles';
import { KYC_STATUS } from '@/lib/kyc/provider';
import { getJurisdiction, supportsNotarization } from '@/lib/jurisdictions';

export const AVAILABILITY_COLLECTION = 'notaryAvailability';

/**
 * How long an availability record stays trustworthy without a heartbeat.
 *
 * A browser that is closed, crashes or loses its network never sends an
 * "offline". Without an expiry the queue would offer work to professionals who
 * are not there, and the client would sit waiting on someone who will never
 * answer. Two minutes is short enough that a stale entry disappears quickly and
 * long enough to survive a laptop sleeping briefly or a tab in the background.
 */
export const PRESENCE_TTL_MS = 2 * 60 * 1000;

/** The dashboard heartbeats at half the TTL, so one missed beat is survivable. */
export const HEARTBEAT_INTERVAL_MS = PRESENCE_TTL_MS / 2;

export const INELIGIBLE = Object.freeze({
  NOT_WORKING_PARTNER: 'not_working_partner',
  NOT_APPROVED: 'not_approved',
  NO_JURISDICTIONS: 'no_jurisdictions',
  NO_NOTARIZABLE_JURISDICTION: 'no_notarizable_jurisdiction',
  KYC_INCOMPLETE: 'kyc_incomplete',
});

const INELIGIBLE_MESSAGE = Object.freeze({
  [INELIGIBLE.NOT_WORKING_PARTNER]:
    'Only Notaries and Commissioners of Oaths take sessions.',
  [INELIGIBLE.NOT_APPROVED]:
    'Your account is still awaiting approval by the Website Manager.',
  [INELIGIBLE.NO_JURISDICTIONS]:
    'Add at least one jurisdiction of practice on the Account tab before going live.',
  [INELIGIBLE.NO_NOTARIZABLE_JURISDICTION]:
    'None of your jurisdictions permit electronic notarisation, so there is no ' +
    'work to receive. Sessions cannot be offered to you until that changes.',
  [INELIGIBLE.KYC_INCOMPLETE]:
    'Identity verification must be complete before you can take sessions.',
});

/**
 * May this professional go live?
 *
 * @param {object} profile  the Firestore user document (or session user)
 * @returns {{ eligible: boolean, reason: string|null, message: string|null,
 *             jurisdictions: string[] }}
 */
export function checkEligibility(profile) {
  const role = normalizeRole(profile?.role ?? profile?.signUpAs);

  const fail = (reason) => ({
    eligible: false,
    reason,
    message: INELIGIBLE_MESSAGE[reason],
    jurisdictions: [],
  });

  if (!isWorkingPartner(role)) return fail(INELIGIBLE.NOT_WORKING_PARTNER);
  if (profile?.status !== ACCOUNT_STATUS.APPROVED) return fail(INELIGIBLE.NOT_APPROVED);

  const held = Array.isArray(profile?.jurisdictions) ? profile.jurisdictions : [];
  const known = held.filter((code) => getJurisdiction(code)?.launchEnabled);

  if (known.length === 0) return fail(INELIGIBLE.NO_JURISDICTIONS);

  // Holding only e-signature jurisdictions is not a configuration error, but it
  // does mean no notarisation work can ever be routed here. Say so plainly
  // rather than leaving them live and idle, wondering why nothing arrives.
  const notarizable = known.filter((code) => supportsNotarization(code));
  if (notarizable.length === 0) return fail(INELIGIBLE.NO_NOTARIZABLE_JURISDICTION);

  if (profile?.kyc?.status !== KYC_STATUS.APPROVED) return fail(INELIGIBLE.KYC_INCOMPLETE);

  return { eligible: true, reason: null, message: null, jurisdictions: notarizable };
}

/** Has this availability record gone stale? */
export const isStale = (record, now = Date.now()) => {
  const beat = Date.parse(record?.lastSeenAt ?? record?.updatedAt ?? '');
  if (Number.isNaN(beat)) return true;
  return now - beat > PRESENCE_TTL_MS;
};

/** Is this professional genuinely available right now? */
export const isLive = (record, now = Date.now()) =>
  Boolean(record?.isOnline) && !isStale(record, now);
