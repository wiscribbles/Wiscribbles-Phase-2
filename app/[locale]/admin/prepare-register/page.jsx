import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/server';
import PrepareRegisterQueue from '@/components/admin/PrepareRegisterQueue';
import { STYLES } from '@/lib/theme';

export const metadata = {
  title: 'Prepare & Register — WiScribbles',
};

export const dynamic = 'force-dynamic';

export default async function AdminPrepareRegisterPage({ params }) {
  const { locale } = await params;
  await requireAdmin(locale);

  return (
    <main className="container" style={{ maxWidth: 980, padding: '40px 16px 80px' }}>
      <header className="mb-4">
        <h1 style={STYLES.pageHeading}>Prepare &amp; Register</h1>
        <p style={{ ...STYLES.lede, marginBottom: '0.75rem' }}>
          Documents that cannot be executed electronically in the client&rsquo;s
          jurisdiction. Everything up to the signature is done here; the
          signature happens on paper. Nothing in this queue is ever
          electronically signed or sealed.
        </p>
        <div className="d-flex gap-3 flex-wrap" style={{ fontSize: '0.88rem' }}>
          <Link href={`/${locale}/admin/partners`}>← Partner applications</Link>
          <Link href={`/${locale}/admin/documents`}>Document repository</Link>
        </div>
      </header>

      <PrepareRegisterQueue />
    </main>
  );
}
