import { route, ok, readJson } from '@/lib/api';
import { estadoVentas, registrarVenta } from '@/lib/entradas/ventas';
import { estadoDonaciones } from '@/lib/entradas/donaciones';

// El teléfono del vendedor sube una orden (puede llegar horas después de la venta).
export const POST = route(async (req) => {
  const venta = await registrarVenta(await readJson(req));
  return ok({ venta });
});

// Cómo van las ventas y donaciones de este teléfono: ?ids=a,b,c
export const GET = route(async (req) => {
  const ids = (req.nextUrl.searchParams.get('ids') || '').split(',').map((s) => s.trim());
  const ventas = await estadoVentas(ids);
  const vistas = new Set(ventas.map((v) => v.id));
  const donaciones = await estadoDonaciones(ids.filter((i) => !vistas.has(i)));
  return ok({ ventas: [...ventas, ...donaciones] });
});
