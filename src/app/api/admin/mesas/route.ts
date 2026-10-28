import { route, ok, fail, readJson } from '@/lib/api';
import { mesasEstado } from '@/lib/entradas/service';
import { store } from '@/lib/entradas/store';

// Mesas con la gente sentada en cada una (solo administración).
export const GET = route(async () => {
  const [{ mesas, resumen }, entradas] = await Promise.all([mesasEstado(), store().listEntradas()]);
  const gente = entradas
    .filter((e) => e.tableId && (e.status === 'activa' || e.status === 'por_verificar'))
    .map((e) => ({
      code: e.code,
      number: e.number,
      tableId: e.tableId,
      name: e.attendeeName,
      phone: e.attendeePhone,
      status: e.status,
      checkedIn: Boolean(e.checkedInAt),
    }));
  return ok({ mesas, resumen, gente });
}, ['admin']);

export const PATCH = route(async (req) => {
  const body = await readJson(req);
  if (typeof body.id !== 'string') return fail('Falta la mesa.');
  await store().updateMesa(body.id, {
    label: body.label === undefined ? undefined : String(body.label ?? '').trim().slice(0, 60) || null,
    blocked: body.blocked === undefined ? undefined : Boolean(body.blocked),
  });
  return ok();
}, ['admin']);
