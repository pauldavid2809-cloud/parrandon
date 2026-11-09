import 'server-only';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin, useLocalStore, StoreNotConfiguredError } from '@/lib/supabase-admin';
import {
  ClaimResult,
  Entrada,
  Mesa,
  OCUPA_PUESTO,
  Parroquia,
  SECTORES,
  Venta,
  MESAS_POR_SECTOR,
  CAPACIDAD_MESA,
  StaffRole,
} from './types';

// Persistencia de entradas, mesas, parroquias y PIN.
// Producción: Supabase con clave de servicio. Desarrollo: PARRANDON_LOCAL_DB=1 usa un JSON local.

export interface EntradaLite {
  number: number;
  tableId: string | null;
  status: Entrada['status'];
}

export interface Condicion {
  status?: Entrada['status'];
  notCheckedIn?: boolean;
  sinPersona?: boolean; // todavía no tiene nombre registrado
}

// Filtro por igualdad que se resuelve en la base de datos (no se traen las demás filas).
export type FiltroEntradas = Partial<Pick<Entrada, 'holderType' | 'holderId' | 'saleId'>>;

interface Store {
  // false si a la tabla le faltan columnas nuevas (no se ha vuelto a correr supabase/entradas.sql).
  schemaAlDia(): Promise<boolean>;
  listEntradas(filtro?: FiltroEntradas): Promise<Entrada[]>;
  // Solo las columnas que usa cada pantalla. Puerta, cocina y administración se refrescan cada
  // pocos segundos y leen las 500 entradas cada vez: el plan gratis de Supabase cuenta los datos que salen.
  listCampos<K extends keyof Entrada>(campos: readonly K[], filtro?: FiltroEntradas): Promise<Pick<Entrada, K>[]>;
  listEntradasLite(): Promise<EntradaLite[]>;
  countEntradas(): Promise<number>;
  getEntrada(code: string): Promise<Entrada | null>;
  getEntradaByNumber(n: number): Promise<Entrada | null>;
  updateEntrada(code: string, patch: Partial<Entrada>): Promise<Entrada | null>;
  // Actualiza solo si la entrada sigue en el estado esperado (evita dobles ventas o dobles ingresos).
  updateEntradaIf(code: string, cond: Condicion, patch: Partial<Entrada>): Promise<Entrada | null>;
  updateEntradas(codes: string[], patch: Partial<Entrada>): Promise<number>;
  // Con «estado», solo las del rango que están en ese estado (p. ej. solo las sin vender).
  updateRange(from: number, to: number, patch: Partial<Entrada>, estado?: Entrada['status']): Promise<number>;
  insertEntradas(rows: Entrada[]): Promise<void>;
  claimTable(code: string, tableId: string, force: boolean): Promise<ClaimResult>;
  listMesas(): Promise<Mesa[]>;
  updateMesa(id: string, patch: Partial<Mesa>): Promise<void>;
  listParroquias(): Promise<Parroquia[]>;
  upsertParroquia(p: Parroquia): Promise<void>;
  deleteParroquia(id: string): Promise<void>;
  getPin(role: StaffRole): Promise<string | null>;
  setPin(role: StaffRole, pin: string | null): Promise<void>;
  getVenta(id: string): Promise<Venta | null>;
  saveVenta(v: Venta): Promise<void>;
  updateVenta(id: string, patch: Partial<Venta>): Promise<void>;
  listVentas(ids?: string[]): Promise<Venta[]>;
  // Capture que siguen guardados como imagen dentro de la fila (para moverlos al almacenamiento).
  capturasEmbebidas(tipo: 'venta' | 'entrada', max: number): Promise<{ clave: string; url: string }[]>;
  // Pone el enlace del capture ya subido. En una venta, también en sus entradas (tenían la misma foto).
  reemplazarCaptura(tipo: 'venta' | 'entrada', clave: string, url: string): Promise<void>;
}

// Las listas no traen las fotos embebidas (pesan cientos de KB cada una): ponen «embedded» y
// quien necesita la imagen la pide por su lado (getEntrada / getVenta).
const marcarEmbebida = (url: string | null) => (url?.startsWith('data:') ? 'embedded' : url);

