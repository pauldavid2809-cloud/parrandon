import { route, ok, fail } from '@/lib/api';
import { loteDe } from '@/lib/entradas/service';
import type { HolderType } from '@/lib/entradas/types';

const TYPES: HolderType[] = ['seminarista', 'padre_jorge', 'parroquia', 'taquilla'];

// Estado de las entradas de un responsable. Sin códigos: solo números y estado.
export const GET = route(async (req) => {
  const type = req.nextUrl.searchParams.get('type') as HolderType;
  const id = req.nextUrl.searchParams.get('id') || '';
  if (!TYPES.includes(type) || !id) return fail('Indica de quién es el lote.');
  return ok({ lote: await loteDe(type, id) });
});
