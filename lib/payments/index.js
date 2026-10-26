/**
 * Provider selection.
 *
 * Call `getProviderFor(...)` and never construct a provider directly outside
 * this file.
 *
 * ── STRIPE IS THE ONLY PROVIDER (26 October 2026) ───────────────────────────
 *
 * WiPay is DISABLED by instruction. Every charge, one-off or subscription,
 * goes to Stripe.
 *
 * The adapter is kept rather than deleted, for two reasons: `getProviderById`
 * must still be able to verify a stored record if one ever turns up, and the
 * work in `lib/payments/wipay.js` — the hash verification in particular — is
 * correct and was expensive to get right. Re-enabling is `WIPAY_ENABLED = true`
 * here and nothing else.
 *
 * WHAT THIS DOES AND DOES NOT SOLVE. It settles which gateway collects the
 * money. It does NOT settle whose money it is on the way through, which is
 * the question that actually governs licensing:
 *
 *   - A Stripe account in WiScribbles' name, collecting a notarisation fee and
 *     later paying the professional, is collect-and-pay. That is the fact
 *     pattern behind the payment-licence requirement in Guyana (National
 *     Payments System Act ss.7–8), Trinidad (Central Bank registration) and
 *     Barbados (Payment Institution licence, where "bill or payment
 *     aggregation" is the limb that catches it, plus physical presence), and
 *     it pulls AML registration along behind it in two of them.
 *   - Stripe Connect with the professional as the connected account, settling
 *     to them directly, avoids all of that — but Stripe Connect's country
 *     support does not currently reach Caribbean notaries, which is recorded
 *     in PROVIDER_LIMITATIONS and is why PAYOUT still throws below.
 *
 * So switching to Stripe does not remove the licensing question; it changes
 * which provider the answer has to be implemented against. Nothing here
 * decides it, and no code in this module may be read as deciding it.
 *
 *   SUBSCRIPTIONS → Stripe. Proper recurring billing.
 *   ONE-OFF CHARGES → Stripe, in every country.
 *   PAYOUTS → nothing. See PROVIDER_LIMITATIONS.
 */

import { PaymentError, PAYMENT_ERROR, PROVIDER_LIMITATIONS } from './provider';
import { StripeProvider } from './stripe';
import { WiPayProvider } from './wipay';

export { PaymentError, PAYMENT_ERROR, PROVIDER_LIMITATIONS };
export { StripeProvider, WiPayProvider };

export const PURPOSE = Object.freeze({
  SUBSCRIPTION: 'subscription',
  ONE_OFF: 'one_off',
  PAYOUT: 'payout',
});

/* Providers are stateless over a request, so one instance each is fine. */
let stripeInstance = null;
let wipayInstance = null;

export const stripe = () => (stripeInstance ??= new StripeProvider());
export const wipay = () => (wipayInstance ??= new WiPayProvider());

/**
 * THE SWITCH. False means no charge is ever routed to WiPay, whatever the
 * payer's country and whatever is in the environment — a configured
 * `WIPAY_API_KEY` does not re-enable it, which is the point: disabling a
 * provider by removing its credentials is not disabling it, it is leaving a
 * live path behind a blank variable.
 *
 * Setting this true restores the previous routing (WiPay for one-off charges
 * in BB, GD, GY, JM and TT; Stripe elsewhere) and nothing else needs to
 * change.
 */
const WIPAY_ENABLED = false;

/** Countries WiPay can process in. Unused while WIPAY_ENABLED is false. */
const WIPAY_COUNTRIES = new Set(['BB', 'GD', 'GY', 'JM', 'TT']);

/**
 * @param {object}  args
 * @param {string}  args.purpose       one of PURPOSE
 * @param {string} [args.countryCode]  where the PAYER is
 * @param {string} [args.prefer]       'stripe' | 'wipay' — honoured if capable
 * @returns {import('./provider').PaymentProvider}
 */
