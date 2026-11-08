import { route, ok } from '@/lib/api';
import { ventasAdmin } from '@/lib/entradas/ventas';
import { sumarDonaciones } from '@/lib/entradas/donaciones';

// Ventas de los vendedores, y en la rendición el efectivo de sus donaciones por entregar.
export const GET = route(async () => {
  const datos = await ventasAdmin();
  const vendedores = await sumarDonaciones(datos.vendedores, (nombre, lote) => ({
    nombre,
    lote,
    ventas: 0,
    entradas: 0,
    efectivoPorEntregar: 0,
    pagosPorVerificar: 0,
    verificadas: 0,
  }));
  return ok({ ...datos, vendedores });
}, ['admin']);
