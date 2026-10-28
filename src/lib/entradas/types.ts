// Modelo de las entradas físicas con QR del Parrandón.
// Cada entrada impresa tiene un número (#001–#500) y un código secreto que va dentro del QR.

export type EntradaStatus = 'sin_vender' | 'por_verificar' | 'activa' | 'anulada';

export type HolderType = 'seminarista' | 'padre_jorge' | 'parroquia' | 'taquilla' | 'sin_asignar';

export type MetodoPago = 'zelle' | 'pago_movil' | 'efectivo_usd';

export type ReportadoPor = 'comprador' | 'vendedor' | 'puerta' | 'taquilla' | 'admin';

export type StaffRole = 'puerta' | 'cocina' | 'taquilla';

export type SessionRole = 'admin' | StaffRole;

export interface Entrada {
  code: string;
  number: number;
  holderType: HolderType;
  holderId: string | null;
  holderName: string | null;
  status: EntradaStatus;
  attendeeName: string | null;
  attendeePhone: string | null;
  tableId: string | null;
  paymentMethod: MetodoPago | null;
  paymentReference: string | null;
  paymentProofUrl: string | null;
  amount: number | null;
  currency: 'USD' | 'VES' | null;
  rateApplied: number | null;
  reportedBy: ReportadoPor | null;
  reportedAt: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  doorActivated: boolean;
  checkedInAt: string | null;
  checkedInBy: string | null;
  mealServedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Mesa {
  id: string; // "A1" … "E10"
  sector: string; // "A" … "E"
  number: number; // 1 … 10
  capacity: number;
  label: string | null;
  blocked: boolean;
}

export interface MesaEstado extends Mesa {
  taken: number; // puestos ocupados (por verificar + activas)
  free: number;
  isFull: boolean;
}

export interface MesasResumen {
  totalMesas: number;
  mesasLlenas: number;
  mesasConCupo: number;
  puestosLibres: number;
  puestosTotales: number;
}

export interface Parroquia {
  id: string;
  name: string;
  contact: string | null;
  createdAt: string;
}

export type ClaimResult =
  | 'ok'
  | 'mesa_llena'
  | 'mesa_bloqueada'
  | 'mesa_no_existe'
  | 'entrada_no_existe'
  | 'entrada_no_activa';

export const STATUS_LABEL: Record<EntradaStatus, string> = {
  sin_vender: 'Sin vender',
  por_verificar: 'Por verificar',
  activa: 'Activa',
  anulada: 'Anulada',
};

export const HOLDER_LABEL: Record<HolderType, string> = {
  seminarista: 'Seminarista',
  padre_jorge: 'Padre Jorge',
  parroquia: 'Parroquia',
  taquilla: 'Taquilla',
  sin_asignar: 'Sin asignar',
};

export const METODO_LABEL: Record<MetodoPago, string> = {
  zelle: 'Zelle',
  pago_movil: 'Pago Móvil',
  efectivo_usd: 'Efectivo $',
};

export const SECTORES = ['A', 'B', 'C', 'D', 'E'] as const;
export const MESAS_POR_SECTOR = 10;
export const CAPACIDAD_MESA = 10;
export const TOTAL_ENTRADAS = 500;
export const ENTRADAS_POR_SEMINARISTA = 6;

// Estados que ocupan un puesto en una mesa.
export const OCUPA_PUESTO: EntradaStatus[] = ['por_verificar', 'activa'];
