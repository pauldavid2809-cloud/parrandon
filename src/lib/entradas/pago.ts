import type { MetodoPago } from './types';

// Pago mixto («Zelle + efectivo»): una parte se paga en efectivo, en dólares, y el resto por
// Zelle, con su referencia y su capture. La entrada guarda el total en «amount» y la parte en
// efectivo en «cashAmount»; lo de Zelle es la diferencia.

export const METODOS_PAGO: MetodoPago[] = ['zelle', 'pago_movil', 'efectivo_usd', 'mixto'];

// Zelle y Pago Móvil (y la parte de Zelle de un pago mixto) llevan referencia y capture.
export const llevaReferencia = (m: MetodoPago | null | undefined) => m === 'zelle' || m === 'pago_movil' || m === 'mixto';
// Efectivo que alguien tiene que entregar a administración.
export const llevaEfectivo = (m: MetodoPago | null | undefined) => m === 'efectivo_usd' || m === 'mixto';

const centavos = (n: number) => Math.round(n * 100);
const usd = (c: number) => c / 100;
export const dinero = (n: number) => `$${(Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '')}`;

// Lee lo que escribió la persona («10», «10,50», «$10.5»). Devuelve NaN si no es un monto.
export function leerMonto(raw: unknown): number {
  const s = String(raw ?? '')
    .trim()
    .replace(/^\$\s*/, '')
    .replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  return usd(centavos(Number(s)));
}

// La parte en efectivo tiene que dejar algo para Zelle: entre $1 y el total menos $1.
export function errorMixto(totalUsd: number, efectivoUsd: number): string | null {
  const max = usd(centavos(totalUsd) - 100);
  if (!Number.isFinite(efectivoUsd) || efectivoUsd < 1 || efectivoUsd > max) {
    return max < 1
      ? 'El monto es muy pequeño para dividirlo entre Zelle y efectivo.'
      : `Escribe cuánto se pagó en efectivo: entre $1 y ${dinero(max)}. El resto va por Zelle.`;
  }
  return null;
}

// Una venta de varias entradas con un solo pago mixto: el efectivo se reparte entre ellas
// (al centavo, para que la suma dé exacta).
export function repartirEfectivo(efectivoUsd: number, n: number): number[] {
  const total = centavos(efectivoUsd);
  const base = Math.floor(total / n);
  const resto = total - base * n;
  return Array.from({ length: n }, (_, i) => usd(base + (i < resto ? 1 : 0)));
}

// Cuánto de un pago fue en efectivo, por Zelle y por Pago Móvil (en bolívares).
export function partesDelPago(e: { paymentMethod: MetodoPago | null; amount: number | null; cashAmount?: number | null }) {
  const total = e.amount ?? 0;
  switch (e.paymentMethod) {
    case 'efectivo_usd':
      return { efectivo: total, zelle: 0, pagoMovilBs: 0 };
    case 'zelle':
      return { efectivo: 0, zelle: total, pagoMovilBs: 0 };
    case 'pago_movil':
      return { efectivo: 0, zelle: 0, pagoMovilBs: total };
    case 'mixto': {
      const efectivo = Math.min(e.cashAmount ?? 0, total);
      return { efectivo, zelle: usd(centavos(total) - centavos(efectivo)), pagoMovilBs: 0 };
    }
    default:
      return { efectivo: 0, zelle: 0, pagoMovilBs: 0 };
  }
}

// «Zelle $15 + efectivo $10», para mostrar un pago mixto.
export function detalleMixto(totalUsd: number, efectivoUsd: number | null | undefined) {
  const efectivo = Math.min(efectivoUsd ?? 0, totalUsd);
  return `Zelle ${dinero(totalUsd - efectivo)} + efectivo ${dinero(efectivo)}`;
}
