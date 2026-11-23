'use client';

import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react';
import CaptureDialog from '@/components/admin/CaptureDialog';
import { api, fechaCorta, PageTitle } from '@/components/admin/api';
import { formatBs } from '@/components/pago/PaymentDetails';
import { Button, Field, Notice, TextInput } from '@/components/ui';
import {
  ESTADO_LIBRO,
  ORIGEN_LIBRO,
  fechaCaracas,
  resumenLibro,
  sabadoDe,
  sumarDias,
  type EstadoLibro,
  type MontosLibro,
  type RegistroLibro,
} from '@/lib/entradas/libro-ventas';
import { METODO_LABEL } from '@/lib/entradas/types';
import { formatNumber } from '@/lib/site';
import { useAutoLoad } from '@/lib/useAutoLoad';
import { cn } from '@/lib/utils';

const RUTA = '/api/admin/libro-ventas';
const PRIMER_DIA = '1900-01-06';
const ULTIMO_DIA = '9999-12-25';
const rangoFechas = new Intl.DateTimeFormat('es-VE', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
});
const diaLargo = new Intl.DateTimeFormat('es-VE', { dateStyle: 'full', timeZone: 'UTC' });
const fechaHora = new Intl.DateTimeFormat('es-VE', {
  dateStyle: 'medium',
  timeStyle: 'medium',
  timeZone: 'America/Caracas',
});
const usd = new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' });
const tasa = new Intl.NumberFormat('es-VE', { maximumFractionDigits: 6 });

const MONTOS = [
  ['zelleUsd', 'Zelle', (valor: number) => usd.format(valor)],
  ['pagoMovilVes', 'Pago Móvil', formatBs],
  ['efectivoUsd', 'Efectivo', (valor: number) => usd.format(valor)],
] as const;

const ESTADOS_PAGO = [
  ['verificados', 'Verificado', 'text-verde-2'],
  ['pendientes', 'Pendiente', 'text-oro-ink'],
  ['excluidos', 'Excluido', 'text-ink-2'],
] as const;

const ESTILOS_ESTADO: Record<EstadoLibro, string> = {
  verificada: 'bg-verde-soft text-verde-2',
  por_verificar: 'bg-oro-soft text-oro-ink',
  rechazada: 'bg-rojo-soft text-rojo-2',
  anulada: 'bg-rojo-soft text-rojo-2',
  parcial: 'bg-oro-soft text-oro-ink',
  sin_confirmar: 'bg-paper-2 text-ink-2',
};

type Modo = 'general' | 'fin_de_semana' | 'dia';

function diaCompleto(dia: string) {
  return diaLargo.format(new Date(`${dia}T12:00:00Z`));
}

function horaCompleta(iso: string | null) {
  return iso && Number.isFinite(Date.parse(iso)) ? fechaHora.format(new Date(iso)) : null;
}

function numeroEntrada(numero: number) {
  return `#${formatNumber(numero)}`;
}

