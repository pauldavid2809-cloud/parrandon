'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useState } from 'react';
import MesaMap from '@/components/mesas/MesaMap';
import type { MesaPublica } from '@/components/mesas/useMesas';
import { MesasResumenLine } from '@/components/mesas/Leyenda';
import { Button, Field, Notice, Spinner, StatusPill, TextInput } from '@/components/ui';
import { api, PageTitle } from '@/components/admin/api';
import type { EntradaStatus, MesasResumen } from '@/lib/entradas/types';
import { formatNumber } from '@/lib/site';

interface Persona {
  code: string;
  number: number;
  tableId: string;
  name: string | null;
  phone: string | null;
  status: EntradaStatus;
  checkedIn: boolean;
}

export default function MesasAdmin() {
  const [mesas, setMesas] = useState<MesaPublica[]>([]);
  const [resumen, setResumen] = useState<MesasResumen | null>(null);
  const [gente, setGente] = useState<Persona[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<{ mesas: MesaPublica[]; resumen: MesasResumen; gente: Persona[] }>('/api/admin/mesas');
      setMesas(data.mesas);
      setResumen(data.resumen);
      setGente(data.gente);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useAutoLoad(load, 15000);

  const mesa = mesas.find((m) => m.id === selected);
  const sentados = gente.filter((p) => p.tableId === selected).sort((a, b) => a.number - b.number);

  return (
    <div className="max-w-6xl">
      <PageTitle title="Mesas" />
      {error && <Notice tone="error" className="mb-4">{error}</Notice>}
      {!loaded && <Spinner />}
      {loaded && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <div>
            <MesasResumenLine resumen={resumen} className="mb-3" />
            <div className="rounded-2xl bg-card p-2 shadow-[var(--shadow-soft)]">
              <MesaMap mesas={mesas} selected={selected} mode="admin" onSelect={(m) => setSelected(m.id === selected ? null : m.id)} />
            </div>
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start">
            {mesa ? (
              <MesaPanel key={mesa.id} mesa={mesa} sentados={sentados} onSaved={load} />
            ) : (
              <p className="rounded-2xl border-2 border-dashed border-line p-6 text-ink-2">
                Toca una mesa para ver quién está sentado, ponerle un nombre (por ejemplo «Familia del Padre Jorge») o
                reservarla para que nadie más la escoja.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MesaPanel({ mesa, sentados, onSaved }: { mesa: MesaPublica; sentados: Persona[]; onSaved: () => void }) {
  const [label, setLabel] = useState(mesa.label || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (patch: { label?: string; blocked?: boolean }) => {
    setBusy(true);
    setError(null);
    try {
      await api('/api/admin/mesas', { method: 'PATCH', body: { id: mesa.id, ...patch } });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card shadow-[var(--shadow-soft)]">
      <div className="p-5">
        <p className="font-display text-4xl">Mesa {mesa.id}</p>
        <p className="tabular text-ink-2">
          Sector {mesa.sector} · {mesa.taken} de {mesa.capacity} ocupados
          {mesa.blocked ? ' · reservada' : ''}
        </p>
      </div>
      <ul className="divide-y divide-line border-t border-line">
        {sentados.length === 0 && <li className="p-5 text-ink-2">Nadie ha escogido esta mesa todavía.</li>}
        {sentados.map((p) => (
          <li key={p.code} className="flex items-center gap-3 px-5 py-3">
            <span className="tabular w-12 font-display text-lg">{formatNumber(p.number)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{p.name || 'Sin nombre'}</p>
              <p className="text-sm text-ink-3">
                {p.phone || 'Sin teléfono'}
                {p.checkedIn ? ' · ya entró' : ''}
              </p>
            </div>
            <StatusPill status={p.status} />
          </li>
        ))}
      </ul>
      <div className="space-y-3 border-t border-line p-5">
        <Field label="Nombre de la mesa (opcional)" htmlFor="mesa-label" hint="Solo lo ve administración.">
          <div className="flex gap-2">
            <TextInput id="mesa-label" value={label} onChange={(e) => setLabel(e.target.value)} />
            <Button variant="outline" onClick={() => save({ label })} loading={busy}>
              Guardar
            </Button>
          </div>
        </Field>
        <Button variant={mesa.blocked ? 'verde' : 'outline'} onClick={() => save({ blocked: !mesa.blocked })} loading={busy}>
          {mesa.blocked ? 'Abrir la mesa al público' : 'Reservar mesa (nadie más la puede escoger)'}
        </Button>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </div>
  );
}
