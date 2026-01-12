import AdminGuard from '@/components/AdminGuard';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Operations Dashboard',
};

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}