function cantidad(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`;
}

export default function LibroVentas() {
  const [registros, setRegistros] = useState<RegistroLibro[] | null>(null);
  const [modo, setModo] = useState<Modo>('fin_de_semana');
  const [fecha, setFecha] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);
  const periodoRef = useRef<HTMLHeadingElement>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await api<{ registros: RegistroLibro[] }>(RUTA);
      setRegistros(datos.registros);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el libro de ventas.');
    } finally {
      setCargando(false);
    }
  }, []);
  useAutoLoad(cargar);

  const { porDia, ordenados, primerDia, ultimoDia, ultimoFinDeSemana } = useMemo(() => {
    const porDia = new Map<string, RegistroLibro[]>();
    const ordenados = (registros ?? []).slice().sort((a, b) => Date.parse(a.fechaVenta) - Date.parse(b.fechaVenta));
    for (const registro of ordenados) {
      const dia = fechaCaracas(registro.fechaVenta);
      const operaciones = porDia.get(dia) ?? [];
      operaciones.push(registro);
      porDia.set(dia, operaciones);
    }
    const dias = [...porDia.keys()].sort().reverse();
    const ultimoFinDeSemana = dias.find((dia) => {
      const sabado = sabadoDe(dia);
      return dia === sabado || dia === sumarDias(sabado, 1);
    });
    return { porDia, ordenados, primerDia: dias.at(-1), ultimoDia: dias[0], ultimoFinDeSemana };
  }, [registros]);

  const general = modo === 'general';
  const finDeSemana = modo === 'fin_de_semana';
  const hoy = fechaCaracas(new Date());
  let desde = fecha || ultimoDia || hoy;
  let hasta = desde;
  if (general) {
    desde = primerDia || hoy;
    hasta = ultimoDia || hoy;
  } else if (finDeSemana) {
    desde = sabadoDe(fecha || ultimoFinDeSemana || hoy);
    hasta = sumarDias(desde, 1);
  }

  const paso = finDeSemana ? 7 : 1;
  const anterior = sumarDias(desde, -paso);
  const siguiente = sumarDias(desde, paso);
  const dias = finDeSemana ? [desde, hasta] : [desde];
  const operaciones = general ? ordenados : dias.flatMap((dia) => porDia.get(dia) ?? []);
  const resumen = resumenLibro(operaciones);
  const fechaPeriodo = general || finDeSemana
    ? rangoFechas.formatRange(new Date(desde + 'T12:00:00Z'), new Date(hasta + 'T12:00:00Z'))
    : diaCompleto(desde);

  function navegar(fecha: string) {
    setFecha(fecha);
    setErrorDescarga(null);
  }

  function seleccionarModo(nuevoModo: Modo) {
    setModo(nuevoModo);
    setErrorDescarga(null);
  }

  function abrirDia(dia: string) {
    setFecha(dia);
    seleccionarModo('dia');
    requestAnimationFrame(() => periodoRef.current?.focus());
  }

  async function descargar() {
    setDescargando(true);
    setErrorDescarga(null);
    try {
      const { descargarLibroVentas } = await import('@/lib/entradas/libro-ventas-excel');
      await descargarLibroVentas(desde, hasta, operaciones);
    } catch {
      setErrorDescarga('No se pudo descargar el Excel. Inténtalo de nuevo.');
    } finally {
      setDescargando(false);
    }
  }

  return (
    <main className="max-w-6xl">
      <PageTitle title="Libro de ventas">
        {registros && (
          <>
            <Button type="button" variant="quiet" loading={cargando} onClick={cargar} aria-label="Actualizar libro de ventas">
              {!cargando && <RefreshCw aria-hidden className="h-4 w-4" />} Actualizar
            </Button>
            <Button
              type="button"
              variant="verde"
              loading={descargando}
              disabled={cargando || (general && operaciones.length === 0)}
              onClick={descargar}
            >
              {!descargando && <Download aria-hidden className="h-4 w-4" />} Descargar Excel
            </Button>
          </>
        )}
      </PageTitle>
      <p className="-mt-4 mb-6 max-w-[65ch] text-ink-2">
        Los importes se agrupan por fecha de venta o reporte, en hora de Caracas.
      </p>

      {error && (
        <Notice tone="error" className="mb-5">
          <p>{error}</p>
          {registros ? (
            <p className="mt-1">Se muestran los datos de la última carga correcta.</p>
          ) : (
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={cargar}>
              Reintentar
            </Button>
          )}
        </Notice>
      )}
      {errorDescarga && <Notice tone="error" className="mb-5">{errorDescarga}</Notice>}
      {!registros && !error && (
        <div role="status" className="rounded-2xl border border-line bg-card p-5">
          <p className="text-ink-2">Cargando el libro de ventas…</p>
          <div aria-hidden className="mt-4 h-16 rounded-xl bg-paper-2 motion-safe:animate-pulse" />
        </div>
      )}

      {registros && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 rounded-2xl bg-paper-2 p-4 sm:px-5">
            <div role="group" aria-label="Agrupar ventas" className="flex flex-wrap gap-1">
              {([
                ['general', 'General'],
                ['fin_de_semana', 'Por fin de semana'],
                ['dia', 'Por día'],
              ] as const).map(([opcion, etiqueta]) => (
                <button
                  key={opcion}
                  type="button"
                  aria-pressed={modo === opcion}
                  onClick={() => seleccionarModo(opcion)}
                  className={cn(
                    'min-h-11 rounded-lg px-2 text-sm font-bold transition-colors sm:px-4 sm:text-base',
                    modo === opcion ? 'bg-verde text-paper' : 'text-ink-2 hover:bg-card hover:text-ink',
                  )}
                >
                  {etiqueta}
                </button>
              ))}
            </div>

            {!general && (
              <div className="grid w-full max-w-80 grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-12 px-0"
                  aria-label={finDeSemana ? 'Fin de semana anterior' : 'Día anterior'}
                  disabled={anterior < PRIMER_DIA}
                  onClick={() => navegar(anterior)}
                >
                  <ChevronLeft aria-hidden className="h-5 w-5" />
                </Button>
                <Field label={finDeSemana ? 'Elegir fin de semana' : 'Elegir día'} htmlFor="libro-fecha" className="min-w-0">
                  <TextInput
                    id="libro-fecha"
                    type="date"
                    min={PRIMER_DIA}
                    max={ULTIMO_DIA}
                    value={desde}
                    className="min-w-0 px-2 sm:px-3"
                    onChange={(event) => {
                      if (event.target.validity.valid) {
                        setFecha(event.target.value);
                        setErrorDescarga(null);
                      }
                    }}
                  />
                </Field>
                <Button
                  type="button"
                  variant="outline"
                  className="w-12 px-0"
                  aria-label={finDeSemana ? 'Fin de semana siguiente' : 'Día siguiente'}
                  disabled={siguiente > ULTIMO_DIA}
                  onClick={() => navegar(siguiente)}
                >
                  <ChevronRight aria-hidden className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>

          <section aria-labelledby="libro-periodo" className="mt-8">
            <h2
              ref={periodoRef}
              id="libro-periodo"
              tabIndex={-1}
              className="font-display text-xl first-letter:uppercase sm:text-2xl"
              aria-live="polite"
            >
              {general ? 'Resumen general' : fechaPeriodo}
            </h2>
            {general && operaciones.length > 0 && (
              <p className="mt-1 text-ink-2">{fechaPeriodo}</p>
            )}
            <p className="tabular mt-2 mb-4 text-ink-2">
              <strong className="text-ink">{cantidad(resumen.operaciones, 'operación', 'operaciones')}</strong>
              {' · '}
              {cantidad(resumen.entradas, 'entrada reportada', 'entradas reportadas')}
            </p>
            <TablaMontos montos={resumen.montos} etiqueta="Importes del período por método y estado" />
            {resumen.operaciones > 0 && (
              <ul aria-label="Operaciones por estado" className="mt-3 flex flex-wrap gap-2">
                {(Object.keys(ESTILOS_ESTADO) as EstadoLibro[]).map((estado) => (
                  resumen.porEstado[estado] > 0 && (
                    <li key={estado}>
                      <Estado estado={estado} cantidad={resumen.porEstado[estado]} />
                    </li>
                  )
                ))}
              </ul>
            )}
          </section>

          {finDeSemana && (
            <section aria-labelledby="libro-dias" className="mt-8">
              <h2 id="libro-dias" className="mb-3 font-display text-xl">Desglose por día</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
                {dias.map((dia) => {
                  const resumenDia = resumenLibro(porDia.get(dia) ?? []);
                  return (
                    <li key={dia}>
                      <button
                        type="button"
                        onClick={() => abrirDia(dia)}
                        className="flex min-h-14 w-full flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-4 py-2.5 text-left hover:bg-paper-2 focus-visible:outline-offset-[-3px]"
                      >
                        <span className="block font-bold first-letter:uppercase">{diaCompleto(dia)}</span>
                        <span className="tabular flex items-center gap-2 text-sm text-ink-2">
                          {cantidad(resumenDia.operaciones, 'operación', 'operaciones')}
                          <ChevronRight aria-hidden className="h-4 w-4" />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section aria-labelledby="libro-operaciones" className="mt-8">
            <h2 id="libro-operaciones" className="mb-3 font-display text-xl">Operaciones registradas</h2>
            {operaciones.length === 0 ? (
              <p className="rounded-2xl border border-line bg-card px-5 py-6 text-ink-2">
                {general
                  ? 'Todavía no hay operaciones registradas.'
                  : `No hay operaciones registradas para ${finDeSemana ? 'este fin de semana' : 'este día'}. Elige otra fecha para consultar sus ventas.`}
              </p>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
                {operaciones.map((registro) => <Operacion key={registro.id} registro={registro} />)}
              </ul>
            )}
            <p className="mt-3 max-w-[70ch] text-sm text-ink-2">
              El libro muestra el estado de las operaciones conservadas. Los registros anteriores pueden tener un historial incompleto.
            </p>
          </section>
        </>
      )}
    </main>
  );
}

function Estado({ estado, cantidad }: { estado: EstadoLibro; cantidad?: number }) {
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-1 text-sm leading-tight font-bold', ESTILOS_ESTADO[estado])}>
      {ESTADO_LIBRO[estado]}{cantidad === undefined ? '' : ` (${cantidad})`}
    </span>
  );
}

function TablaMontos({ montos, etiqueta }: { montos: RegistroLibro['montos']; etiqueta: string }) {
  return (
    <div role="region" aria-label={etiqueta} tabIndex={0} className="overflow-x-auto rounded-2xl border border-line bg-card">
      <table className="tabular w-full text-sm">
        <caption className="sr-only">{etiqueta}</caption>
        <thead className="border-b border-line bg-paper-2/60 text-ink-2">
          <tr>
            <th scope="col" className="px-2 py-2.5 text-left sm:px-4">Método</th>
            {ESTADOS_PAGO.map(([key, label, color]) => (
              <th key={key} scope="col" className={cn('px-2 py-2.5 text-right sm:px-4', color)}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {MONTOS.map(([metodo, label, formato]) => (
            <tr key={metodo}>
              <th scope="row" className="px-2 py-2.5 text-left sm:px-4">{label}</th>
              {ESTADOS_PAGO.map(([key, , color]) => (
                <td key={key} className={cn('px-2 py-2.5 text-right whitespace-nowrap sm:px-4', color, key === 'verificados' && 'font-bold')}>
                  {formato(montos[key][metodo])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function montoOperacion(registro: RegistroLibro) {
  if (!registro.metodo || !registro.entradas.some((entrada) => entrada.monto !== null)) return null;
  const suma = (metodo: keyof MontosLibro) => ESTADOS_PAGO.reduce((total, [estado]) => total + registro.montos[estado][metodo], 0);
  if (registro.metodo === 'pago_movil') return formatBs(suma('pagoMovilVes'));
  if (registro.metodo === 'zelle') return usd.format(suma('zelleUsd'));
  if (registro.metodo === 'efectivo_usd') return usd.format(suma('efectivoUsd'));
  return usd.format(suma('zelleUsd') + suma('efectivoUsd'));
}

function Operacion({ registro }: { registro: RegistroLibro }) {
  const [abierta, setAbierta] = useState(false);
  const numeros = registro.numerosReportados.length ? registro.numerosReportados : registro.entradas.map((e) => e.numero);
  const etiquetas = numeros.slice(0, 3).map(numeroEntrada).join(' · ');
  const cantidadExtra = numeros.length > 3 ? ` +${numeros.length - 3}` : '';
  const importe = montoOperacion(registro);

  return (
    <li>
      <details className="group" onToggle={(event) => setAbierta(event.currentTarget.open)}>
        <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_minmax(0,auto)_1rem] items-start gap-x-3 gap-y-2 px-4 py-3 hover:bg-paper-2/65 focus-visible:outline-offset-[-3px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,0.85fr)_minmax(7rem,0.85fr)_1rem] [&::-webkit-details-marker]:hidden">
          <span className="col-start-1 row-start-1 min-w-0">
            <span className="tabular block font-bold">{etiquetas ? etiquetas + cantidadExtra : 'Sin número de entrada'}</span>
            <time dateTime={registro.fechaVenta} className="block text-sm text-ink-2">{fechaCorta(registro.fechaVenta)}</time>
          </span>
          <span className="col-start-1 row-start-2 min-w-0 lg:col-start-2 lg:row-start-1">
            <span className="block text-sm font-bold">{ORIGEN_LIBRO[registro.origen]}</span>
            {registro.vendedor && <span className="block text-sm text-ink-2 [overflow-wrap:anywhere]">{registro.vendedor}</span>}
          </span>
          <span className="col-span-2 col-start-2 row-start-2 text-right lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:text-left">
            <span className="block text-sm text-ink-2">{registro.metodo ? METODO_LABEL[registro.metodo] : 'Método sin registrar'}</span>
            {importe && <span className="tabular block text-sm font-bold">{importe}</span>}
          </span>
          <span className="col-start-2 row-start-1 justify-self-end text-right lg:col-start-4 lg:justify-self-start lg:text-left">
            <Estado estado={registro.estado} />
          </span>
          <ChevronDown
            aria-hidden
            className="col-start-3 row-start-1 mt-1 h-4 w-4 text-ink-2 transition-transform group-open:rotate-180 lg:col-start-5 motion-reduce:transition-none"
          />
        </summary>
        {abierta && <DetalleOperacion registro={registro} />}
      </details>
    </li>
  );
}

function DetalleOperacion({ registro }: { registro: RegistroLibro }) {
  const [prueba, setPrueba] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idEntradas = useId();

  async function verComprobante() {
    setBuscando(true);
    setError(null);
    try {
      const { proofUrl } = await api<{ proofUrl: string | null }>(`${RUTA}?comprobante=${encodeURIComponent(registro.id)}`);
      if (!proofUrl) {
        setError('El comprobante ya no está disponible.');
        return;
      }
      setPrueba(proofUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir el comprobante.');
    } finally {
      setBuscando(false);
    }
  }

  const datos = [
    ['ID de la operación', registro.id],
    ['Comprador', registro.comprador],
    ['Vendedor', registro.vendedor],
    ['Lote', registro.lote],
    ['Referencia', registro.referencia],
    ['Tasa aplicada', registro.tasa === null ? null : `Bs. ${tasa.format(registro.tasa)} / USD`],
    ['Venta o reporte', horaCompleta(registro.fechaVenta)],
    ['Recepción en el sistema', horaCompleta(registro.fechaRecepcion)],
    ['Revisión', horaCompleta(registro.fechaRevision)],
    ['Revisado por', registro.revisadoPor],
    ['Números reportados', registro.numerosReportados.map(numeroEntrada).join(' · ')],
  ];

  return (
    <div className="space-y-4 border-t border-line bg-paper-2/40 px-4 py-4 sm:px-5">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm lg:grid-cols-3">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="min-w-0">
            <dt className="text-ink-2">{etiqueta}</dt>
            <dd className="tabular font-bold [overflow-wrap:anywhere]">{valor || '—'}</dd>
          </div>
        ))}
      </dl>
      {registro.motivo && <p className="text-sm"><strong>Motivo</strong> · {registro.motivo}</p>}
      {registro.incidencias.length > 0 && (
        <div className="text-sm text-rojo-2">
          <p className="font-bold">Incidencias</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {registro.incidencias.map((incidencia, index) => <li key={index}>{incidencia}</li>)}
          </ul>
        </div>
      )}

      <TablaMontos montos={registro.montos} etiqueta="Importes de esta operación" />

      {registro.entradas.length > 0 && (
        <div>
          <h3 id={idEntradas} className="mb-1 text-sm font-bold">Entradas de la operación</h3>
          <div role="region" aria-labelledby={idEntradas} tabIndex={0} className="overflow-x-auto">
            <table className="tabular w-full border-collapse text-sm">
              <thead className="border-b border-line text-left text-ink-2">
                <tr>
                  {['Entrada', 'Estado', 'Monto', 'Efectivo recibido', 'Revisión', 'Motivo'].map((etiqueta) => (
                    <th scope="col" key={etiqueta} className="px-2 py-2 font-bold first:pl-0">{etiqueta}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {registro.entradas.map((entrada) => (
                  <tr key={entrada.numero}>
                    <th scope="row" className="py-2 pr-2 text-left">{numeroEntrada(entrada.numero)}</th>
                    <td className="px-2 py-2">{ESTADO_LIBRO[entrada.estado]}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {entrada.monto !== null && entrada.moneda ? (entrada.moneda === 'VES' ? formatBs(entrada.monto) : usd.format(entrada.monto)) : '—'}
                    </td>
                    <td className="px-2 py-2">{horaCompleta(entrada.efectivoRecibidoAt) || '—'}</td>
                    <td className="px-2 py-2">
                      {horaCompleta(entrada.fechaRevision) || '—'}
                      {entrada.revisadoPor && <span className="block text-ink-2">{entrada.revisadoPor}</span>}
                    </td>
                    <td className="px-2 py-2 [overflow-wrap:anywhere]">{entrada.motivo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {registro.comprobante ? (
        <Button type="button" size="sm" variant="outline" loading={buscando} onClick={verComprobante}>Ver comprobante</Button>
      ) : (
        <p className="text-sm text-ink-2">Sin comprobante adjunto.</p>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {prueba && <CaptureDialog src={prueba} alt="Comprobante de la operación" onClose={() => setPrueba(null)} />}
    </div>
  );
}
