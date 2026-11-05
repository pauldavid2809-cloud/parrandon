import { route, ok, fail, readJson } from '@/lib/api';
import { aprobarVenta, captureDeVenta, rechazarVenta } from '@/lib/entradas/ventas';

type Ctx = { params: Promise<{ id: string }> };

// El capture de la venta (puede ser una imagen embebida pesada).
export const GET = route<Ctx>(async (_req, { params }) => ok({ proofUrl: await captureDeVenta((await params).id) }), ['admin']);

export const PATCH = route<Ctx>(async (req, { params }) => {
  const id = (await params).id;
  const body = await readJson(req);
  if (body.action === 'aprobar') return ok({ aprobadas: await aprobarVenta(id) });
  if (body.action === 'rechazar') return ok(await rechazarVenta(id, String(body.reason ?? '')));
  return fail('Acción desconocida.');
}, ['admin']);
