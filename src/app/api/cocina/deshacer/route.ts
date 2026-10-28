import { route, ok, fail, readJson } from '@/lib/api';
import { deshacerDespacho } from '@/lib/entradas/service';

export const POST = route(async (req) => {
  const { codes } = await readJson(req);
  if (!Array.isArray(codes) || codes.some((c) => typeof c !== 'string')) return fail('Nada que deshacer.');
  return ok({ count: await deshacerDespacho(codes as string[]) });
}, ['cocina']);
