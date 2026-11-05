import { route, ok } from '@/lib/api';
import { getEventConfig } from '@/lib/db';
import { aceptaPagoMovil } from '@/lib/metodos';
import { store } from '@/lib/entradas/store';
import { OCUPA_PUESTO } from '@/lib/entradas/types';

export const GET = route(async () => {
  const [entradas, config] = await Promise.all([
    store().listCampos(['number', 'status', 'attendeeName', 'tableId', 'checkedInAt', 'doorActivated']),
    getEventConfig(),
  ]);
  const dentro = entradas
    .filter((e) => e.checkedInAt)
    .sort((a, b) => (b.checkedInAt! > a.checkedInAt! ? 1 : -1));
  return ok({
    pagoMovil: aceptaPagoMovil(config),
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
