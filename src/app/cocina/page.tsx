import type { Metadata } from 'next';
import StaffGate from '@/components/staff/StaffGate';
import CocinaClient from './CocinaClient';

export const metadata: Metadata = { title: 'Cocina · Parrandón 2026', robots: { index: false, follow: false } };

export default function CocinaPage() {
  return (
    <StaffGate role="cocina">
      <CocinaClient />
    </StaffGate>
  );
}
