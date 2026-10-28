'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useState, type FormEvent } from 'react';
import { CheckCircle2, LogOut, Ticket } from 'lucide-react';
import CameraScanner from '@/components/CameraScanner';
import MesaPicker from '@/components/mesas/MesaPicker';
import ProofUpload from '@/components/pago/ProofUpload';
import { formatBs } from '@/components/pago/PaymentDetails';
import { Button, Choice, Field, Notice, TextInput } from '@/components/ui';
import { logout } from '@/components/staff/StaffGate';
import type { StaffView } from '@/lib/entradas/staff-view';
import type { MetodoPago } from '@/lib/entradas/types';
import { formatNumber } from '@/lib/site';

interface Resumen {
  ventas: {
    number: number;
    name: string | null;
    tableId: string | null;
    method: MetodoPago | null;
    amount: number | null;
    currency: 'USD' | 'VES' | null;
    at: string | null;
  }[];
  cantidad: number;
  totales: { zelle: number; pago_movil: number; efectivo_usd: number };
  disponiblesTaquilla: number;
}

interface Found {
  entrada: StaffView;
  priceUsd: number;
  rateBs: number;
}

const METODO: Record<MetodoPago, string> = { pago_movil: 'Pago Móvil', zelle: 'Zelle', efectivo_usd: 'Efectivo $' };

function money(amount: number | null, currency: string | null) {
  if (amount == null) return '';
  return currency === 'VES' ? formatBs(amount) : `$${amount.toFixed(2)}`;
}

