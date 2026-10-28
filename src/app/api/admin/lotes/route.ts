import { route, ok, readJson } from '@/lib/api';
import { asignarLote } from '@/lib/entradas/service';
import type { HolderType } from '@/lib/entradas/types';

export const POST = route(async (req) => {
  const { from, to, type, id } = await readJson(req);
  const count = await asignarLote(Number(from), Number(to), type as HolderType, id ? String(id) : null);
  return ok({ count });
}, ['admin']);
