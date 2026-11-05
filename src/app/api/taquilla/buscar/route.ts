import { route, ok, fail, readJson } from '@/lib/api';
import { eventRules, findForStaff } from '@/lib/entradas/service';
import { staffView } from '@/lib/entradas/staff-view';
import { aceptaPagoMovil } from '@/lib/metodos';

export const POST = route(async (req) => {
  const { input } = await readJson(req);
  const text = String(input ?? '').trim();
  if (!text) return fail('Escanea la entrada o escribe su número.');
  const entrada = await findForStaff(text);
  if (!entrada) return fail('No existe una entrada con ese código o número.', 404);
  const { config } = await eventRules();
  return ok({ entrada: staffView(entrada), priceUsd: config.ticketPriceUsd, rateBs: config.currentRateBs, pagoMovil: aceptaPagoMovil(config) });
}, ['taquilla']);
