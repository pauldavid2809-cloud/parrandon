import 'server-only';
import { randomBytes } from 'crypto';
import { getEventConfig } from '@/lib/db';
import { fetchLiveEuroRate } from '@/lib/rates';
import { isSafeProofUrl } from '@/lib/proof';
import { SEMINARISTAS_DIRECTORY } from '@/lib/seminaristas';
import { store } from './store';
import {
  ClaimResult,
  CAPACIDAD_MESA,
  ENTRADAS_POR_SEMINARISTA,
  Entrada,
  HolderType,
  MesaEstado,
  MesasResumen,
  MetodoPago,
  OCUPA_PUESTO,
  ReportadoPor,
  TOTAL_ENTRADAS,
} from './types';

export class EntradaError extends Error {
  constructor(message: string, public status = 400, public reason?: string) {
    super(message);
  }
}

// ---------- códigos ----------

// Sin 0/O/1/I para que se puedan dictar o escribir a mano sin confusión.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_RE = /P\d{3,4}-[2-9A-HJ-NP-Z]{8}/i;

export function newCode(number: number): string {
  const bytes = randomBytes(8);
  let secret = '';
  for (const b of bytes) secret += ALPHABET[b % ALPHABET.length];
  return `P${String(number).padStart(3, '0')}-${secret}`;
}

// Acepta el enlace completo del QR o el código escrito a mano.
export function extractCode(input: string): string | null {
  const match = input.trim().toUpperCase().match(CODE_RE);
  return match ? match[0] : null;
}

// Personal autorizado puede buscar por número cuando el QR está dañado.
export async function findForStaff(input: string): Promise<Entrada | null> {
  const code = extractCode(input);
  if (code) return store().getEntrada(code);
  const n = Number(input.replace(/[^0-9]/g, ''));
  if (Number.isInteger(n) && n > 0 && /^\s*#?\s*\d+\s*$/.test(input)) return store().getEntradaByNumber(n);
  return null;
}

// ---------- reglas de fecha y precio ----------

function caracasToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas' }).format(new Date());
}

export async function eventRules() {
  const [config, rate] = await Promise.all([getEventConfig(), fetchLiveEuroRate()]);
  if (rate > 0) config.currentRateBs = rate;
  const eventDateIso = config.eventDateIso || '2026-12-12';
  const today = caracasToday();
  return {
    config,
    eventDateIso,
    isEventDay: today === eventDateIso,
    // El comprador puede cambiar su mesa hasta el día anterior al evento.
    canChangeTable: today < eventDateIso,
  };
}

function amountFor(method: MetodoPago, priceUsd: number, rate: number) {
  if (method === 'pago_movil') {
    return { amount: Math.round(priceUsd * rate * 100) / 100, currency: 'VES' as const, rateApplied: rate };
  }
  return { amount: priceUsd, currency: 'USD' as const, rateApplied: null };
}

// ---------- vistas ----------

export function firstName(name: string | null): string | null {
  if (!name) return null;
  return name.trim().split(/\s+/)[0] || null;
}

// Lo que ve quien tiene la entrada en la mano (el QR es su credencial).
export function ticketView(e: Entrada) {
  return {
    code: e.code,
    number: e.number,
    status: e.status,
    holderType: e.holderType,
    holderName: e.holderName,
    attendeeName: e.attendeeName,
    attendeePhone: e.attendeePhone,
    tableId: e.tableId,
    paymentMethod: e.paymentMethod,
    paymentReference: e.paymentReference,
    reportedBy: e.reportedBy,
    reportedAt: e.reportedAt,
    verifiedAt: e.verifiedAt,
    rejectionReason: e.rejectionReason,
    checkedInAt: e.checkedInAt,
  };
}

export type TicketView = ReturnType<typeof ticketView>;

