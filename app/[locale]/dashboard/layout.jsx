/**
 * The dashboard layout.
 *
 * WHAT THIS USED TO BE, AND WHY IT HAD TO GO
 *
 * A client component that subscribed to `onAuthStateChanged` and, if there was
 * no user, called `router.replace("/auth/signin")`. Three problems, and the
 * third is the one that mattered:
 *
 *   1. It was a CLIENT-SIDE guard. It hid the UI; it did not deny access. The
 *      data behind it was protected by `firestore.rules`, not by this.
 *   2. The redirect dropped the locale — `/auth/signin` rather than
 *      `/${locale}/auth/signin` — so a signed-out visitor landed outside the
 *      i18n routing.
 *   3. It applied to every route NESTED under /dashboard, which since Stage 4
 *      includes the partner dashboard. So the Phase 2 pages, which do their own
 *      server-side verification, were additionally gated behind a weaker
 *      client-side check that could flash a spinner, then redirect a perfectly
 *      valid session to a locale-less sign-in page.
 *
 * Now it is a plain wrapper. Each page under here guards itself on the server
 * (`requireVerifiedUser`, `requirePartner`), which is the only kind of guard
 * that denies rather than hides.
 */

export default function DashboardLayout({ children }) {
  return <>{children}</>;
}
