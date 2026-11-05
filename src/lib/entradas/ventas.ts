import 'server-only';
import { isSafeProofUrl } from '@/lib/proof';
import { aceptaPagoMovil, PAGO_MOVIL_PAUSADO } from '@/lib/metodos';
import { store } from './store';
import { amountFor, aprobar, EntradaError, eventRules, extractCode, holderInfo, rechazar } from './service';
import { MAX_ENTRADAS_POR_VENTA, type Entrada, type HolderType, type MetodoPago, type Venta, type VentaEstado } from './types';

// Órdenes de los vendedores: escanean una o varias entradas, ponen el método de pago y la
// suben (a veces horas después, cuando hay internet). Cada persona completa sus datos después
// escaneando su propia entrada.

const ID_RE = /^[A-Za-z0-9-]{8,64}$/;
const VENDEDORES: HolderType[] = ['seminarista', 'padre_jorge', 'parroquia'];
const METODOS: MetodoPago[] = ['efectivo_usd', 'pago_movil', 'zelle'];

function clean(value: unknown, max = 120): string {
  return String(value ?? '').trim().slice(0, max);
}

// Las ventas guardan la hora del teléfono; si viene rara (reloj mal puesto), se usa la del servidor.
function horaVenta(raw: unknown, ahora: Date) {
  const t = Date.parse(String(raw ?? ''));
  const maxAtraso = 90 * 24 * 3600 * 1000;
  if (Number.isNaN(t) || t > ahora.getTime() + 5 * 60 * 1000 || t < ahora.getTime() - maxAtraso) return ahora.toISOString();
  return new Date(t).toISOString();
}

// El estado sale de las entradas: si administración rechaza o mueve una, la orden lo refleja.
type DeVenta = Pick<Entrada, 'saleId' | 'number' | 'status'>;
const CAMPOS_VENTA = ['saleId', 'number', 'status'] as const;

export function estadoVenta<E extends DeVenta>(v: Venta, entradas: E[]) {
  const suyas = entradas.filter((e) => e.saleId === v.id).sort((a, b) => a.number - b.number);
  const porVerificar = suyas.filter((e) => e.status === 'por_verificar');
  const estado: VentaEstado = porVerificar.length ? 'por_verificar' : suyas.some((e) => e.status === 'activa') ? 'verificada' : 'rechazada';
  return { estado, suyas, porVerificar };
}

// Lo que ve el vendedor de su orden (sin códigos ni datos de nadie).
export function vistaVendedor(v: Venta, entradas: DeVenta[]) {
  const { estado, suyas } = estadoVenta(v, entradas);
  return {
    id: v.id,
    estado,
    entradas: suyas.map((e) => e.number),
    problemas: v.problemas,
    rejectionReason: v.rejectionReason,
  };
}

export type VistaVendedor = ReturnType<typeof vistaVendedor>;

