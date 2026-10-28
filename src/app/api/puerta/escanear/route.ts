import { route, ok, fail, readJson } from '@/lib/api';
import { checkIn, findForStaff } from '@/lib/entradas/service';
import { staffView } from '@/lib/entradas/staff-view';

// Un escaneo en la puerta. Si la entrada está activa y tiene mesa, entra de una vez.
export const POST = route(async (req) => {
  const { input } = await readJson(req);
  const text = String(input ?? '').trim();
  if (!text) return fail('No se leyó ningún código.');
  const entrada = await findForStaff(text);
  if (!entrada) return ok({ state: 'no_existe' });

  if (entrada.status === 'anulada') return ok({ state: 'anulada', entrada: staffView(entrada) });
  if (entrada.checkedInAt) return ok({ state: 'ya_ingreso', entrada: staffView(entrada) });
  if (entrada.status === 'sin_vender') return ok({ state: 'sin_activar', entrada: staffView(entrada) });
  if (!entrada.tableId) return ok({ state: 'sin_mesa', entrada: staffView(entrada) });
  if (entrada.status === 'por_verificar') return ok({ state: 'por_verificar', entrada: staffView(entrada) });

  const updated = await checkIn(entrada.code, 'Puerta');
  return ok({ state: 'adelante', entrada: updated && staffView(updated) });
}, ['puerta']);