export function getProviderFor({ purpose, countryCode = null, prefer = null }) {
  if (purpose === PURPOSE.PAYOUT) {
    throw new PaymentError(
      PAYMENT_ERROR.UNSUPPORTED_OPERATION,
      'No payout provider is available yet. Stripe Connect cannot reach ' +
        'Caribbean notaries, Stripe Global Payouts needs a legal decision on ' +
        'money transmission, and WiPay payouts are not integrated. ' +
        'See PROVIDER_LIMITATIONS.',
    );
  }

  if (prefer) {
    /* A preference for a disabled provider is ignored rather than honoured.
       `prefer` is a hint from a caller, and a hint must not be able to reach
       a provider the platform has switched off. */
    const preferred =
      prefer === 'stripe'
        ? stripe()
        : prefer === 'wipay' && WIPAY_ENABLED
          ? wipay()
          : null;
    if (preferred && providerCan(preferred, purpose, countryCode)) return preferred;
    // Fall through rather than fail — a preference is a hint, not a constraint.
  }

  if (purpose === PURPOSE.SUBSCRIPTION) {
    const provider = stripe();
    if (!provider.isConfigured()) {
      throw new PaymentError(
        PAYMENT_ERROR.NOT_CONFIGURED,
        'Subscriptions require Stripe, which is not configured. Set STRIPE_SECRET_KEY.',
      );
    }
    return provider;
  }

  if (purpose === PURPOSE.ONE_OFF) {
    if (WIPAY_ENABLED && countryCode && WIPAY_COUNTRIES.has(countryCode) && wipay().isConfigured()) {
      return wipay();
    }

    const provider = stripe();
    if (!provider.isConfigured()) {
      /* Names Stripe specifically. The old message said "no payment provider
         is configured", which was true when there were two and useless for
         working out what to do about it. */
      throw new PaymentError(
        PAYMENT_ERROR.NOT_CONFIGURED,
        'Stripe is not configured, and it is the only payment provider. Set ' +
          'STRIPE_SECRET_KEY.',
      );
    }
    return provider;
  }

  throw new PaymentError(PAYMENT_ERROR.UNSUPPORTED_OPERATION, `Unknown purpose "${purpose}".`);
}

function providerCan(provider, purpose, countryCode) {
  if (!provider.isConfigured()) return false;
  const caps = provider.capabilities;
  if (purpose === PURPOSE.SUBSCRIPTION && !caps.subscriptions) return false;
  if (purpose === PURPOSE.ONE_OFF && !caps.oneOffCharges) return false;
  if (countryCode && !caps.countries.includes('*') && !caps.countries.includes(countryCode)) {
    return false;
  }
  return true;
}

/**
 * Look a provider up by id, for verifying a callback from a stored record.
 *
 * WiPay resolves here even while disabled, deliberately. This path is
 * read-only — it verifies a response hash against a record that already
 * exists — and refusing to verify a record that exists would be worse than
 * verifying it: a payment stuck unverifiable is a payment nobody can account
 * for. Disabling WiPay stops new charges being created, which is the part
 * that matters.
 *
 * In practice no such record should exist: WiPay collection was never
 * switched on. One turning up is worth investigating, hence the warning.
 */
export function getProviderById(id) {
  if (id === 'stripe') return stripe();
  if (id === 'wipay') {
    if (!WIPAY_ENABLED) {
      console.warn(
        '[payments] A WiPay record was looked up while WiPay is disabled. ' +
          'Verification is allowed, but no new WiPay charge can be created — ' +
          'worth checking where this record came from.',
      );
    }
    return wipay();
  }
  throw new PaymentError(PAYMENT_ERROR.UNSUPPORTED_OPERATION, `Unknown provider "${id}".`);
}

/** For the admin dashboard: what is actually wired up right now. */
export function providerStatus() {
  const describe = (provider, { enabled = true } = {}) => ({
    id: provider.id,
    enabled,
    /* `configured` and `enabled` are reported separately on purpose. WiPay
       credentials may still sit in the environment, and a dashboard that
       showed only "configured" would imply it was in use. */
    configured: provider.isConfigured(),
    capabilities: provider.capabilities,
    limitations: PROVIDER_LIMITATIONS[provider.id] ?? [],
    ...(enabled
      ? {}
      : {
          disabledReason:
            'Disabled by platform decision on 26 October 2026. All payments ' +
            'are routed through Stripe.',
        }),
  });

  return [describe(stripe()), describe(wipay(), { enabled: WIPAY_ENABLED })];
}

/** Whether WiPay is switched on, for anything that needs to say so. */
export const wipayEnabled = () => WIPAY_ENABLED;