export async function registrarVenta(input: Record<string, unknown>) {
  const id = clean(input.id, 64);
  if (!ID_RE.test(id)) throw new EntradaError('La venta no tiene identificador. Actualiza la app de vendedores.');

  // Reintento de una venta que ya llegó (el teléfono no recibió la respuesta): se devuelve igual.
  const existente = await store().getVenta(id);
  if (existente) return vistaVendedor(existente, await store().listCampos(CAMPOS_VENTA, { saleId: id }));

  const seller = (input.seller ?? {}) as Record<string, unknown>;
  const sellerType = seller.type as HolderType;
  if (!VENDEDORES.includes(sellerType)) throw new EntradaError('Indica quién vende.');
  const holder = await holderInfo(sellerType, clean(seller.id, 80) || null);
  // Quien vende las entradas de una parroquia suele ser un seminarista: su nombre sale del directorio.
  const vendedorId = clean(seller.vendedorId, 40);
  const vendedor = vendedorId ? (await holderInfo('seminarista', vendedorId)).name : clean(seller.vendedor, 80) || null;
  if (sellerType !== 'seminarista' && !vendedor) throw new EntradaError('Escribe el nombre de quien vende.');

  const method = input.method as MetodoPago;
  if (!METODOS.includes(method)) throw new EntradaError('Elige cómo pagaron.');
  const reference = clean(input.reference, 60);
  if (method !== 'efectivo_usd' && reference.length < 4) {
    throw new EntradaError('Escribe la referencia del pago (al menos 4 dígitos).');
  }
  const proofUrl = clean(input.proofUrl, 4_000_000) || null;
  if (proofUrl && !isSafeProofUrl(proofUrl)) throw new EntradaError('El capture no es válido. Tómalo de nuevo.');

  const crudos = Array.isArray(input.codes) ? input.codes : [];
  const codes = [...new Set(crudos.map((c) => extractCode(String(c ?? ''))).filter((c): c is string => Boolean(c)))];
  if (codes.length === 0) throw new EntradaError('Escanea al menos una entrada.');
  if (codes.length > MAX_ENTRADAS_POR_VENTA) {
    throw new EntradaError(`Una venta puede tener hasta ${MAX_ENTRADAS_POR_VENTA} entradas.`);
  }

  // El monto en bolívares es el que vio el comprador en el teléfono del vendedor, salvo que
  // esa tasa esté muy lejos de la de hoy (teléfono sin internet por días).
  const { config } = await eventRules();
  if (method === 'pago_movil' && !aceptaPagoMovil(config)) throw new EntradaError(PAGO_MOVIL_PAUSADO);
  const tasaTelefono = Number(input.rateBs);
  const tasa =
    Number.isFinite(tasaTelefono) && tasaTelefono > config.currentRateBs * 0.8 && tasaTelefono < config.currentRateBs * 1.25
      ? tasaTelefono
      : config.currentRateBs;
  const dinero = amountFor(method, config.ticketPriceUsd, tasa);

  const ahora = new Date();
  const soldAt = horaVenta(input.soldAt, ahora);
  const numbers: number[] = [];
  const problemas: Venta['problemas'] = [];
  for (const code of codes) {
    const entrada = await store().getEntrada(code);
    const numero = entrada?.number ?? Number(code.slice(1, code.indexOf('-')));
    numbers.push(numero);
    if (!entrada) {
      problemas.push({ number: numero, motivo: 'Ese código no es de una entrada del Parrandón.' });
      continue;
    }
    if (entrada.saleId === id) continue; // ya quedó en esta venta en un intento anterior
    if (entrada.status === 'anulada') {
      problemas.push({ number: numero, motivo: 'Está anulada.' });
      continue;
    }
    const ok =
      entrada.status === 'sin_vender' &&
      (await store().updateEntradaIf(code, { status: 'sin_vender' }, {
        status: 'por_verificar',
        paymentMethod: method,
        paymentReference: reference || null,
        paymentProofUrl: proofUrl,
        ...dinero,
        reportedBy: 'vendedor',
        reportedAt: soldAt,
        rejectionReason: null,
        saleId: id,
      }));
    // Si otro intento de esta misma venta la tomó al mismo tiempo, no es un problema.
    if (!ok && (await store().getEntrada(code))?.saleId !== id) {
      problemas.push({ number: numero, motivo: 'Ya estaba vendida o reportada.' });
    }
  }

  const venta: Venta = {
    id,
    sellerType,
    sellerId: holder.id,
    sellerName: holder.name,
    vendedor,
    method,
    reference: reference || null,
    proofUrl,
    buyerName: clean(input.buyerName, 120) || null,
    buyerPhone: clean(input.buyerPhone, 30) || null,
    priceUsd: config.ticketPriceUsd,
    rateApplied: dinero.rateApplied,
    numbers,
    problemas,
    soldAt,
    receivedAt: ahora.toISOString(),
    verifiedAt: null,
    verifiedBy: null,
    rejectionReason: null,
  };
  await store().saveVenta(venta);
  return vistaVendedor(venta, await store().listCampos(CAMPOS_VENTA, { saleId: id }));
}

// El teléfono del vendedor pregunta cómo van sus órdenes (los id solo los conoce ese teléfono).
export async function estadoVentas(ids: string[]) {
  const validos = [...new Set(ids.filter((i) => ID_RE.test(i)))].slice(0, 100);
  if (validos.length === 0) return [];
  const [ventas, entradas] = await Promise.all([store().listVentas(validos), store().listCampos(CAMPOS_VENTA)]);
  return ventas.map((v) => vistaVendedor(v, entradas));
}

