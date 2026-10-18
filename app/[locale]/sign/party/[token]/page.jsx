import PartySigning from '@/components/signing/PartySigning';

export const metadata = {
  title: 'Sign a document — WiScribbles',
  /* Nothing about this page should be indexed or previewed: the URL is a
     credential, and a link preview service fetching it would count as a visit
     to somebody else's signing link. */
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Where a party lands from a signing link.
 *
 * NO AUTH GUARD, by necessity. The other side of a sale is not a WiScribbles
 * user and should not have to become one to sign. The token in the path is the
 * credential, and it is checked by `/api/signing` — which finds the party by
 * the token's digest, refuses a spent or expired one, and refuses signing out
 * of turn.
 *
 * The document id travels as `?d=` rather than in the path so that the token
 * remains the last segment — which keeps the useful part of the URL intact if
 * an email client truncates the query string, and makes it obvious which part
 * is secret.
 */
export default async function PartySigningPage({ params, searchParams }) {
  const { token } = await params;
  const { d } = (await searchParams) ?? {};

  return (
    <PartySigning
      token={String(token ?? '')}
      documentId={typeof d === 'string' ? d : ''}
    />
  );
}
