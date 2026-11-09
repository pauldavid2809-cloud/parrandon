import { route, ok, readJson } from '@/lib/api';
import { liberarLotesParroquia } from '@/lib/entradas/service';

// Quita de una parroquia (o de todas, sin parroquiaId) las entradas que no se han vendido.
export const POST = route(async (req) => {
  const { parroquiaId } = await readJson(req);
  return ok(await liberarLotesParroquia(typeof parroquiaId === 'string' && parroquiaId ? parroquiaId : null));
}, ['admin']);
