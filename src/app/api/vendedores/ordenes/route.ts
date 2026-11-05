import { route, ok, readJson } from '@/lib/api';
import { estadoVentas, registrarVenta } from '@/lib/entradas/ventas';

// El teléfono del vendedor sube una orden (puede llegar horas después de la venta).
export const POST = route(async (req) => {
  const venta = await registrarVenta(await readJson(req));
  return ok({ venta });
});

// Cómo van las órdenes de este teléfono: ?ids=a,b,c
export const GET = route(async (req) => {
  const ids = (req.nextUrl.searchParams.get('ids') || '').split(',').map((s) => s.trim());
  return ok({ ventas: await estadoVentas(ids) });
});