export async function mesasEstado(): Promise<{ mesas: MesaEstado[]; resumen: MesasResumen }> {
  const [mesas, entradas] = await Promise.all([store().listMesas(), store().listEntradasLite()]);
  const taken = new Map<string, number>();
  for (const e of entradas) {
    if (e.tableId && OCUPA_PUESTO.includes(e.status)) taken.set(e.tableId, (taken.get(e.tableId) || 0) + 1);
  }
  const estado: MesaEstado[] = mesas.map((m) => {
    const t = taken.get(m.id) || 0;
    const free = m.blocked ? 0 : Math.max(0, m.capacity - t);
    return { ...m, taken: t, free, isFull: free === 0 };
  });
  const mesasLlenas = estado.filter((m) => m.isFull).length;
  return {
    mesas: estado,
    resumen: {
      totalMesas: estado.length,
      mesasLlenas,
      mesasConCupo: estado.length - mesasLlenas,
      puestosLibres: estado.reduce((s, m) => s + m.free, 0),
      puestosTotales: estado.reduce((s, m) => s + m.capacity, 0),
    },
  };
}

// ---------- generación ----------

export async function generarEntradas(total = TOTAL_ENTRADAS): Promise<number> {
  const existing = await store().countEntradas();
  if (existing > 0) throw new EntradaError('Las entradas ya fueron generadas. No se pueden generar de nuevo.', 409);

  const now = new Date().toISOString();
  const rows: Entrada[] = [];
  for (let n = 1; n <= total; n++) {
    // Seminaristas en orden del directorio: 6 consecutivas cada uno (#001–#006, #007–#012…).
    const sem = SEMINARISTAS_DIRECTORY[Math.floor((n - 1) / ENTRADAS_POR_SEMINARISTA)];
    rows.push({
      code: newCode(n),
      number: n,
      holderType: sem ? 'seminarista' : 'sin_asignar',
      holderId: sem ? sem.id : null,
      holderName: sem ? sem.name : null,
      status: 'sin_vender',
      attendeeName: null,
      attendeePhone: null,
      tableId: null,
      paymentMethod: null,
      paymentReference: null,
      paymentProofUrl: null,
      amount: null,
      currency: null,
      rateApplied: null,
      reportedBy: null,
      reportedAt: null,
      verifiedAt: null,
      verifiedBy: null,
      rejectionReason: null,
      doorActivated: false,
      checkedInAt: null,
      checkedInBy: null,
      mealServedAt: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
    });
  }
  await store().insertEntradas(rows);
  return rows.length;
}

// ---------- mesa ----------

const CLAIM_MESSAGE: Record<Exclude<ClaimResult, 'ok'>, string> = {
  mesa_llena: 'Esa mesa se acaba de llenar. Elige otra.',
  mesa_bloqueada: 'Esa mesa está reservada por la organización. Elige otra.',
  mesa_no_existe: 'Esa mesa no existe.',
  entrada_no_existe: 'Entrada no encontrada.',
  entrada_no_activa: 'Primero hay que reportar el pago de la entrada.',
};

export async function apartarMesa(code: string, tableId: string, force = false): Promise<void> {
  const result = await store().claimTable(code, tableId.toUpperCase(), force);
  if (result !== 'ok') throw new EntradaError(CLAIM_MESSAGE[result], 409, result);
}

export async function elegirMesaComprador(code: string, tableId: string) {
  const entrada = await store().getEntrada(code);
  if (!entrada) throw new EntradaError('Entrada no encontrada.', 404);
  if (entrada.checkedInAt) throw new EntradaError('Esta entrada ya ingresó al evento. La mesa no se puede cambiar.');
  const { canChangeTable } = await eventRules();
  if (entrada.tableId && !canChangeTable) {
    throw new EntradaError('Los cambios de mesa cerraron. El día del evento te ayudan en la puerta.');
  }
  await apartarMesa(code, tableId);
  return store().getEntrada(code);
}

// ---------- reporte de pago (comprador o vendedor) ----------

export interface ReporteInput {
  name: string;
  phone: string;
  method: MetodoPago;
  reference: string;
  proofUrl: string;
  tableId?: string | null;
}

function clean(value: unknown, max = 120): string {
  return String(value ?? '').trim().slice(0, max);
}