export default function TaquillaClient() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [found, setFound] = useState<Found | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const [vendida, setVendida] = useState<StaffView | null>(null);

  const loadResumen = useCallback(async () => {
    try {
      const res = await fetch('/api/taquilla/resumen', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setResumen(json);
    } catch {
      // se reintenta luego
    }
  }, []);

  useAutoLoad(loadResumen);

  const buscar = async (input: string) => {
    setLookupError(null);
    try {
      const res = await fetch('/api/taquilla/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setFound(json);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'No se encontró la entrada.');
    }
  };

  const reset = () => {
    setFound(null);
    setVendida(null);
    setManual('');
    setLookupError(null);
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-rojo text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <p className="flex items-center gap-2 font-display text-2xl">
            <Ticket className="h-6 w-6" aria-hidden /> Taquilla
          </p>
          {resumen && (
            <p className="tabular text-sm text-paper/90">
              <strong>{resumen.cantidad}</strong> vendidas esta noche · quedan{' '}
              <strong>{resumen.disponiblesTaquilla}</strong> del lote de taquilla
            </p>
          )}
          <button
            type="button"
            onClick={logout}
            className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-paper/85 hover:bg-rojo-2"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Salir
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-6 lg:grid-cols-[1fr_20rem]">
        <main>
          {vendida ? (
            <div className="flash-in rounded-2xl bg-verde p-6 text-paper sm:p-8">
              <CheckCircle2 className="h-10 w-10 text-oro" aria-hidden />
              <p className="mt-2 font-display text-4xl">Venta lista</p>
              <p className="mt-1 text-lg">
                {vendida.attendeeName} · Entrada N.º {formatNumber(vendida.number)}
              </p>
              <p className="mt-6 text-paper/80">Su mesa</p>
              <p className="font-display text-[5rem] leading-none">{vendida.tableId}</p>
              <p className="mt-2 text-paper/85">
                {vendida.checkedInAt ? 'Ya quedó registrada su entrada: puede pasar.' : 'Debe pasar por la puerta con su entrada.'}
              </p>
              <Button variant="cream" size="lg" className="mt-8 w-full" onClick={reset}>
                Siguiente venta
              </Button>
            </div>
          ) : found ? (
            <VentaForm
              found={found}
              onCancel={reset}
              onDone={(e) => {
                setVendida(e);
                loadResumen();
              }}
            />
          ) : (
            <div>
              <h1 className="font-display text-3xl">Nueva venta</h1>
              <p className="mt-1 text-ink-2">Escanea la entrada de papel que vas a entregar, o escribe su número.</p>
              <div className="mt-5 max-w-sm">
                <CameraScanner autoStart onResult={buscar} />
              </div>
              <form
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  if (manual.trim()) buscar(manual.trim());
                }}
                className="mt-4 flex max-w-sm gap-2"
              >
                <TextInput
                  aria-label="Número de la entrada"
                  placeholder="N.º de entrada, ej. 421"
                  inputMode="numeric"
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                />
                <Button type="submit" variant="outline">
                  Buscar
                </Button>
              </form>
              {lookupError && (
                <Notice tone="error" className="mt-3 max-w-sm">
                  {lookupError}
                </Notice>
              )}
            </div>
          )}
        </main>

        <aside>
          <h2 className="font-display text-2xl">Caja de esta noche</h2>
          {resumen && (
            <>
              <dl className="tabular mt-3 divide-y divide-line rounded-2xl bg-card px-4 shadow-[var(--shadow-soft)]">
                <div className="flex justify-between py-2.5">
                  <dt>Efectivo $</dt>
                  <dd className="font-bold">${resumen.totales.efectivo_usd.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt>Zelle</dt>
                  <dd className="font-bold">${resumen.totales.zelle.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt>Pago Móvil</dt>
                  <dd className="font-bold">{formatBs(resumen.totales.pago_movil)}</dd>
                </div>
              </dl>
              <h3 className="mt-6 font-bold">Últimas ventas</h3>
              {resumen.ventas.length === 0 && <p className="mt-1 text-ink-2">Aún no hay ventas.</p>}
              <ul className="mt-2 divide-y divide-line">
                {resumen.ventas.map((v) => (
                  <li key={v.number} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{v.name}</p>
                      <p className="tabular text-sm text-ink-3">
                        N.º {formatNumber(v.number)} · {v.method ? METODO[v.method] : ''} {money(v.amount, v.currency)}
                      </p>
                    </div>
                    <span className="font-display text-xl text-rojo">{v.tableId}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function VentaForm({ found, onCancel, onDone }: { found: Found; onCancel: () => void; onDone: (e: StaffView) => void }) {
  const { entrada, priceUsd, rateBs } = found;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<MetodoPago | null>(null);
  const [reference, setReference] = useState('');
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [enterNow, setEnterNow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bs = Math.round(priceUsd * rateBs * 100) / 100;

  if (entrada.status !== 'sin_vender') {
    return (
      <div className="space-y-4">
        <p className="tabular font-display text-3xl">Entrada N.º {formatNumber(entrada.number)}</p>
        <Notice tone="error">
          Esta entrada ya {entrada.status === 'anulada' ? 'está anulada' : `fue vendida${entrada.attendeeName ? ` a ${entrada.attendeeName}` : ''}`}.
          Usa otra del lote de taquilla.
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
    setBusy(true);
    try {
      const res = await fetch('/api/taquilla/vender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: entrada.code, name, phone, method, reference, proofUrl, tableId, enterNow }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onDone(json.entrada);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la venta.');
    } finally {
      setBusy(false);
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
      {entrada.holderType !== 'taquilla' && (
        <Notice tone="warn">
          Esta entrada no es del lote de taquilla{entrada.holderName ? ` (es de ${entrada.holderName})` : ''}. Véndela solo si
          te la entregaron para eso.
        </Notice>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre de quien compra" htmlFor="t-nombre">
          <TextInput id="t-nombre" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Teléfono (opcional)" htmlFor="t-tel">
          <TextInput id="t-tel" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      <Field label="¿Cómo paga?">
        <Choice
          name="Método de pago"
          value={method}
          onChange={setMethod}
          className="sm:grid-cols-3"
          options={[
            { value: 'efectivo_usd', label: 'Efectivo $', detail: `$${priceUsd.toFixed(2)}` },
            { value: 'pago_movil', label: 'Pago Móvil', detail: formatBs(bs) },
            { value: 'zelle', label: 'Zelle', detail: `$${priceUsd.toFixed(2)}` },
          ]}
        />
      </Field>
      {method && method !== 'efectivo_usd' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Referencia" htmlFor="t-ref" hint="Confírmala en el teléfono de cobro antes de seguir.">
            <TextInput id="t-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
          </Field>
          <div>
            <p className="mb-1.5 text-[0.95rem] font-bold">Capture (opcional)</p>
            <ProofUpload value={proofUrl} onChange={setProofUrl} tag={`taquilla-${entrada.number}`} />
          </div>
        </div>
      )}
      <div>
        <p className="mb-2 font-bold">Mesa</p>
        <MesaPicker value={tableId} onChange={setTableId} hideConfirm />
      </div>
      <label className="flex items-center gap-3 font-bold">
        <input
          type="checkbox"
          checked={enterNow}
          onChange={(e) => setEnterNow(e.target.checked)}
          className="h-5 w-5 accent-[var(--color-rojo)]"
        />
        Registrar que entra ahora mismo
      </label>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="sticky bottom-0 -mx-4 border-t border-line bg-paper px-4 py-3">
        <Button type="submit" size="lg" loading={busy} disabled={!name.trim() || !method || !tableId} className="w-full">
          {tableId ? `Cobrar y sentar en la ${tableId}` : 'Cobrar y activar'}
        </Button>
      </div>
    </form>
  );
}
