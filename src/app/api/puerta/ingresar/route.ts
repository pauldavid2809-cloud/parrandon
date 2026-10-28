import { route, ok, fail, readJson } from '@/lib/api';
import { checkIn } from '@/lib/entradas/service';
import { staffView } from '@/lib/entradas/staff-view';

// Deja pasar una entrada con el pago aún por verificar.
export const POST = route(async (req) => {
  const { code } = await readJson(req);
  if (typeof code !== 'string') return fail('Falta el código.');
  const entrada = await checkIn(code, 'Puerta');
  return ok({ state: 'adelante', entrada: entrada && staffView(entrada) });
}, ['puerta']);
