import type { Metadata } from 'next';
import StaffGate from '@/components/staff/StaffGate';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = { title: 'Administración · Parrandón 2026', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffGate role="admin">
      <AdminShell>{children}</AdminShell>
    </StaffGate>
  );
}
