import type { Metadata } from 'next';
import VendedoresClient from './VendedoresClient';

export const metadata: Metadata = {
  title: 'Vendedores · Parrandón Navideño 2026',
  robots: { index: false, follow: false },
};

export default function VendedoresPage() {
  return (
    <div className="paper-grain flex-1">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <VendedoresClient />
      </div>
    </div>
  );
}
