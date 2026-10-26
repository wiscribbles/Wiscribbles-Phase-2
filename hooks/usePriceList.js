'use client';

/**
 * The live price list, for any client component that shows a figure.
 *
 * WHY THIS EXISTS. The homepage pricing panel had `15`, `25` and three `$10`s
 * typed into its markup, and `lib/fees.js` held the same numbers for the
 * actual charge. Two copies of a price is one copy too many: the failure mode
 * is a visitor quoted $15 on the homepage and charged $20 at checkout, which
 * is both a support problem and, in Guyana, a consumer-protection one — the
 * Consumer Affairs Act 2011 s.54(1) bites on misrepresentation, and the site's
 * own Terms of Service clause 5 undertakes that fees are displayed before a
 * transaction completes.
 *
 * So no component should contain a price. It asks for one.
 *
 * FALLS BACK RATHER THAN FAILING. If the endpoint cannot be reached the hook
 * returns `null` prices and `failed: true`, and the caller is expected to hide
 * the figure rather than render a zero or a dash where a price should be.
 * Showing "$0" because a fetch failed would be worse than showing nothing.
 */

import { useEffect, useState } from 'react';

/** cents → "$15.00", or "$15" when it is a whole number of dollars. */
export function formatCents(cents) {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return null;
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export function usePriceList() {
  const [state, setState] = useState({ list: null, loading: true, failed: false });

  useEffect(() => {
    let live = true;

    (async () => {
      try {
        const response = await fetch('/api/pricing', { cache: 'no-store' });
        if (!response.ok) throw new Error(String(response.status));
        const list = await response.json();
        if (live) setState({ list, loading: false, failed: false });
      } catch {
        if (live) setState({ list: null, loading: false, failed: true });
      }
    })();

    /* Guards against setting state after unmount — the pricing panel is on the
       homepage, which people leave quickly. */
    return () => {
      live = false;
    };
  }, []);

  return state;
}

/**
 * The figures the pricing panel needs, pulled out by label-independent key.
 *
 * The API returns a labelled list for display; this maps it back to the five
 * figures a layout needs to position, so a panel does not have to index into
 * an array by number and break when a line is added.
 */
export function panelFigures(list) {
  if (!list?.items) return null;

  const at = (index) => list.items[index]?.cents ?? null;

  return {
    baseSingle: at(0),
    baseTwo: at(1),
    additionalSignatory: at(2),
    witness: at(3),
    additionalSeal: at(4),
    esign: at(5),
    prepareRegister: list.prepareRegister ?? null,
    version: list.version ?? null,
  };
}
