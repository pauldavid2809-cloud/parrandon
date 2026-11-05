import type { Metadata } from 'next';
import VendedoresClient from './VendedoresClient';

export const metadata: Metadata = {
  title: 'Vendedores · Parrandón Navideño 2026',
  robots: { index: false, follow: false },
  // Se instala en el teléfono como app y abre sin internet (ver public/sw-vendedores.js).
  manifest: '/vendedores.webmanifest',
  appleWebApp: { capable: true, title: 'Vender entradas', statusBarStyle: 'default' },
  icons: { apple: '/icons/vendedores-180.png' },
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