export function validarReporte(input: Partial<ReporteInput>, opts: { requireProof: boolean; methods: MetodoPago[] }) {
  const name = clean(input.name);
  const phone = clean(input.phone, 30);
  const reference = clean(input.reference, 60);
  const proofUrl = clean(input.proofUrl, 4_000_000);
  const method = input.method as MetodoPago;
  if (name.length < 3) throw new EntradaError('Escribe el nombre y apellido de quien va a usar la entrada.');
  if (phone.replace(/\D/g, '').length < 10) throw new EntradaError('Escribe un teléfono válido, por ejemplo 0414-1234567.');
  if (!opts.methods.includes(method)) throw new EntradaError('Elige cómo se pagó la entrada.');
  if (method !== 'efectivo_usd' && reference.length < 4) {
    throw new EntradaError('Escribe el número de referencia del pago (al menos 4 dígitos).');
  }
  if (opts.requireProof && method !== 'efectivo_usd' && !proofUrl) {
    throw new EntradaError('Sube el capture del pago para poder verificarlo.');
  }
  if (proofUrl && !isSafeProofUrl(proofUrl)) throw new EntradaError('El capture no es válido. Súbelo de nuevo.');
  return { name, phone, method, reference, proofUrl, tableId: input.tableId ? clean(input.tableId, 4) : null };
}

export async function reportarPago(code: string, input: Partial<ReporteInput>, by: ReportadoPor) {
  const entrada = await store().getEntrada(code);
  if (!entrada) throw new EntradaError('Entrada no encontrada.', 404);
  if (entrada.status === 'anulada') throw new EntradaError('Esta entrada fue anulada. Comunícate con la organización.');
  if (entrada.status !== 'sin_vender') {
    throw new EntradaError('El pago de esta entrada ya fue reportado.', 409, 'ya_reportada');
  }
  const data = validarReporte(input, { requireProof: true, methods: ['zelle', 'pago_movil'] });
  const { config } = await eventRules();
  const money = amountFor(data.method, config.ticketPriceUsd, config.currentRateBs);

  const reportado = await store().updateEntradaIf(code, { status: 'sin_vender' }, {
    status: 'por_verificar',
    attendeeName: data.name,
    attendeePhone: data.phone,
    paymentMethod: data.method,
    paymentReference: data.reference,
    paymentProofUrl: data.proofUrl,
    ...money,
    reportedBy: by,
    reportedAt: new Date().toISOString(),
    rejectionReason: null,
  });
  if (!reportado) throw new EntradaError('El pago de esta entrada ya fue reportado.', 409, 'ya_reportada');

  // La mesa se aparta en el mismo momento; si se llenó, el pago queda reportado y se elige otra.
  let mesaError: string | null = null;
  if (data.tableId) {
    try {
      await apartarMesa(code, data.tableId);
    } catch (err) {
      mesaError = err instanceof Error ? err.message : 'No se pudo apartar la mesa.';
    }
  }
  return { entrada: await store().getEntrada(code), mesaError };
}

// ---------- verificación (administración) ----------

export async function aprobar(code: string, by = 'Administración') {
  const entrada = await store().getEntrada(code);
  if (!entrada) throw new EntradaError('Entrada no encontrada.', 404);
  if (entrada.status !== 'por_verificar') throw new EntradaError('Esta entrada no está esperando verificación.');
  const ok = await store().updateEntradaIf(code, { status: 'por_verificar' }, {
    status: 'activa',
    verifiedAt: new Date().toISOString(),
    verifiedBy: by,
  });
  if (!ok) throw new EntradaError('Esta entrada cambió mientras tanto. Recarga la lista.', 409);
  return ok;
}

export async function rechazar(code: string, reason: string, by = 'Administración') {
  const entrada = await store().getEntrada(code);
  if (!entrada) throw new EntradaError('Entrada no encontrada.', 404);
  if (entrada.status !== 'por_verificar') throw new EntradaError('Esta entrada no está esperando verificación.');
  if (entrada.checkedInAt) throw new EntradaError('Esta persona ya entró al evento. Resuélvelo directamente con ella.');
  // Vuelve a "sin vender" y libera el puesto; la persona puede reportar de nuevo.
  const ok = await store().updateEntradaIf(code, { status: 'por_verificar', notCheckedIn: true }, {
    status: 'sin_vender',
    tableId: null,
    rejectionReason: clean(reason, 300) || 'No se encontró el pago.',
    verifiedAt: new Date().toISOString(),
    verifiedBy: by,
    doorActivated: false,
  });
  if (!ok) throw new EntradaError('Esta entrada cambió mientras tanto. Recarga la lista.', 409);
  return ok;
}

