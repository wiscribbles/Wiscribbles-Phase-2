import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/server';
import VerifyEmailPanel from '@/components/auth/VerifyEmailPanel';

export const metadata = {
  title: 'Confirm your email — WiScribbles',
};

/**
 * Where `requireVerifiedUser` sends a signed-in user whose address is not yet
 * confirmed. The one authenticated page an unverified user may open.
 */
export default async function VerifyEmailPage({ params }) {
  const { locale } = await params;
  const user = await getSessionUser();

  if (!user) redirect(`/${locale}/auth/signin`);
  // Already done — nothing to show.
  if (user.emailVerified) redirect(`/${locale}/dashboard`);

  return (
    <main className="container" style={{ maxWidth: 560, padding: '64px 16px' }}>
      <VerifyEmailPanel email={user.email} locale={locale} />
    </main>
  );
}
