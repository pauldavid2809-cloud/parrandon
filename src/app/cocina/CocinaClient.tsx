'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut, Utensils } from 'lucide-react';
import { Button, Notice, Spinner } from '@/components/ui';
import { logout } from '@/components/staff/StaffGate';
import { formatNumber } from '@/lib/site';
import { cn } from '@/lib/utils';

interface MesaCocina {
  id: string;
  sector: string;
  number: number;
  esperados: number;
  llegaron: number;
  servidos: number;
  porServir: number;
  esperaDesde: string | null;
}
interface Llegada {
  number: number;
  name: string | null;
  tableId: string | null;
  checkedInAt: string;
  served: boolean;
}
interface Estado {
  llegadas: Llegada[];
  mesas: MesaCocina[];
  totales: { esperados: number; llegaron: number; servidos: number; porServir: number };
}

const POLL_MS = 4000;

function hace(iso: string, now: number) {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  return `hace ${h} h ${min % 60} min`;
}

export default function CocinaClient() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const [now, setNow] = useState(() => Date.now());
  const [filtro, setFiltro] = useState<'pendientes' | 'todas'>('pendientes');
  const [busyTable, setBusyTable] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ tableId: string; codes: string[]; count: number } | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/cocina', { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      // Marca las llegadas nuevas para resaltarlas un momento.
      const keys = (json.llegadas as Llegada[]).map((l) => `${l.number}-${l.checkedInAt}`);
      const nuevos = new Set(keys.filter((k) => !seen.current.has(k)));
      keys.forEach((k) => seen.current.add(k));
      setFresh(firstLoad.current ? new Set() : nuevos);
      firstLoad.current = false;
      setEstado(json);
      setError(null);
      setUpdatedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sin conexión con el servidor.');
    }
  }, []);

  useAutoLoad(load, POLL_MS);
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(tick);
  }, []);

  const despachar = async (tableId: string) => {
    setBusyTable(tableId);
    try {
      const res = await fetch('/api/cocina/despachar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setUndo({ tableId, codes: json.codes, count: json.count });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo despachar.');
    } finally {
      setBusyTable(null);
    }
  };

  const deshacer = async () => {
    if (!undo) return;
    await fetch('/api/cocina/deshacer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes: undo.codes }),
    });
    setUndo(null);
    load();
  };

  const pendientes = (estado?.mesas || [])
    .filter((m) => m.porServir > 0)
    .sort((a, b) => (a.esperaDesde || '').localeCompare(b.esperaDesde || ''));
  const lista = filtro === 'pendientes' ? pendientes : estado?.mesas || [];
  const stale = updatedAt > 0 && now - updatedAt > 20000;

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <p className="flex items-center gap-2 font-display text-2xl">
            <Utensils className="h-6 w-6 text-rojo" aria-hidden /> Cocina
          </p>
          {estado && (
            <dl className="tabular flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <div className="flex gap-1.5">
                <dt className="text-ink-3">Llegaron</dt>
                <dd className="font-bold">{estado.totales.llegaron}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-ink-3">Servidos</dt>
                <dd className="font-bold text-verde-2">{estado.totales.servidos}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-ink-3">Por servir</dt>
                <dd className="font-bold text-rojo">{estado.totales.porServir}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-ink-3">Con entrada</dt>
                <dd className="font-bold">{estado.totales.esperados}</dd>
              </div>
            </dl>
          )}
          <p className={cn('ml-auto flex items-center gap-2 text-sm font-bold', stale ? 'text-rojo' : 'text-verde-2')}>
            <span aria-hidden className={cn('h-2.5 w-2.5 rounded-full', stale ? 'bg-rojo' : 'bulb bg-verde')} />
            {stale ? 'Sin actualizar: revisa la conexión' : 'En vivo'}
          </p>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-ink-2 hover:bg-paper-2"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Salir
          </button>
        </div>
      </header>

      {!estado && !error && <Spinner label="Cargando mesas…" />}
      {error && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {estado && (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-6 lg:grid-cols-[1fr_22rem]">
          <section aria-labelledby="mesas-cocina">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 id="mesas-cocina" className="font-display text-3xl">
                {filtro === 'pendientes' ? 'Mesas por despachar' : 'Todas las mesas'}
              </h1>
              <div role="tablist" className="flex rounded-xl bg-paper-2 p-1">
                {(['pendientes', 'todas'] as const).map((f) => (
                  <button
                    key={f}
                    role="tab"
                    aria-selected={filtro === f}
                    onClick={() => setFiltro(f)}
                    className={cn(
                      'h-10 rounded-lg px-4 font-bold',
                      filtro === f ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
                    )}
                  >
                    {f === 'pendientes' ? `Pendientes (${pendientes.length})` : 'Todas'}
                  </button>
                ))}
              </div>
            </div>
            {filtro === 'pendientes' && pendientes.length === 0 && (
              <p className="mt-6 rounded-2xl border-2 border-dashed border-line p-8 text-center text-lg text-ink-2">
                No hay platos pendientes. Cuando alguien entre por la puerta, su mesa aparece aquí.
              </p>
            )}
            <ul className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(13.5rem,1fr))] gap-3">
              {lista.map((m) => (
                <MesaCard key={m.id} mesa={m} now={now} busy={busyTable === m.id} onDespachar={() => despachar(m.id)} />
              ))}
            </ul>
          </section>

          <aside aria-labelledby="llegadas" className="lg:sticky lg:top-24 lg:self-start">
            <h2 id="llegadas" className="font-display text-2xl">
              Van llegando
            </h2>
            {estado.llegadas.length === 0 && <p className="mt-2 text-ink-2">Todavía no ha entrado nadie.</p>}
            <ul className="mt-3 max-h-[70vh] divide-y divide-line overflow-y-auto rounded-2xl bg-card shadow-[var(--shadow-soft)]">
              {estado.llegadas.map((l) => {
                const key = `${l.number}-${l.checkedInAt}`;
                return (
                  <li key={key} className={cn('flex items-center gap-3 px-4 py-3', fresh.has(key) && 'row-arrive')}>
                    <span className="w-12 shrink-0 text-center font-display text-2xl text-rojo">{l.tableId}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{l.name || `Entrada ${formatNumber(l.number)}`}</p>
                      <p className="text-sm text-ink-3">
                        {hace(l.checkedInAt, now)}
                        {l.served ? ' · servido' : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      )}

      {undo && (
        <div role="status" className="flash-in fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-ink p-4 text-paper shadow-[var(--shadow-ticket)]">
          <p>
            Mesa <strong>{undo.tableId}</strong>: {undo.count} {undo.count === 1 ? 'plato despachado' : 'platos despachados'}
          </p>
          <div className="flex gap-1">
            <button type="button" onClick={deshacer} className="h-10 rounded-lg px-3 font-bold text-oro hover:bg-noche-2">
              Deshacer
            </button>
            <button type="button" onClick={() => setUndo(null)} className="h-10 rounded-lg px-3 font-bold text-paper/70 hover:bg-noche-2">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MesaCard({
  mesa,
  now,
  busy,
  onDespachar,
}: {
  mesa: MesaCocina;
  now: number;
  busy: boolean;
  onDespachar: () => void;
}) {
  const pendiente = mesa.porServir > 0;
  const completa = mesa.llegaron > 0 && mesa.porServir === 0;
  return (
    <li
      className={cn(
        'flex flex-col rounded-2xl p-4',
        pendiente ? 'bg-card shadow-[var(--shadow-soft)] ring-2 ring-rojo' : 'bg-paper-2'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-4xl leading-none">{mesa.id}</p>
        {pendiente ? (
          <p className="text-right leading-tight">
            <span className="tabular block font-display text-4xl text-rojo">{mesa.porServir}</span>
            <span className="text-sm font-bold text-rojo">por servir</span>
          </p>
        ) : completa ? (
          <p className="rounded-full bg-verde-soft px-2.5 py-0.5 text-sm font-bold text-verde-2">Al día</p>
        ) : (
          <p className="text-sm font-bold text-ink-3">Sin llegar</p>
        )}
      </div>
      <p className="tabular mt-3 text-sm text-ink-2">
        Llegaron {mesa.llegaron} de {mesa.esperados} · servidos {mesa.servidos}
      </p>
      {pendiente && mesa.esperaDesde && <p className="text-sm text-ink-3">Esperando desde {hace(mesa.esperaDesde, now)}</p>}
      {pendiente && (
        <Button variant="verde" className="mt-4 w-full" loading={busy} onClick={onDespachar}>
          Despachar {mesa.porServir} {mesa.porServir === 1 ? 'plato' : 'platos'}
        </Button>
      )}
    </li>
  );
}
