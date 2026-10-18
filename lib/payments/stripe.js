/**
 * Stripe adapter — subscriptions for attorneys and businesses.
 *
 * Card details never touch our servers: Checkout is hosted by Stripe and we
 * receive an identifier, never a PAN. This is a deliberate correction of the
 * Phase 1 sign-up form, which wrote `card_number`, `expiry_date` and CVV into
 * Firestore in plaintext.
 *
 * PAYOUTS ARE NOT IMPLEMENTED HERE, and that is a decision rather than an
 * omission. Stripe Connect's cross-border payouts reach connected accounts
 * only in the US, UK, EEA, Canada and Switzerland, so they cannot pay a
 * Caribbean notary. Stripe's Global Payouts product does reach Guyana, Jamaica
 * and Trinidad, but requires a US or UK platform carrying its own money-
 * transmission compliance — plausibly a Money Transmitter Licence, since
 * WiScribbles holds the client's fee before passing half to the notary. That
 * is a legal question, not an engineering one, so payouts stay unimplemented
 * until it is answered. See PROVIDER_LIMITATIONS in ./provider.
 */

import Stripe from 'stripe';
import { PaymentError, PAYMENT_ERROR, PaymentProvider } from './provider';

export class StripeProvider extends PaymentProvider {
  constructor({
    secretKey = process.env.STRIPE_SECRET_KEY,
    webhookSecret = process.env.STRIPE_WEBHOOK_SECRET,
  } = {}) {
    super();
    this.secretKey = secretKey;
    this.webhookSecret = webhookSecret;
    this._client = null;
  }

  get id() {
    return 'stripe';
  }

  get capabilities() {
    return {
      subscriptions: true,
      oneOffCharges: true,
      hostedCheckout: true,
      payouts: false, // see the file header
      // Where CUSTOMERS may be, not where we may pay out. Card collection is
      // effectively global; the constraint is on the money leaving again.
      countries: ['*'],
      currencies: ['USD'],
    };
  }

  isConfigured() {
    return Boolean(this.secretKey);
  }

  supportsCountry() {
    return true;
  }

  client() {
    if (!this.isConfigured()) {
      throw new PaymentError(
        PAYMENT_ERROR.NOT_CONFIGURED,
        'Stripe is not configured. Set STRIPE_SECRET_KEY.',
        { provider: this.id },
      );
    }
    if (!this._client) {
      this._client = new Stripe(this.secretKey, {
        appInfo: { name: 'WiScribbles', url: 'https://wiscribbles.com' },
      });
    }
    return this._client;
  }

