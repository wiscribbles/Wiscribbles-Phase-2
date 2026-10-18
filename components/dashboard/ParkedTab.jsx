'use client';

/**
 * A tab that exists, is reachable, and is honest about not working yet.
 *
 * The Financials and Invoice tabs are both held back on a decision that is not
 * a coding decision: whether service-fee distribution to Caribbean notaries
 * runs through Stripe or WiPay, which turns on money-transmission licensing.
 * That was deferred until WiPay is fully set up.
 *
 * The alternative — building a payout screen against a guess — would be worse
 * than this placeholder. If the answer comes back the other way, a bank-detail
 * capture form built for the wrong provider is not half-finished work, it is
 * work that has to be removed, after people have already entered their bank
 * details into it.
 *
 * So the tab says what it is waiting for. A partner reading it learns something
 * true, which is more than a spinner or an empty state would give them.
 */

import { COLORS, STYLES } from '@/lib/theme';

export default function ParkedTab({ title, waitingOn, meanwhile = null }) {
  return (
    <div style={{ maxWidth: 680 }}>
      <h2 style={STYLES.sectionHeading}>{title}</h2>

      <div className="p-4 mt-3" style={{ ...STYLES.card, background: COLORS.surface }}>
        <p className="mb-0" style={{ color: COLORS.inkSubtle, lineHeight: 1.7 }}>
          {waitingOn}
        </p>

        {meanwhile && (
          <p className="mb-0 mt-3" style={{ color: COLORS.inkMuted, fontSize: '0.9rem', lineHeight: 1.7 }}>
            {meanwhile}
          </p>
        )}
      </div>
    </div>
  );
}
