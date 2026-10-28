import type { Metadata } from 'next';
import StaffGate from '@/components/staff/StaffGate';
import TaquillaClient from './TaquillaClient';

export const metadata: Metadata = { title: 'Taquilla · Parrandón 2026', robots: { index: false, follow: false } };

export default function TaquillaPage() {
  return (
    <StaffGate role="taquilla">
      <TaquillaClient />
    </StaffGate>
  );
}
