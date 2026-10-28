'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useMemo, useState } from 'react';
import { Download, Printer, Search } from 'lucide-react';
import { Button, Field, Notice, Spinner, StatusPill, TextInput } from '@/components/ui';
import { api, PageTitle } from '@/components/admin/api';
import { buildEntradasPdf, download, entradasCsv } from '@/lib/print/entradasPdf';
import { HOLDER_LABEL, type Entrada, type EntradaStatus, type HolderType } from '@/lib/entradas/types';
import type { EventConfig } from '@/types';
import { formatNumber } from '@/lib/site';
import { cn } from '@/lib/utils';
import EntradaDetalle from './EntradaDetalle';

const ESTADOS: { value: EntradaStatus | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'sin_vender', label: 'Sin vender' },
  { value: 'por_verificar', label: 'Por verificar' },
  { value: 'activa', label: 'Activas' },
  { value: 'anulada', label: 'Anuladas' },
];

const PAGE = 100;

export default function EntradasAdmin() {
  const [entradas, setEntradas] = useState<Entrada[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<EntradaStatus | 'todas'>('todas');
  const [tipo, setTipo] = useState<HolderType | 'todos'>('todos');
  const [selected, setSelected] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [printOpen, setPrintOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<{ entradas: Entrada[] }>('/api/admin/entradas');
      setEntradas(data.entradas);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar.');
    }
  }, []);

  useAutoLoad(load);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (entradas || []).filter((e) => {
      if (estado !== 'todas' && e.status !== estado) return false;
      if (tipo !== 'todos' && e.holderType !== tipo) return false;
      if (!term) return true;
      if (/^#?\d+$/.test(term)) return e.number === Number(term.replace('#', ''));
      return [e.attendeeName, e.attendeePhone, e.code, e.holderName, e.tableId, e.paymentReference]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term));
    });
  }, [entradas, q, estado, tipo]);

  const current = entradas?.find((e) => e.code === selected) || null;

  return (
    <div className="max-w-7xl">
      <PageTitle title="Entradas">
        {entradas && entradas.length > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={() => setPrintOpen((v) => !v)}>
              <Printer className="h-4 w-4" aria-hidden /> PDF para imprenta
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                download('entradas-parrandon-2026.csv', new Blob([entradasCsv(entradas)], { type: 'text/csv;charset=utf-8' }))
              }
            >
              <Download className="h-4 w-4" aria-hidden /> CSV con códigos
            </Button>
          </>
        )}
      </PageTitle>

      {printOpen && entradas && <Imprimir entradas={entradas} onClose={() => setPrintOpen(false)} />}
      {error && <Notice tone="error">{error}</Notice>}
      {!entradas && !error && <Spinner />}
      {entradas && entradas.length === 0 && (
        <Notice tone="warn" title="Todavía no se han generado las entradas">
          Ve a Resumen y pulsa «Generar entradas».
        </Notice>
      )}

      {entradas && entradas.length > 0 && (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <Field label="Buscar" htmlFor="buscar" className="lg:w-80">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" aria-hidden />
                <TextInput
                  id="buscar"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setLimit(PAGE);
                  }}
                  placeholder="N.º, nombre, teléfono, mesa, referencia"
                  className="pl-10"
                />
              </div>
            </Field>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
              {ESTADOS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={estado === s.value}
                  onClick={() => {
                    setEstado(s.value);
                    setLimit(PAGE);
                  }}
                  className={cn(
                    'h-10 rounded-lg px-3 text-sm font-bold',
                    estado === s.value ? 'bg-ink text-paper' : 'bg-paper-2 text-ink-2 hover:text-ink'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5 text-[0.95rem] font-bold">
              Lote
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as HolderType | 'todos')}
                className="h-10 rounded-lg border-2 border-line bg-card px-2 font-normal"
              >
                <option value="todos">Todos</option>
                {(Object.keys(HOLDER_LABEL) as HolderType[]).map((h) => (
                  <option key={h} value={h}>
                    {HOLDER_LABEL[h]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="tabular mt-4 text-sm text-ink-3">
            {filtered.length} {filtered.length === 1 ? 'entrada' : 'entradas'}
          </p>

          <div className="mt-3 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_26rem]">
            <div className="overflow-x-auto rounded-2xl bg-card shadow-[var(--shadow-soft)]">
              <table className="tabular w-full min-w-[44rem] text-left">
                <thead className="border-b border-line text-sm text-ink-3">
                  <tr>
                    <th className="px-4 py-3 font-bold">N.º</th>
                    <th className="px-4 py-3 font-bold">Estado</th>
                    <th className="px-4 py-3 font-bold">Nombre</th>
                    <th className="px-4 py-3 font-bold">Mesa</th>
                    <th className="px-4 py-3 font-bold">Lote</th>
                    <th className="px-4 py-3 font-bold">Entró</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.slice(0, limit).map((e) => (
                    <tr
                      key={e.code}
                      onClick={() => setSelected(e.code)}
                      className={cn('cursor-pointer hover:bg-paper-2', selected === e.code && 'bg-oro-soft')}
                    >
                      <td className="px-4 py-2.5">
                        <button type="button" className="font-display text-lg" onClick={() => setSelected(e.code)}>
                          {formatNumber(e.number)}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusPill status={e.status} />
                      </td>
                      <td className="max-w-[14rem] truncate px-4 py-2.5">{e.attendeeName || <span className="text-ink-3">—</span>}</td>
                      <td className="px-4 py-2.5 font-bold">{e.tableId || <span className="font-normal text-ink-3">—</span>}</td>
                      <td className="max-w-[14rem] truncate px-4 py-2.5 text-ink-2">{e.holderName || 'Sin asignar'}</td>
                      <td className="px-4 py-2.5">{e.checkedInAt ? 'Sí' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > limit && (
                <div className="border-t border-line p-3 text-center">
                  <Button variant="quiet" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
                    Ver {Math.min(PAGE, filtered.length - limit)} más
                  </Button>
                </div>
              )}
            </div>
            <div className="xl:sticky xl:top-6 xl:self-start">
              {current ? (
                <EntradaDetalle
                  key={current.code}
                  entrada={current}
                  onClose={() => setSelected(null)}
                  onChange={(updated) =>
                    setEntradas((list) => list && list.map((x) => (x.code === updated.code ? { ...updated, paymentProofUrl: updated.paymentProofUrl?.startsWith('data:') ? 'embedded' : updated.paymentProofUrl } : x)))
                  }
                />
              ) : (
                <p className="hidden rounded-2xl border-2 border-dashed border-line p-6 text-ink-2 xl:block">
                  Toca una entrada para ver sus datos, aprobar el pago, moverla de mesa o anularla.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Imprimir({ entradas, onClose }: { entradas: Entrada[]; onClose: () => void }) {
  const max = entradas.length;
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState(String(max));
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generar = async () => {
    const a = Number(from);
    const b = Number(to);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < a || b > max) {
      setError(`Revisa el rango: de 1 a ${max}.`);
      return;
    }
    setError(null);
    setProgress(0);
    try {
      const { config } = await api<{ config: EventConfig }>('/api/config');
      const tickets = entradas.filter((e) => e.number >= a && e.number <= b).map((e) => ({ number: e.number, code: e.code }));
      const doc = await buildEntradasPdf(
        tickets,
        { date: config.date, time: config.time, priceUsd: config.ticketPriceUsd },
        (n) => setProgress(n)
      );
      download(`entradas-${formatNumber(a)}-${formatNumber(b)}.pdf`, doc.output('blob'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el PDF.');
    } finally {
      setProgress(null);
    }
  };

  const total = Math.max(0, Number(to) - Number(from) + 1);
  return (
    <div className="mb-8 rounded-2xl bg-card p-5 shadow-[var(--shadow-soft)]">
      <p className="font-display text-2xl">PDF para la imprenta</p>
      <p className="mt-1 max-w-[62ch] text-ink-2">
        Cuatro entradas por hoja A4 con línea de corte y talón. Cada QR abre la página de su entrada. Guarda el PDF en un
        lugar privado: quien tenga un QR puede activar esa entrada.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Field label="Desde N.º" htmlFor="pdf-desde">
          <TextInput id="pdf-desde" inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value)} className="w-28" />
        </Field>
        <Field label="Hasta N.º" htmlFor="pdf-hasta">
          <TextInput id="pdf-hasta" inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value)} className="w-28" />
        </Field>
        <Button onClick={generar} loading={progress !== null}>
          {progress !== null ? `Generando ${progress} de ${total}…` : `Descargar ${total} entradas`}
        </Button>
        <Button variant="quiet" onClick={onClose}>
          Cerrar
        </Button>
      </div>
      {error && <Notice tone="error" className="mt-3">{error}</Notice>}
    </div>
  );
}
