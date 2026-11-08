import 'server-only';
import { getDonacionesPorId, guardarDonacionVendedor, listDonacionesVendedores, type DonacionResumen } from '@/lib/db';
import { guardarCapture } from '@/lib/capturas';
import { isSafeProofUrl } from '@/lib/proof';
import { aceptaPagoMovil, PAGO_MOVIL_PAUSADO } from '@/lib/metodos';
import type { Order, PaymentMethod } from '@/types';
import { EntradaError, eventRules } from './service';
import { horaVenta, ID_RE, quienVende } from './ventas';
import type { MetodoPago } from './types';

// Donaciones que reciben los vendedores (en la parroquia, sin entrada). Se guardan en el
// teléfono aunque no haya señal y se suben después, como las ventas. Quedan en la tabla de
// donaciones (orders) con el id DON-…, por verificar hasta que administración reciba el
// efectivo o encuentre el pago.

const METODOS: MetodoPago[] = ['efectivo_usd', 'zelle', 'pago_movil'];
const COMO_ORDEN: Record<MetodoPago, PaymentMethod> = { efectivo_usd: 'cash', zelle: 'zelle', pago_movil: 'pago_movil' };
const MAX_USD = 1000;

const idOrden = (id: string) => `DON-${id}`.toUpperCase();

function clean(value: unknown, max = 120): string {
  return String(value ?? '').trim().slice(0, max);
}

// Lo que ve el vendedor en «Tus ventas», con la misma forma que una venta.
function vista(o: Order, idTelefono: string) {
  return {
    id: idTelefono,
    estado: o.status === 'approved' ? ('verificada' as const) : o.status === 'rejected' ? ('rechazada' as const) : ('por_verificar' as const),
    entradas: [] as number[],
    problemas: [] as { number: number | null; motivo: string }[],
    rejectionReason: o.status === 'rejected' ? (o.rejectionReason ?? null) : null,
  };
}

export async function registrarDonacion(input: Record<string, unknown>) {
  const id = clean(input.id, 64);
  if (!ID_RE.test(id)) throw new EntradaError('La donación no tiene identificador. Actualiza la app de vendedores.');

  // Reintento (el teléfono no recibió la respuesta): se devuelve la que ya llegó.
  const [existente] = await getDonacionesPorId([idOrden(id)]);
  if (existente) return vista(existente, id);

  const { holder, vendedor } = await quienVende(input.seller);

  const method = input.method as MetodoPago;
  if (!METODOS.includes(method)) throw new EntradaError('Elige cómo donaron.');
  const { config } = await eventRules();
  if (method === 'pago_movil' && !aceptaPagoMovil(config)) throw new EntradaError(PAGO_MOVIL_PAUSADO);

  const montoUsd = Math.round(Number(input.montoUsd) * 100) / 100;
  if (!Number.isFinite(montoUsd) || montoUsd < 1) throw new EntradaError('Escribe el monto de la donación (al menos $1).');
  if (montoUsd > MAX_USD) throw new EntradaError(`Una donación puede ser de hasta $${MAX_USD}. Si es más, avísale a administración.`);

  const reference = clean(input.reference, 60);
  const proofUrl = clean(input.proofUrl, 4_000_000) || null;
  if (method !== 'efectivo_usd') {
    if (reference.length < 4) throw new EntradaError('Escribe la referencia del pago (al menos 4 dígitos).');
    if (!proofUrl) throw new EntradaError('Falta el capture del pago. Agrega la foto y guarda la donación otra vez.');
  }
  if (proofUrl && !isSafeProofUrl(proofUrl)) throw new EntradaError('El capture no es válido. Tómalo de nuevo.');

  // En bolívares, el monto es el que vio el donante en el teléfono, salvo que esa tasa esté muy
  // lejos de la de hoy (teléfono sin internet por días).
  const tasaTelefono = Number(input.rateBs);
  const tasa =
    Number.isFinite(tasaTelefono) && tasaTelefono > config.currentRateBs * 0.8 && tasaTelefono < config.currentRateBs * 1.25
      ? tasaTelefono
      : config.currentRateBs;
  const enBs = method === 'pago_movil';

  const ahora = new Date();
  const donante = clean(input.donorName, 80);
  const orden: Order = {
    id: idOrden(id),
    createdAt: horaVenta(input.soldAt, ahora),
    buyerName: donante || 'Anónimo',
    buyerEmail: '',
    buyerPhone: clean(input.donorPhone, 30),
    buyerDocId: '',
    quantity: 0,
    isDonation: true,
    donationAmount: montoUsd,
    seats: [],
    attendees: [],
    paymentMethod: COMO_ORDEN[method],
    paymentReference: method === 'efectivo_usd' ? 'N/A' : reference,
    paymentProofUrl: method === 'efectivo_usd' ? undefined : ((await guardarCapture(proofUrl, `donacion-${id}`)) ?? undefined),
    amountPaid: enBs ? Math.round(montoUsd * tasa * 100) / 100 : montoUsd,
    currency: enBs ? 'VES' : 'USD',
    convertedUsd: montoUsd,
    rateApplied: enBs ? tasa : undefined,
    status: 'pending',
    salesChannel: 'seminarista_parroquia',
    // Las mismas etiquetas que la rendición de ventas: quien vende y, si no es el dueño, de qué lote.
    sellerName: vendedor || holder.name || undefined,
    parishName: vendedor ? holder.name || undefined : undefined,
    notes: `[DONACIÓN] Registrada en la app de vendedores; llegó ${ahora.toISOString()}.`,
    tickets: [],
  };
  await guardarDonacionVendedor(orden);
  return vista(orden, id);
}

