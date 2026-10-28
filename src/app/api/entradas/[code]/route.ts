import { route, ok, fail } from '@/lib/api';
import { eventRules, extractCode, ticketView } from '@/lib/entradas/service';
import { store } from '@/lib/entradas/store';

type Ctx = { params: Promise<{ code: string }> };

// Lo que ve quien escanea su propia entrada.
export const GET = route<Ctx>(async (_req, { params }) => {
  const code = extractCode((await params).code);
  if (!code) return fail('Ese código no corresponde a una entrada del Parrandón.', 404);
  const entrada = await store().getEntrada(code);
  if (!entrada) return fail('Ese código no corresponde a una entrada del Parrandón.', 404);
  const { config, canChangeTable, isEventDay, eventDateIso } = await eventRules();
  return ok({
    entrada: ticketView(entrada),
    rules: { canChangeTable, isEventDay, eventDateIso },
    pago: {
      priceUsd: config.ticketPriceUsd,
      rateBs: config.currentRateBs,
      pagoMovil: config.paymentDetails.pagoMovil,
      zelle: config.paymentDetails.zelle,
    },
  });
});
