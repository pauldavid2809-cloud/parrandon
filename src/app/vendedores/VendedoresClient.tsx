'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, ScanLine } from 'lucide-react';
import { Button, Choice, Field, Notice, Spinner, StatusPill, TextInput } from '@/components/ui';
import CameraScanner from '@/components/CameraScanner';
import MesaPicker from '@/components/mesas/MesaPicker';
import PaymentDetails, { formatBs, montoBs, type PagoInfo } from '@/components/pago/PaymentDetails';
import ProofUpload from '@/components/pago/ProofUpload';
import type { EntradaStatus, HolderType } from '@/lib/entradas/types';
import type { TicketView } from '@/lib/entradas/service';
import { formatNumber } from '@/lib/site';

type SellerType = Extract<HolderType, 'seminarista' | 'padre_jorge' | 'parroquia'>;
interface Seller {
  type: SellerType;
  id: string;
  name: string;
}
interface LoteItem {
  number: number;
  status: EntradaStatus;
  tableId: string | null;
  buyer: string | null;
  checkedIn: boolean;
}

const STORAGE_KEY = 'parrandon-vendedor';
const CODE_RE = /P\d{3,4}-[2-9A-HJ-NP-Z]{8}/i;

// El vendedor elegido se recuerda en este teléfono.
const listeners = new Set<() => void>();
let memory: string | null = null;

function readSeller(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return memory;
  }
}

