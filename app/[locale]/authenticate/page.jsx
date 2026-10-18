import VerifyDocument from '@/components/authenticate/VerifyDocument';

export const metadata = {
  title: 'Authenticate a document — WiScribbles',
};

/**
 * Public document verification.
 *
 * No guard, deliberately — see the note in `app/api/authenticate/route.js`.
 * The people who need to check a document are banks, registries and
 * counterparties, almost none of whom have an account. Requiring one would
 * make the verification service useless for its only purpose.
 *
 * This replaces `components/authenticatePage.jsx`, which ran the lookup as a
 * Firestore query in the browser and had no concept of revocation. The page
 * keeps that component's layout and styling; what changed is underneath.
 */
export default function AuthenticatePage() {
  return <VerifyDocument />;
}
