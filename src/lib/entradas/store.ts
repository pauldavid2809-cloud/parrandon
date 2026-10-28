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

interface Store {
  listEntradas(): Promise<Entrada[]>;
  listEntradasLite(): Promise<EntradaLite[]>;
  countEntradas(): Promise<number>;
  getEntrada(code: string): Promise<Entrada | null>;
  getEntradaByNumber(n: number): Promise<Entrada | null>;
  updateEntrada(code: string, patch: Partial<Entrada>): Promise<Entrada | null>;
  updateEntradas(codes: string[], patch: Partial<Entrada>): Promise<number>;
  updateRange(from: number, to: number, patch: Partial<Entrada>): Promise<number>;
  insertEntradas(rows: Entrada[]): Promise<void>;
  claimTable(code: string, tableId: string, force: boolean): Promise<ClaimResult>;
  listMesas(): Promise<Mesa[]>;
  updateMesa(id: string, patch: Partial<Mesa>): Promise<void>;
  listParroquias(): Promise<Parroquia[]>;
  upsertParroquia(p: Parroquia): Promise<void>;
  deleteParroquia(id: string): Promise<void>;
  getPin(role: StaffRole): Promise<string | null>;
  setPin(role: StaffRole, pin: string | null): Promise<void>;
}

// ---------- mapeo snake_case <-> camelCase ----------

const COLS: Record<keyof Entrada, string> = {
  code: 'code',
  number: 'number',
  holderType: 'holder_type',
  holderId: 'holder_id',
  holderName: 'holder_name',
  status: 'status',
  attendeeName: 'attendee_name',
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
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

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

  return {
    async listEntradas() {
      const { data, error } = await db.from('entradas').select('*').order('number').limit(2000);
      fail('Leyendo entradas', error);
      return (data || []).map(fromRow);
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
    async updateRange(from, to, patch) {
      const { data, error } = await db
        .from('entradas')
        .update({ ...toRow(patch), updated_at: new Date().toISOString() })
        .gte('number', from)
        .lte('number', to)
        .select('code');
      fail('Asignando lote', error);
      return data?.length || 0;
    },
    async insertEntradas(rows) {
      for (let i = 0; i < rows.length; i += 250) {
        const { error } = await db.from('entradas').insert(rows.slice(i, i + 250).map(toRow));
        fail('Creando entradas', error);
      }
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
  };
}

// ---------- JSON local (solo desarrollo) ----------

interface LocalData {
  entradas: Entrada[];
  mesas: Mesa[];
  parroquias: Parroquia[];
  pins: Partial<Record<StaffRole, string | null>>;
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
    async listEntradas() {
      return readLocal().entradas.sort((a, b) => a.number - b.number);
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
    async updateEntradas(codes, patch) {
      const set = new Set(codes);
      return patchAll((e) => set.has(e.code), patch);
    },
    async updateRange(from, to, patch) {
      return patchAll((e) => e.number >= from && e.number <= to, patch);
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
