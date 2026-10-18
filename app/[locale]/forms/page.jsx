import { requireVerifiedUser } from '@/lib/auth/server';
import FormsLibrary from '@/components/client/FormsLibrary';
import { STYLES } from '@/lib/theme';

export const metadata = { title: 'Standard forms — WiScribbles' };
export const dynamic = 'force-dynamic';

/**
 * The standard forms library.
 *
 * Open to any verified account, including clients: the point of the library is
 * that someone who does not own a correctly drafted affidavit can still use a
 * notary, and that is most people.
 */
export default async function FormsPage({ params }) {
  const { locale } = await params;
  await requireVerifiedUser(locale, { returnTo: `/${locale}/forms` });

  return (
    <main className="container" style={{ maxWidth: 820, padding: '40px 16px 80px' }}>
      <header className="mb-4">
        <h1 style={STYLES.pageHeading}>Standard forms</h1>
        <p style={{ ...STYLES.lede, marginBottom: 0 }}>
          Blank forms maintained by WiScribbles, ready to be filled in, signed
          and — where the law allows it — notarised. Read any of them before you
          decide; nothing goes into your own documents until you choose it.
        </p>
      </header>

      <FormsLibrary locale={locale} />
    </main>
  );
}