// ---------- puerta ----------

export async function checkIn(code: string, by = 'Puerta') {
  const entrada = await store().getEntrada(code);
  if (!entrada) throw new EntradaError('Entrada no encontrada.', 404);
  if (!OCUPA_PUESTO.includes(entrada.status)) throw new EntradaError('Esta entrada no está activa.');
  if (entrada.checkedInAt) throw new EntradaError('Esta entrada ya ingresó.', 409, 'ya_ingreso');
  if (!entrada.tableId) throw new EntradaError('Primero elige la mesa de esta persona.', 400, 'sin_mesa');
  const ok = await store().updateEntradaIf(code, { notCheckedIn: true }, { checkedInAt: new Date().toISOString(), checkedInBy: by });
  // Si dos puertas escanean la misma entrada a la vez, solo una la deja pasar.
  if (!ok) throw new EntradaError('Esta entrada ya ingresó.', 409, 'ya_ingreso');
  return ok;
}

export interface ActivacionPuertaInput {
  name: string;
  phone?: string;
  method: MetodoPago;
  reference?: string;
  tableId: string;
  soldBy?: string;
}

export async function activarEnPuerta(code: string, input: Partial<ActivacionPuertaInput>, by = 'Puerta') {
  const entrada = await store().getEntrada(code);
  if (!entrada) throw new EntradaError('Entrada no encontrada.', 404);
  if (entrada.status === 'anulada') throw new EntradaError('Esta entrada fue anulada.');

  const name = clean(input.name);
  if (name.length < 3) throw new EntradaError('Escribe el nombre de la persona.');
  if (!input.tableId) throw new EntradaError('Elige la mesa donde se va a sentar.');
  const method = input.method as MetodoPago;
  if (!['zelle', 'pago_movil', 'efectivo_usd'].includes(method)) throw new EntradaError('Elige el método de pago.');

  const { config } = await eventRules();
  const soldBy = clean(input.soldBy, 120);
  if (entrada.status === 'sin_vender') {
    await store().updateEntradaIf(code, { status: 'sin_vender' }, {
      status: 'por_verificar',
      attendeeName: name,
      attendeePhone: clean(input.phone, 30) || null,
      paymentMethod: method,
      paymentReference: clean(input.reference, 60) || null,
      ...amountFor(method, config.ticketPriceUsd, config.currentRateBs),
      reportedBy: 'puerta',
      reportedAt: new Date().toISOString(),
      doorActivated: true,
      rejectionReason: null,
      notes: soldBy ? `Dice que la compró a: ${soldBy}` : entrada.notes,
    });
  }
  await apartarMesa(code, input.tableId);
  return checkIn(code, by);
}

// ---------- taquilla ----------

export async function ventaTaquilla(
  code: string,
  input: Partial<ReporteInput> & { enterNow?: boolean },
  by = 'Taquilla'
) {
  const entrada = await store().getEntrada(code);
  if (!entrada) throw new EntradaError('Entrada no encontrada.', 404);
  if (entrada.status !== 'sin_vender') {
    throw new EntradaError('Esta entrada ya fue vendida o reportada. Usa otra del lote de taquilla.', 409);
  }
  const name = clean(input.name);
  if (name.length < 3) throw new EntradaError('Escribe el nombre de quien compra.');
  const method = input.method as MetodoPago;
  if (!['zelle', 'pago_movil', 'efectivo_usd'].includes(method)) throw new EntradaError('Elige el método de pago.');
  const reference = clean(input.reference, 60);
  if (method !== 'efectivo_usd' && reference.length < 4) throw new EntradaError('Escribe la referencia del pago.');
  if (!input.tableId) throw new EntradaError('Elige la mesa.');
  const proofUrl = clean(input.proofUrl, 4_000_000);
  if (proofUrl && !isSafeProofUrl(proofUrl)) throw new EntradaError('El capture no es válido. Súbelo de nuevo.');

  const { config } = await eventRules();
  const now = new Date().toISOString();
  const vendida = await store().updateEntradaIf(code, { status: 'sin_vender' }, {
    status: 'activa',
    attendeeName: name,
    attendeePhone: clean(input.phone, 30) || null,
    paymentMethod: method,
    paymentReference: reference || null,
    paymentProofUrl: proofUrl || null,
    ...amountFor(method, config.ticketPriceUsd, config.currentRateBs),
    reportedBy: 'taquilla',
    reportedAt: now,
    verifiedAt: now,
    verifiedBy: by,
    rejectionReason: null,
  });
  if (!vendida) throw new EntradaError('Esta entrada se acaba de vender en otra caja. Usa otra.', 409);
  try {
    await apartarMesa(code, input.tableId);
  } catch (err) {
    // Sin mesa la venta no sirve: se revierte para que el taquillero elija otra.
    await store().updateEntrada(code, {
      status: 'sin_vender',
      attendeeName: null,
      attendeePhone: null,
      paymentMethod: null,
      paymentReference: null,
      paymentProofUrl: null,
      amount: null,
      currency: null,
      rateApplied: null,
      reportedBy: null,
      reportedAt: null,
      verifiedAt: null,
      verifiedBy: null,
    });
    throw err;
  }
  if (input.enterNow) return checkIn(code, by);
  return store().getEntrada(code);
}

