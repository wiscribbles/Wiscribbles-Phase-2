import Link from 'next/link';

export const metadata = {
  title: 'Confirm your email — WiScribbles',
};

/**
 * Shown straight after sign-up. The account exists but no session has been
 * created, so this page is deliberately public — the user is not signed in yet
 * and will not be until their address is confirmed.
 */
export default async function CheckEmailPage({ params, searchParams }) {
  const { locale } = await params;
  const { email } = await searchParams;

  return (
    <main className="container" style={{ maxWidth: 560, padding: '64px 16px' }}>
      <h1 style={{ fontFamily: 'Jost', fontSize: '1.8rem', marginBottom: '1rem' }}>
        Check your email
      </h1>

      <p style={{ fontSize: '1rem', lineHeight: 1.7 }}>
        {email ? (
          <>
            We have sent a confirmation link to <strong>{email}</strong>.
          </>
        ) : (
          'We have sent you a confirmation link.'
        )}{' '}
        Open it to activate your account — your dashboard stays closed until you do.
      </p>

      <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
        The link expires in 24 hours. If it does not arrive within a few minutes,
        check your spam folder. You can request a new one after signing in.
      </p>

      <Link
        href={`/${locale}/auth/signin`}
        className="btn"
        style={{ background: '#0C1134', color: '#fff', padding: '0.6rem 1.4rem' }}
      >
        Go to sign in
      </Link>
    </main>
  );
}
