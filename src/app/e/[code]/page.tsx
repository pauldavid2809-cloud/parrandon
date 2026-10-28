import type { Metadata } from 'next';
import EntradaClient from './EntradaClient';

export const metadata: Metadata = {
  title: 'Mi entrada · Parrandón Navideño 2026',
  robots: { index: false, follow: false },
};

export default async function EntradaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <EntradaClient code={decodeURIComponent(code).toUpperCase()} />;
}
