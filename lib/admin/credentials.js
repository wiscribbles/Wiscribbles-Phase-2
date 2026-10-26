/**
 * CERTIFICATE EXPIRY — access that ends when the commission does.
 *
 * A notary or Commissioner of Oaths is appointed for a term. The certificate
 * they upload at onboarding states when that term ends. Until now the platform
 * read the certificate as a one-off proof of appointment and never looked at
 * it again, so a commission that expired in March left the account live in
 * September, sealing documents with a certificate block that asserted an
 * authority the person no longer had.
 *
 * WHY THIS IS NOT A TIDINESS FEATURE. Guyana Public Notaries Act Cap. 4:02
 * **s.7** makes it an offence to perform notarial acts **for reward** while not
 * on the register kept by the Registrar of the Supreme Court. Barbados Notaries
 * Public Act 2024 **s.16** is to the same effect for a notary whose
 * appointment is suspended or revoked. So an expired officer who keeps working
 * is not merely out of date: they are committing an offence on every act, with
 * the platform's certificate attached to the evidence, and the platform put
 * the work in front of them.
 *
 * WHY A MANAGER-ENTERED DATE RATHER THAN A LIVE REGISTER LOOKUP. The ideal
 * control is a periodic query against the official register. None of the four
 * jurisdictions publishes one that can be queried: Barbados's Notaries Public
 * Act 2024 s.7(1) says the register "may be in an electronic form", which is
 * permission rather than an API, and the Guyana register is held by the
 * Registrar of the Supreme Court in no published machine-readable form. So the
 * date on the certificate in front of the Website Manager is the best
 * available evidence, and the manager enters it when they approve. That is a
 * deliberate second-best, and if a register ever becomes queryable this module
 * is where the lookup replaces the stored date.
 *
 * HOW IT ENDS ACCESS — the same lazy lapse as `lib/admin/sanctions.js`, and
 * for the same reasons: it runs inside session resolution, so it cannot
 * silently stop working, and nobody is harmed by the state of an account
 * nobody is using. The difference is the direction. A lapsed suspension
 * RESTORES access; a lapsed certificate WITHDRAWS it, which means a failure
 * here must fail the other way — if the write cannot be made, the account must
 * be treated as expired for this request rather than waved through.
 *
 * WHAT STATUS AN EXPIRED OFFICER GETS. `more_info_requested`, not `suspended`.
 * Both stop access, but a suspension is a sanction and this is not one — the
 * person has done nothing wrong, their term simply ended. `more_info_requested`
 * is also the status that reopens the upload fields, so the route back is to
 * upload a current certificate, which is exactly the right route.
 */

import { ACCOUNT_STATUS, ROLES, normalizeRole } from '@/lib/roles';
import { adminDb } from '@/lib/firebase-admin';
import { revokeUserSessions, setUserClaims } from '@/lib/auth/claims';

/**
 * Roles whose access is bound to a dated certificate.
 *
 * Notaries and Commissioners of Oaths hold a term appointment and commit an
 * offence by acting after it ends. Attorneys and businesses are subscribers
 * here rather than officers performing acts under a commission, so an expiry
 * is accepted for them but never required. If the platform ever relies on an
 * attorney's practising certificate, add the role here and the requirement
 * follows automatically.
 */
export const CREDENTIAL_REQUIRED_ROLES = Object.freeze([ROLES.NOTARY, ROLES.COATH]);

export const requiresCredentialExpiry = (role) =>
  CREDENTIAL_REQUIRED_ROLES.includes(normalizeRole(role));

/** How far ahead the admin UI starts warning. */
export const EXPIRY_WARNING_DAYS = 30;

/** A certificate valid for more than this is a typo or a way round the control. */
const MAX_TERM_YEARS = 10;

export class CredentialError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'CredentialError';
    this.code = code;
  }
}

/**
 * The instant a certificate stops being valid.
 *
 * A certificate that says it expires on 1 March is valid THROUGH 1 March, not
 * until midnight at its start. Treating the stored date as the beginning of
 * that day would cut every officer off a day early, which is both wrong and
 * the kind of wrong that looks like a platform fault rather than a rule.
 *
 * Resolved at the end of the day in UTC. The jurisdictions span UTC-4 to
 * UTC-5, so end-of-day UTC is a few hours before local midnight — erring, by
 * a matter of hours, on the side of stopping work slightly early rather than
 * slightly late. Given s.7 that is the correct direction to be imprecise in.
 */
export function expiryInstant(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return NaN;

  /* A bare YYYY-MM-DD parses as midnight UTC, so push it to the end of that
     day. A full timestamp is honoured as given — if somebody recorded a
     precise instant, that is what they meant. */
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return Date.parse(`${raw}T23:59:59.999Z`);
  }
  return Date.parse(raw);
}

/**
 * Validate an expiry date from the approval form.
 *
 * @returns {{valid: boolean, value?: string|null, error?: string}}
 */
export function validateCredentialExpiry(input, { role = null, now = Date.now() } = {}) {
  const raw = String(input ?? '').trim();

  if (!raw) {
    /* Required for an officer, optional for anyone else. Approving a notary
       without an expiry is what this whole module exists to prevent, so the
       absence is an error rather than an unbounded term. */
    if (requiresCredentialExpiry(role)) {
      return {
        valid: false,
        error:
          'Enter the expiry date shown on the certificate. A notary or ' +
          'Commissioner of Oaths cannot be approved without one — their ' +
          'access ends when their commission does.',
      };
    }
    return { valid: true, value: null };
  }

  const at = expiryInstant(raw);

  if (Number.isNaN(at)) {
    return { valid: false, error: 'That is not a date. Use the date picker, or YYYY-MM-DD.' };
  }

  if (at <= now) {
    return {
      valid: false,
      error:
        'That date has already passed. An expired certificate cannot be the ' +
        'basis for approval — ask for a current one.',
    };
  }

  const maxAt = now + MAX_TERM_YEARS * 365.25 * 86400000;
  if (at > maxAt) {
    return {
      valid: false,
      error: `That is more than ${MAX_TERM_YEARS} years away. Check the date on the certificate.`,
    };
  }

  /* Stored as the date, not the computed instant. The instant is derived on
     read, so changing the end-of-day rule later does not require rewriting
     every stored value. */
  return { valid: true, value: raw };
}