// ---------- mapeo snake_case <-> camelCase ----------

const COLS: Record<keyof Entrada, string> = {
  code: 'code',
  number: 'number',
  holderType: 'holder_type',
  holderId: 'holder_id',
  holderName: 'holder_name',
  status: 'status',
  attendeeName: 'attendee_name',
  attendeeFirstName: 'attendee_first_name',
  attendeeLastName: 'attendee_last_name',
  attendeeCedula: 'attendee_cedula',
  attendeePhone: 'attendee_phone',
  tableId: 'table_id',
  paymentMethod: 'payment_method',
  paymentReference: 'payment_reference',
  paymentProofUrl: 'payment_proof_url',
  amount: 'amount',
  currency: 'currency',
  rateApplied: 'rate_applied',
  reportedBy: 'reported_by',
  reportedAt: 'reported_at',
  verifiedAt: 'verified_at',
  verifiedBy: 'verified_by',
  rejectionReason: 'rejection_reason',
  doorActivated: 'door_activated',
  checkedInAt: 'checked_in_at',
  checkedInBy: 'checked_in_by',
  mealServedAt: 'meal_served_at',
  notes: 'notes',
  saleId: 'sale_id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const VENTA_COLS: Record<keyof Venta, string> = {
  id: 'id',
  sellerType: 'seller_type',
  sellerId: 'seller_id',
  sellerName: 'seller_name',
  vendedor: 'vendedor',
  method: 'method',
  reference: 'reference',
  proofUrl: 'proof_url',
  buyerName: 'buyer_name',
  buyerPhone: 'buyer_phone',
  priceUsd: 'price_usd',
  rateApplied: 'rate_applied',
  numbers: 'numbers',
  problemas: 'problemas',
  soldAt: 'sold_at',
  receivedAt: 'received_at',
  verifiedAt: 'verified_at',
  verifiedBy: 'verified_by',
  rejectionReason: 'rejection_reason',
};

function ventaToRow(patch: Partial<Venta>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    const col = VENTA_COLS[key as keyof Venta];
    if (col) row[col] = value;
  }
  return row;
}

function ventaFromRow(row: Record<string, unknown>): Venta {
  const v = {} as Record<string, unknown>;
  for (const [key, col] of Object.entries(VENTA_COLS)) v[key] = row[col] ?? null;
  const venta = v as unknown as Venta;
  venta.priceUsd = Number(row.price_usd);
  venta.rateApplied = row.rate_applied == null ? null : Number(row.rate_applied);
  venta.numbers = Array.isArray(row.numbers) ? (row.numbers as number[]).map(Number) : [];
  venta.problemas = Array.isArray(row.problemas) ? (row.problemas as Venta['problemas']) : [];
  return venta;
}

function toRow(patch: Partial<Entrada>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    const col = COLS[key as keyof Entrada];
    if (col) row[col] = value;
  }
  return row;
}

function fromRow(row: Record<string, unknown>): Entrada {
  const e = {} as Record<string, unknown>;
  for (const [key, col] of Object.entries(COLS)) {
    e[key] = row[col] ?? null;
  }
  const entrada = e as unknown as Entrada;
  entrada.number = Number(row.number);
  entrada.amount = row.amount == null ? null : Number(row.amount);
  entrada.rateApplied = row.rate_applied == null ? null : Number(row.rate_applied);
  entrada.doorActivated = Boolean(row.door_activated);
  return entrada;
}

function elegir<K extends keyof Entrada>(e: Entrada, campos: readonly K[]): Pick<Entrada, K> {
  const out = {} as Pick<Entrada, K>;
  for (const k of campos) out[k] = e[k];
  return out;
}

function cumple(e: Entrada, filtro: FiltroEntradas = {}) {
  return (Object.entries(filtro) as [keyof FiltroEntradas, unknown][]).every(
    ([key, value]) => value === undefined || (e[key] ?? null) === value
  );
}

function mesaFromRow(row: Record<string, unknown>): Mesa {
  return {
    id: String(row.id),
    sector: String(row.sector),
    number: Number(row.number),
    capacity: Number(row.capacity ?? CAPACIDAD_MESA),
    label: (row.label as string) ?? null,
    blocked: Boolean(row.blocked),
  };
}

