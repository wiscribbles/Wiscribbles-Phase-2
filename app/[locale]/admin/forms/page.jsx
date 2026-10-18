import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/server';
import StandardFormsManager from '@/components/admin/StandardFormsManager';
import { STYLES } from '@/lib/theme';

export const metadata = { title: 'Standard forms — WiScribbles' };
export const dynamic = 'force-dynamic';

export default async function AdminFormsPage({ params }) {
  const { locale } = await params;
  await requireAdmin(locale);

  return (
    <main className="container" style={{ maxWidth: 980, padding: '40px 16px 80px' }}>
      <header className="mb-4">
        <h1 style={STYLES.pageHeading}>Standard forms library</h1>
        <p style={{ ...STYLES.lede, marginBottom: '0.75rem' }}>
          Blank PDFs any account can take a copy of. Each binds to a document
          template, which is what carries the routing — who may handle it and
          where it has effect. Stored once and shared, so they do not count
          against anybody&rsquo;s repository.
        </p>
        <div className="d-flex gap-3 flex-wrap" style={{ fontSize: '0.88rem' }}>
          <Link href={`/${locale}/admin/templates`}>← Document templates</Link>
          <Link href={`/${locale}/admin/documents`}>Document repository</Link>
        </div>
      </header>

      <StandardFormsManager />
    </main>
  );
}
