/**
 * Appointments.
 *
 * Brief: appointment scheduling with a "maximum 24 hour window", and a choice
 * between e-signature only, notarisation, and commissioning.
 *
 * THE READING TAKEN ON "MAXIMUM 24 HOUR WINDOW"
 *
 * The phrase can mean two things: an appointment may be booked at most 24 hours
 * in advance, or an appointment must be honoured within 24 hours of being
 * booked. This implements the first — a booking horizon — because that is what
 * makes the notary side work. Professionals go live and offline; a slot booked
 * three weeks out is a promise the platform cannot keep, since there is no way
 * to know who will be available then and no roster to reserve against. A 24-hour
 * horizon is a promise that can be kept against live availability.
 *
 * The constant is `BOOKING_HORIZON_HOURS` and it is used in exactly one place,
 * so if that reading is wrong the change is one line.
 */

import { ROLES, normalizeRole } from '@/lib/roles';
import { getJurisdiction, supportsNotarization } from '@/lib/jurisdictions';
import { SERVICE_TYPE } from '@/lib/queue';

export const APPOINTMENTS_COLLECTION = 'appointments';

/** How far ahead an appointment may be booked. See the note above. */
export const BOOKING_HORIZON_HOURS = 24;

/** The shortest usable notice. Anything less and nobody can get to it. */
export const MINIMUM_NOTICE_MINUTES = 15;

export const APPOINTMENT_SERVICE = Object.freeze({
  /** Signature only. No professional involved. */
  ESIGN: 'esign',
  /** Requires a Notary Public. */
  NOTARIZATION: SERVICE_TYPE.NOTARIZATION,
  /** Requires a Commissioner of Oaths. */
  COMMISSIONING: SERVICE_TYPE.COMMISSIONING,
});

export const APPOINTMENT_SERVICE_OPTIONS = Object.freeze([
  {
    value: APPOINTMENT_SERVICE.ESIGN,
    label: 'E-signature only',
    description: 'Parties sign. No notary or commissioner attends.',
  },
  {
    value: APPOINTMENT_SERVICE.NOTARIZATION,
    label: 'Notarisation',
    description: 'A Notary Public attends and seals the document.',
    requiresNotarizableJurisdiction: true,
  },
  {
    value: APPOINTMENT_SERVICE.COMMISSIONING,
    label: 'Commissioning of oaths',
    description: 'A Commissioner of Oaths administers the oath or declaration.',
    requiresNotarizableJurisdiction: true,
  },
]);

export const APPOINTMENT_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  IN_SESSION: 'in_session',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  /** Start time passed with nobody attending. */
  MISSED: 'missed',
});

export const ROLE_FOR_APPOINTMENT_SERVICE = Object.freeze({
  [APPOINTMENT_SERVICE.NOTARIZATION]: ROLES.NOTARY,
  [APPOINTMENT_SERVICE.COMMISSIONING]: ROLES.COATH,
  [APPOINTMENT_SERVICE.ESIGN]: null,
});

/* ------------------------------------------------------------------------- */
/* Validation                                                                 */
/* ------------------------------------------------------------------------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validate a proposed appointment.
 *
 * @param {object}   input
 * @param {string}   input.title
 * @param {string}   input.scheduledFor      ISO timestamp
 * @param {string}   input.serviceType       one of APPOINTMENT_SERVICE
 * @param {string}   input.jurisdiction      ISO code
 * @param {object[]} input.participants      [{ name, email }]
 * @param {number}  [now]                    injected for testing
 */
export function validateAppointment(
  { title, scheduledFor, serviceType, jurisdiction, participants = [] },
  now = Date.now(),
) {
  const errors = {};

  if (!title || String(title).trim().length < 3) {
    errors.title = 'Give the appointment a short title.';
  } else if (String(title).trim().length > 140) {
    errors.title = 'Keep the title under 140 characters.';
  }

  if (!Object.values(APPOINTMENT_SERVICE).includes(serviceType)) {
    errors.serviceType = 'Choose what kind of appointment this is.';
  }

  /* ---- the time ------------------------------------------------------- */
  const at = Date.parse(scheduledFor ?? '');

  if (Number.isNaN(at)) {
    errors.scheduledFor = 'Choose a date and time.';
  } else if (at < now + MINIMUM_NOTICE_MINUTES * 60000) {
    errors.scheduledFor =
      `Give at least ${MINIMUM_NOTICE_MINUTES} minutes' notice so a ` +
      'professional can be there.';
  } else if (at > now + BOOKING_HORIZON_HOURS * 3600000) {
    errors.scheduledFor =
      `Appointments can be booked up to ${BOOKING_HORIZON_HOURS} hours ahead. ` +
      'Professionals come online and go offline, so a slot further out than ' +
      'that cannot be guaranteed to anyone.';
  }

  /* ---- the jurisdiction ----------------------------------------------- */
  const place = getJurisdiction(jurisdiction);

  if (!place) {
    errors.jurisdiction = 'Choose a jurisdiction.';
  } else if (!place.launchEnabled) {
    errors.jurisdiction = `WiScribbles does not operate in ${place.name} yet.`;
  } else if (
    serviceType !== APPOINTMENT_SERVICE.ESIGN &&
    !supportsNotarization(jurisdiction)
  ) {
    // The same refusal the template system makes, for the same reason: the
    // instrument would have no statutory effect.
    errors.serviceType =
      `${place.name} law does not give electronic notarisation statutory ` +
      `effect (${place.statute}). This appointment can only be booked as ` +
      `e-signature only.`;
  }

  /* ---- the participants ----------------------------------------------- */
  if (!Array.isArray(participants) || participants.length === 0) {
    errors.participants = 'Add at least one person to invite.';
  } else if (participants.length > 10) {
    errors.participants = 'Up to ten participants per appointment.';
  } else {
    const bad = participants.find((person) => !EMAIL.test(String(person?.email ?? '')));
    if (bad) errors.participants = `"${bad?.email ?? ''}" is not a valid email address.`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** The window a client may pick from, for the date input's min/max. */
export function bookingWindow(now = Date.now()) {
  return {
    earliest: new Date(now + MINIMUM_NOTICE_MINUTES * 60000).toISOString(),
    latest: new Date(now + BOOKING_HORIZON_HOURS * 3600000).toISOString(),
    horizonHours: BOOKING_HORIZON_HOURS,
  };
}

/** Normalise participants to the stored shape. */
export const normalizeParticipants = (participants) =>
  (Array.isArray(participants) ? participants : []).slice(0, 10).map((person) => ({
    name: String(person?.name ?? '').trim().slice(0, 120) || null,
    email: String(person?.email ?? '').trim().toLowerCase().slice(0, 200),
  }));

/** Which professional role, if any, this appointment needs. */
export const professionalRoleFor = (serviceType) =>
  ROLE_FOR_APPOINTMENT_SERVICE[serviceType] ?? null;

export const isOwnRole = (role) =>
  [ROLES.ATTORNEY, ROLES.BUSINESS].includes(normalizeRole(role));
