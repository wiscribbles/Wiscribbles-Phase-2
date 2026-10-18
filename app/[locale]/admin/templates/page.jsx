import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/server';
import TemplateManager from '@/components/admin/TemplateManager';
import { STYLES } from '@/lib/theme';

export const metadata = {
  title: 'Document templates — WiScribbles',
};

export const dynamic = 'force-dynamic';

/**
 * Brief, on both document-to-role and document-to-jurisdiction mapping:
 * "This can be done by the creation of templates in the website manager
 * dashboard. These templates will have tick boxes for roles and jurisdiction."
 */
export default async function AdminTemplatesPage({ params }) {
  const { locale } = await params;
  await requireAdmin(locale);

  return (
    <main className="container" style={{ maxWidth: 900, padding: '40px 16px 80px' }}>
      <header className="mb-4">
        <h1 style={STYLES.pageHeading}>Document templates</h1>
        <p style={{ ...STYLES.lede, marginBottom: '0.75rem' }}>
          Every document uploaded to the platform binds to one of these. The
          template decides who may handle it and where it is valid, and the
          session check later enforces exactly that.
        </p>
        <p style={{ ...STYLES.lede, fontSize: '0.88rem', marginBottom: '0.75rem' }}>
          A template requiring notarisation can only be ticked for jurisdictions
          where electronic notarisation has statutory effect. Anything else is
          refused with the reason, rather than producing instruments that look
          valid and are not.
        </p>
        <Link href={`/${locale}/admin/partners`} style={{ fontSize: '0.88rem' }}>
          ← Partner applications
        </Link>
      </header>

      <TemplateManager />
    </main>
  );
}
