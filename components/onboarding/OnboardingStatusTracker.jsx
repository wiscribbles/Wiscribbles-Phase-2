'use client';

/**
 * The holding dashboard a partner sees between email verification and approval.
 *
 *   "On submission, view switches to status tracker. Display Admin feedback
 *    (user.admin_feedback) and re-open fields for resubmission upon
 *    'Request More Information' action."  — Phase 2 brief
 *
 * Tab contents land in Stage 2 (jurisdictions, KYC, certificate upload, Stripe
 * onboarding). What is live now is the part that governs access: which tabs
 * exist for this role, the status the application is in, and the Website
 * Manager's feedback when they have asked for more.
 */

import { useState } from 'react';
import { ACCOUNT_STATUS, STATUS_LABELS, TABS } from '@/lib/roles';
import AccountTab from './AccountTab';

const TAB_LABELS = {
  [TABS.ACCOUNT]: 'Account',
  [TABS.FINANCIALS]: 'Financials',
  [TABS.INVOICE]: 'Invoice',
};

const STATUS_TONE = {
  [ACCOUNT_STATUS.PENDING_REVIEW]: { bg: '#eef2f9', fg: '#274171', dot: '#4b6fae' },
  [ACCOUNT_STATUS.MORE_INFO_REQUESTED]: { bg: '#fff6e5', fg: '#8a5a00', dot: '#d39106' },
};

const STEPS = [
  { key: 'email', label: 'Email confirmed' },
  { key: 'details', label: 'Professional details' },
  { key: 'review', label: 'Website Manager review' },
  { key: 'approved', label: 'Approved' },
];

function stepStateFor(status, index) {
  // Email is confirmed by the time this page is reachable at all.
  if (index === 0) return 'done';
  if (status === ACCOUNT_STATUS.MORE_INFO_REQUESTED) {
    return index === 1 ? 'action' : 'pending';
  }
  if (index === 1) return 'done';
  if (index === 2) return 'current';
  return 'pending';
}

export default function OnboardingStatusTracker({
  roleLabel,
  status,
  adminFeedback,
  canResubmit,
  tabs,
  financialTab,
  isWorkingPartner,
  jurisdictions,
}) {
  const [activeTab, setActiveTab] = useState(tabs[0] ?? TABS.ACCOUNT);
  const tone = STATUS_TONE[status] ?? STATUS_TONE[ACCOUNT_STATUS.PENDING_REVIEW];

  return (
    <main className="container" style={{ maxWidth: 940, padding: '48px 16px 80px' }}>
      <header className="mb-4">
        <p className="text-muted mb-1" style={{ fontSize: '0.85rem', letterSpacing: '0.04em' }}>
          {roleLabel.toUpperCase()} APPLICATION
        </p>
        <h1 style={{ fontFamily: 'Jost', fontSize: '1.9rem', marginBottom: '0.75rem' }}>
          Complete your application
        </h1>
        <span
          className="d-inline-flex align-items-center gap-2 rounded-pill px-3 py-1"
          style={{ background: tone.bg, color: tone.fg, fontSize: '0.87rem', fontWeight: 600 }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: tone.dot,
              display: 'inline-block',
            }}
          />
          {STATUS_LABELS[status]}
        </span>
      </header>

      {/* Progress */}
      <ol
        className="list-unstyled d-flex flex-wrap gap-3 mb-4 pb-3"
        style={{ borderBottom: '1px solid #e6e9ef' }}
      >
        {STEPS.map((step, index) => {
          const state = stepStateFor(status, index);
          const color =
            state === 'done'
              ? '#1b7f4b'
              : state === 'action'
                ? '#d39106'
                : state === 'current'
                  ? '#274171'
                  : '#9aa5b5';
          return (
            <li key={step.key} className="d-flex align-items-center gap-2">
              <span
                aria-hidden="true"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `2px solid ${color}`,
                  background: state === 'done' ? color : 'transparent',
                  display: 'inline-block',
                }}
              />
              <span style={{ color, fontSize: '0.9rem', fontWeight: state === 'pending' ? 400 : 600 }}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Website Manager feedback */}
      {adminFeedback && (
        <div
          className="rounded p-3 mb-4"
          style={{ background: '#fff6e5', borderLeft: '3px solid #d39106' }}
        >
          <p className="fw-semibold mb-1" style={{ color: '#8a5a00' }}>
            The Website Manager needs more information
          </p>
          <p className="mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {adminFeedback}
          </p>
        </div>
      )}

      {/* Pre-approval tabs */}
      <nav
        className="d-flex gap-1 mb-0"
        role="tablist"
        aria-label="Application sections"
        style={{ borderBottom: '1px solid #e6e9ef' }}
      >
        {tabs.map((tab) => {
          const active = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab)}
              className="btn"
              style={{
                borderRadius: 0,
                border: 'none',
                borderBottom: `2px solid ${active ? '#274171' : 'transparent'}`,
                color: active ? '#274171' : '#6b7684',
                fontWeight: active ? 600 : 500,
                padding: '0.6rem 1rem',
              }}
            >
              {TAB_LABELS[tab] ?? tab}
            </button>
          );
        })}
      </nav>

      <section className="pt-4" role="tabpanel">
        {activeTab === TABS.ACCOUNT ? (
          <AccountTab canEdit />
        ) : (
          <FinancialPanel tab={financialTab} canResubmit={canResubmit} />
        )}
      </section>

      <p className="text-muted mt-5 mb-0" style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
        Your remaining tabs open once the Website Manager approves your application.
        We will email you as soon as there is a decision.
      </p>
    </main>
  );
}

/* ------------------------------------------------------------------------- */

function Placeholder({ title, items }) {
  return (
    <div className="rounded p-4" style={{ background: '#f7f8fa', border: '1px dashed #d4d9e2' }}>
      <p className="fw-semibold mb-2">{title}</p>
      <ul className="mb-0 text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.9 }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}


function FinancialPanel({ tab, canResubmit }) {
  const isPayout = tab === TABS.FINANCIALS;
  return (
    <Placeholder
      title={canResubmit ? 'Update your payment details' : isPayout ? 'How you get paid' : 'Your subscription'}
      items={
        isPayout
          ? [
              'Bank details for revenue distribution, captured and tokenised by the payment processor',
              'Bank details are never stored on WiScribbles servers',
              'Payouts begin once the Website Manager approves your account',
            ]
          : [
              'Subscription plan selection',
              'Card details, captured and tokenised by the payment processor',
              'Card details are never stored on WiScribbles servers',
            ]
      }
    />
  );
}
