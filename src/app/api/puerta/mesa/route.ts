import { route, ok, fail, readJson } from '@/lib/api';
import { apartarMesa, checkIn } from '@/lib/entradas/service';
import { staffView } from '@/lib/entradas/staff-view';

// Entrada pagada que nunca eligió mesa: se le asigna en la puerta y entra.
export const POST = route(async (req) => {
  const { code, tableId } = await readJson(req);
  if (typeof code !== 'string' || typeof tableId !== 'string') return fail('Elige la mesa.');
  await apartarMesa(code, tableId);
  const entrada = await checkIn(code, 'Puerta');
  return ok({ state: 'adelante', entrada: entrada && staffView(entrada) });
}, ['puerta']);
