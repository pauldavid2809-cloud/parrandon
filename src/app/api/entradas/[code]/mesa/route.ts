import { route, ok, fail, readJson } from '@/lib/api';
import { elegirMesaComprador, extractCode, ticketView } from '@/lib/entradas/service';

type Ctx = { params: Promise<{ code: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const code = extractCode((await params).code);
  if (!code) return fail('Código de entrada inválido.', 404);
  const { tableId } = await readJson(req);
  if (typeof tableId !== 'string' || !tableId) return fail('Elige una mesa.');
  const entrada = await elegirMesaComprador(code, tableId);
  return ok({ entrada: entrada && ticketView(entrada) });
});
