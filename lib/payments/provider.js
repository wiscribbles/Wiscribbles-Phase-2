/**
 * The payment provider contract.
 *
 * Two providers, because neither one covers the whole business:
 *
 *   STRIPE  collects subscriptions from attorneys and businesses, many of them
 *           diaspora-facing and paying in USD. Mature recurring billing.
 *           Cannot self-serve payouts to Caribbean notaries — see below.
 *
 *   WIPAY   is Caribbean-native and runs a processing platform in Guyana,
 *           Jamaica, Trinidad, Barbados and Grenada. Collects locally.
 *           Has no recurring-billing primitive — see WIPAY_LIMITATIONS.
 *
 * WHY BOTH, in one sentence: Stripe Connect's cross-border payouts only reach
 * connected accounts in the US, UK, EEA, Canada and Switzerland, so it cannot
 * pay a Guyanese notary; Stripe's separate Global Payouts product does reach
 * Guyana but requires a US or UK platform that manages its own money-
 * transmission compliance. WiPay settles locally without that burden.
 *
 * Everything above the adapter speaks this interface and never names a
 * provider. Code that says `if (provider === 'stripe')` outside lib/payments
 * is a bug.
 */

/**
 * @typedef {object} ProviderCapabilities
 * @property {boolean} subscriptions     native recurring billing
 * @property {boolean} oneOffCharges
 * @property {boolean} hostedCheckout    provider hosts the card form (we never see a PAN)
 * @property {boolean} payouts           can send money to a partner
 * @property {string[]} countries        ISO 3166-1 alpha-2 it can process in
 * @property {string[]} currencies
 */

/**
 * @typedef {object} CheckoutSession
 * @property {string} url            where to send the customer
 * @property {string} reference      OUR identifier — the order id we reconcile on
 * @property {string} [providerRef]  the provider's own id, when it gives one at creation
 * @property {string} provider
 */

/**
 * @typedef {object} CallbackResult
 * @property {boolean} verified   cryptographically verified as genuinely from the provider
 * @property {'succeeded'|'failed'|'pending'|'unknown'} status
 * @property {string}  reference
 * @property {string}  [providerRef]
 * @property {number}  [amountCents]
 * @property {string}  [currency]
 * @property {string}  [failureReason]
 * @property {object}  [raw]
 */

/** Thrown for anything a caller might reasonably handle. */
export class PaymentError extends Error {
  constructor(code, message, { provider = null, cause = null } = {}) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.provider = provider;
    this.cause = cause;
  }
}

export const PAYMENT_ERROR = Object.freeze({
  NOT_CONFIGURED: 'not_configured',
  UNSUPPORTED_COUNTRY: 'unsupported_country',
  UNSUPPORTED_OPERATION: 'unsupported_operation',
  PROVIDER_REJECTED: 'provider_rejected',
  VERIFICATION_FAILED: 'verification_failed',
  NETWORK: 'network',
});

/**
 * Base class. Subclasses override what they support; anything left alone
 * throws UNSUPPORTED_OPERATION rather than silently doing nothing, so a
 * missing capability surfaces at the call site instead of as a payment that
 * never happened.
 */
export class PaymentProvider {
  /** @returns {string} */
  get id() {
    throw new Error('PaymentProvider subclasses must define id');
  }

  /** @returns {ProviderCapabilities} */
  get capabilities() {
    return {
      subscriptions: false,
      oneOffCharges: false,
      hostedCheckout: false,
      payouts: false,
      countries: [],
      currencies: [],
    };
  }

  /** True when the provider's credentials are present in the environment. */
  isConfigured() {
    return false;
  }

  supportsCountry(countryCode) {
    return this.capabilities.countries.includes(countryCode);
  }

  supportsCurrency(currency) {
    return this.capabilities.currencies.includes(currency);
  }

  unsupported(operation) {
    throw new PaymentError(
      PAYMENT_ERROR.UNSUPPORTED_OPERATION,
      `${this.id} does not support ${operation}.`,
      { provider: this.id },
    );
  }

  /* --------------------------------------------------------------------- */

  /**
   * Start a subscription.
   * @returns {Promise<CheckoutSession>}
   */
  // eslint-disable-next-line no-unused-vars
  async createSubscriptionCheckout(options) {
    return this.unsupported('subscriptions');
  }

  /**
   * Charge once — a notarisation fee, a revocation fee.
   * @returns {Promise<CheckoutSession>}
   */
  // eslint-disable-next-line no-unused-vars
  async createCheckout(options) {
    return this.unsupported('one-off charges');
  }

  /**
   * Verify something the provider sent us: a webhook body, or the query
   * string on a browser redirect. MUST be cryptographic. A callback that is
   * merely parsed is an open door — anyone can hit a return URL.
   * @returns {Promise<CallbackResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async verifyCallback(input) {
    return this.unsupported('callback verification');
  }

  /** Cancel a subscription. */
  // eslint-disable-next-line no-unused-vars
  async cancelSubscription(options) {
    return this.unsupported('subscription cancellation');
  }

  /** Onboard a partner to receive money. */
  // eslint-disable-next-line no-unused-vars
  async createPayoutRecipient(options) {
    return this.unsupported('payout recipients');
  }

  /** Send money to a partner. */
  // eslint-disable-next-line no-unused-vars
  async sendPayout(options) {
    return this.unsupported('payouts');
  }
}

/**
 * Known constraints, recorded here so they are visible at the point of use
 * rather than rediscovered during an integration.
 *
 * Verified against provider documentation on 18 October 2026. Both vendors
 * change availability; re-check before relying on any line of this.
 */
export const PROVIDER_LIMITATIONS = Object.freeze({
  stripe: [
    'Connect cross-border payouts reach connected accounts only in the US, UK, ' +
      'EEA, Canada and Switzerland. A Guyanese, Jamaican, Trinidadian or ' +
      'Barbadian notary CANNOT be paid this way.',
    'Stripe Global Payouts does reach Guyana (GY/GYD, by wire), Jamaica ' +
      '(JM/JMD, local bank) and Trinidad & Tobago (TT/TTD, local bank), but ' +
      'requires the platform to be in the US or UK, and shifts money-' +
      'transmission compliance onto the platform — potentially a Money ' +
      'Transmitter Licence, since WiScribbles holds a client fee before ' +
      'passing half to the notary. Needs legal advice before use.',
    'Barbados does not appear in the Global Payouts recipient list.',
  ],
  wipay: [
    'NO recurring-billing primitive. The Payments API creates single hosted ' +
      'checkouts. Subscriptions billed through WiPay must be driven by our own ' +
      'scheduler against a stored card (WAPI Trusted Card) or by sending a ' +
      'payment link each month.',
    'The payment request endpoint is UNAUTHENTICATED. The response hash is the ' +
      'only control against forged confirmations, so the API key must never ' +
      'reach the browser.',
    'The response hash is MD5 over transaction_id + original_total + api_key. ' +
      'MD5 is weak, and the scheme has no nonce or timestamp, so a genuine ' +
      'success redirect can be replayed. Fulfilment must be idempotent on ' +
      'order_id.',
    'The `total` in the response is the CUSTOMER-FACING total and may exceed ' +
      'the amount requested, because fees can be passed on. Always hash and ' +
      'reconcile against our own stored original total.',
  ],
});
