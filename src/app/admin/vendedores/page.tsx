'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Field, Notice, Spinner, TextInput } from '@/components/ui';
import { api, PageTitle } from '@/components/admin/api';
import { HOLDER_LABEL, type Entrada, type HolderType, type Parroquia } from '@/lib/entradas/types';
import { formatNumber, formatRangos } from '@/lib/site';

interface Lista {
  seminaristas: { id: string; name: string; stage: string }[];
}

// "1,2,3,4,7,8" -> "#001–#004, #007–#008"
function rangos(nums: number[]) {
  const sorted = [...nums].sort((a, b) => a - b);
  const out: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (const n of sorted.slice(1).concat([NaN])) {
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    out.push(start === prev ? `#${formatNumber(start)}` : `#${formatNumber(start)}–#${formatNumber(prev)}`);
    start = n;
    prev = n;
  }
  return out.join(', ');
}

const ASIGNABLES: HolderType[] = ['seminarista', 'padre_jorge', 'parroquia', 'taquilla', 'sin_asignar'];

export default function VendedoresAdmin() {
  const [entradas, setEntradas] = useState<Entrada[] | null>(null);
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [lista, setLista] = useState<Lista | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [e, p, l] = await Promise.all([
        api<{ entradas: Entrada[] }>('/api/admin/entradas'),
        api<{ parroquias: Parroquia[] }>('/api/admin/parroquias'),
        api<Lista>('/api/vendedores/lista'),
      ]);
      setEntradas(e.entradas);
      setParroquias(p.parroquias);
      setLista(l);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar.');
    }
  }, []);

  useAutoLoad(load);

  const grupos = useMemo(() => {
    const map = new Map<string, { type: HolderType; name: string; numbers: number[]; vendidas: number }>();
    for (const e of entradas || []) {
      const key = `${e.holderType}:${e.holderId ?? ''}`;
      const g = map.get(key) || { type: e.holderType, name: e.holderName || 'Sin asignar', numbers: [], vendidas: 0 };
      g.numbers.push(e.number);
      if (e.status === 'activa' || e.status === 'por_verificar') g.vendidas++;
      map.set(key, g);
    }
    return Array.from(map.values()).sort((a, b) => Math.min(...a.numbers) - Math.min(...b.numbers));
  }, [entradas]);

  if (!entradas && !error) return <Spinner />;

  return (
    <div className="max-w-6xl space-y-12">
      <PageTitle title="Lotes y vendedores" />
      {error && <Notice tone="error">{error}</Notice>}
      {entradas && lista && (
        <AsignarLote entradas={entradas} parroquias={parroquias} seminaristas={lista.seminaristas} onDone={load} />
      )}

      <section aria-labelledby="quien-tiene">
        <h2 id="quien-tiene" className="font-display text-2xl">
          Quién tiene cada entrada
        </h2>
        <div
          role="region"
          aria-label="Tabla de lotes"
          tabIndex={0}
          className="mt-4 overflow-x-auto rounded-2xl bg-card shadow-[var(--shadow-soft)]"
        >
          <table className="tabular w-full min-w-[40rem] text-left">
            <thead className="border-b border-line text-sm text-ink-3">
              <tr>
                <th className="px-4 py-3 font-bold">Responsable</th>
                <th className="px-4 py-3 font-bold">Tipo</th>
                <th className="px-4 py-3 font-bold">Números</th>
                <th className="px-4 py-3 text-right font-bold">Vendidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {grupos.map((g) => (
                <tr key={`${g.type}-${g.name}`}>
                  <td className="px-4 py-2.5 font-bold">{g.name}</td>
                  <td className="px-4 py-2.5 text-ink-2">{HOLDER_LABEL[g.type]}</td>
                  <td className="px-4 py-2.5 text-ink-2">{rangos(g.numbers)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {g.vendidas} / {g.numbers.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Parroquias parroquias={parroquias} onChange={setParroquias} />
    </div>
  );
}

function AsignarLote({
  entradas,
  parroquias,
  seminaristas,
  onDone,
}: {
  entradas: Entrada[];
  parroquias: Parroquia[];
  seminaristas: { id: string; name: string; stage: string }[];
  onDone: () => void;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState<HolderType>('padre_jorge');
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const a = Number(from);
  const b = Number(to);
  const valid = Number.isInteger(a) && Number.isInteger(b) && a >= 1 && b >= a;
  const enRango = valid ? entradas.filter((e) => e.number >= a && e.number <= b) : [];
  const conPago = enRango.filter((e) => e.status !== 'sin_vender').length;
  const needsId = type === 'seminarista' || type === 'parroquia';
  const deSeminaristas = entradas.filter((e) => e.holderType === 'seminarista').map((e) => e.number);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { count } = await api<{ count: number }>('/api/admin/lotes', { method: 'POST', body: { from: a, to: b, type, id } });
      setMsg({ tone: 'ok', text: `Listo: ${count} entradas asignadas.` });
      setFrom('');
      setTo('');
      onDone();
    } catch (err) {
      setMsg({ tone: 'error', text: err instanceof Error ? err.message : 'No se pudo asignar.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="asignar" className="rounded-2xl bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <h2 id="asignar" className="font-display text-2xl">
        Asignar un lote
      </h2>
      <p className="mt-1 max-w-[62ch] text-ink-2">
        Escribe el rango de números de las entradas que entregas y a quién.
        {deSeminaristas.length > 0 && ` Los seminaristas tienen ${formatRangos(deSeminaristas)}.`}
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Desde N.º" htmlFor="lote-desde">
          <TextInput id="lote-desde" inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="235" />
        </Field>
        <Field label="Hasta N.º" htmlFor="lote-hasta">
          <TextInput id="lote-hasta" inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value)} placeholder="260" />
        </Field>
        <Field label="Para" htmlFor="lote-tipo">
          <select
            id="lote-tipo"
            value={type}
            onChange={(e) => {
              setType(e.target.value as HolderType);
              setId('');
            }}
            className="h-12 w-full rounded-xl border-2 border-line bg-card px-3"
          >
            {ASIGNABLES.map((h) => (
              <option key={h} value={h}>
                {HOLDER_LABEL[h]}
              </option>
            ))}
          </select>
        </Field>
        {needsId && (
          <Field label={type === 'seminarista' ? 'Seminarista' : 'Parroquia'} htmlFor="lote-quien">
            <select id="lote-quien" value={id} onChange={(e) => setId(e.target.value)} className="h-12 w-full rounded-xl border-2 border-line bg-card px-3">
              <option value="">Selecciona</option>
              {(type === 'seminarista' ? seminaristas : parroquias).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
      {type === 'parroquia' && parroquias.length === 0 && (
        <Notice tone="warn" className="mt-4">
          Primero crea la parroquia más abajo.
        </Notice>
      )}
      {valid && (
        <p className="tabular mt-4 text-ink-2">
          Se asignarán {enRango.length} entradas (#{formatNumber(a)}–#{formatNumber(b)})
          {conPago > 0 ? `. Ojo: ${conPago} ya tienen pago reportado; cambiará quién aparece como responsable.` : '.'}
        </p>
      )}
      {msg && <Notice tone={msg.tone} className="mt-4">{msg.text}</Notice>}
      <Button className="mt-4" onClick={submit} loading={busy} disabled={!valid || enRango.length === 0 || (needsId && !id)}>
        Asignar lote
      </Button>
    </section>
  );
}

function Parroquias({ parroquias, onChange }: { parroquias: Parroquia[]; onChange: (p: Parroquia[]) => void }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      const { parroquias: list } = await api<{ parroquias: Parroquia[] }>('/api/admin/parroquias', {
        method: 'POST',
        body: { name, contact },
      });
      onChange(list);
      setName('');
      setContact('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Parroquia) => {
    if (!confirm(`¿Eliminar ${p.name}?`)) return;
    setError(null);
    try {
      const { parroquias: list } = await api<{ parroquias: Parroquia[] }>(`/api/admin/parroquias?id=${encodeURIComponent(p.id)}`, {
        method: 'DELETE',
      });
      onChange(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

  return (
    <section aria-labelledby="parroquias">
      <h2 id="parroquias" className="font-display text-2xl">
        Parroquias
      </h2>
      <p className="mt-1 text-ink-2">Las parroquias que reciben entradas. Aparecen en el portal de vendedores.</p>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
          {parroquias.length === 0 && <li className="p-5 text-ink-2">Todavía no hay parroquias.</li>}
          {parroquias.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="font-bold">{p.name}</p>
                {p.contact && <p className="text-sm text-ink-3">{p.contact}</p>}
              </div>
              <button type="button" onClick={() => remove(p)} aria-label={`Eliminar ${p.name}`} className="rounded-lg p-2 text-ink-3 hover:bg-paper-2 hover:text-rojo">
                <Trash2 className="h-5 w-5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <div className="space-y-3 rounded-2xl bg-paper-2 p-5">
          <Field label="Nombre de la parroquia" htmlFor="par-nombre">
            <TextInput id="par-nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Parroquia Santa Bárbara" />
          </Field>
          <Field label="Contacto (opcional)" htmlFor="par-contacto">
            <TextInput id="par-contacto" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Nombre y teléfono" />
          </Field>
          {error && <Notice tone="error">{error}</Notice>}
          <Button onClick={add} loading={busy} disabled={name.trim().length < 3}>
            Agregar parroquia
          </Button>
        </div>
      </div>
    </section>
  );
}
