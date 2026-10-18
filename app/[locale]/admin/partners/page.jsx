import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/server';
import PartnerReviewQueue from '@/components/admin/PartnerReviewQueue';

export const metadata = {
  title: 'Partner applications — WiScribbles',
};

export const dynamic = 'force-dynamic';

/**
 * Brief: "Regulate partners (Notaries, COaths, Attorneys and Businesses)
 * during their sign-up process; Interface must possess the ability to accept,
 * reject or request more information from partners."
 *
 * Behind `requireAdmin`, so a non-admin never receives the data at all.
 */
export default async function AdminPartnersPage({ params }) {
  const { locale } = await params;
  await requireAdmin(locale);

  return (
    <main className="container" style={{ maxWidth: 900, padding: '40px 16px 80px' }}>
      <header className="mb-4">
        <h1 style={{ fontFamily: 'Jost', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          Partner applications
        </h1>
        <p className="text-muted mb-2" style={{ maxWidth: '64ch', lineHeight: 1.7 }}>
          Notaries, Commissioners of Oaths, Attorneys and Businesses waiting to
          be let in. Approving opens their full dashboard immediately; rejecting
          or suspending ends their session on the spot rather than whenever
          their token happens to expire.
        </p>
        <Link href={`/${locale}/admin/plans`} style={{ fontSize: '0.88rem' }}>
          Plans &amp; template allowances →
        </Link>
      </header>

      <PartnerReviewQueue />
    </main>
  );
}
