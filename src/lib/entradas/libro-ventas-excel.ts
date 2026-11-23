import { ESTADO_LIBRO, fechaCaracas, ORIGEN_LIBRO, resumenLibro, type RegistroLibro } from './libro-ventas';
import { METODO_LABEL } from './types';

const horaLibro = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Caracas',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const hora = (iso: string | null) => (iso ? horaLibro.format(new Date(iso)) : null);

const estados = Object.keys(ESTADO_LIBRO) as (keyof typeof ESTADO_LIBRO)[];
const columnasImportes = ['Verificado', 'Pendiente', 'Excluido'].flatMap((grupo) => [
  'Efectivo USD · ' + grupo,
  'Zelle USD · ' + grupo,
  'Pago Móvil VES · ' + grupo,
]);

function importes(montos: RegistroLibro['montos']) {
  return [montos.verificados, montos.pendientes, montos.excluidos].flatMap(({ efectivoUsd, zelleUsd, pagoMovilVes }) =>
    [efectivoUsd, zelleUsd, pagoMovilVes]
  );
}

export async function descargarLibroVentas(desde: string, hasta: string, registros: RegistroLibro[]) {
  const { utils, writeFile } = await import('xlsx');
  const libro = utils.book_new();
  const porDia = new Map<string, RegistroLibro[]>();
  for (const registro of registros) {
    const dia = fechaCaracas(registro.fechaVenta);
    const fila = porDia.get(dia);
    if (fila) fila.push(registro);
    else porDia.set(dia, [registro]);
  }

  const datosResumen = (filas: RegistroLibro[]) => {
    const datos = resumenLibro(filas);
    return [datos.operaciones, datos.entradas, ...estados.map((estado) => datos.porEstado[estado]), ...importes(datos.montos)];
  };

  const hojaResumen = utils.aoa_to_sheet([
    ['Libro de ventas · Parrandón'],
    ['Desde', desde],
    ['Hasta', hasta],
    ['Zona horaria', 'America/Caracas'],
    ['Exportado', hora(new Date().toISOString())],
    ['Base del período', 'Fecha de venta o reporte según los registros disponibles al exportar.'],
    [],
    ['Período', 'Operaciones', 'Entradas en operaciones', ...estados.map((estado) => ESTADO_LIBRO[estado]), ...columnasImportes],
    ['Total', ...datosResumen(registros)],
    ...[...porDia.keys()].sort().map((dia) => [dia, ...datosResumen(porDia.get(dia) ?? [])]),
  ]);
  hojaResumen['!cols'] = [{ wch: 20 }, { wch: 18 }, ...Array.from({ length: 16 }, () => ({ wch: 24 }))];
  utils.book_append_sheet(libro, hojaResumen, 'Resumen');

  const operaciones = utils.aoa_to_sheet([
    [
      'ID de operación', 'Venta o reporte (Caracas)', 'Recepción (Caracas)', 'Revisión (Caracas)', 'Revisado por',
      'Origen', 'Vendedor', 'Lote', 'Comprador', 'Medio de pago', 'Referencia', 'Tasa VES por USD', 'Estado',
      'Entradas reportadas', 'Entradas en operaciones', 'Comprobante disponible', 'Motivo', 'Incidencias', ...columnasImportes,
    ],
    ...registros.map((r) => [
      r.id, hora(r.fechaVenta), hora(r.fechaRecepcion), hora(r.fechaRevision), r.revisadoPor, ORIGEN_LIBRO[r.origen],
      r.vendedor, r.lote, r.comprador, r.metodo ? METODO_LABEL[r.metodo] : null, r.referencia, r.tasa, ESTADO_LIBRO[r.estado],
      r.numerosReportados.join(', '), r.entradas.length, r.comprobante ? 'Sí' : 'No', r.motivo, r.incidencias.join(' | '),
      ...importes(r.montos),
    ]),
  ]);
  operaciones['!cols'] = Array.from({ length: 18 + columnasImportes.length }, () => ({ wch: 24 }));
  if (operaciones['!ref']) operaciones['!autofilter'] = { ref: operaciones['!ref'] };
  utils.book_append_sheet(libro, operaciones, 'Operaciones');

  const entradas = utils.aoa_to_sheet([
    ['ID de operación', 'Número de entrada', 'Estado', 'Importe', 'Moneda', 'Efectivo recibido (Caracas)', 'Revisión (Caracas)', 'Revisado por', 'Motivo'],
    ...registros.flatMap((r) =>
      r.entradas.map((e) => [r.id, e.numero, ESTADO_LIBRO[e.estado], e.monto, e.moneda, hora(e.efectivoRecibidoAt), hora(e.fechaRevision), e.revisadoPor, e.motivo])
    ),
  ]);
  entradas['!cols'] = Array.from({ length: 9 }, () => ({ wch: 24 }));
  if (entradas['!ref']) entradas['!autofilter'] = { ref: entradas['!ref'] };
  utils.book_append_sheet(libro, entradas, 'Entradas');

  const periodo = desde === hasta ? desde : desde + '_a_' + hasta;
  writeFile(libro, 'parrandon-libro-ventas-' + periodo + '.xlsx', { compression: true });
}
