import { route, ok, fail, readJson } from '@/lib/api';
import { extractCode, reportarPago, ticketView } from '@/lib/entradas/service';
import { store } from '@/lib/entradas/store';

// El vendedor registra la venta escaneando la entrada que entrega.
export const POST = route(async (req) => {
  const body = await readJson(req);
  const code = extractCode(String(body.code ?? ''));
  if (!code) return fail('Escanea el QR de la entrada o escribe su código completo.');
  const sellerName = String(body.sellerName ?? '').trim().slice(0, 120);
  const { entrada, mesaError } = await reportarPago(code, body, 'vendedor');
  if (entrada && sellerName && sellerName !== entrada.holderName) {
    await store().updateEntrada(code, { notes: `Venta registrada por: ${sellerName}` });
  }
  return ok({ entrada: entrada && ticketView(entrada), mesaError });
});