// ---------- cocina ----------

export async function cocinaEstado() {
  const [entradas, { mesas }] = await Promise.all([store().listEntradas(), mesasEstado()]);
  const enMesa = entradas.filter((e) => e.tableId && OCUPA_PUESTO.includes(e.status));
  const llegadas = enMesa
    .filter((e) => e.checkedInAt)
    .sort((a, b) => (b.checkedInAt! > a.checkedInAt! ? 1 : -1));

  const porMesa = mesas.map((m) => {
    const gente = enMesa.filter((e) => e.tableId === m.id);
    const llegaron = gente.filter((e) => e.checkedInAt);
    const servidos = llegaron.filter((e) => e.mealServedAt);
    // Desde cuándo espera plato la primera persona sin servir de esa mesa.
    const esperaDesde = llegaron
      .filter((e) => !e.mealServedAt)
      .reduce<string | null>((min, e) => (!min || e.checkedInAt! < min ? e.checkedInAt : min), null);
    return {
      id: m.id,
      sector: m.sector,
      number: m.number,
      esperados: gente.length,
      llegaron: llegaron.length,
      servidos: servidos.length,
      porServir: llegaron.length - servidos.length,
      esperaDesde,
    };
  });

  return {
    llegadas: llegadas.slice(0, 60).map((e) => ({
      number: e.number,
      name: e.attendeeName,
      tableId: e.tableId,
      checkedInAt: e.checkedInAt,
      served: Boolean(e.mealServedAt),
    })),
    mesas: porMesa,
    totales: {
      esperados: enMesa.length,
      llegaron: llegadas.length,
      servidos: llegadas.filter((e) => e.mealServedAt).length,
      porServir: llegadas.filter((e) => !e.mealServedAt).length,
    },
  };
}

export async function despacharMesa(tableId: string) {
  const entradas = await store().listEntradas();
  const codes = entradas
    .filter((e) => e.tableId === tableId && e.checkedInAt && !e.mealServedAt && OCUPA_PUESTO.includes(e.status))
    .map((e) => e.code);
  if (codes.length === 0) throw new EntradaError('No hay platos pendientes en esa mesa.');
  await store().updateEntradas(codes, { mealServedAt: new Date().toISOString() });
  return codes;
}

export async function deshacerDespacho(codes: string[]) {
  return store().updateEntradas(codes.slice(0, CAPACIDAD_MESA * 2), { mealServedAt: null });
}

// ---------- lotes ----------

export async function holderInfo(type: HolderType, id: string | null): Promise<{ id: string | null; name: string | null }> {
  if (type === 'seminarista') {
    const sem = SEMINARISTAS_DIRECTORY.find((s) => s.id === id);
    if (!sem) throw new EntradaError('Seminarista no encontrado.');
    return { id: sem.id, name: sem.name };
  }
  if (type === 'parroquia') {
    const p = (await store().listParroquias()).find((x) => x.id === id);
    if (!p) throw new EntradaError('Parroquia no encontrada.');
    return { id: p.id, name: p.name };
  }
  if (type === 'padre_jorge') return { id: 'padre-jorge', name: 'Padre Jorge' };
  if (type === 'taquilla') return { id: 'taquilla', name: 'Taquilla' };
  return { id: null, name: null };
}

