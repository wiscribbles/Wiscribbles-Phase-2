/**
 * Provider selection.
 *
 * Call `getProviderFor(...)` and never construct a provider directly outside
 * this file. The routing rules live here so that changing them — when WiPay
 * gains recurring billing, or when the Global Payouts legal question is
 * settled — is a change in one place.
 *
 * The rules, and why:
 *
 *   SUBSCRIPTIONS → Stripe. WiPay's Payments API has no recurring primitive,
 *   so billing an attorney monthly through WiPay would mean running our own
 *   scheduler against a stored card. Stripe does this properly, and the
 *   subscribers are the segment most able to pay in USD.
 *
 *   ONE-OFF CHARGES → WiPay where the client is in a WiPay country, Stripe
 *   otherwise. A Guyanese client paying a notarisation fee gets a local
 *   gateway and local methods; the diaspora client paying from Queens gets
 *   Stripe.
 *
 *   PAYOUTS → neither, yet. See PROVIDER_LIMITATIONS. This is the open
 *   question that blocks the notary Financials tab.
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

/** Countries WiPay can process in. */
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
    const preferred = prefer === 'stripe' ? stripe() : prefer === 'wipay' ? wipay() : null;
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
    if (countryCode && WIPAY_COUNTRIES.has(countryCode) && wipay().isConfigured()) {
      return wipay();
    }
    const provider = stripe();
    if (!provider.isConfigured()) {
      throw new PaymentError(
        PAYMENT_ERROR.NOT_CONFIGURED,
        'No payment provider is configured for this charge.',
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

/** Look a provider up by id, for verifying a callback from a stored record. */
export function getProviderById(id) {
  if (id === 'stripe') return stripe();
  if (id === 'wipay') return wipay();
  throw new PaymentError(PAYMENT_ERROR.UNSUPPORTED_OPERATION, `Unknown provider "${id}".`);
}

/** For the admin dashboard: what is actually wired up right now. */
export function providerStatus() {
  const describe = (provider) => ({
    id: provider.id,
    configured: provider.isConfigured(),
    capabilities: provider.capabilities,
    limitations: PROVIDER_LIMITATIONS[provider.id] ?? [],
  });
  return [describe(stripe()), describe(wipay())];
}
