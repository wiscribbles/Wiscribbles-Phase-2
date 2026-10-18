/**
 * WiPay Payments API adapter.
 *
 * Built against WiPay's published documentation (docs.wipayfinancial.com) as
 * of 18 October 2026. Verify against a sandbox transaction before going live.
 *
 * Request:  POST {base}/plugins/payments/request  with Accept: application/json
 *           → { url, message, transaction_id }
 * Result:   browser GET back to our response_url with the outcome in the query
 *           string, carrying `hash` on success only.
 *
 * SECURITY — three things about this protocol need care:
 *
 *   1. The request endpoint is UNAUTHENTICATED. `account_number` identifies the
 *      merchant and nothing proves the request is ours. The response hash is
 *      therefore the only thing standing between us and a forged "payment
 *      succeeded" redirect, which is why `WIPAY_API_KEY` must never reach the
 *      browser.
 *   2. The response's `total` is the CUSTOMER-FACING total and can exceed what
 *      we asked for, because `fee_structure` may pass fees on. The hash is
 *      computed over OUR original total. Verification therefore requires the
 *      caller to supply the amount from our own records — this module will not
 *      accept the response's own figure, and the signature makes that
 *      impossible to get wrong by accident.
 *   3. There is no nonce or timestamp in the hash, so a genuine success
 *      redirect can be replayed indefinitely. Callers MUST make fulfilment
 *      idempotent on `order_id`.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import { PaymentError, PAYMENT_ERROR, PaymentProvider } from './provider';

/** Processing platforms, each with its own host. */
const PLATFORMS = Object.freeze({
  BB: { live: 'https://bb.wipayfinancial.com', sandbox: 'https://bbsb.wipayfinancial.com' },
  GD: { live: 'https://gd.wipayfinancial.com', sandbox: 'https://gdsb.wipayfinancial.com' },
  GY: { live: 'https://gy.wipayfinancial.com', sandbox: 'https://gysb.wipayfinancial.com' },
  JM: { live: 'https://jm.wipayfinancial.com', sandbox: 'https://jmsb.wipayfinancial.com' },
  TT: { live: 'https://tt.wipayfinancial.com', sandbox: 'https://ttsb.wipayfinancial.com' },
});

/** WiPay's published sandbox merchant. Never a fallback in production. */
const SANDBOX = Object.freeze({ accountNumber: '1234567890', apiKey: '123' });

/** order_id and origin: no leading/trailing underscore or hyphen. */
const ID_PATTERN = /^(?![_-])[a-zA-Z0-9_-]+(?<![_-])$/;

export class WiPayProvider extends PaymentProvider {
  constructor({
    accountNumber = process.env.WIPAY_ACCOUNT_NUMBER,
    apiKey = process.env.WIPAY_API_KEY,
    environment = process.env.WIPAY_ENVIRONMENT ?? 'sandbox',
    defaultCountry = process.env.WIPAY_COUNTRY ?? 'GY',
    origin = process.env.WIPAY_ORIGIN ?? 'wiscribbles',
  } = {}) {
    super();
    this.environment = environment === 'live' ? 'live' : 'sandbox';
    this.defaultCountry = defaultCountry;
    this.origin = origin;

    // In sandbox, fall back to WiPay's published test merchant so the flow is
    // exercisable before credentials exist. Never in live.
    if (this.environment === 'sandbox') {
      this.accountNumber = accountNumber ?? SANDBOX.accountNumber;
      this.apiKey = apiKey ?? SANDBOX.apiKey;
    } else {
      this.accountNumber = accountNumber;
      this.apiKey = apiKey;
    }
  }

  get id() {
    return 'wipay';
  }

  get capabilities() {
    return {
      // No recurring primitive. Monthly billing through WiPay has to be
      // driven by our own scheduler — see PROVIDER_LIMITATIONS.
      subscriptions: false,
      oneOffCharges: true,
      hostedCheckout: true,
      // The Payments API does not pay anyone out. WiPay's WAPI withdrawals
      // endpoints may, but are not integrated here and are not documented
      // well enough to build against blind.
      payouts: false,
      countries: Object.keys(PLATFORMS),
      currencies: ['USD', 'GYD', 'JMD', 'TTD', 'BBD', 'XCD'],
    };
  }

  isConfigured() {
    if (this.environment === 'sandbox') return true;
    return Boolean(this.accountNumber && this.apiKey);
  }

  baseUrl(countryCode) {
    const platform = PLATFORMS[countryCode];
    if (!platform) {
      throw new PaymentError(
        PAYMENT_ERROR.UNSUPPORTED_COUNTRY,
        `WiPay has no processing platform for "${countryCode}". ` +
          `Supported: ${Object.keys(PLATFORMS).join(', ')}.`,
        { provider: this.id },
      );
    }
    return platform[this.environment];
  }