export async function asignarLote(from: number, to: number, type: HolderType, id: string | null) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
    throw new EntradaError('Revisa el rango: desde y hasta deben ser números y "desde" no puede ser mayor.');
  }
  const holder = await holderInfo(type, id);
  return store().updateRange(from, to, { holderType: type, holderId: holder.id, holderName: holder.name });
}

export async function loteDe(type: HolderType, id: string) {
  const entradas = await store().listEntradas();
  return entradas
    .filter((e) => e.holderType === type && e.holderId === id)
    .map((e) => ({
      number: e.number,
      status: e.status,
      tableId: e.tableId,
      buyer: firstName(e.attendeeName),
      checkedIn: Boolean(e.checkedInAt),
    }));
}

// ---------- resumen administrativo ----------

export async function resumenAdmin() {
  const [entradas, { resumen }] = await Promise.all([store().listEntradas(), mesasEstado()]);
  const count = (pred: (e: Entrada) => boolean) => entradas.filter(pred).length;
  const vendidas = entradas.filter((e) => OCUPA_PUESTO.includes(e.status));
  const activas = entradas.filter((e) => e.status === 'activa');
  const sum = (list: Entrada[], method: MetodoPago) =>
    list.filter((e) => e.paymentMethod === method).reduce((s, e) => s + (e.amount || 0), 0);

  const holders = new Map<string, { type: HolderType; id: string | null; name: string; total: number; vendidas: number; activas: number }>();
  for (const e of entradas) {
    const key = `${e.holderType}:${e.holderId ?? ''}`;
    const h = holders.get(key) || {
      type: e.holderType,
      id: e.holderId,
      name: e.holderName || 'Sin asignar',
      total: 0,
      vendidas: 0,
      activas: 0,
    };
    h.total++;
    if (OCUPA_PUESTO.includes(e.status)) h.vendidas++;
    if (e.status === 'activa') h.activas++;
    holders.set(key, h);
  }

  return {
    generadas: entradas.length,
    sinVender: count((e) => e.status === 'sin_vender'),
    porVerificar: count((e) => e.status === 'por_verificar'),
    activas: activas.length,
    anuladas: count((e) => e.status === 'anulada'),
    vendidas: vendidas.length,
    sinMesa: count((e) => OCUPA_PUESTO.includes(e.status) && !e.tableId),
    activadasEnPuerta: count((e) => e.doorActivated && e.status === 'por_verificar'),
    ingresaron: count((e) => Boolean(e.checkedInAt)),
    platosServidos: count((e) => Boolean(e.mealServedAt)),
    mesas: resumen,
    recaudado: {
      // Solo pagos verificados (activas).
      zelleUsd: sum(activas, 'zelle'),
      pagoMovilVes: sum(activas, 'pago_movil'),
      efectivoUsd: sum(activas, 'efectivo_usd'),
    },
    porResponsable: Array.from(holders.values()).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)),
  };
}

export async function resumenTaquilla() {
  const entradas = await store().listEntradas();
  const ventas = entradas
    .filter((e) => e.reportedBy === 'taquilla')
    .sort((a, b) => ((b.reportedAt || '') > (a.reportedAt || '') ? 1 : -1));
  const total = (m: MetodoPago) => ventas.filter((e) => e.paymentMethod === m).reduce((s, e) => s + (e.amount || 0), 0);
  return {
    ventas: ventas.slice(0, 40).map((e) => ({
      number: e.number,
      name: e.attendeeName,
      tableId: e.tableId,
      method: e.paymentMethod,
      amount: e.amount,
      currency: e.currency,
      at: e.reportedAt,
    })),
    cantidad: ventas.length,
    totales: { zelle: total('zelle'), pago_movil: total('pago_movil'), efectivo_usd: total('efectivo_usd') },
    disponiblesTaquilla: entradas.filter((e) => e.holderType === 'taquilla' && e.status === 'sin_vender').length,
  };
}
