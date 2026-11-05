import { route, ok, fail, readJson } from '@/lib/api';
import { completarDatos, extractCode, ticketView } from '@/lib/entradas/service';

type Ctx = { params: Promise<{ code: string }> };

// La persona completa sus datos cuando la venta la registró un vendedor.
export const POST = route<Ctx>(async (req, { params }) => {
  const code = extractCode((await params).code);
  if (!code) return fail('Código de entrada inválido.', 404);
  const entrada = await completarDatos(code, await readJson(req));
  return ok({ entrada: ticketView(entrada) });
});