function writeSeller(s: Seller | null) {
  memory = s ? JSON.stringify(s) : null;
  try {
    if (memory) localStorage.setItem(STORAGE_KEY, memory);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // sin almacenamiento local: queda en memoria
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

export default function VendedoresClient() {
  // En el servidor no hay vendedor guardado: se muestra la carga hasta hidratar.
  const raw = useSyncExternalStore(subscribe, readSeller, () => undefined);
  if (raw === undefined) return <Spinner />;
  let seller: Seller | null = null;
  try {
    seller = raw ? (JSON.parse(raw) as Seller) : null;
  } catch {
    seller = null;
  }
  return seller ? <Panel seller={seller} onExit={() => writeSeller(null)} /> : <QuienEres onChoose={writeSeller} />;
}

// ---------- identificación ----------

function QuienEres({ onChoose }: { onChoose: (s: Seller) => void }) {
  const [lista, setLista] = useState<{
    seminaristas: { id: string; name: string; stage: string }[];
    parroquias: { id: string; name: string }[];
  } | null>(null);
  const [type, setType] = useState<SellerType | null>(null);
  const [id, setId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/vendedores/lista', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => (d.success ? setLista(d) : setError(d.error)))
      .catch(() => setError('No se pudo cargar la lista. Revisa tu conexión.'));
  }, []);

  const stages = lista ? Array.from(new Set(lista.seminaristas.map((s) => s.stage))) : [];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!type) return;
    if (type === 'padre_jorge') return onChoose({ type, id: 'padre-jorge', name: 'Padre Jorge' });
    const found =
      type === 'seminarista' ? lista?.seminaristas.find((s) => s.id === id) : lista?.parroquias.find((p) => p.id === id);
    if (found) onChoose({ type, id: found.id, name: found.name });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">Vendedores</h1>
        <p className="mt-3 text-lg text-ink-2">
          Aquí ves cómo van tus entradas y registras cada venta escaneando el QR de la entrada que entregas.
        </p>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="¿Quién eres?">
        <Choice
          name="Tipo de vendedor"
          value={type}
          onChange={(v) => {
            setType(v);
            setId('');
          }}
          className="sm:grid-cols-3"
          options={[
            { value: 'seminarista', label: 'Seminarista' },
            { value: 'padre_jorge', label: 'Padre Jorge' },
            { value: 'parroquia', label: 'Parroquia' },
          ]}
        />
      </Field>
      {type === 'seminarista' && (
        <Field label="Tu nombre" htmlFor="seminarista">
          <select
            id="seminarista"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="h-12 w-full rounded-xl border-2 border-line bg-card px-3 text-base focus:border-ink focus:outline-none"
          >
            <option value="">Selecciona tu nombre</option>
            {stages.map((stage) => (
              <optgroup key={stage} label={stage}>
                {lista!.seminaristas
                  .filter((s) => s.stage === stage)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Field>
      )}
      {type === 'parroquia' && (
        <Field label="Parroquia" htmlFor="parroquia">
          {lista && lista.parroquias.length === 0 ? (
            <Notice tone="warn">Todavía no hay parroquias con entradas asignadas. Pídele a administración que te registre.</Notice>
          ) : (
            <select
              id="parroquia"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="h-12 w-full rounded-xl border-2 border-line bg-card px-3 text-base focus:border-ink focus:outline-none"
            >
              <option value="">Selecciona la parroquia</option>
              {lista?.parroquias.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}
      <Button type="submit" size="lg" disabled={!type || (type !== 'padre_jorge' && !id)}>
        Entrar
      </Button>
    </form>
  );
}

// ---------- panel del vendedor ----------

function Panel({ seller, onExit }: { seller: Seller; onExit: () => void }) {
  const [lote, setLote] = useState<LoteItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selling, setSelling] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/vendedores/lote?type=${seller.type}&id=${encodeURIComponent(seller.id)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setLote(data.lote);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar tu lote.');
    }
  }, [seller]);

  useAutoLoad(load);

  if (selling) {
    return (
      <RegistrarVenta
        seller={seller}
        onClose={() => {
          setSelling(false);
          load();
        }}
      />
    );
  }

  const vendidas = lote?.filter((e) => e.status === 'activa' || e.status === 'por_verificar').length ?? 0;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-ink-3">
            {seller.type === 'seminarista' ? 'Seminarista' : seller.type === 'parroquia' ? 'Parroquia' : 'Sacerdote'}
          </p>
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">{seller.name}</h1>
        </div>
        <button type="button" onClick={onExit} className="font-bold text-ink-2 underline underline-offset-4">
          No soy yo
        </button>
      </div>

      <Button size="lg" onClick={() => setSelling(true)} className="w-full sm:w-auto">
        <ScanLine className="h-5 w-5" aria-hidden />
        Registrar una venta
      </Button>

      {error && <Notice tone="error">{error}</Notice>}
      {!lote && !error && <Spinner label="Cargando tus entradas…" />}
      {lote && (
        <section>
          <h2 className="font-display text-2xl">Tus entradas</h2>
          {lote.length === 0 ? (
            <Notice className="mt-3" tone="info">
              Todavía no tienes entradas asignadas. Administración te las asigna por número.
            </Notice>
          ) : (
            <>
              <p className="tabular mt-1 text-ink-2">
                {vendidas} de {lote.length} vendidas
              </p>
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
                {lote.map((e) => (
                  <li key={e.number} className="flex items-center gap-4 px-4 py-3">
                    <span className="tabular w-14 font-display text-xl">{formatNumber(e.number)}</span>
                    <div className="min-w-0 flex-1">
                      <StatusPill status={e.status} />
                      {(e.buyer || e.tableId) && (
                        <p className="mt-0.5 truncate text-sm text-ink-2">
                          {e.buyer}
                          {e.buyer && e.tableId ? ' · ' : ''}
                          {e.tableId ? `Mesa ${e.tableId}` : ''}
                          {e.checkedIn ? ' · Ya entró' : ''}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}

// ---------- registrar venta ----------

interface EntradaData {
  entrada: TicketView;
  pago: PagoInfo;
}

function RegistrarVenta({ seller, onClose }: { seller: Seller; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [manual, setManual] = useState('');
  const [data, setData] = useState<EntradaData | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [done, setDone] = useState<TicketView | null>(null);

  const lookup = async (raw: string) => {
    const match = raw.toUpperCase().replace(/\s+/g, '').match(CODE_RE);
    if (!match) {
      setLookupError('Ese no es el QR de una entrada del Parrandón.');
      return;
    }
    setLookupError(null);
    try {
      const res = await fetch(`/api/entradas/${match[0]}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setCode(match[0]);
      setData({ entrada: json.entrada, pago: json.pago });
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'No se encontró la entrada.');
    }
  };

  if (done) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-verde p-6 text-paper">
          <CheckCircle2 className="h-9 w-9 text-oro" aria-hidden />
          <p className="mt-2 font-display text-3xl">Venta registrada</p>
          <p className="mt-1 text-paper/85">
            Entrada N.º {formatNumber(done.number)} a nombre de {done.attendeeName}. El pago queda en verificación.
            {done.tableId
              ? ` Mesa ${done.tableId} apartada.`
              : ' El comprador puede escanear su QR para escoger la mesa.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setDone(null);
              setData(null);
              setCode('');
            }}
          >
            Registrar otra venta
          </Button>
          <Button variant="outline" onClick={onClose}>
            Volver a mis entradas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 font-bold text-ink-2">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Mis entradas
      </button>
      <h1 className="font-display text-3xl sm:text-4xl">Registrar una venta</h1>
      {!data ? (
        <>
          <p className="text-lg text-ink-2">Escanea el QR de la entrada que vas a entregar.</p>
          <div className="max-w-sm">
            <CameraScanner autoStart onResult={lookup} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookup(manual);
            }}
            className="flex max-w-md flex-col gap-2 sm:flex-row"
          >
            <TextInput
              aria-label="Código de la entrada"
              placeholder="O escribe el código: P123-ABCD2345"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              autoCapitalize="characters"
            />
            <Button type="submit" variant="outline">
              Buscar
            </Button>
          </form>
          {lookupError && <Notice tone="error">{lookupError}</Notice>}
        </>
      ) : (
        <VentaForm
          code={code}
          data={data}
          seller={seller}
          onCancel={() => setData(null)}
          onDone={setDone}
        />
      )}
    </div>
  );
}

function VentaForm({
  code,
  data,
  seller,
  onCancel,
  onDone,
}: {
  code: string;
  data: EntradaData;
  seller: Seller;
  onCancel: () => void;
  onDone: (e: TicketView) => void;
}) {
  const { entrada, pago } = data;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<'pago_movil' | 'zelle' | null>(null);
  const [reference, setReference] = useState('');
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [withTable, setWithTable] = useState(false);
  const [tableId, setTableId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const otherLot = entrada.holderName && !(entrada.holderType === seller.type && entrada.holderName === seller.name);

  if (entrada.status !== 'sin_vender') {
    return (
      <div className="space-y-4">
        <p className="tabular font-display text-3xl">Entrada N.º {formatNumber(entrada.number)}</p>
        <Notice tone={entrada.status === 'anulada' ? 'error' : 'warn'}>
          {entrada.status === 'anulada'
            ? 'Esta entrada está anulada. No la entregues.'
            : `Esta entrada ya tiene un pago reportado${entrada.attendeeName ? ` a nombre de ${entrada.attendeeName}` : ''}.`}
        </Notice>
        <Button variant="outline" onClick={onCancel}>
          Escanear otra
        </Button>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch('/api/vendedores/reportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name,
          phone,
          method,
          reference,
          proofUrl,
          tableId: withTable ? tableId : null,
          sellerName: seller.name,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onDone(json.entrada);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la venta.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="tabular font-display text-3xl">Entrada N.º {formatNumber(entrada.number)}</p>
        <button type="button" onClick={onCancel} className="font-bold text-ink-2 underline underline-offset-4">
          Otra entrada
        </button>
      </div>
      {otherLot && (
        <Notice tone="warn">
          Esta entrada es del lote de {entrada.holderName}. Puedes registrarla igual; quedará anotado que la vendiste tú.
        </Notice>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del comprador" htmlFor="v-nombre">
          <TextInput id="v-nombre" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Teléfono del comprador" htmlFor="v-tel">
          <TextInput id="v-tel" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0414-1234567" />
        </Field>
      </div>
      <Field label="¿Cómo pagó?">
        <Choice
          name="Método de pago"
          value={method}
          onChange={setMethod}
          className="grid-cols-2"
          options={[
            { value: 'pago_movil', label: 'Pago Móvil', detail: formatBs(montoBs(pago)) },
            { value: 'zelle', label: 'Zelle', detail: `$${pago.priceUsd.toFixed(2)}` },
          ]}
        />
      </Field>
      {method && <PaymentDetails method={method} pago={pago} />}
      <Field label="Número de referencia" htmlFor="v-ref">
        <TextInput id="v-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
      </Field>
      <div>
        <p className="mb-1.5 text-[0.95rem] font-bold">Capture del pago</p>
        <ProofUpload value={proofUrl} onChange={setProofUrl} tag={`venta-${entrada.number}`} />
      </div>
      <div>
        <label className="flex items-center gap-3 font-bold">
          <input
            type="checkbox"
            checked={withTable}
            onChange={(e) => setWithTable(e.target.checked)}
            className="h-5 w-5 accent-[var(--color-rojo)]"
          />
          Escoger la mesa ahora con el comprador
        </label>
        <p className="mt-1 text-sm text-ink-3">Si no, el comprador la escoge al escanear el QR de su entrada.</p>
        {withTable && <MesaPicker className="mt-4" value={tableId} onChange={setTableId} hideConfirm />}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" size="lg" loading={sending} className="w-full">
        Registrar venta
      </Button>
    </form>
  );
}
