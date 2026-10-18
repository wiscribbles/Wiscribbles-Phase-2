import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/server';
import DocumentRepository from '@/components/admin/DocumentRepository';
import { STYLES } from '@/lib/theme';

export const metadata = {
  title: 'Document repository — WiScribbles',
};

export const dynamic = 'force-dynamic';

export default async function AdminDocumentsPage({ params }) {
  const { locale } = await params;
  await requireAdmin(locale);

  return (
    <main className="container" style={{ maxWidth: 1040, padding: '40px 16px 80px' }}>
      <header className="mb-4">
        <h1 style={STYLES.pageHeading}>Document repository</h1>
        <p style={{ ...STYLES.lede, marginBottom: '0.75rem' }}>
          Every document executed on the platform, filterable by jurisdiction,
          partner type and account. Opening one is recorded against your
          account, as it is for any other party.
        </p>
        <div className="d-flex gap-3 flex-wrap" style={{ fontSize: '0.88rem' }}>
          <Link href={`/${locale}/admin/partners`}>← Partner applications</Link>
          <Link href={`/${locale}/admin/templates`}>Document templates</Link>
        </div>
      </header>

      <DocumentRepository />
    </main>
  );
}
