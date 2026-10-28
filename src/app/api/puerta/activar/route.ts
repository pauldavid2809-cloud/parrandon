import { route, ok, fail, readJson } from '@/lib/api';
import { activarEnPuerta } from '@/lib/entradas/service';
import { staffView } from '@/lib/entradas/staff-view';

// Entrada que llega sin activar: se registran los datos, se elige mesa y entra.
export const POST = route(async (req) => {
  const body = await readJson(req);
  if (typeof body.code !== 'string') return fail('Falta el código.');
  const entrada = await activarEnPuerta(body.code, body as never, 'Puerta');
  return ok({ state: 'adelante', entrada: entrada && staffView(entrada) });
}, ['puerta']);
