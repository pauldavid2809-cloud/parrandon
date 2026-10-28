import type { Metadata } from 'next';
import EntradaClient, { type Data } from './EntradaClient';
import { eventRules, extractCode, ticketView } from '@/lib/entradas/service';
import { store } from '@/lib/entradas/store';

export const metadata: Metadata = {
  title: 'Mi entrada · Parrandón Navideño 2026',
  robots: { index: false, follow: false },
};

// Se busca la entrada en el servidor para que la página llegue lista al teléfono.
// Si la base no responde, la página la busca sola desde el navegador.
async function loadInitial(code: string): Promise<{ data: Data | null; notFound: boolean } | undefined> {
  const clean = extractCode(code);
  if (!clean) return { data: null, notFound: true };
  try {
    const entrada = await store().getEntrada(clean);
    if (!entrada) return { data: null, notFound: true };
    const { config, canChangeTable, isEventDay, eventDateIso } = await eventRules();
    return {
      notFound: false,
      data: {
        entrada: ticketView(entrada),
        rules: { canChangeTable, isEventDay, eventDateIso },
        pago: {
          priceUsd: config.ticketPriceUsd,
          rateBs: config.currentRateBs,
          pagoMovil: config.paymentDetails.pagoMovil,
          zelle: config.paymentDetails.zelle,
        },
      },
    };
  } catch {
    return undefined;
  }
}

export default async function EntradaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = decodeURIComponent(code).toUpperCase();
  return <EntradaClient code={normalized} initial={await loadInitial(normalized)} />;
}
