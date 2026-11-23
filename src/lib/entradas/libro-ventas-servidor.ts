import 'server-only';

import { isSafeProofUrl } from '@/lib/proof';
import { montosVacios, type DetalleEntradaLibro, type EstadoLibro, type MontosLibro, type RegistroLibro } from './libro-ventas';
import { partesDelPago } from './pago';
import { store } from './store';
import type { Entrada, Venta } from './types';
import { ID_RE } from './ventas';

type MontosRegistro = RegistroLibro['montos'];

function estadoEntrada(entrada: Entrada): EstadoLibro {
  switch (entrada.status) {
    case 'activa': return 'verificada';
    case 'por_verificar': return 'por_verificar';
    case 'anulada': return 'anulada';
    case 'sin_vender': return entrada.rejectionReason ? 'rechazada' : 'sin_confirmar';
  }
}

function detalleEntrada(entrada: Entrada): DetalleEntradaLibro {
  const estado = estadoEntrada(entrada);
  // Un nuevo reporte puede conservar la fecha de un rechazo anterior.
  const fechaRevision = estado !== 'por_verificar' && estado !== 'sin_confirmar' && entrada.verifiedAt &&
    (!entrada.reportedAt || Date.parse(entrada.verifiedAt) >= Date.parse(entrada.reportedAt))
    ? entrada.verifiedAt : null;

  return {
    numero: entrada.number,
    estado,
    monto: entrada.amount ?? null,
    moneda: entrada.currency ?? null,
    efectivoRecibidoAt: entrada.cashReceivedAt ?? null,
    fechaRevision,
    revisadoPor: fechaRevision ? entrada.verifiedBy : null,
    motivo: estado === 'rechazada' ? entrada.rejectionReason : null,
  };
}

function detalleFaltante(numero: number): DetalleEntradaLibro {
  return {
    numero,
    estado: 'sin_confirmar',
    monto: null,
    moneda: null,
    efectivoRecibidoAt: null,
    fechaRevision: null,
    revisadoPor: null,
    motivo: null,
  };
}

function sumarPago(destino: MontosLibro, efectivo: number, zelle: number, pagoMovil: number) {
  destino.efectivoUsd += Math.round(efectivo * 100);
  destino.zelleUsd += Math.round(zelle * 100);
  destino.pagoMovilVes += Math.round(pagoMovil * 100);
}

function montosEntradas(entradas: Entrada[]): MontosRegistro {
  const totales = { verificados: montosVacios(), pendientes: montosVacios(), excluidos: montosVacios() };

  for (const entrada of entradas) {
    const estado = estadoEntrada(entrada);
    const { efectivo, zelle, pagoMovilBs } = partesDelPago(entrada);
    if (estado === 'verificada') {
      sumarPago(totales.verificados, efectivo, zelle, pagoMovilBs);
    } else if (estado === 'por_verificar') {
      const recibido = entrada.paymentMethod === 'mixto' && entrada.cashReceivedAt ? efectivo : 0;
      sumarPago(totales.verificados, recibido, 0, 0);
      sumarPago(totales.pendientes, efectivo - recibido, zelle, pagoMovilBs);
    } else {
      sumarPago(totales.excluidos, efectivo, zelle, pagoMovilBs);
    }
  }

  for (const total of Object.values(totales)) {
    total.efectivoUsd /= 100;
    total.zelleUsd /= 100;
    total.pagoMovilVes /= 100;
  }
  return totales;
}

function estadoRegistro(entradas: DetalleEntradaLibro[], montos: MontosRegistro, motivo: string | null): EstadoLibro {
  const estados = new Set(entradas.map((entrada) => entrada.estado));
  if (estados.size > 1) return 'parcial';

  const [estado = 'sin_confirmar'] = estados;
  if (estado === 'sin_confirmar' && motivo) return 'rechazada';
  if (estado === 'por_verificar' && montos.verificados.efectivoUsd > 0) return 'parcial';
  return estado;
}

function tieneComprobante(url: string | null) {
  return url === 'embedded' || Boolean(url && isSafeProofUrl(url));
}

function registroVenta(venta: Venta, asociadas: Entrada[]): RegistroLibro {
  const numerosReportados = [...new Set(venta.numbers.filter(Number.isSafeInteger))].sort((a, b) => a - b);
  const detalles = new Map(asociadas.map((entrada) => [entrada.number, detalleEntrada(entrada)]));
  for (const numero of numerosReportados) {
    if (!detalles.has(numero)) detalles.set(numero, detalleFaltante(numero));
  }
  const entradas = [...detalles.values()].sort((a, b) => a.numero - b.numero);
  const montos = montosEntradas(asociadas);
  let fechaRevision = venta.verifiedAt;
  let revisadoPor = venta.verifiedBy;
  for (const entrada of entradas) {
    if (entrada.fechaRevision && (!fechaRevision || Date.parse(entrada.fechaRevision) > Date.parse(fechaRevision))) {
      fechaRevision = entrada.fechaRevision;
      revisadoPor = entrada.revisadoPor;
    }
  }

  return {
    id: `venta:${venta.id}`,
    origen: 'vendedor',
    vendedor: venta.vendedor || venta.sellerName,
    lote: venta.sellerName,
    comprador: venta.buyerName,
    fechaVenta: venta.soldAt,
    fechaRecepcion: venta.receivedAt,
    fechaRevision,
    revisadoPor,
    metodo: venta.method,
    referencia: venta.reference,
    tasa: venta.rateApplied,
    entradas,
    numerosReportados,
    incidencias: venta.problemas.map(({ number, motivo }) => number == null ? motivo : `Entrada #${number}: ${motivo}`),
    estado: estadoRegistro(entradas, montos, venta.rejectionReason),
    motivo: venta.rejectionReason,
    montos,
    comprobante: tieneComprobante(venta.proofUrl),
  };
}