// Cómo van las donaciones de este teléfono (los ids que no son de ventas).
export async function estadoDonaciones(ids: string[]) {
  const validos = [...new Set(ids.filter((i) => ID_RE.test(i)))].slice(0, 100);
  if (validos.length === 0) return [];
  const porOrden = new Map(validos.map((i) => [idOrden(i), i]));
  const ordenes = await getDonacionesPorId([...porOrden.keys()]);
  return ordenes.map((o) => vista(o, porOrden.get(o.id.toUpperCase())!));
}

type Fila = { nombre: string; lote: string | null; efectivoPorEntregar: number; donacionesPorEntregar?: number; donaciones?: number };

// Suma a la rendición de cada vendedor el efectivo de sus donaciones que administración todavía
// no ha recibido. Las filas se emparejan por el mismo nombre y lote que muestra la rendición.
export async function sumarDonaciones<F extends Fila>(filas: F[], crear: (nombre: string, lote: string | null) => F) {
  let donaciones: DonacionResumen[] = [];
  try {
    donaciones = await listDonacionesVendedores();
  } catch (err) {
    console.error(err);
    return filas;
  }
  const clave = (nombre: string, lote: string | null) => `${nombre.toLowerCase()}|${(lote ?? '').toLowerCase()}`;
  const porClave = new Map(filas.map((f) => [clave(f.nombre, f.lote), f]));
  for (const d of donaciones) {
    if (d.status !== 'pending' || d.paymentMethod !== 'cash') continue;
    const nombre = d.sellerName || 'Sin nombre';
    const lote = d.parishName || null;
    let f = porClave.get(clave(nombre, lote));
    if (!f) {
      f = crear(nombre, lote);
      porClave.set(clave(nombre, lote), f);
      filas.push(f);
    }
    f.efectivoPorEntregar += d.convertedUsd;
    f.donacionesPorEntregar = (f.donacionesPorEntregar ?? 0) + d.convertedUsd;
    f.donaciones = (f.donaciones ?? 0) + 1;
  }
  return filas.sort((a, b) => b.efectivoPorEntregar - a.efectivoPorEntregar);
}
