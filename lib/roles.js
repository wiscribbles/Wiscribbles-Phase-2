/**
 * Single source of truth for roles, account status, and what each role may see.
 *
 * Phase 2 brief: partner roles are Notary, Commissioner of Oaths, Attorney and
 * Business. "Real Estate Agent" was dropped (decision 18 Oct 2026); legacy
 * accounts carrying it are mapped to BUSINESS by `normalizeRole`.
 *
 * Nothing in this file is enforcement — it is the shared vocabulary. Enforcement
 * lives in `lib/auth/server.js` (server components / route handlers), the Next
 * middleware, and the Firestore security rules. All three read from here.
 */

export const ROLES = Object.freeze({
  CLIENT: 'client',
  NOTARY: 'notary',
  COATH: 'coath',
  ATTORNEY: 'attorney',
  BUSINESS: 'business',
  ADMIN: 'admin',
});

/** Roles a member of the public may choose at sign-up. */
export const SELECTABLE_ROLES = Object.freeze([
  ROLES.CLIENT,
  ROLES.NOTARY,
  ROLES.COATH,
  ROLES.ATTORNEY,
  ROLES.BUSINESS,
]);

/** Roles that require Website Manager approval before operating. */
export const PARTNER_ROLES = Object.freeze([
  ROLES.NOTARY,
  ROLES.COATH,
  ROLES.ATTORNEY,
  ROLES.BUSINESS,
]);

/**
 * "Working partners refer to solely Notaries and COaths who provide a service to
 * the website and its users" — brief, Website Manager section. These are the
 * roles that EARN money (Stripe Connect payouts). The others PAY (subscriptions).
 */
export const WORKING_PARTNER_ROLES = Object.freeze([ROLES.NOTARY, ROLES.COATH]);

/** Partner roles that pay a recurring platform fee. */
export const SUBSCRIBER_ROLES = Object.freeze([ROLES.ATTORNEY, ROLES.BUSINESS]);

/**
 * Roles whose practice is confined to the jurisdictions they are licensed in.
 * Attorneys and Businesses are explicitly NOT limited ("Businesses, similar to
 * Attorneys, are not limited to a jurisdiction of Practice" — brief).
 */
export const JURISDICTION_BOUND_ROLES = Object.freeze([ROLES.NOTARY, ROLES.COATH]);

export const ACCOUNT_STATUS = Object.freeze({
  /** Signed up, email not yet confirmed. No dashboard route is reachable. */
  EMAIL_UNVERIFIED: 'email_unverified',
  /** Email confirmed, partner application with the Website Manager. */
  PENDING_REVIEW: 'pending_review',
  /** Manager pressed "Request More Information" — fields re-open. */
  MORE_INFO_REQUESTED: 'more_info_requested',
  /** Cleared to operate. */
  APPROVED: 'approved',
  /** Application refused. */
  REJECTED: 'rejected',
  /** Sanctioned: access withdrawn until `suspendedUntil`, or indefinitely. */
  SUSPENDED: 'suspended',
  /** Removed by the Website Manager. Terminal. */
  REMOVED: 'removed',
});

/** Statuses from which a partner may edit and resubmit their application. */
export const RESUBMITTABLE_STATUSES = Object.freeze([
  ACCOUNT_STATUS.PENDING_REVIEW,
  ACCOUNT_STATUS.MORE_INFO_REQUESTED,
]);

/** Statuses that deny all dashboard access outright. */
export const BLOCKED_STATUSES = Object.freeze([
  ACCOUNT_STATUS.REJECTED,
  ACCOUNT_STATUS.SUSPENDED,
  ACCOUNT_STATUS.REMOVED,
]);

/* ------------------------------------------------------------------------- */
/* Dashboard tabs                                                             */
/* ------------------------------------------------------------------------- */

export const TABS = Object.freeze({
  ACCOUNT: 'account',
  ANALYTICS: 'analytics',
  SUPPORT: 'support',
  FINANCIALS: 'financials',
  APPOINTMENT: 'appointment',
  SOCIAL_MEDIA: 'social-media',
  INVOICE: 'invoice',
  FILE_MANAGER: 'file-manager',
});

/**
 * Which tabs a role sees, before and after approval.
 *
 * Pre-approval sets come straight from the brief:
 *   "Account holders who sign up as notaries are restricted to the Account and
 *    the Financials Tab pending review by the Website Manager."
 *   "Account holders who sign up as attorneys are restricted to the Account and
 *    the Invoice Tab pending review by the Website Manager."
 */
const TAB_MATRIX = Object.freeze({
  [ROLES.NOTARY]: {
    pending: [TABS.ACCOUNT, TABS.FINANCIALS],
    approved: [TABS.ACCOUNT, TABS.ANALYTICS, TABS.SUPPORT, TABS.FINANCIALS],
  },
  // "The Commissioner of Oaths dashboard and verification process is identical
  //  to that of the Notary" — brief.
  [ROLES.COATH]: {
    pending: [TABS.ACCOUNT, TABS.FINANCIALS],
    approved: [TABS.ACCOUNT, TABS.ANALYTICS, TABS.SUPPORT, TABS.FINANCIALS],
  },
  [ROLES.ATTORNEY]: {
    pending: [TABS.ACCOUNT, TABS.INVOICE],
    approved: [
      TABS.ACCOUNT,
      TABS.APPOINTMENT,
      TABS.SOCIAL_MEDIA,
      TABS.ANALYTICS,
      TABS.SUPPORT,
      TABS.INVOICE,
      TABS.FILE_MANAGER,
    ],
  },
  // "Business profiles workflow are similar to that of Attorneys except for the
  //  type of document required to be submitted for approval" — brief.
  [ROLES.BUSINESS]: {
    pending: [TABS.ACCOUNT, TABS.INVOICE],
    approved: [
      TABS.ACCOUNT,
      TABS.APPOINTMENT,
      TABS.SOCIAL_MEDIA,
      TABS.ANALYTICS,
      TABS.SUPPORT,
      TABS.INVOICE,
      TABS.FILE_MANAGER,
    ],
  },
  [ROLES.CLIENT]: {
    pending: [TABS.ACCOUNT],
    approved: [TABS.ACCOUNT],
  },
});