export function defaultMesas(): Mesa[] {
  return SECTORES.flatMap((sector) =>
    Array.from({ length: MESAS_POR_SECTOR }, (_, i) => ({
      id: `${sector}${i + 1}`,
      sector,
      number: i + 1,
      capacity: CAPACIDAD_MESA,
      label: null,
      blocked: false,
    }))
  );
}

// ---------- Supabase ----------

function supabaseStore(): Store {
  const db = supabaseAdmin!;
  const fail = (what: string, error: { message: string } | null) => {
    if (error) throw new Error(`${what}: ${error.message}`);
  };
  const leer = async (columnas: string, filtro: FiltroEntradas = {}, foto?: 'enlace' | 'embebida') => {
    let q = db.from('entradas').select(columnas);
    for (const [key, value] of Object.entries(filtro) as [keyof FiltroEntradas, string | null | undefined][]) {
      if (value === undefined) continue;
      q = value === null ? q.is(COLS[key], null) : q.eq(COLS[key], value);
    }
    if (foto === 'enlace') q = q.not('payment_proof_url', 'is', null).not('payment_proof_url', 'like', 'data:%');
    if (foto === 'embebida') q = q.like('payment_proof_url', 'data:%');
    const { data, error } = await q.order('number').limit(2000);
    fail('Leyendo entradas', error);
    return (data || []) as unknown as Record<string, unknown>[];
  };
  const SIN_FOTO = Object.values(COLS)
    .filter((c) => c !== 'payment_proof_url')
    .join(',');
  const VENTA_SIN_FOTO = Object.values(VENTA_COLS)
    .filter((c) => c !== 'proof_url')
    .join(',');

  return {
    async schemaAlDia() {
      const [entradas, ventas] = await Promise.all([
        db.from('entradas').select(Object.values(COLS).join(',')).limit(1),
        db.from('ventas').select(Object.values(VENTA_COLS).join(',')).limit(1),
      ]);
      return !entradas.error && !ventas.error;
    },
    async listEntradas(filtro) {
      // La foto se pide aparte: solo el enlace, o una marca si sigue embebida.
      const [rows, enlaces, embebidas] = await Promise.all([
        leer(SIN_FOTO, filtro),
        leer('code,payment_proof_url', filtro, 'enlace'),
        leer('code', filtro, 'embebida'),
      ]);
      const foto = new Map<string, string>();
      for (const r of enlaces) foto.set(String(r.code), String(r.payment_proof_url));
      for (const r of embebidas) foto.set(String(r.code), 'embedded');
      return rows.map((r) => ({ ...fromRow(r), paymentProofUrl: foto.get(String(r.code)) ?? null }));
    },
    async listCampos(campos, filtro) {
      const rows = await leer(campos.map((k) => COLS[k]).join(','), filtro);
      return rows.map((r) => elegir(fromRow(r), campos));
    },
    async listEntradasLite() {
      const { data, error } = await db.from('entradas').select('number,table_id,status').limit(2000);
      fail('Leyendo mesas', error);
      return (data || []).map((r) => ({ number: Number(r.number), tableId: r.table_id, status: r.status }));
    },
    async countEntradas() {
      const { count, error } = await db.from('entradas').select('code', { count: 'exact', head: true });
      fail('Contando entradas', error);
      return count || 0;
    },
    async getEntrada(code) {
      const { data, error } = await db.from('entradas').select('*').eq('code', code).maybeSingle();
      fail('Buscando entrada', error);
      return data ? fromRow(data) : null;
    },
    async getEntradaByNumber(n) {
      const { data, error } = await db.from('entradas').select('*').eq('number', n).maybeSingle();
      fail('Buscando entrada', error);
      return data ? fromRow(data) : null;
    },
    async updateEntrada(code, patch) {
      const { data, error } = await db
        .from('entradas')
        .update({ ...toRow(patch), updated_at: new Date().toISOString() })
        .eq('code', code)
        .select('*')
        .maybeSingle();
      fail('Guardando entrada', error);
      return data ? fromRow(data) : null;
    },
    async updateEntradaIf(code, cond, patch) {
      let q = db
        .from('entradas')
        .update({ ...toRow(patch), updated_at: new Date().toISOString() })
        .eq('code', code);
      if (cond.status) q = q.eq('status', cond.status);
      if (cond.notCheckedIn) q = q.is('checked_in_at', null);
      if (cond.sinPersona) q = q.is('attendee_name', null);
      const { data, error } = await q.select('*').maybeSingle();
      fail('Guardando entrada', error);
      return data ? fromRow(data) : null;
    },
    async updateEntradas(codes, patch) {
      if (codes.length === 0) return 0;
      const { data, error } = await db
        .from('entradas')
        .update({ ...toRow(patch), updated_at: new Date().toISOString() })
        .in('code', codes)
        .select('code');
      fail('Guardando entradas', error);
      return data?.length || 0;
    },
    async updateRange(from, to, patch, estado) {
      let q = db
        .from('entradas')
        .update({ ...toRow(patch), updated_at: new Date().toISOString() })
        .gte('number', from)
        .lte('number', to);
      if (estado) q = q.eq('status', estado);
      const { data, error } = await q.select('code');
      fail('Asignando lote', error);
      return data?.length || 0;
    },
    async insertEntradas(rows) {
      // Una sola inserción: o se crean todas o ninguna.
      const { error } = await db.from('entradas').insert(rows.map(toRow));
      fail('Creando entradas', error);
    },
    async claimTable(code, tableId, force) {
      const { data, error } = await db.rpc('claim_table', { p_code: code, p_table: tableId, p_force: force });
      fail('Apartando mesa', error);
      return data as ClaimResult;
    },
    async listMesas() {
      const { data, error } = await db.from('mesas').select('*').order('sector').order('number');
      fail('Leyendo mesas', error);
      const mesas = (data || []).map(mesaFromRow);
      return mesas.length ? mesas : defaultMesas();
    },
    async updateMesa(id, patch) {
      const row: Record<string, unknown> = {};
      if (patch.label !== undefined) row.label = patch.label;
      if (patch.blocked !== undefined) row.blocked = patch.blocked;
      if (patch.capacity !== undefined) row.capacity = patch.capacity;
      const { error } = await db.from('mesas').update(row).eq('id', id);
      fail('Guardando mesa', error);
    },
    async listParroquias() {
      const { data, error } = await db.from('parroquias').select('*').order('name');
      fail('Leyendo parroquias', error);
      return (data || []).map((r) => ({
        id: r.id,
        name: r.name,
        contact: r.contact ?? null,
        createdAt: r.created_at,
      }));
    },
    async upsertParroquia(p) {
      const { error } = await db
        .from('parroquias')
        .upsert({ id: p.id, name: p.name, contact: p.contact, created_at: p.createdAt });
      fail('Guardando parroquia', error);
    },
    async deleteParroquia(id) {
      const { error } = await db.from('parroquias').delete().eq('id', id);
      fail('Eliminando parroquia', error);
    },
    async getPin(role) {
      const { data, error } = await db.from('staff_access').select('pin').eq('role', role).maybeSingle();
      fail('Leyendo PIN', error);
      return data?.pin || null;
    },
    async setPin(role, pin) {
      const { error } = await db.from('staff_access').upsert({ role, pin });
      fail('Guardando PIN', error);
    },
    async getVenta(id) {
      const { data, error } = await db.from('ventas').select('*').eq('id', id).maybeSingle();
      fail('Buscando venta', error);
      return data ? ventaFromRow(data) : null;
    },
    async saveVenta(v) {
      const { error } = await db.from('ventas').upsert(ventaToRow(v));
      fail('Guardando venta', error);
    },
    async updateVenta(id, patch) {
      const { error } = await db.from('ventas').update(ventaToRow(patch)).eq('id', id);
      fail('Guardando venta', error);
    },
    async listVentas(ids) {
      const consulta = (columnas: string) => {
        const q = db.from('ventas').select(columnas);
        return ids ? q.in('id', ids) : q;
      };
      const [lista, enlaces, embebidas] = await Promise.all([
        consulta(VENTA_SIN_FOTO).order('received_at', { ascending: false }).limit(2000),
        consulta('id,proof_url').not('proof_url', 'is', null).not('proof_url', 'like', 'data:%').limit(2000),
        consulta('id').like('proof_url', 'data:%').limit(2000),
      ]);
      fail('Leyendo ventas', lista.error || enlaces.error || embebidas.error);
      const foto = new Map<string, string>();
      for (const r of (enlaces.data || []) as unknown as Record<string, unknown>[]) foto.set(String(r.id), String(r.proof_url));
      for (const r of (embebidas.data || []) as unknown as Record<string, unknown>[]) foto.set(String(r.id), 'embedded');
      return ((lista.data || []) as unknown as Record<string, unknown>[]).map((r) => ({
        ...ventaFromRow(r),
        proofUrl: foto.get(String(r.id)) ?? null,
      }));
    },
    async capturasEmbebidas(tipo, max) {
      const { data, error } =
        tipo === 'venta'
          ? await db.from('ventas').select('id,proof_url').like('proof_url', 'data:%').limit(max)
          : await db.from('entradas').select('code,payment_proof_url').like('payment_proof_url', 'data:%').limit(max);
      fail('Leyendo capture', error);
      return ((data || []) as unknown as Record<string, unknown>[]).map((r) => ({
        clave: String(tipo === 'venta' ? r.id : r.code),
        url: String(tipo === 'venta' ? r.proof_url : r.payment_proof_url),
      }));
    },
    async reemplazarCaptura(tipo, clave, url) {
      if (tipo === 'venta') {
        const venta = await db.from('ventas').update({ proof_url: url }).eq('id', clave);
        fail('Guardando capture', venta.error);
        const suyas = await db.from('entradas').update({ payment_proof_url: url }).eq('sale_id', clave).like('payment_proof_url', 'data:%');
        fail('Guardando capture', suyas.error);
      } else {
        const { error } = await db.from('entradas').update({ payment_proof_url: url }).eq('code', clave);
        fail('Guardando capture', error);
      }
    },
  };
}

