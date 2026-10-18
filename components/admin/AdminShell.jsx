'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LayoutDashboard, Users, FileText, CreditCard, ShieldCheck, Settings, LogOut, UserCheck, FileCheck, Archive, PenLine } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'react-hot-toast';

const navigationItems = [
  {
    label: 'Overview',
    slug: '',
    icon: LayoutDashboard,
    description: 'Platform performance and metrics',
  },
  {
    label: 'User Accounts',
    slug: '/users',
    icon: Users,
    description: 'Manage platform members and onboarding',
  },

  /* Phase 2. These three are the Website Manager's actual working surfaces:
     the approval queue, the templates every document binds to, and the
     repository with audit, flag and revoke. They were reachable only by typing
     the URL until now. */
  {
    label: 'Partner Applications',
    slug: '/partners',
    icon: UserCheck,
    description: 'Approve, reject, suspend or request more information',
  },
  {
    label: 'Document Templates',
    slug: '/templates',
    icon: FileCheck,
    description: 'Role and jurisdiction mapping for every document type',
  },
  {
    label: 'Document Repository',
    slug: '/documents',
    icon: Archive,
    description: 'Every executed document, with audit, flag and revoke',
  },
  {
    label: 'Prepare & Register',
    slug: '/prepare-register',
    icon: PenLine,
    description: 'Documents the statute excludes — prepared online, signed on paper',
  },
  {
    label: 'Notarizations',
    slug: '/notarizations',
    icon: FileText,
    description: 'Audit executed and scheduled notarizations',
  },
  {
    label: 'Payments',
    slug: '/payments',
    icon: CreditCard,
    description: 'Review transactions and payouts',
  },
  {
    label: 'Commissioners',
    slug: '/commissioners',
    icon: ShieldCheck,
    description: 'Review commissioner of oaths applications',
  },
];

const AdminShell = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  const segments = pathname?.split('/') ?? [];
  const locale = segments.length > 1 ? segments[1] : 'en';
  const basePath = `/${locale}/admin`;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 30 * 1000);

    return () => clearInterval(timer);
  }, []);

  const activeSlug = (() => {
    const relativePath = pathname.replace(`${basePath}`, '') || '';
    if (!relativePath || relativePath === '/') return '';
    const matched = navigationItems
      .map((item) => item.slug)
      .filter(Boolean)
      .find((slug) => relativePath === slug || relativePath.startsWith(`${slug}/`));
    return matched || '';
  })();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out');
      router.replace(`/${locale}/auth/signin`);
    } catch (error) {
      console.error('Failed to sign out:', error);
      toast.error('Unable to sign out, please try again.');
    }
  };

  const renderNavItems = () =>
    navigationItems.map((item) => {
      const Icon = item.icon;
      const href = `${basePath}${item.slug}`;
      const isActive = item.slug === activeSlug;

      return (
        <Link key={href} href={href} className="text-decoration-none d-block">
          <div
            className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 ${
              isActive ? 'bg-white text-dark shadow-sm' : 'text-white-50'
            }`}
            style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
          >
            <span
              className={`d-flex align-items-center justify-content-center rounded-circle ${
                isActive ? 'bg-primary text-white shadow-sm' : 'text-white-50 border border-white border-opacity-25'
              }`}
              style={{ width: 32, height: 32 }}
            >
              <Icon size={18} />
            </span>
            <div className="d-flex flex-column">
              <span className={`fw-semibold ${isActive ? 'text-dark' : 'text-white'}`}>{item.label}</span>
              <small className={`mb-0 ${isActive ? 'text-muted' : 'text-white-50'}`}>{item.description}</small>
            </div>
          </div>
        </Link>
      );
    });

  return (
    <div className="admin-shell">
      <div className="d-flex">
        {/* Desktop sidebar */}
        <aside
          className="d-none d-lg-flex flex-column text-white"
          style={{
            width: '280px',
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0b1c39 0%, #142a52 100%)',
          }}
        >
          <div className="p-4 border-bottom border-white border-opacity-10 d-flex flex-column align-items-center gap-2 text-center">
            <img src="/assets/images/logos/logo-white.png" alt="WiScribble" style={{ width: 120, height: 'auto' }} />
            <small className="text-white-50">Operations control center</small>
          </div>
          <div className="flex-grow-1 px-3 py-4 overflow-auto">
            <div className="text-uppercase text-white-50 small mb-3 px-2">Navigation</div>
            <div className="d-flex flex-column gap-2">{renderNavItems()}</div>
          </div>
          <div className="px-4 py-3 border-top border-white border-opacity-10">
            <div className="mb-3">
              <p className="small mb-1 text-white-50">Signed in as</p>
              <p className="fw-semibold mb-0 text-white">{user?.name || user?.email}</p>
              <p className="text-white-50 small mb-0">
                {user?.role === 'admin' ? 'Administrator' : user?.staffRole || 'Staff'}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-light d-flex align-items-center gap-2 w-100"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" onClick={() => setSidebarOpen(false)}>
            <aside
              className="position-absolute top-0 start-0 bg-white h-100"
              style={{ width: '280px', boxShadow: '0 0 30px rgba(0,0,0,0.2)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">WiScribble Ops</h5>
                  <small className="text-muted">Control center</small>
                </div>
                <button type="button" className="btn btn-link text-dark p-0" onClick={() => setSidebarOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="p-3 d-flex flex-column gap-3">
                {renderNavItems()}
                <button
                  type="button"
                  className="btn btn-outline-dark d-flex align-items-center gap-2 mt-2"
                  onClick={() => {
                    setSidebarOpen(false);
                    handleSignOut();
                  }}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-grow-1 bg-light bg-opacity-50 min-vh-100" style={{ paddingRight: '24px' }}>
          <header className="bg-white border-bottom">
            <div className="container-fluid py-2 px-4 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <button type="button" className="btn btn-outline-primary d-lg-none" onClick={() => setSidebarOpen(true)}>
                  <Menu size={18} />
                </button>
                <div className="d-flex align-items-center gap-3">
                  <div className="text-start">
                    <span className="fw-semibold d-block">{user?.name || user?.email}</span>
                    <small className="text-muted">
                      {user?.role === 'admin' ? 'Administrator' : user?.staffRole || 'Operations Staff'}
                    </small>
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-4">
                <div className="text-end">
                  <span className="fw-semibold d-block">
                    {currentDate.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <small className="text-muted">
                    {currentDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary d-none d-lg-inline-flex align-items-center gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          </header>
          <div className="container-fluid py-4" style={{ paddingRight: 0 }}>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminShell;

