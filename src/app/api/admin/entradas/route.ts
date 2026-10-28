import { route, ok } from '@/lib/api';
import { store } from '@/lib/entradas/store';

// Lista completa para administración. Los capture guardados como imagen embebida
// se omiten aquí (pesan mucho); se piden uno por uno al verificar.
export const GET = route(async () => {
  const entradas = await store().listEntradas();
  return ok({
    entradas: entradas.map((e) => ({
      ...e,
      paymentProofUrl: e.paymentProofUrl?.startsWith('data:') ? 'embedded' : e.paymentProofUrl,
    })),
  });
}, ['admin']);
