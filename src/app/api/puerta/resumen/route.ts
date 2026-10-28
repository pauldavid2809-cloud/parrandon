import { route, ok } from '@/lib/api';
import { store } from '@/lib/entradas/store';
import { OCUPA_PUESTO } from '@/lib/entradas/types';

export const GET = route(async () => {
  const entradas = await store().listEntradas();
  const dentro = entradas
    .filter((e) => e.checkedInAt)
    .sort((a, b) => (b.checkedInAt! > a.checkedInAt! ? 1 : -1));
  return ok({
    ingresaron: dentro.length,
    esperados: entradas.filter((e) => OCUPA_PUESTO.includes(e.status)).length,
    recientes: dentro.slice(0, 12).map((e) => ({
      number: e.number,
      name: e.attendeeName,
      tableId: e.tableId,
      at: e.checkedInAt,
      doorActivated: e.doorActivated,
    })),
  });
}, ['puerta']);
