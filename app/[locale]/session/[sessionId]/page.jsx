import { requireVerifiedUser } from '@/lib/auth/server';
import SessionView from '@/components/session/SessionView';

export const metadata = {
  title: 'Session — WiScribbles',
};

export const dynamic = 'force-dynamic';

/**
 * A live session.
 *
 * Participation is NOT checked here. It is checked by `/api/sessions`, which
 * returns 404 for a session the caller is not a party to, and again by
 * `/api/sessions/token`, which is what actually admits anyone to the call. One
 * guard, at the thing being guarded. A page-level check would be a second
 * answer to the same question and would eventually disagree with the first.
 *
 * What this page does require is a verified, unblocked account, because
 * `requireVerifiedUser` is also what bounces a suspended professional — and a
 * suspension that lapsed is lifted on the way through.
 */
export default async function SessionPage({ params }) {
  const { locale, sessionId } = await params;
  const user = await requireVerifiedUser(locale, {
    returnTo: `/${locale}/session/${sessionId}`,
  });

  return (
    <main className="container" style={{ maxWidth: 1180, padding: '28px 16px 64px' }}>
      <SessionView
        sessionId={sessionId}
        locale={locale}
        userName={user.name ?? user.email ?? 'Participant'}
      />
    </main>
  );
}