/**
 * Has this account's certificate run out?
 *
 * Only an APPROVED account can expire. An account already in any other status
 * is not being let through on the strength of a certificate, so there is
 * nothing to withdraw, and returning true for it would mean rewriting the
 * status of rejected and removed accounts on every request.
 */
export function credentialHasExpired(profile, now = Date.now()) {
  if (profile?.status !== ACCOUNT_STATUS.APPROVED) return false;

  const role = normalizeRole(profile?.role ?? profile?.signUpAs);
  if (!requiresCredentialExpiry(role)) return false;

  const at = expiryInstant(profile?.credentialExpiresAt);

  /* An approved officer with NO expiry recorded is not treated as expired.
     That sounds like the wrong way round, and it is a deliberate choice about
     existing accounts: officers approved before this field existed have no
     date, and locking all of them out on deploy would be an outage caused by a
     safety feature. They are surfaced to the Website Manager instead —
     `describeCredential` reports `missing`, the review queue shows it, and the
     manager adds the date. New approvals cannot omit it, because
     `validateCredentialExpiry` refuses. */
  if (Number.isNaN(at)) return false;

  return at <= now;
}

/**
 * Withdraw access from an account whose certificate has expired.
 *
 * Returns the status the caller should treat as current.
 *
 * FAILS CLOSED, unlike `restoreOnLapse`. If the writes cannot be made the
 * account is still reported as `more_info_requested` for this request, so an
 * officer whose commission has ended does not keep working because Firestore
 * was briefly unavailable. The write is retried on the next request.
 *
 * @returns {Promise<string>} the effective ACCOUNT_STATUS
 */
export async function expireOnLapse(uid, profile, now = Date.now()) {
  if (!credentialHasExpired(profile, now)) {
    return profile?.status ?? ACCOUNT_STATUS.EMAIL_UNVERIFIED;
  }

  const role = normalizeRole(profile?.role ?? profile?.signUpAs);
  const next = ACCOUNT_STATUS.MORE_INFO_REQUESTED;
  const at = new Date(now).toISOString();

  const feedback =
    'The expiry date recorded for your certificate has passed, so your ' +
    'account has been set back to pending while it is renewed. Upload a ' +
    'current certificate and it will go to the Website Manager for review. ' +
    'Nothing you have already completed is affected.';

  try {
    /* Claims first, as in `sanctions.js`, but for the opposite reason: the
       claim is what actually stops the account working, so it is the thing to
       get written even if the rest fails. */
    await setUserClaims(uid, { role, status: next });

    await adminDb()
      .collection('users')
      .doc(uid)
      .set(
        {
          status: next,
          adminFeedback: feedback,
          credentialExpiredAt: at,
          updatedAt: at,
        },
        { merge: true },
      );

    /* Claims live in the token for up to an hour. Without this an expired
       officer keeps working until their token refreshes, which is exactly the
       window this module exists to close. */
    await revokeUserSessions(uid).catch((error) =>
      console.error('[credentials] session revoke failed', { uid, error }),
    );

    await adminDb()
      .collection('auditLog')
      .add({
        type: 'credential_expired',
        targetUid: uid,
        targetEmail: profile?.email ?? null,
        targetRole: role,
        newStatus: next,
        credentialExpiresAt: profile?.credentialExpiresAt ?? null,
        // Nobody did this. The term ended on its own.
        actorUid: null,
        actorEmail: 'system',
        at,
      })
      .catch((error) => console.error('[credentials] audit write failed', error));

    return next;
  } catch (error) {
    console.error('[credentials] could not withdraw access for an expired certificate', {
      uid,
      error,
    });
    /* Fail closed. Reported as expired regardless of whether the write
       succeeded. */
    return next;
  }
}

/** For the admin UI and the review queue: how this certificate reads now. */
export function describeCredential(profile, now = Date.now()) {
  const role = normalizeRole(profile?.role ?? profile?.signUpAs);
  if (!requiresCredentialExpiry(role)) return null;

  const raw = profile?.credentialExpiresAt ?? null;
  const at = expiryInstant(raw);

  if (Number.isNaN(at)) {
    return {
      state: 'missing',
      expiresAt: null,
      label: 'No expiry recorded — add the date from the certificate',
    };
  }

  if (at <= now) {
    return {
      state: 'expired',
      expiresAt: raw,
      label: 'Certificate expired — access ends on their next request',
    };
  }

  /* FLOOR, not ceil. The stored date resolves to the END of its day, so a
     certificate expiring "in ten days" is ten and a half days away from a
     midday request. Rounding up would report eleven — a warning that
     overstates the time remaining is the wrong way to be wrong. */
  const days = Math.floor((at - now) / 86400000);

  if (days <= EXPIRY_WARNING_DAYS) {
    return {
      state: 'expiring',
      expiresAt: raw,
      daysRemaining: days,
      label:
        days === 0
          ? 'Expires today'
          : `Expires in ${days} day${days === 1 ? '' : 's'}`,
    };
  }

  return {
    state: 'valid',
    expiresAt: raw,
    daysRemaining: days,
    label: `Valid until ${raw}`,
  };
}
