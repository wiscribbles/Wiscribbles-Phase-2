/**
 * Identity verification — the provider contract.
 *
 * The brief named Persona. The 3 Sept costing ruled it out: US$250/month
 * minimum on a twelve-month contract, against a GYD 600,000 capital base —
 * more than the entire capital over a year. Didit is US$0.33 per check with
 * 500 free monthly and no minimum.
 *
 * Rather than relitigate that, everything above this file speaks one
 * interface, so switching is `KYC_PROVIDER=persona` plus two keys. Code that
 * names a provider outside lib/kyc is a bug.
 *
 * Both providers work the same way, which is what makes the abstraction
 * honest rather than decorative: create a session server-side, send the user
 * to a hosted page, receive a signed webhook when they finish. We never touch
 * a government ID or a selfie — those stay on the provider's origin, which is
 * a meaningfully smaller surface to defend for a notarisation platform.
 *
 * ONE THING THIS DOES NOT DO, and must not be mistaken for: a passed check is
 * platform-level assurance, not the notary's statutory duty. The notary's
 * independent obligation to satisfy themselves of the signer's identity
 * cannot be automated away, and the session UI must never imply that a green
 * tick here discharges it.
 */

export const KYC_STATUS = Object.freeze({
  /** No check started. */
  NOT_STARTED: 'not_started',
  /** Session created, user has not finished. */
  PENDING: 'pending',
  /** Provider is reviewing — some checks are not instant. */
  IN_REVIEW: 'in_review',
  /** Identity confirmed. */
  APPROVED: 'approved',
  /** Check failed. */
  DECLINED: 'declined',
  /** Session expired or abandoned; the user may start again. */
  EXPIRED: 'expired',
});

/** Statuses from which starting a new check is allowed. */
export const RESTARTABLE_KYC_STATUSES = Object.freeze([
  KYC_STATUS.NOT_STARTED,
  KYC_STATUS.DECLINED,
  KYC_STATUS.EXPIRED,
]);

export class KycError extends Error {
  constructor(code, message, { provider = null, cause = null } = {}) {
    super(message);
    this.name = 'KycError';
    this.code = code;
    this.provider = provider;
    this.cause = cause;
  }
}

export const KYC_ERROR = Object.freeze({
  NOT_CONFIGURED: 'not_configured',
  PROVIDER_REJECTED: 'provider_rejected',
  VERIFICATION_FAILED: 'verification_failed',
  NETWORK: 'network',
});

/**
 * @typedef {object} KycSession
 * @property {string} url          hosted verification page to send the user to
 * @property {string} reference    OUR identifier, echoed back by the webhook
 * @property {string} providerRef  the provider's session id
 * @property {string} provider
 */

/**
 * @typedef {object} KycResult
 * @property {boolean} verified    webhook signature checked and valid
 * @property {string}  status      one of KYC_STATUS
 * @property {string}  reference
 * @property {string}  [providerRef]
 * @property {string}  [declineReason]
 * @property {object}  [raw]
 */

export class KycProvider {
  get id() {
    throw new Error('KycProvider subclasses must define id');
  }

  isConfigured() {
    return false;
  }

  unsupported(operation) {
    throw new KycError(
      KYC_ERROR.NOT_CONFIGURED,
      `${this.id} does not implement ${operation}.`,
      { provider: this.id },
    );
  }

  /**
   * Create a verification session.
   * @param {object} options
   * @param {string} options.reference   our id for this check
   * @param {string} options.userId
   * @param {string} options.email
   * @param {string} [options.fullName]
   * @param {string} options.returnUrl   where the user lands afterwards
   * @returns {Promise<KycSession>}
   */
  // eslint-disable-next-line no-unused-vars
  async createSession(options) {
    return this.unsupported('createSession');
  }

  /**
   * Verify and interpret a webhook. MUST check the signature — an unsigned
   * webhook is an open endpoint that lets anyone mark themselves verified.
   * @param {object} input
   * @param {string|Buffer} input.rawBody
   * @param {object} input.headers
   * @returns {Promise<KycResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async verifyWebhook(input) {
    return this.unsupported('verifyWebhook');
  }

  /** Ask the provider directly, for reconciliation when a webhook is missed. */
  // eslint-disable-next-line no-unused-vars
  async fetchStatus(providerRef) {
    return this.unsupported('fetchStatus');
  }
}

export const KYC_NOTES = Object.freeze({
  didit: [
    'Chosen 18 Oct 2026 on cost: ~US$0.33/check, 500 free per month, no minimum.',
    'Endpoint paths and webhook signature scheme are built from published ' +
      'documentation and MUST be verified against a sandbox session before launch.',
  ],
  persona: [
    'Secondary option, not active. US$250/month minimum on a 12-month contract.',
    'Self-serve accounts are limited until you speak to their sales team, so ' +
      'this cannot be stood up quickly in an emergency — which is the usual ' +
      'reason to keep a fallback.',
    'Use the HOSTED flow, not Embedded: it matches this adapter shape. Embedded ' +
      'would put Persona-specific SDK code in the frontend and break the swap.',
  ],
});
