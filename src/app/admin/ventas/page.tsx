'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useState } from 'react';
import { Button, Notice, Spinner, TextInput } from '@/components/ui';
import { api, fechaCorta, PageTitle } from '@/components/admin/api';
import CaptureDialog from '@/components/admin/CaptureDialog';
import { formatBs } from '@/components/pago/PaymentDetails';
import { METODO_LABEL, type VentaEstado } from '@/lib/entradas/types';
import type { VentaAdmin, ventasAdmin } from '@/lib/entradas/ventas';
import { formatNumber } from '@/lib/site';
import { cn } from '@/lib/utils';

type Datos = Awaited<ReturnType<typeof ventasAdmin>>;
type Filtro = VentaEstado | 'todas';

const MOTIVOS = ['No aparece el pago en la cuenta.', 'El monto está incompleto.', 'No entregó el efectivo.'];
const ESTADO: Record<VentaEstado, { label: string; className: string }> = {
  por_verificar: { label: 'Por verificar', className: 'bg-oro-soft text-oro-ink' },
  verificada: { label: 'Verificada', className: 'bg-verde-soft text-verde-2' },
  rechazada: { label: 'Rechazada', className: 'bg-rojo-soft text-rojo-2' },
};

const usd = (n: number) => `$${n.toFixed(2)}`;

