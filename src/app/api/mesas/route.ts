import { route, ok } from '@/lib/api';
import { mesasEstado } from '@/lib/entradas/service';

// Estado público de las 50 mesas: cuántos puestos quedan, sin nombres.
export const GET = route(async () => {
  const { mesas, resumen } = await mesasEstado();
  return ok({
    mesas: mesas.map(({ id, sector, number, capacity, taken, free, isFull, blocked }) => ({
      id,
      sector,
      number,
      capacity,
      taken,
      free,
      isFull,
      blocked,
      label: null,
    })),
    resumen,
  });
});
