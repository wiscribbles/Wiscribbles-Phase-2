'use client';

/**
 * Waits for the user to follow the link in their inbox.
 *
 * Polls GET /api/auth/verification, which reads the Firebase auth record
 * server-side and promotes the account's status the first time it sees the
 * address confirmed. The client never asserts that it is verified — it only
 * asks, and the server decides.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';

const POLL_INTERVAL_MS = 5000;
/** Stop polling after five minutes; the manual button still works. */
const MAX_POLLS = 60;

export default function VerifyEmailPanel({ email, locale }) {
  const router = useRouter();
  const [resendState, setResendState] = useState('idle');
  const [resendMessage, setResendMessage] = useState(null);
  const [checking, setChecking] = useState(false);
  const pollCount = useRef(0);

  const check = useCallback(
    async ({ manual = false } = {}) => {
      if (manual) setChecking(true);
      try {
        const response = await fetch('/api/auth/verification', { cache: 'no-store' });
        if (!response.ok) return false;

        const data = await response.json();
        if (!data.emailVerified) {
          if (manual) setResendMessage('Not confirmed yet — open the link in your inbox.');
          return false;
        }

        /*
         * The session cookie was minted before verification, so its claims still
         * say email_unverified. Force a token refresh and re-exchange it, or the
         * dashboard guard will bounce straight back here.
         */
        try {
          const idToken = await auth.currentUser?.getIdToken(true);
          if (idToken) {
            await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
            });
          }
        } catch {
          // Fall through — a full sign-in will pick up the new claims.
        }

        router.replace(`/${locale}/dashboard`);
        router.refresh();
        return true;
      } catch {
        return false;
      } finally {
        if (manual) setChecking(false);
      }
    },
    [locale, router],
  );

  useEffect(() => {
    let cancelled = false;

    const timer = setInterval(async () => {
      if (cancelled) return;
      pollCount.current += 1;
      if (pollCount.current > MAX_POLLS) {
        clearInterval(timer);
        return;
      }
      await check();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [check]);

  const resend = async () => {
    setResendState('sending');
    setResendMessage(null);
    try {
      const response = await fetch('/api/auth/verification', { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setResendState('sent');
        setResendMessage('Sent. It should arrive within a minute.');
        return;
      }
      setResendState('error');
      setResendMessage(
        response.status === 429
          ? data.message ?? 'Please wait a minute before requesting another email.'
          : 'We could not send that email. Try again shortly.',
      );
    } catch {
      setResendState('error');
      setResendMessage('We could not reach the server. Check your connection.');
    }
  };

  return (
    <>
      <h1 style={{ fontFamily: 'Jost', fontSize: '1.8rem', marginBottom: '1rem' }}>
        Confirm your email address
      </h1>

      <p style={{ fontSize: '1rem', lineHeight: 1.7 }}>
        We sent a link to <strong>{email}</strong>. Open it and this page will move
        you on automatically.
      </p>

      <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
        Your dashboard stays closed until your address is confirmed.
      </p>

      {resendMessage && (
        <div
          className={`alert py-2 ${resendState === 'error' ? 'alert-warning' : 'alert-info'}`}
          role="status"
        >
          {resendMessage}
        </div>
      )}

      <div className="d-flex gap-2 flex-wrap mt-3">
        <button
          type="button"
          className="btn"
          onClick={() => check({ manual: true })}
          disabled={checking}
          style={{ background: '#0C1134', color: '#fff', padding: '0.6rem 1.4rem' }}
        >
          {checking ? 'Checking…' : 'I have confirmed it'}
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={resend}
          disabled={resendState === 'sending'}
          style={{ padding: '0.6rem 1.4rem' }}
        >
          {resendState === 'sending' ? 'Sending…' : 'Send another link'}
        </button>
      </div>
    </>
  );
}
