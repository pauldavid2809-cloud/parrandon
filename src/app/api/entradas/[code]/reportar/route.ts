import { route, ok, fail, readJson } from '@/lib/api';
import { extractCode, reportarPago, ticketView } from '@/lib/entradas/service';

type Ctx = { params: Promise<{ code: string }> };

// El comprador reporta su pago (Zelle o Pago Móvil) y aparta su mesa.
export const POST = route<Ctx>(async (req, { params }) => {
  const code = extractCode((await params).code);
  if (!code) return fail('Código de entrada inválido.', 404);
  const body = await readJson(req);
  const { entrada, mesaError } = await reportarPago(code, body, 'comprador');
  return ok({ entrada: entrada && ticketView(entrada), mesaError });
});
