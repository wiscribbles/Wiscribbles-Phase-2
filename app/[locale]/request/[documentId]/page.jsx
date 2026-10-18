import { requireVerifiedUser } from '@/lib/auth/server';
import RequestStatus from '@/components/client/RequestStatus';
import { STYLES } from '@/lib/theme';

export const metadata = {
  title: 'Your request — WiScribbles',
};

export const dynamic = 'force-dynamic';

/**
 * The waiting room.
 *
 * Ownership is not checked here — it is checked by the route the component
 * polls, which returns 404 for a document the caller does not own. Checking in
 * both places would mean two answers to the same question, and the one that
 * matters is the one guarding the data.
 */
export default async function RequestStatusPage({ params }) {
  const { locale, documentId } = await params;
  await requireVerifiedUser(locale, { returnTo: `/${locale}/request/${documentId}` });

  return (
    <main className="container" style={{ maxWidth: 820, padding: '40px 16px 80px' }}>
      <header className="mb-4">
        <h1 style={STYLES.pageHeading}>Your request</h1>
      </header>

      <RequestStatus documentId={documentId} locale={locale} />
    </main>
  );
}