export default function VentasAdmin() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('por_verificar');

  const load = useCallback(async () => {
    try {
      setDatos(await api<Datos>('/api/admin/ventas'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar.');
    }
  }, []);

  useAutoLoad(load, 20_000);

  const cuenta = (f: Filtro) => (datos ? datos.ventas.filter((v) => f === 'todas' || v.estado === f).length : 0);
  const lista = datos ? datos.ventas.filter((v) => filtro === 'todas' || v.estado === filtro) : [];
  const efectivoTotal = datos?.vendedores.reduce((s, v) => s + v.efectivoPorEntregar, 0) ?? 0;

  return (
    <div className="max-w-5xl">
      <PageTitle title="Ventas de vendedores" />
      <p className="-mt-4 mb-8 max-w-[65ch] text-ink-2">
        Cada venta es lo que un vendedor registró de una vez: una o varias entradas con un solo pago. Llegan cuando su
        teléfono tiene señal. Cada persona completa sus datos al escanear su entrada.
      </p>
      {error && <Notice tone="error">{error}</Notice>}
      {!datos && !error && <Spinner />}

      {datos && (
        <>
          <section aria-labelledby="rendicion" className="mb-10">
            <h2 id="rendicion" className="font-display text-2xl">
              Rendición por vendedor
            </h2>
            {datos.vendedores.length === 0 ? (
              <p className="mt-2 text-ink-2">Todavía no hay ventas de vendedores.</p>
            ) : (
              <>
                <p className="tabular mt-1 text-ink-2">
                  Efectivo por recibir en total: <strong className="text-ink">{usd(efectivoTotal)}</strong>
                </p>
                <div className="mt-4 overflow-x-auto rounded-2xl bg-card shadow-[var(--shadow-soft)]" tabIndex={0} aria-label="Rendición por vendedor">
                  <table className="tabular w-full min-w-[36rem] text-left">
                    <thead className="border-b border-line text-sm text-ink-3">
                      <tr>
                        <th className="px-4 py-3 font-bold">Vendedor</th>
                        <th className="px-4 py-3 font-bold">Entradas</th>
                        <th className="px-4 py-3 font-bold">Efectivo por entregar</th>
                        <th className="px-4 py-3 font-bold">Pagos por verificar</th>
                        <th className="px-4 py-3 font-bold">Verificadas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {datos.vendedores.map((v) => (
                        <tr key={`${v.nombre}-${v.lote}`}>
                          <td className="px-4 py-3">
                            <p className="font-bold">{v.nombre}</p>
                            {v.lote && <p className="text-sm text-ink-3">Lote de {v.lote}</p>}
                          </td>
                          <td className="px-4 py-3">{v.entradas}</td>
                          <td className={cn('px-4 py-3', v.efectivoPorEntregar > 0 && 'font-bold text-rojo-2')}>
                            {v.efectivoPorEntregar > 0 ? usd(v.efectivoPorEntregar) : '—'}
                          </td>
                          <td className="px-4 py-3">{v.pagosPorVerificar || '—'}</td>
                          <td className="px-4 py-3">{v.verificadas || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section aria-labelledby="lista-ventas">
            <h2 id="lista-ventas" className="sr-only">
              Ventas
            </h2>
            <div className="mb-5 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar ventas">
              {(
                [
                  ['por_verificar', 'Por verificar'],
                  ['verificada', 'Verificadas'],
                  ['rechazada', 'Rechazadas'],
                  ['todas', 'Todas'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filtro === key}
                  onClick={() => setFiltro(key)}
                  className={cn('h-10 rounded-lg px-4 font-bold', filtro === key ? 'bg-ink text-paper' : 'bg-paper-2 text-ink-2 hover:text-ink')}
                >
                  {label} ({cuenta(key)})
                </button>
              ))}
            </div>
            {lista.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-line p-8 text-center text-lg text-ink-2">
                {filtro === 'por_verificar' ? 'No hay ventas esperando verificación.' : 'No hay ventas aquí.'}
              </p>
            ) : (
              <ul className="space-y-4">
                {lista.map((v) => (
                  <VentaCard key={v.id} venta={v} onDone={load} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function VentaCard({ venta, onDone }: { venta: VentaAdmin; onDone: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [capture, setCapture] = useState<string | null>(null);

  const n = venta.entradas.length;
  const efectivo = venta.method === 'efectivo_usd';
  const monto =
    venta.method === 'pago_movil' && venta.rateApplied
      ? formatBs(Math.round(venta.priceUsd * venta.rateApplied * 100) / 100 * Math.max(n, 1))
      : usd(venta.priceUsd * Math.max(n, 1));
  // Si se vendió sin señal, se sabe cuánto tardó en llegar.
  const tarde = Date.parse(venta.receivedAt) - Date.parse(venta.soldAt) > 10 * 60 * 1000;

  const act = async (action: 'aprobar' | 'rechazar') => {
    setBusy(action);
    setError(null);
    try {
      await api(`/api/admin/ventas/${encodeURIComponent(venta.id)}`, { method: 'PATCH', body: { action, reason: motivo } });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar.');
    } finally {
      setBusy(null);
    }
  };

  const verCapture = async () => {
    if (venta.proofUrl && venta.proofUrl !== 'embedded') return setCapture(venta.proofUrl);
    try {
      const { proofUrl } = await api<{ proofUrl: string | null }>(`/api/admin/ventas/${encodeURIComponent(venta.id)}`);
      if (proofUrl) setCapture(proofUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir el capture.');
    }
  };

  const estado = ESTADO[venta.estado];
  return (
    <li className="rounded-2xl bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="tabular font-display text-2xl">
          {n ? venta.entradas.map((e) => formatNumber(e.number)).join(' · ') : venta.numbers.map((x) => formatNumber(x)).join(' · ')}
        </p>
        <span className={cn('rounded-full px-3 py-1 text-sm font-bold', estado.className)}>{estado.label}</span>
      </div>
      <p className="mt-1 font-bold">
        {venta.vendedor || venta.sellerName}
        {venta.vendedor && <span className="font-normal text-ink-2"> · lote de {venta.sellerName}</span>}
      </p>
      <p className="tabular text-ink-2">
        {METODO_LABEL[venta.method]} · {monto}
        {venta.reference ? ` · Ref. ${venta.reference}` : ''}
        {venta.buyerName ? ` · ${venta.buyerName}` : ''}
      </p>
      <p className="tabular text-sm text-ink-3">
        Vendida {fechaCorta(venta.soldAt)}
        {tarde && ` · llegó ${fechaCorta(venta.receivedAt)} (sin señal al vender)`}
        {venta.verifiedAt && ` · ${venta.rejectionReason ? 'rechazada' : 'verificada'} ${fechaCorta(venta.verifiedAt)}`}
      </p>

      {n > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {venta.entradas.map((e) => (
            <li key={e.number} className="rounded-lg bg-paper-2 px-3 py-1.5">
              <span className="tabular font-bold">{formatNumber(e.number)}</span>{' '}
              <span className="text-ink-2">
                {e.conDatos ? 'con datos' : 'sin datos todavía'}
                {e.tableId ? ` · mesa ${e.tableId}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      {venta.problemas.length > 0 && (
        <div className="mt-3 rounded-xl bg-rojo-soft px-4 py-3 text-sm text-rojo-2">
          <p className="font-bold">No se pudieron vender en esta orden:</p>
          {venta.problemas.map((p, i) => (
            <p key={i}>
              {p.number ? `N.º ${formatNumber(p.number)}: ` : ''}
              {p.motivo}
            </p>
          ))}
        </div>
      )}
      {venta.rejectionReason && <p className="mt-3 font-bold text-rojo-2">Motivo: {venta.rejectionReason}</p>}
      {error && (
        <Notice tone="error" className="mt-3">
          {error}
        </Notice>
      )}

      {(venta.estado === 'por_verificar' || venta.proofUrl) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {venta.estado === 'por_verificar' && !rechazando && (
            <>
              <Button variant="verde" loading={busy === 'aprobar'} onClick={() => act('aprobar')}>
                {efectivo ? `Efectivo recibido (${usd(venta.priceUsd * venta.porVerificar)})` : 'Pago verificado'}
              </Button>
              <Button variant="outline" onClick={() => setRechazando(true)}>
                Rechazar
              </Button>
            </>
          )}
          {venta.proofUrl && (
            <Button variant="quiet" onClick={verCapture}>
              Ver capture
            </Button>
          )}
        </div>
      )}
      {rechazando && (
        <div className="mt-4 space-y-3 rounded-xl bg-paper-2 p-4">
          <p className="font-bold">¿Por qué se rechaza? Las entradas vuelven a «sin vender» y quien las tenga ve el motivo.</p>
          <div className="flex flex-wrap gap-2">
            {MOTIVOS.map((m) => (
              <button key={m} type="button" onClick={() => setMotivo(m)} className="min-h-10 rounded-lg bg-card px-3 text-sm font-bold hover:bg-paper">
                {m}
              </button>
            ))}
          </div>
          <TextInput aria-label="Motivo del rechazo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Escribe el motivo" />
          <div className="flex gap-2">
            <Button variant="primary" loading={busy === 'rechazar'} disabled={motivo.trim().length < 3} onClick={() => act('rechazar')}>
              Rechazar la venta
            </Button>
            <Button variant="quiet" onClick={() => setRechazando(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
      {capture && <CaptureDialog src={capture} alt={`Capture de la venta ${venta.numbers.join(', ')}`} onClose={() => setCapture(null)} />}
    </li>
  );
}