// ---------- administración ----------

export async function ventasAdmin() {
  const [ventas, entradas] = await Promise.all([
    store().listVentas(),
    store().listCampos([...CAMPOS_VENTA, 'attendeeName', 'tableId']),
  ]);
  const porVendedor = new Map<
    string,
    { nombre: string; lote: string | null; ventas: number; entradas: number; efectivoPorEntregar: number; pagosPorVerificar: number; verificadas: number }
  >();
  const lista = ventas.map((v) => {
    const { estado, suyas, porVerificar } = estadoVenta(v, entradas);
    const key = `${v.sellerType}:${v.sellerId ?? ''}:${(v.vendedor ?? '').toLowerCase()}`;
    const r = porVendedor.get(key) ?? {
      nombre: v.vendedor || v.sellerName || 'Sin nombre',
      lote: v.vendedor ? v.sellerName : null,
      ventas: 0,
      entradas: 0,
      efectivoPorEntregar: 0,
      pagosPorVerificar: 0,
      verificadas: 0,
    };
    r.ventas += 1;
    r.entradas += suyas.length;
    if (v.method === 'efectivo_usd') r.efectivoPorEntregar += porVerificar.length * v.priceUsd;
    else r.pagosPorVerificar += porVerificar.length;
    r.verificadas += suyas.filter((e) => e.status === 'activa').length;
    porVendedor.set(key, r);
    return {
      ...v,
      // Los capture guardados como imagen embebida pesan mucho: se piden uno por uno.
      proofUrl: v.proofUrl?.startsWith('data:') ? 'embedded' : v.proofUrl,
      estado,
      entradas: suyas.map((e) => ({ number: e.number, status: e.status, conDatos: Boolean(e.attendeeName), tableId: e.tableId })),
      porVerificar: porVerificar.length,
    };
  });
  return {
    ventas: lista,
    vendedores: [...porVendedor.values()].sort((a, b) => b.efectivoPorEntregar - a.efectivoPorEntregar || b.entradas - a.entradas),
  };
}

export type VentaAdmin = Awaited<ReturnType<typeof ventasAdmin>>['ventas'][number];

async function entradasDe(id: string) {
  const venta = await store().getVenta(id);
  if (!venta) throw new EntradaError('Venta no encontrada.', 404);
  const entradas = (await store().listEntradas({ saleId: id })).filter((e) => e.status === 'por_verificar');
  return { venta, entradas };
}

// «Efectivo recibido» o «Pago verificado»: activa todas las entradas de la orden.
export async function aprobarVenta(id: string, by = 'Administración') {
  const { entradas } = await entradasDe(id);
  if (entradas.length === 0) throw new EntradaError('Esta venta no tiene entradas por verificar.');
  for (const e of entradas) await aprobar(e.code, by);
  await store().updateVenta(id, { verifiedAt: new Date().toISOString(), verifiedBy: by, rejectionReason: null });
  return entradas.length;
}

// Pago no encontrado: las entradas vuelven a sin vender (salvo las que ya entraron al evento).
export async function rechazarVenta(id: string, reason: string, by = 'Administración') {
  const { entradas } = await entradasDe(id);
  if (entradas.length === 0) throw new EntradaError('Esta venta no tiene entradas por verificar.');
  const motivo = clean(reason, 300) || 'No se encontró el pago de la venta.';
  const yaEntraron: number[] = [];
  for (const e of entradas) {
    if (e.checkedInAt) yaEntraron.push(e.number);
    else await rechazar(e.code, motivo, by);
  }
  await store().updateVenta(id, { verifiedAt: new Date().toISOString(), verifiedBy: by, rejectionReason: motivo });
  return { rechazadas: entradas.length - yaEntraron.length, yaEntraron };
}

export async function captureDeVenta(id: string) {
  const venta = await store().getVenta(id);
  if (!venta) throw new EntradaError('Venta no encontrada.', 404);
  return venta.proofUrl;
}
