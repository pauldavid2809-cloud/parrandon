'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, LogOut, OctagonX, TriangleAlert } from 'lucide-react';
import CameraScanner from '@/components/CameraScanner';
import MesaPicker from '@/components/mesas/MesaPicker';
import PersonaFields, { PERSONA_VACIA, type Persona } from '@/components/PersonaFields';
import { erroresPersona, formatCedula } from '@/lib/persona';
import { Button, Choice, Field, Notice, TextInput } from '@/components/ui';
import { logout } from '@/components/staff/StaffGate';
import type { StaffView } from '@/lib/entradas/staff-view';
import type { MetodoPago } from '@/lib/entradas/types';
import { formatNumber } from '@/lib/site';
import { cn } from '@/lib/utils';

type ScanState = 'adelante' | 'ya_ingreso' | 'por_verificar' | 'sin_mesa' | 'sin_activar' | 'anulada' | 'no_existe';
interface Result {
  state: ScanState;
  entrada?: StaffView;
}
interface Resumen {
  ingresaron: number;
  esperados: number;
  recientes: { number: number; name: string | null; tableId: string | null; at: string; doorActivated: boolean }[];
}

function hora(iso: string | null | undefined) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-VE', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Caracas' }).format(
    new Date(iso)
  );
}

// Tono corto para confirmar sin mirar la pantalla: agudo = pasa, grave = revisar.
function beep(ok: boolean) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = ok ? 880 : 220;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (ok ? 0.18 : 0.45));
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.2 : 0.5));
  } catch {
    // sin audio
  }
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json;
}

