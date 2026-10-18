import { requireVerifiedUser } from '@/lib/auth/server';
import PrepareRegisterForm from '@/components/client/PrepareRegisterForm';
import { STYLES } from '@/lib/theme';

export const metadata = {
  title: 'Prepare & Register — WiScribbles',
};

export const dynamic = 'force-dynamic';

/**
 * Prepare & Register.
 *
 * Where the request flow sends a client whose document cannot be executed
 * electronically. `category` and `jurisdiction` arrive as query parameters from
 * that refusal, so the client does not have to re-answer two questions they
 * have already answered.
 */
export default async function PrepareRegisterPage({ params, searchParams }) {
  const { locale } = await params;
  const { category, jurisdiction } = (await searchParams) ?? {};

  await requireVerifiedUser(locale, { returnTo: `/${locale}/prepare-register` });

  return (
    <main className="container" style={{ maxWidth: 820, padding: '40px 16px 80px' }}>
      <header className="mb-4">
        <h1 style={STYLES.pageHeading}>Prepare &amp; Register</h1>
        <p style={{ ...STYLES.lede, marginBottom: 0 }}>
          Some documents cannot be signed electronically, whatever platform you
          use — the statute simply does not reach them. Everything up to the
          signature can still be done online, and that is what this is. We
          draft it, check it, verify who the parties are, and arrange the
          signing.
        </p>
      </header>

      <PrepareRegisterForm
        locale={locale}
        initialCategory={typeof category === 'string' ? category : ''}
        initialJurisdiction={typeof jurisdiction === 'string' ? jurisdiction : ''}
      />
    </main>
  );
}
