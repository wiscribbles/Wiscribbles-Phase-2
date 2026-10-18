import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/server';
import RevocationQueue from '@/components/admin/RevocationQueue';
import { STYLES } from '@/lib/theme';

export const metadata = {
  title: 'Revocation requests — WiScribbles',
};

export const dynamic = 'force-dynamic';

export default async function AdminRevocationsPage({ params }) {
  const { locale } = await params;
  await requireAdmin(locale);

  return (
    <main className="container" style={{ maxWidth: 980, padding: '40px 16px 80px' }}>
      <header className="mb-4">
        <h1 style={STYLES.pageHeading}>Revocation requests</h1>
        <p style={{ ...STYLES.lede, marginBottom: '0.75rem' }}>
          A party cannot withdraw an executed document on their own — other
          people may be relying on it, and they are entitled to have that
          considered. These are the requests, and this is where the question is
          answered.
        </p>
        <div className="d-flex gap-3 flex-wrap" style={{ fontSize: '0.88rem' }}>
          <Link href={`/${locale}/admin/documents`}>← Document repository</Link>
          <Link href={`/${locale}/admin/prepare-register`}>Prepare &amp; Register</Link>
        </div>
      </header>

      <RevocationQueue />
    </main>
  );
}
