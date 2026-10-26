import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';

/**
 * Middleware does TWO things, in order: locale routing (unchanged from Phase 1)
 * and a cheap authentication gate.
 *
 * The gate is deliberately shallow. Middleware runs on the edge runtime, where
 * firebase-admin cannot run, so the session cookie CANNOT be cryptographically
 * verified here. All this does is bounce requests that carry no cookie at all,
 * which keeps anonymous traffic off protected routes and off the server
 * components behind them.
 *
 * Real enforcement — signature verification, role, status, email-verified — is
 * in `lib/auth/server.js`, run by the layout of every protected area, and in
 * the Firestore security rules. Do not add authorisation logic here and assume
 * it is binding: a forged cookie passes this check and fails the next one.
 */

const intlMiddleware = createMiddleware(routing);

const SESSION_COOKIE = 'wis_session';

/** Path prefixes (after the locale segment) that require a session. */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/onboarding',
  '/account',
  '/video-call',
  /* `/notary`, `/notary-dashboard` and `/secondary-dashboard` were here and
     have gone with the routes themselves (26 Oct 2026). All three were Phase 1
     pages whose entire contents, `export default` included, were commented
     out: they registered in the route manifest and would have errored for
     anyone who reached them. Guarding a route that does not exist costs
     nothing but reads as though the page is live, which is how a dead route
     survives a cleanup. */
];

/** Signed-in users have no business on these. */
const AUTH_ONLY_PREFIXES = ['/auth/signin', '/auth/signup', '/signIn', '/signUp'];

const LOCALE_PATTERN = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`);

/** Split "/en/dashboard/x" into ["en", "/dashboard/x"]. */
function splitLocale(pathname) {
  const match = pathname.match(LOCALE_PATTERN);
  if (!match) return [routing.defaultLocale, pathname];
  const rest = pathname.slice(match[0].length) || '/';
  return [match[1], rest];
}

const startsWithAny = (path, prefixes) =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

export default function middleware(request) {
  const response = intlMiddleware(request);

  // Let next-intl's own redirects and rewrites resolve first; the gate applies
  // to the path the user actually lands on.
  if (response?.status >= 300 && response?.status < 400) return response;

  const { pathname, search } = request.nextUrl;
  const [locale, path] = splitLocale(pathname);
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && startsWithAny(path, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth/signin`;
    url.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(url);
  }

  if (hasSession && startsWithAny(path, AUTH_ONLY_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
