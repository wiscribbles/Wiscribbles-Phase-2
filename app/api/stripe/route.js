import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireUser } from '@/lib/serverAuth';
import { getBaseUrl } from '@/lib/apiUtils';

export const runtime = 'nodejs';

export async function POST(request) {
  const { error: authError } = await requireUser(request, { roles: ['notary', 'admin'] });
  if (authError) return authError;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = getBaseUrl();

    // 1. Create a connected account
    const account = await stripe.accounts.create({ type: 'express' });

    // 2. Generate account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/en/form2-page4`,
      return_url: `${baseUrl}/en/form2-page5`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe API error:', error);
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}
