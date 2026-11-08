import { route, ok, readJson } from '@/lib/api';
import { registrarDonacion } from '@/lib/entradas/donaciones';

// El teléfono del vendedor sube una donación (puede llegar horas después, cuando hay señal).
export const POST = route(async (req) => {
  const venta = await registrarDonacion(await readJson(req));
  return ok({ venta });
});
