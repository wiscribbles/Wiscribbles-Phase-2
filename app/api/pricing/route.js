/**
 * The published price list — public.
 *
 *   GET → the list in force, for the pricing panel and any page that quotes a
 *         figure to a visitor.
 *
 * DELIBERATELY UNAUTHENTICATED. A price list is published information; the
 * marketing site shows it to people who have no account, and the site's own
 * Terms of Service clause 5 undertakes that fees are displayed before a
 * transaction completes. Requiring a session to read a price would mean the
 * homepage could not honour that.
 *
 * WHY THIS ROUTE EXISTS AT ALL, rather than the figures being imported into
 * the page: until now the homepage panel had `$15`, `$25` and three `$10`s
 * typed into the markup. Those are the kind of numbers that get changed in one
 * place and not the other, and the failure mode is a client quoted one price
 * on the homepage and charged another at checkout. One source, read at
 * request time, is what stops that.
 *
 * It returns prices only — no override metadata, no who-changed-it, nothing
 * about the manager. Those belong to `/api/admin/pricing`.
 */

import { NextResponse } from 'next/server';
import { getPriceList } from '@/lib/pricing';
import { publishedPriceList } from '@/lib/fees';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { prices, version } = await getPriceList();

  return NextResponse.json(publishedPriceList(prices, version), {
    headers: {
      /* Briefly cacheable, revalidated in the background. A price change
         should reach the site in seconds, not on the next deploy, but a
         pricing panel does not need to hit Firestore once per visitor. */
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=300',
    },
  });
}
