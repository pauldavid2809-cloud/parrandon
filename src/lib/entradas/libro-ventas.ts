import type { MetodoPago, ReportadoPor } from './types';

export type EstadoLibro = 'verificada' | 'por_verificar' | 'rechazada' | 'anulada' | 'parcial' | 'sin_confirmar';

export const ESTADO_LIBRO: Record<EstadoLibro, string> = {
  verificada: 'Verificada',
  por_verificar: 'Por verificar',
  rechazada: 'Rechazada',
  anulada: 'Anulada',
  parcial: 'Parcial',
  sin_confirmar: 'Sin confirmar',
};

export const ORIGEN_LIBRO: Record<ReportadoPor, string> = {
  vendedor: 'Vendedor',
  comprador: 'Reporte del comprador',
  puerta: 'Puerta',
  taquilla: 'Taquilla',
  admin: 'Administración',
};

export interface MontosLibro {
  efectivoUsd: number;
  zelleUsd: number;
  pagoMovilVes: number;
}

export interface DetalleEntradaLibro {
  numero: number;
  estado: EstadoLibro;
  monto: number | null;
  moneda: 'USD' | 'VES' | null;
  efectivoRecibidoAt: string | null;
  fechaRevision: string | null;
  revisadoPor: string | null;
  motivo: string | null;
}

export interface RegistroLibro {
  id: string;
  origen: ReportadoPor;
  vendedor: string | null;
  lote: string | null;
  comprador: string | null;
  fechaVenta: string;
  fechaRecepcion: string | null;
  fechaRevision: string | null;
  revisadoPor: string | null;
  metodo: MetodoPago | null;
  referencia: string | null;
  tasa: number | null;
  entradas: DetalleEntradaLibro[];
  numerosReportados: number[];
  incidencias: string[];
  estado: EstadoLibro;
  motivo: string | null;
  montos: { verificados: MontosLibro; pendientes: MontosLibro; excluidos: MontosLibro };
  comprobante: boolean;
}

export interface ResumenLibro {
  operaciones: number;
  entradas: number;
  porEstado: Record<EstadoLibro, number>;
  montos: RegistroLibro['montos'];
}

const fechaLocal = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Caracas',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function fechaCaracas(iso: string | Date): string {
  return fechaLocal.format(new Date(iso));
}

export function sumarDias(fecha: string, dias: number): string {
  const dia = new Date(fecha + 'T00:00:00Z');
  dia.setUTCDate(dia.getUTCDate() + dias);
  return dia.toISOString().slice(0, 10);
}

export function sabadoDe(fecha: string): string {
  const dia = new Date(fecha + 'T00:00:00Z').getUTCDay();
  return sumarDias(fecha, -((dia + 1) % 7));
}

export function montosVacios(): MontosLibro {
  return { efectivoUsd: 0, zelleUsd: 0, pagoMovilVes: 0 };
}

export function resumenLibro(registros: readonly RegistroLibro[]): ResumenLibro {
  const porEstado: ResumenLibro['porEstado'] = {
    verificada: 0, por_verificar: 0, rechazada: 0, anulada: 0, parcial: 0, sin_confirmar: 0,
  };
  const montos = { verificados: montosVacios(), pendientes: montosVacios(), excluidos: montosVacios() };
  const grupos = ['verificados', 'pendientes', 'excluidos'] as const;
  const medios = ['efectivoUsd', 'zelleUsd', 'pagoMovilVes'] as const;
  let entradas = 0;

  for (const registro of registros) {
    entradas += registro.entradas.length;
    porEstado[registro.estado] += 1;
    for (const grupo of grupos) {
      for (const medio of medios) {
        montos[grupo][medio] += Math.round(registro.montos[grupo][medio] * 100);
      }
    }
  }
  for (const grupo of grupos) {
    for (const medio of medios) {
      montos[grupo][medio] /= 100;
    }
  }
  return { operaciones: registros.length, entradas, porEstado, montos };
}
