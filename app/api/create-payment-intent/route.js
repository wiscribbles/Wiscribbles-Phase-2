import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireUser } from '@/lib/serverAuth';

export const runtime = 'nodejs';

// Server-side price list in the smallest currency unit (cents). The client may
// only choose WHICH service it wants - never the amount. Adjust to real prices.
const PRICES_USD_CENTS = {
  esign: 1500,
  notary: 3500,
};

export async function POST(request) {
  const { user, error: authError } = await requireUser(request);
  if (authError) return authError;

  try {
    const { serviceType } = await request.json();
    const amount = PRICES_USD_CENTS[serviceType];
    if (!amount) {
      return NextResponse.json({ error: 'Unknown service type' }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { serviceType, uid: user.uid },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: 'Could not create payment' }, { status: 500 });
  }
}
