import { route, ok, fail, readJson } from '@/lib/api';
import { ventaTaquilla } from '@/lib/entradas/service';
import { staffView } from '@/lib/entradas/staff-view';

export const POST = route(async (req) => {
  const body = await readJson(req);
  if (typeof body.code !== 'string') return fail('Falta la entrada.');
  const entrada = await ventaTaquilla(body.code, { ...body, enterNow: body.enterNow !== false }, 'Taquilla');
  return ok({ entrada: entrada && staffView(entrada) });
}, ['taquilla']);