export default function PuertaClient() {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadResumen = useCallback(async () => {
    try {
      const res = await fetch('/api/puerta/resumen', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setResumen(json);
    } catch {
      // se reintenta en el próximo ciclo
    }
  }, []);

  useAutoLoad(loadResumen, 8000);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setResult(null);
    setError(null);
  }, []);

  const show = useCallback(
    (r: Result) => {
      setResult(r);
      beep(r.state === 'adelante');
      if (timer.current) clearTimeout(timer.current);
      if (r.state === 'adelante') timer.current = setTimeout(clear, 7000);
      loadResumen();
    },
    [clear, loadResumen]
  );

  const scan = useCallback(
    async (input: string) => {
      if (busy) return;
      setBusy(true);
      setError(null);
      try {
        const json = await post('/api/puerta/escanear', { input });
        show({ state: json.state, entrada: json.entrada });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo leer la entrada.');
      } finally {
        setBusy(false);
      }
    },
    [busy, show]
  );

  const act = async (url: string, body: unknown) => {
    setBusy(true);
    setError(null);
    try {
      const json = await post(url, body);
      show({ state: json.state, entrada: json.entrada });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-noche text-paper">
      <header className="flex items-center justify-between gap-3 border-b border-noche-3 px-4 py-3">
        <div>
          <p className="font-display text-2xl leading-none">Puerta</p>
          {resumen && (
            <p className="tabular mt-1 text-sm text-paper/75">
              <strong className="text-paper">{resumen.ingresaron}</strong> adentro de {resumen.esperados} con entrada
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-paper/75 hover:bg-noche-2"
        >
          <LogOut className="h-4 w-4" aria-hidden /> Salir
        </button>
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-5 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className={cn(result && 'hidden')}>
            <CameraScanner tone="noche" autoStart paused={Boolean(result) || busy} onResult={scan} />
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (manual.trim()) scan(manual.trim());
                setManual('');
              }}
              className="mt-4 flex gap-2"
            >
              <label htmlFor="manual" className="sr-only">
                Número o código de la entrada
              </label>
              <input
                id="manual"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="N.º de entrada o código"
                inputMode="text"
                autoCapitalize="characters"
                className="tabular h-14 min-w-0 flex-1 rounded-xl border-2 border-noche-3 bg-noche-2 px-4 text-lg text-paper placeholder:text-paper/50 focus:border-oro focus:outline-none"
              />
              <Button type="submit" variant="cream" size="lg" loading={busy}>
                Buscar
              </Button>
            </form>
            {error && !result && (
              <Notice tone="error" className="mt-3">
                {error}
              </Notice>
            )}
          </div>

          {result && (
            <ResultPanel result={result} busy={busy} error={error} onNext={clear} onAct={act} />
          )}
        </div>

        <aside>
          <h2 className="font-display text-xl">Últimos en entrar</h2>
          {resumen && resumen.recientes.length === 0 && <p className="mt-2 text-paper/70">Todavía no ha entrado nadie.</p>}
          <ul className="mt-3 divide-y divide-noche-3">
            {resumen?.recientes.map((r) => (
              <li key={`${r.number}-${r.at}`} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-bold">{r.name || `Entrada ${formatNumber(r.number)}`}</p>
                  <p className="tabular text-sm text-paper/65">
                    N.º {formatNumber(r.number)} · {hora(r.at)}
                    {r.doorActivated ? ' · activada aquí' : ''}
                  </p>
                </div>
                <span className="font-display text-2xl text-oro">{r.tableId}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function ResultPanel({
  result,
  busy,
  error,
  onNext,
  onAct,
}: {
  result: Result;
  busy: boolean;
  error: string | null;
  onNext: () => void;
  onAct: (url: string, body: unknown) => void;
}) {
  const e = result.entrada;
  const head = e ? `Entrada N.º ${formatNumber(e.number)}` : '';
  const ci = e?.attendeeCedula ? ` · C.I. ${formatCedula(e.attendeeCedula)}` : '';

  if (result.state === 'adelante' && e) {
    return (
      <Panel tone="verde" icon={<CheckCircle2 className="h-12 w-12 text-oro" aria-hidden />} title="Adelante">
        <p className="text-xl font-bold">{e.attendeeName}</p>
        <p className="tabular text-paper/80">
          {head}
          {ci}
        </p>
        <p className="mt-6 text-paper/80">Su mesa</p>
        <p className="font-display text-[5.5rem] leading-none">{e.tableId}</p>
        <p className="text-lg text-paper/85">Sector {e.tableId?.[0]}</p>
        {e.status === 'por_verificar' && <p className="mt-4 text-paper/85">Pago pendiente de verificación (queda anotado).</p>}
        <Next onNext={onNext} label="Escanear siguiente" />
      </Panel>
    );
  }

  if (result.state === 'ya_ingreso' && e) {
    return (
      <Panel tone="rojo" icon={<OctagonX className="h-12 w-12" aria-hidden />} title="Esta entrada ya entró">
        <p className="text-xl font-bold">Entró a las {hora(e.checkedInAt)}</p>
        <p className="mt-1 text-paper/85">
          {e.attendeeName} · {head}
          {ci} · Mesa {e.tableId}
        </p>
        <p className="mt-4 text-paper/85">Si la persona dice que es suya, pide ayuda a administración.</p>
        <Next onNext={onNext} label="Entendido" />
      </Panel>
    );
  }

  if (result.state === 'anulada' || result.state === 'no_existe') {
    return (
      <Panel tone="rojo" icon={<OctagonX className="h-12 w-12" aria-hidden />} title={result.state === 'anulada' ? 'Entrada anulada' : 'Código no válido'}>
        <p className="text-lg text-paper/90">
          {result.state === 'anulada'
            ? `${head}. No dejar pasar; enviar a taquilla.`
            : 'Esta no es una entrada del Parrandón. No dejar pasar; enviar a taquilla.'}
        </p>
        <Next onNext={onNext} label="Entendido" />
      </Panel>
    );
  }

  if (result.state === 'por_verificar' && e) {
    return (
      <Panel tone="oro" icon={<TriangleAlert className="h-12 w-12" aria-hidden />} title="Pago por verificar">
        <p className="text-xl font-bold">{e.attendeeName}</p>
        <p className="tabular">
          {head}
          {ci} · Mesa {e.tableId}
        </p>
        <p className="mt-3">
          Reportó el pago {e.reportedBy === 'vendedor' ? 'su vendedor' : e.reportedBy === 'puerta' ? 'en la puerta' : 'la persona'}
          {e.paymentReference ? ` (ref. ${e.paymentReference})` : ''} y aún no se ha verificado.
        </p>
        {error && <Notice tone="error" className="mt-3">{error}</Notice>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button size="lg" variant="verde" loading={busy} onClick={() => onAct('/api/puerta/ingresar', { code: e.code })}>
            Dejar pasar
          </Button>
          <Button size="lg" variant="outline" onClick={onNext}>
            No dejar pasar
          </Button>
        </div>
      </Panel>
    );
  }

  if (result.state === 'sin_mesa' && e) {
    return (
      <div className="flash-in rounded-2xl bg-noche-2 p-5">
        <p className="font-display text-3xl">Falta escoger la mesa</p>
        <p className="mt-1 text-paper/80">
          {e.attendeeName} · {head}. Escojan juntos dónde se va a sentar.
        </p>
        <MesaPicker
          className="mt-4"
          tone="noche"
          onConfirm={(tableId) => onAct('/api/puerta/mesa', { code: e.code, tableId })}
          confirmLabel={(id) => `Sentarle en la ${id} y dejar pasar`}
          busy={busy}
          error={error}
        />
        <button type="button" onClick={onNext} className="mt-4 font-bold text-paper/75 underline underline-offset-4">
          Cancelar
        </button>
      </div>
    );
  }

  if (result.state === 'sin_activar' && e) {
    return <ActivarAqui entrada={e} busy={busy} error={error} onAct={onAct} onCancel={onNext} />;
  }

  return null;
}

function Panel({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'verde' | 'rojo' | 'oro';
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        'flash-in rounded-2xl p-6 sm:p-8',
        tone === 'verde' && 'bg-verde text-paper',
        tone === 'rojo' && 'bg-rojo text-paper',
        tone === 'oro' && 'bg-oro text-ink'
      )}
    >
      {icon}
      <p className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Next({ onNext, label }: { onNext: () => void; label: string }) {
  return (
    <Button size="lg" variant="cream" onClick={onNext} className="mt-8 w-full">
      {label}
    </Button>
  );
}

function ActivarAqui({
  entrada,
  busy,
  error,
  onAct,
  onCancel,
}: {
  entrada: StaffView;
  busy: boolean;
  error: string | null;
  onAct: (url: string, body: unknown) => void;
  onCancel: () => void;
}) {
  const [persona, setPersona] = useState<Persona>(PERSONA_VACIA);
  const [errors, setErrors] = useState<ReturnType<typeof erroresPersona>>({});
  const [method, setMethod] = useState<MetodoPago | null>(null);
  const [reference, setReference] = useState('');
  const [soldBy, setSoldBy] = useState(entrada.holderName || '');
  const [tableId, setTableId] = useState<string | null>(null);

  const ready = method && tableId;
  const activar = () => {
    const faltan = erroresPersona(persona, { cedula: true, phone: false });
    setErrors(faltan);
    if (Object.keys(faltan).length) {
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onAct('/api/puerta/activar', { code: entrada.code, ...persona, method, reference, soldBy, tableId });
  };
  return (
    <div className="flash-in rounded-2xl bg-card p-5 text-ink sm:p-6">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-1 h-8 w-8 shrink-0 text-oro-ink" aria-hidden />
        <div>
          <p className="font-display text-3xl leading-tight">Entrada sin activar</p>
          <p className="tabular mt-1 text-ink-2">
            N.º {formatNumber(entrada.number)}
            {entrada.holderName ? ` · del lote de ${entrada.holderName}` : ''}
          </p>
        </div>
      </div>
      {entrada.rejectionReason && (
        <Notice tone="error" className="mt-4" title="Su pago anterior fue rechazado">
          {entrada.rejectionReason}
        </Notice>
      )}
      <p className="mt-4 text-ink-2">Anota quién es y cómo pagó, escojan la mesa y déjale pasar. Administración lo revisará.</p>
      <div className="mt-5">
        <PersonaFields id="p" value={persona} onChange={setPersona} errors={errors} phone="optional" />
      </div>
      <Field label="¿Cómo pagó?" className="mt-4">
        <Choice
          name="Método de pago"
          value={method}
          onChange={setMethod}
          className="grid-cols-3"
          options={[
            { value: 'pago_movil', label: 'Pago Móvil' },
            { value: 'zelle', label: 'Zelle' },
            { value: 'efectivo_usd', label: 'Efectivo $' },
          ]}
        />
      </Field>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Referencia (si la tiene)" htmlFor="p-ref">
          <TextInput id="p-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
        <Field label="¿A quién se la compró?" htmlFor="p-vendedor">
          <TextInput id="p-vendedor" value={soldBy} onChange={(e) => setSoldBy(e.target.value)} />
        </Field>
      </div>
      <div className="mt-6">
        <p className="mb-2 font-bold">¿Dónde se va a sentar?</p>
        <MesaPicker value={tableId} onChange={setTableId} hideConfirm />
      </div>
      {error && (
        <Notice tone="error" className="mt-4">
          {error}
        </Notice>
      )}
      <div className="sticky bottom-0 -mx-5 mt-6 flex flex-col gap-2 rounded-b-2xl border-t border-line bg-card px-5 py-3 sm:-mx-6 sm:flex-row sm:px-6">
        <Button
          size="lg"
          variant="verde"
          className="flex-1"
          disabled={!ready}
          loading={busy}
          onClick={activar}
        >
          {tableId ? `Activar y sentarle en la ${tableId}` : 'Activar y dejar pasar'}
        </Button>
        <Button size="lg" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
