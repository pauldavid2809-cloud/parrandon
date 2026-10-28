import type { Metadata } from 'next';
import StaffGate from '@/components/staff/StaffGate';
import PuertaClient from './PuertaClient';

export const metadata: Metadata = { title: 'Puerta · Parrandón 2026', robots: { index: false, follow: false } };

export default function PuertaPage() {
  return (
    <StaffGate role="puerta" tone="noche">
      <PuertaClient />
    </StaffGate>
  );
}
