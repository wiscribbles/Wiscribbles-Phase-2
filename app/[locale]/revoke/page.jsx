import { requireVerifiedUser } from '@/lib/auth/server';
import RevocationRequest from '@/components/client/RevocationRequest';
import { STYLES } from '@/lib/theme';

export const metadata = {
  title: 'Request a revocation — WiScribbles',
};

export const dynamic = 'force-dynamic';

export default async function RevokePage({ params, searchParams }) {
  const { locale } = await params;
  const { documentId } = (await searchParams) ?? {};

  await requireVerifiedUser(locale, { returnTo: `/${locale}/revoke` });

  return (
    <main className="container" style={{ maxWidth: 820, padding: '40px 16px 80px' }}>
      <header className="mb-4">
        <h1 style={STYLES.pageHeading}>Request a revocation</h1>
        <p style={{ ...STYLES.lede, marginBottom: 0 }}>
          Ask for an executed document to be withdrawn. Read the notice below
          before you do — the most common misunderstanding is that the fee buys
          the outcome, and it does not.
        </p>
      </header>

      <RevocationRequest documentId={typeof documentId === 'string' ? documentId : ''} />
    </main>
  );
}
