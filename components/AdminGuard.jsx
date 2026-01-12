'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const AdminGuard = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const segments = pathname?.split('/') ?? [];
  const locale = segments.length > 1 && segments[1] ? segments[1] : 'en';
  const loginPath = `/${locale}/auth/signin`;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const redirectTarget = encodeURIComponent(pathname || `/${locale}/admin`);
      router.replace(`${loginPath}?redirect=${redirectTarget}`);
      return;
    }

    const isAuthorized =
      user.role === 'admin' ||
      user.signUpAs === 'Admin' ||
      user.isStaff === true ||
      user.staffRole === 'operations';

    if (!isAuthorized) {
      router.replace('/');
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: '70vh' }}
      >
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted">Preparing your admin workspace...</p>
      </div>
    );
  }

  const isAuthorized =
    user.role === 'admin' ||
    user.signUpAs === 'Admin' ||
    user.isStaff === true ||
    user.staffRole === 'operations';

  if (!isAuthorized) {
    router.replace(loginPath);
    return null;
  }

  return <>{children}</>;
};

export default AdminGuard;

