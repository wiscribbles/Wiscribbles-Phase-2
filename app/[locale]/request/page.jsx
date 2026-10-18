import { requireVerifiedUser } from '@/lib/auth/server';
import RequestWizard from '@/components/client/RequestWizard';
import { STYLES } from '@/lib/theme';

export const metadata = {
  title: 'Request a notarisation — WiScribbles',
};

export const dynamic = 'force-dynamic';

/**
 * The client's request flow.
 *
 * `requireVerifiedUser` rather than a client-role guard: an attorney or a
 * business has documents of their own to execute, and nothing about this flow
 * is specific to a client account. What it does require is a verified email,
 * because the request creates a document and joins a queue of real people.
 */
export default async function RequestPage({ params }) {
  const { locale } = await params;
  await requireVerifiedUser(locale, { returnTo: `/${locale}/request` });

  return (
    <main className="container" style={{ maxWidth: 820, padding: '40px 16px 80px' }}>
      <header className="mb-4">
        <h1 style={STYLES.pageHeading}>Have a document notarised</h1>
        <p style={{ ...STYLES.lede, marginBottom: 0 }}>
          Five steps. We check that what you are asking for has legal effect
          where you need it before you upload anything or pay anything.
        </p>
      </header>

      <RequestWizard locale={locale} />
    </main>
  );
}
