import { route, ok, fail, readJson } from '@/lib/api';
import { despacharMesa } from '@/lib/entradas/service';

// Sirve los platos de quienes ya llegaron a esa mesa y no han comido.
export const POST = route(async (req) => {
  const { tableId } = await readJson(req);
  if (typeof tableId !== 'string') return fail('Falta la mesa.');
  const codes = await despacharMesa(tableId.toUpperCase());
  return ok({ codes, count: codes.length });
}, ['cocina']);
