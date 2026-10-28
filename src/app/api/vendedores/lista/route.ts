import { route, ok } from '@/lib/api';
import { SEMINARISTAS_DIRECTORY } from '@/lib/seminaristas';
import { store } from '@/lib/entradas/store';

// Quién puede tener un lote de entradas (solo nombres).
export const GET = route(async () => {
  const parroquias = await store().listParroquias();
  return ok({
    seminaristas: SEMINARISTAS_DIRECTORY.map(({ id, name, stage }) => ({ id, name, stage })),
    parroquias: parroquias.map(({ id, name }) => ({ id, name })),
  });
});