/**
 * The tabs this user may currently open.
 * Returns [] for any status that denies access — callers should never be
 * rendering a dashboard shell in that case.
 */
export function getVisibleTabs(role, status) {
  const entry = TAB_MATRIX[normalizeRole(role)];
  if (!entry) return [];
  if (BLOCKED_STATUSES.includes(status)) return [];
  if (status === ACCOUNT_STATUS.APPROVED) return entry.approved;
  if (RESUBMITTABLE_STATUSES.includes(status)) return entry.pending;
  return [];
}

export function canAccessTab(role, status, tab) {
  return getVisibleTabs(role, status).includes(tab);
}

/* ------------------------------------------------------------------------- */
/* Predicates                                                                 */
/* ------------------------------------------------------------------------- */

export const isPartnerRole = (role) => PARTNER_ROLES.includes(normalizeRole(role));
export const isWorkingPartner = (role) => WORKING_PARTNER_ROLES.includes(normalizeRole(role));
export const isSubscriberRole = (role) => SUBSCRIBER_ROLES.includes(normalizeRole(role));
export const isJurisdictionBound = (role) =>
  JURISDICTION_BOUND_ROLES.includes(normalizeRole(role));
export const isAdmin = (role) => normalizeRole(role) === ROLES.ADMIN;

/** A partner whose application has not yet cleared the Website Manager. */
export const isAwaitingApproval = (role, status) =>
  isPartnerRole(role) && RESUBMITTABLE_STATUSES.includes(status);

/**
 * The status a newly created account starts in. Email is always unverified at
 * this point — the role only decides where they land once it is confirmed.
 */
export const initialStatusFor = () => ACCOUNT_STATUS.EMAIL_UNVERIFIED;

/**
 * The status an account moves to the moment its email is confirmed.
 * Partners go into the review queue; clients are live immediately.
 */
export function statusAfterEmailVerification(role) {
  return isPartnerRole(role) ? ACCOUNT_STATUS.PENDING_REVIEW : ACCOUNT_STATUS.APPROVED;
}

/* ------------------------------------------------------------------------- */
/* Legacy data                                                                */
/* ------------------------------------------------------------------------- */

/**
 * Pre-Phase-2 documents stored a display label in `signUpAs` ("Notary",
 * "Real Estate Agent") and a slug in `role` ("real_estate_agent", "user").
 * This folds every historic spelling onto the Phase 2 vocabulary so old
 * accounts keep working without a destructive migration.
 */
const LEGACY_ROLE_ALIASES = Object.freeze({
  user: ROLES.CLIENT,
  Notary: ROLES.NOTARY,
  Attorney: ROLES.ATTORNEY,
  Business: ROLES.BUSINESS,
  Admin: ROLES.ADMIN,
  'Commissioner of Oaths': ROLES.COATH,
  commissioner_of_oaths: ROLES.COATH,
  commissioner: ROLES.COATH,
  // Dropped 18 Oct 2026 — folded into Business.
  real_estate_agent: ROLES.BUSINESS,
  'Real Estate Agent': ROLES.BUSINESS,
});

export function normalizeRole(value) {
  if (!value) return ROLES.CLIENT;
  if (Object.values(ROLES).includes(value)) return value;
  return LEGACY_ROLE_ALIASES[value] ?? ROLES.CLIENT;
}

/** Legacy `status: 'active'` predates the Phase 2 status model. */
export function normalizeStatus(value) {
  if (!value) return ACCOUNT_STATUS.EMAIL_UNVERIFIED;
  if (Object.values(ACCOUNT_STATUS).includes(value)) return value;
  if (value === 'active') return ACCOUNT_STATUS.APPROVED;
  return ACCOUNT_STATUS.EMAIL_UNVERIFIED;
}

/** Human-readable role label for UI and admin filters. */
export const ROLE_LABELS = Object.freeze({
  [ROLES.CLIENT]: 'Client',
  [ROLES.NOTARY]: 'Notary Public',
  [ROLES.COATH]: 'Commissioner of Oaths',
  [ROLES.ATTORNEY]: 'Attorney',
  [ROLES.BUSINESS]: 'Business',
  [ROLES.ADMIN]: 'Website Manager',
});

export const STATUS_LABELS = Object.freeze({
  [ACCOUNT_STATUS.EMAIL_UNVERIFIED]: 'Email not verified',
  [ACCOUNT_STATUS.PENDING_REVIEW]: 'Pending review',
  [ACCOUNT_STATUS.MORE_INFO_REQUESTED]: 'More information requested',
  [ACCOUNT_STATUS.APPROVED]: 'Approved',
  [ACCOUNT_STATUS.REJECTED]: 'Rejected',
  [ACCOUNT_STATUS.SUSPENDED]: 'Suspended',
  [ACCOUNT_STATUS.REMOVED]: 'Removed',
});