  /**
   * Create a hosted checkout.
   *
   * @param {object}  options
   * @param {number}  options.amountCents      integer cents
   * @param {string}  options.currency         ISO 4217
   * @param {string}  options.reference        our order id (≤16 chars recommended)
   * @param {string}  options.responseUrl      absolute URL WiPay redirects back to
   * @param {string}  options.customerEmail    must differ from the merchant's own
   * @param {string} [options.countryCode]     processing platform
   * @param {string} [options.customerName]
   * @param {string} [options.customerPhone]   E.164
   * @param {object} [options.metadata]        echoed back in `data`
   * @param {'customer_pay'|'merchant_absorb'|'split'} [options.feeStructure]
   * @returns {Promise<import('./provider').CheckoutSession>}
   */
  async createCheckout({
    amountCents,
    currency,
    reference,
    responseUrl,
    customerEmail,
    countryCode = this.defaultCountry,
    customerName = null,
    customerPhone = null,
    metadata = null,
    feeStructure = 'merchant_absorb',
  }) {
    if (!this.isConfigured()) {
      throw new PaymentError(
        PAYMENT_ERROR.NOT_CONFIGURED,
        'WiPay is not configured. Set WIPAY_ACCOUNT_NUMBER and WIPAY_API_KEY.',
        { provider: this.id },
      );
    }

    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new PaymentError(
        PAYMENT_ERROR.PROVIDER_REJECTED,
        'amountCents must be a positive integer number of cents.',
        { provider: this.id },
      );
    }

    if (!ID_PATTERN.test(reference)) {
      throw new PaymentError(
        PAYMENT_ERROR.PROVIDER_REJECTED,
        `Invalid reference "${reference}". Letters, digits, hyphen and underscore ` +
          'only, and it may not start or end with a hyphen or underscore.',
        { provider: this.id },
      );
    }

    // WiPay wants a decimal string with exactly two places, not cents.
    const total = (amountCents / 100).toFixed(2);

    const payload = {
      account_number: String(this.accountNumber),
      total,
      currency,
      country_code: countryCode,
      environment: this.environment,
      order_id: reference,
      origin: this.origin,
      response_url: responseUrl,
      fee_structure: feeStructure,
      method: '3co_simple',
      email: customerEmail,
    };

    if (customerName) payload.name = customerName.slice(0, 60);
    if (customerPhone) payload.phone = customerPhone;
    if (metadata) payload.data = JSON.stringify(metadata).slice(0, 4096);

    let response;
    try {
      response = await fetch(`${this.baseUrl(countryCode)}/plugins/payments/request`, {
        method: 'POST',
        headers: {
          // Without this, WiPay returns a browser redirect instead of JSON.
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (cause) {
      throw new PaymentError(PAYMENT_ERROR.NETWORK, 'Could not reach WiPay.', {
        provider: this.id,
        cause,
      });
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok || !body.url) {
      throw new PaymentError(
        PAYMENT_ERROR.PROVIDER_REJECTED,
        body.message ?? `WiPay rejected the request (HTTP ${response.status}).`,
        { provider: this.id },
      );
    }

    return {
      url: body.url,
      reference,
      providerRef: body.transaction_id || null,
      provider: this.id,
      // The caller MUST persist this against the order. Verification needs the
      // amount we asked for, and the response cannot be trusted to supply it.
      originalTotal: total,
    };
  }

  /**
   * Verify the redirect WiPay sends to our response_url.
   *
   * @param {object} input
   * @param {URLSearchParams|object} input.params     the query string
   * @param {number}                 input.expectedAmountCents  FROM OUR OWN RECORDS
   * @returns {Promise<import('./provider').CallbackResult>}
   */
  async verifyCallback({ params, expectedAmountCents }) {
    const get = (key) =>
      params instanceof URLSearchParams ? params.get(key) : (params?.[key] ?? null);

    const status = (get('status') ?? '').toLowerCase();
    const reference = get('order_id');
    const transactionId = get('transaction_id');
    const hash = get('hash');

    const base = {
      reference,
      providerRef: transactionId,
      currency: get('currency') ?? undefined,
      raw: params instanceof URLSearchParams ? Object.fromEntries(params) : params,
    };

    // The hash is only present on success, so a failure cannot be verified —
    // and does not need to be, because nothing is fulfilled on a failure.
    if (status !== 'success') {
      return {
        ...base,
        verified: false,
        status: status === 'failed' ? 'failed' : 'unknown',
        failureReason: get('message') ?? undefined,
      };
    }

    if (!hash || !transactionId) {
      return { ...base, verified: false, status: 'unknown', failureReason: 'Missing hash' };
    }

    if (!Number.isInteger(expectedAmountCents)) {
      throw new PaymentError(
        PAYMENT_ERROR.VERIFICATION_FAILED,
        'expectedAmountCents is required and must come from your own record of ' +
          "the order. The response's own `total` is the customer-facing figure " +
          'and may include passed-on fees, so it will not reproduce the hash.',
        { provider: this.id },
      );
    }

    const expected = createHash('md5')
      .update(`${transactionId}${(expectedAmountCents / 100).toFixed(2)}${this.apiKey}`)
      .digest('hex');

    if (!constantTimeEquals(expected, hash)) {
      return {
        ...base,
        verified: false,
        status: 'failed',
        failureReason: 'Response hash did not verify',
      };
    }

    return {
      ...base,
      verified: true,
      status: 'succeeded',
      amountCents: expectedAmountCents,
    };
  }
}

/**
 * Compare without leaking position-of-first-difference through timing.
 * Both sides are hashed first so that differing lengths cannot throw and the
 * comparison is always over equal-length buffers.
 */
function constantTimeEquals(a, b) {
  const bufA = createHash('sha256').update(String(a)).digest();
  const bufB = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(bufA, bufB);
}

export default WiPayProvider;