function registroEntrada(entrada: Entrada): RegistroLibro | null {
  if (!entrada.reportedBy || !entrada.reportedAt || !Number.isFinite(Date.parse(entrada.reportedAt))) return null;

  const detalle = detalleEntrada(entrada);
  const montos = montosEntradas([entrada]);
  return {
    id: `entrada:${entrada.number}:${entrada.reportedAt}`,
    origen: entrada.reportedBy,
    vendedor: entrada.reportedBy === 'vendedor' ? entrada.holderName : null,
    lote: entrada.holderName,
    comprador: entrada.attendeeName,
    fechaVenta: entrada.reportedAt,
    fechaRecepcion: null,
    fechaRevision: detalle.fechaRevision,
    revisadoPor: detalle.revisadoPor,
    metodo: entrada.paymentMethod,
    referencia: entrada.paymentReference,
    tasa: entrada.rateApplied,
    entradas: [detalle],
    numerosReportados: [entrada.number],
    incidencias: entrada.reportedBy === 'vendedor' ? ['Sin orden de vendedor asociada en el registro actual.'] : [],
    estado: estadoRegistro([detalle], montos, detalle.motivo),
    motivo: detalle.motivo,
    montos,
    comprobante: tieneComprobante(entrada.paymentProofUrl),
  };
}

function claveVenta(numero: number, fecha: string) {
  return `${numero}:${Date.parse(fecha)}`;
}

function ventaDelRechazo(entrada: Entrada, ventasPorFecha: Map<string, Venta[]>) {
  if (entrada.saleId || entrada.reportedBy !== 'vendedor' || !entrada.reportedAt || estadoEntrada(entrada) !== 'rechazada') return null;

  // El rechazo suelta el vínculo con la orden, pero conserva el número y la hora del reporte.
  const candidatas = ventasPorFecha.get(claveVenta(entrada.number, entrada.reportedAt)) ?? [];
  if (candidatas.length === 1) return candidatas[0];
  const coincidePago = candidatas.filter((venta) => venta.method === entrada.paymentMethod && venta.reference === entrada.paymentReference);
  return coincidePago.length === 1 ? coincidePago[0] : null;
}

export async function registrosLibroVentas(): Promise<RegistroLibro[]> {
  const datos = store();
  // Estos listados sustituyen las fotos embebidas por una marca de disponibilidad.
  const [ventasGuardadas, entradas] = await Promise.all([datos.listVentas(), datos.listEntradas()]);
  const ventas = ventasGuardadas.filter((venta) => Number.isFinite(Date.parse(venta.soldAt)));
  const asociadas = new Map(ventas.map((venta) => [venta.id, [] as Entrada[]]));
  const ventasPorFecha = new Map<string, Venta[]>();
  for (const venta of ventas) {
    for (const numero of new Set(venta.numbers)) {
      const clave = claveVenta(numero, venta.soldAt);
      const candidatas = ventasPorFecha.get(clave) ?? [];
      candidatas.push(venta);
      ventasPorFecha.set(clave, candidatas);
    }
  }

  const registros: RegistroLibro[] = [];
  for (const entrada of entradas) {
    const ventaId = entrada.saleId || ventaDelRechazo(entrada, ventasPorFecha)?.id;
    const grupo = ventaId ? asociadas.get(ventaId) : undefined;
    if (grupo) grupo.push(entrada);
    else {
      const registro = registroEntrada(entrada);
      if (registro) registros.push(registro);
    }
  }

  for (const venta of ventas) registros.push(registroVenta(venta, asociadas.get(venta.id) ?? []));
  return registros.sort((a, b) => Date.parse(b.fechaVenta) - Date.parse(a.fechaVenta) || a.id.localeCompare(b.id));
}

export async function comprobanteLibro(id: string): Promise<string | null> {
  let url: string | null | undefined;
  if (id.startsWith('venta:')) {
    const ventaId = id.slice('venta:'.length);
    if (!ID_RE.test(ventaId)) return null;
    url = (await store().getVenta(ventaId))?.proofUrl;
  } else {
    const match = /^entrada:([1-9]\d*):(.+)$/.exec(id);
    if (!match) return null;
    const numero = Number(match[1]);
    const fecha = Date.parse(match[2]);
    if (!Number.isSafeInteger(numero) || !Number.isFinite(fecha)) return null;
    const entrada = await store().getEntradaByNumber(numero);
    if (!entrada?.reportedAt || Date.parse(entrada.reportedAt) !== fecha) return null;
    url = entrada.paymentProofUrl;
  }
  return url && isSafeProofUrl(url) ? url : null;
}
