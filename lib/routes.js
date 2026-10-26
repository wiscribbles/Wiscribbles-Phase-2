/**
 * Every route the app links to, in one place.
 *
 * THE BUG THIS FIXES
 *
 * The brief reports that the "Notarize Now" button goes to the wrong page. It
 * does — and there is no single button. There are four, each hard-coded at its
 * own call site, and all four went somewhere different and wrong:
 *
 *   app/[locale]/page.jsx     → `/${locale}/signIn`   a sign-in page, and note
 *                                                     the casing: the real
 *                                                     route is /auth/signin
 *   components/home1/Hero1.js → `/en/form-step1`      locale hard-coded to en,
 *                                                     pointing at the Phase 1
 *                                                     form model that Stage 6
 *                                                     replaced
 *   layout/Header.js          → `/auth/signin`        no locale segment at all
 *   app/[locale]/about/page.js→ `/about`              the page it is already on
 *
 * So the label was translated in three places while the destination was
 * duplicated in four, which is exactly the shape of bug that survives a
 * redesign. The fix is not to correct four strings; it is to stop having four.
 *
 * WHY "NOTARIZE NOW" POINTS AT /request AND NOT AT SIGN-IN
 *
 * `/request` guards itself with `requireVerifiedUser(..., { returnTo })`, so a
 * signed-out visitor is sent to sign-in and returned to the request flow
 * afterwards. Pointing the button at sign-in instead would strand them there:
 * they would arrive at a dashboard having forgotten what they came to do.
 */

/** Routes that do not vary by locale. */
export const ROUTES = Object.freeze({
  /** Where "Notarize Now" goes. The client's five-step request. */
  NOTARIZE_NOW: '/request',

  HOME: '/',
  SIGN_IN: '/auth/signin',
  SIGN_UP: '/auth/signup',
  VERIFY_EMAIL: '/auth/verify-email',
  FORGOT_PASSWORD: '/auth/forgot-password',

  DASHBOARD: '/dashboard',
  PARTNER_DASHBOARD: '/dashboard/partner',
  ONBOARDING: '/onboarding/verification',

  /** The client's own surfaces, reached from the dashboard sidebar. */
  PROFILE: '/dashboard/profile',
  SETTINGS: '/dashboard/settings',
  CALENDAR: '/dashboard/calender',
  /** Checking a reference against an executed document. Public by design. */
  AUTHENTICATE: '/authenticate',
  /** Where a document that cannot be executed electronically is offered. */
  PREPARE_REGISTER: '/prepare-register',

  ADMIN_PARTNERS: '/admin/partners',
  ADMIN_TEMPLATES: '/admin/templates',
  ADMIN_DOCUMENTS: '/admin/documents',

  ABOUT: '/about',
  CONTACT: '/contact',
});

/**
 * Prefix a route with the active locale.
 *
 * Every link in the app needs this, and the three bugs above include two that
 * were a missing or hard-coded locale — so the helper takes the locale rather
 * than defaulting it. A default would make the hard-coded-`en` bug available
 * again by omission.
 */
export function path(locale, route) {
  if (!locale) {
    throw new Error(
      'path() needs a locale. Hard-coding one is how `/en/form-step1` ended up ' +
        'in the hero button.',
    );
  }

  const normalized = String(route ?? '/');
  return `/${locale}${normalized === '/' ? '' : normalized}`;
}

/** Shorthands for the links that appear most. */
export const notarizeNow = (locale) => path(locale, ROUTES.NOTARIZE_NOW);
export const signIn = (locale, next = null) =>
  next
    ? `${path(locale, ROUTES.SIGN_IN)}?next=${encodeURIComponent(next)}`
    : path(locale, ROUTES.SIGN_IN);
export const dashboard = (locale) => path(locale, ROUTES.DASHBOARD);