// ---------- JSON local (solo desarrollo) ----------

interface LocalData {
  entradas: Entrada[];
  mesas: Mesa[];
  parroquias: Parroquia[];
  pins: Partial<Record<StaffRole, string | null>>;
  ventas?: Venta[];
}

const LOCAL_FILE = path.join(process.cwd(), '.data', 'entradas_local.json');

function readLocal(): LocalData {
  try {
    const parsed = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf-8')) as LocalData;
    if (!parsed.mesas?.length) parsed.mesas = defaultMesas();
    return parsed;
  } catch {
    return { entradas: [], mesas: defaultMesas(), parroquias: [], pins: {} };
  }
}

function writeLocal(data: LocalData) {
  fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function localEntradas(filtro?: FiltroEntradas) {
  return readLocal()
    .entradas.filter((e) => cumple(e, filtro))
    .sort((a, b) => a.number - b.number);
}

function localStore(): Store {
  const patchAll = (pred: (e: Entrada) => boolean, patch: Partial<Entrada>) => {
    const data = readLocal();
    let n = 0;
    const now = new Date().toISOString();
    data.entradas = data.entradas.map((e) => {
      if (!pred(e)) return e;
      n++;
      return { ...e, ...patch, updatedAt: now };
    });
    writeLocal(data);
    return n;
  };

  return {
    async schemaAlDia() {
      return true;
    },
    async listEntradas(filtro) {
      return localEntradas(filtro).map((e) => ({ ...e, paymentProofUrl: marcarEmbebida(e.paymentProofUrl) }));
    },
    async listCampos(campos, filtro) {
      return localEntradas(filtro).map((e) => elegir(e, campos));
    },
    async listEntradasLite() {
      return readLocal().entradas.map((e) => ({ number: e.number, tableId: e.tableId, status: e.status }));
    },
    async countEntradas() {
      return readLocal().entradas.length;
    },
    async getEntrada(code) {
      return readLocal().entradas.find((e) => e.code === code) || null;
    },
    async getEntradaByNumber(n) {
      return readLocal().entradas.find((e) => e.number === n) || null;
    },
    async updateEntrada(code, patch) {
      patchAll((e) => e.code === code, patch);
      return readLocal().entradas.find((e) => e.code === code) || null;
    },
    async updateEntradaIf(code, cond, patch) {
      const current = readLocal().entradas.find((e) => e.code === code);
      if (!current) return null;
      if (cond.status && current.status !== cond.status) return null;
      if (cond.notCheckedIn && current.checkedInAt) return null;
      if (cond.sinPersona && current.attendeeName) return null;
      patchAll((e) => e.code === code, patch);
      return readLocal().entradas.find((e) => e.code === code) || null;
    },
    async updateEntradas(codes, patch) {
      const set = new Set(codes);
      return patchAll((e) => set.has(e.code), patch);
    },
    async updateRange(from, to, patch, estado) {
      return patchAll((e) => e.number >= from && e.number <= to && (!estado || e.status === estado), patch);
    },
    async insertEntradas(rows) {
      const data = readLocal();
      data.entradas.push(...rows);
      writeLocal(data);
    },
    async claimTable(code, tableId, force) {
      // Node atiende una petición a la vez entre lecturas y escrituras síncronas: no hay carrera.
      const data = readLocal();
      const mesa = data.mesas.find((m) => m.id === tableId);
      if (!mesa) return 'mesa_no_existe';
      const entrada = data.entradas.find((e) => e.code === code);
      if (!entrada) return 'entrada_no_existe';
      if (!OCUPA_PUESTO.includes(entrada.status)) return 'entrada_no_activa';
      if (entrada.tableId === tableId) return 'ok';
      if (!force) {
        if (mesa.blocked) return 'mesa_bloqueada';
        const taken = data.entradas.filter(
          (e) => e.tableId === tableId && OCUPA_PUESTO.includes(e.status) && e.code !== code
        ).length;
        if (taken >= mesa.capacity) return 'mesa_llena';
      }
      entrada.tableId = tableId;
      entrada.updatedAt = new Date().toISOString();
      writeLocal(data);
      return 'ok';
    },
    async listMesas() {
      return readLocal().mesas;
    },
    async updateMesa(id, patch) {
      const data = readLocal();
      data.mesas = data.mesas.map((m) => (m.id === id ? { ...m, ...patch, id: m.id } : m));
      writeLocal(data);
    },
    async listParroquias() {
      return readLocal().parroquias.sort((a, b) => a.name.localeCompare(b.name));
    },
    async upsertParroquia(p) {
      const data = readLocal();
      data.parroquias = [...data.parroquias.filter((x) => x.id !== p.id), p];
      writeLocal(data);
    },
    async deleteParroquia(id) {
      const data = readLocal();
      data.parroquias = data.parroquias.filter((x) => x.id !== id);
      writeLocal(data);
    },
    async getPin(role) {
      return readLocal().pins[role] || null;
    },
    async setPin(role, pin) {
      const data = readLocal();
      data.pins[role] = pin;
      writeLocal(data);
    },
    async getVenta(id) {
      return readLocal().ventas?.find((v) => v.id === id) || null;
    },
    async saveVenta(v) {
      const data = readLocal();
      data.ventas = [...(data.ventas || []).filter((x) => x.id !== v.id), v];
      writeLocal(data);
    },
    async updateVenta(id, patch) {
      const data = readLocal();
      data.ventas = (data.ventas || []).map((v) => (v.id === id ? { ...v, ...patch, id } : v));
      writeLocal(data);
    },
    async listVentas(ids) {
      return (readLocal().ventas || [])
        .filter((v) => !ids || ids.includes(v.id))
        .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
        .map((v) => ({ ...v, proofUrl: marcarEmbebida(v.proofUrl) }));
    },
    async capturasEmbebidas() {
      return []; // en local no hay almacenamiento de archivos
    },
    async reemplazarCaptura() {},
  };
}

let cached: Store | null = null;

export function store(): Store {
  if (cached) return cached;
  if (useLocalStore) cached = localStore();
  else if (supabaseAdmin) cached = supabaseStore();
  else throw new StoreNotConfiguredError();
  return cached;
}
