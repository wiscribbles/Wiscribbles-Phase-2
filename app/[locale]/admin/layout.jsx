/**
 * The Website Manager (admin) layout.
 *
 * WHY THIS IS A SERVER COMPONENT NOW — 25 Oct 2026
 *
 * It used to render `components/AdminGuard.jsx`, a client component that
 * authorised on fields read from the caller's own Firestore user document:
 *
 *   user.role === 'admin' || user.signUpAs === 'Admin'
 *     || user.isStaff === true || user.staffRole === 'operations'
 *
 * `firestore.rules` let a verified user update their own document and did not
 * list `signUpAs`, `isStaff` or `staffRole` among the protected fields. So any
 * account could write `isStaff: true` to itself and enter the entire admin
 * tree. No data followed them in — every `/api/admin/*` handler calls
 * `requireApiAdmin()` and every rule reads the `role` custom claim, so the
 * impostor got the shell and a wall of errors. But that is a client-side guard
 * doing exactly what `lib/auth/server.js` says client-side guards do: hiding
 * the UI rather than denying access, and leaving the real protection to
 * whatever each page happened to call.
 *
 * `requireAdmin` reads the role from the session cookie's verified claims on
 * the server and redirects a non-admin to their own dashboard — deliberately a
 * redirect and not a 403, so the admin surface does not confirm its own
 * existence. The rules were fixed in the same change; this is the half that
 * actually denies.
 */

import { requireAdmin } from '@/lib/auth/server';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Operations Dashboard',
};

export default async function AdminLayout({ children, params }) {
  const { locale } = await params;
  await requireAdmin(locale);

  return <AdminShell>{children}</AdminShell>;
}
