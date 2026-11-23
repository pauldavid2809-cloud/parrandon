import { route, ok, fail } from '@/lib/api';
import { comprobanteLibro, registrosLibroVentas } from '@/lib/entradas/libro-ventas-servidor';

export const GET = route(async (req) => {
  const id = req.nextUrl.searchParams.get('comprobante');
  if (id === null) return ok({ registros: await registrosLibroVentas() });

  const proofUrl = await comprobanteLibro(id);
  return proofUrl ? ok({ proofUrl }) : fail('No hay un comprobante disponible para esta operación.', 404);
}, ['admin']);