  /**
   * Start a subscription for a partner who pays.
   *
   * The caller is responsible for having run `assertNotCharged(role)` first —
   * notaries and COaths must never reach this path.
   *
   * @param {object} options
   * @param {object} options.plan             from lib/plans.js
   * @param {string} options.reference        our own id for reconciliation
   * @param {string} options.customerEmail
   * @param {string} options.successUrl
   * @param {string} options.cancelUrl
   * @param {string} [options.customerId]     existing Stripe customer
   * @param {object} [options.metadata]
   */
  async createSubscriptionCheckout({
    plan,
    reference,
    customerEmail,
    successUrl,
    cancelUrl,
    customerId = null,
    metadata = {},
  }) {
    const stripe = this.client();

    try {
      const session = await stripe.checkout.sessions.create(
        {
          mode: 'subscription',
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: 'usd',
                unit_amount: plan.monthlyPriceCents,
                recurring: { interval: 'month' },
                product_data: {
                  name: `WiScribbles ${plan.name}`,
                  description: plan.description,
                },
              },
            },
          ],
          ...(customerId ? { customer: customerId } : { customer_email: customerEmail }),
          client_reference_id: reference,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: { ...metadata, reference, planId: plan.id },
          subscription_data: { metadata: { ...metadata, reference, planId: plan.id } },
        },
        {
          // Stripe deduplicates on this key, so a double-submitted form or a
          // retried request creates one session rather than two subscriptions.
          idempotencyKey: `sub_${reference}`,
        },
      );

      return {
        url: session.url,
        reference,
        providerRef: session.id,
        provider: this.id,
      };
    } catch (cause) {
      throw new PaymentError(
        PAYMENT_ERROR.PROVIDER_REJECTED,
        cause?.message ?? 'Stripe rejected the checkout session.',
        { provider: this.id, cause },
      );
    }
  }

  /** One-off charge — notarisation fee, revocation fee. */
  async createCheckout({
    amountCents,
    currency = 'usd',
    reference,
    description,
    customerEmail,
    successUrl,
    cancelUrl,
    metadata = {},
  }) {
    const stripe = this.client();

    try {
      const session = await stripe.checkout.sessions.create(
        {
          mode: 'payment',
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: currency.toLowerCase(),
                unit_amount: amountCents,
                product_data: { name: description ?? 'WiScribbles' },
              },
            },
          ],
          customer_email: customerEmail,
          client_reference_id: reference,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: { ...metadata, reference },
        },
        { idempotencyKey: `pay_${reference}` },
      );

      return { url: session.url, reference, providerRef: session.id, provider: this.id };
    } catch (cause) {
      throw new PaymentError(
        PAYMENT_ERROR.PROVIDER_REJECTED,
        cause?.message ?? 'Stripe rejected the checkout session.',
        { provider: this.id, cause },
      );
    }
  }

  /**
   * Verify a webhook. The RAW body is required — a parsed-and-restringified
   * body will not match the signature, which is the usual cause of webhooks
   * that verify locally and fail in production.
   *
   * @param {object} input
   * @param {string|Buffer} input.rawBody
   * @param {string} input.signature  the Stripe-Signature header
   */
  async verifyCallback({ rawBody, signature }) {
    if (!this.webhookSecret) {
      throw new PaymentError(
        PAYMENT_ERROR.NOT_CONFIGURED,
        'STRIPE_WEBHOOK_SECRET is not set; webhooks cannot be verified. ' +
          'An unverified webhook must never be acted on.',
        { provider: this.id },
      );
    }

    let event;
    try {
      event = this.client().webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (cause) {
      return {
        verified: false,
        status: 'unknown',
        reference: null,
        failureReason: cause?.message ?? 'Signature verification failed',
      };
    }

    const object = event.data?.object ?? {};
    const reference = object.client_reference_id ?? object.metadata?.reference ?? null;

    const STATUS_BY_EVENT = {
      'checkout.session.completed': 'succeeded',
      'invoice.paid': 'succeeded',
      'invoice.payment_succeeded': 'succeeded',
      'invoice.payment_failed': 'failed',
      'customer.subscription.deleted': 'failed',
    };

    return {
      verified: true,
      status: STATUS_BY_EVENT[event.type] ?? 'pending',
      reference,
      providerRef: object.id ?? null,
      amountCents: object.amount_total ?? object.amount_paid ?? undefined,
      currency: object.currency?.toUpperCase(),
      eventType: event.type,
      raw: event,
    };
  }

  async cancelSubscription({ subscriptionId, immediately = false }) {
    const stripe = this.client();
    try {
      return immediately
        ? await stripe.subscriptions.cancel(subscriptionId)
        : await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    } catch (cause) {
      throw new PaymentError(
        PAYMENT_ERROR.PROVIDER_REJECTED,
        cause?.message ?? 'Stripe could not cancel the subscription.',
        { provider: this.id, cause },
      );
    }
  }

  /** Stripe's own hosted page for changing card or cancelling. */
  async createBillingPortalSession({ customerId, returnUrl }) {
    try {
      const session = await this.client().billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return { url: session.url };
    } catch (cause) {
      throw new PaymentError(
        PAYMENT_ERROR.PROVIDER_REJECTED,
        cause?.message ?? 'Stripe could not open the billing portal.',
        { provider: this.id, cause },
      );
    }
  }
}

export default StripeProvider;
