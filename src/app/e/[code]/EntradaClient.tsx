'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button, Choice, Field, Notice, Spinner, StatusPill, TextInput } from '@/components/ui';
import MesaPicker from '@/components/mesas/MesaPicker';
import PaymentDetails, { formatBs, montoBs, type PagoInfo } from '@/components/pago/PaymentDetails';
import ProofUpload from '@/components/pago/ProofUpload';
import PersonaFields, { PERSONA_VACIA, type Persona } from '@/components/PersonaFields';
import { erroresPersona } from '@/lib/persona';
import type { TicketView } from '@/lib/entradas/service';
import { formatNumber } from '@/lib/site';
import { cn } from '@/lib/utils';

export interface Data {
  entrada: TicketView;
  rules: { canChangeTable: boolean; isEventDay: boolean; eventDateIso: string };
  pago: PagoInfo;
}

const noop = () => {};

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Fecha en hora de Venezuela (UTC−4, sin horario de verano). Se arma a mano para que el
// servidor y el teléfono escriban exactamente el mismo texto.
function fecha(iso: string | null) {
  if (!iso) return '';
  const d = new Date(Date.parse(iso) - 4 * 3600 * 1000);
  const h = d.getUTCHours();
  const hora = `${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`;
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}, ${hora}`;
}

// Cierra la oración sin duplicar el punto de "a. m." / "p. m.".
function punto(text: string) {
  return text.endsWith('.') ? text : `${text}.`;
}

// `initial` llega desde el servidor: la página aparece completa, sin pantalla de carga.
export default function EntradaClient({
  code,
  initial,
}: {
  code: string;
  initial?: { data: Data | null; notFound: boolean };
}) {
  const [data, setData] = useState<Data | null>(initial?.data ?? null);
  const [notFound, setNotFound] = useState(initial?.notFound ?? false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Mesa recién apartada en el paso 2, para confirmar que terminó.
  const [recienApartada, setRecienApartada] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/entradas/${encodeURIComponent(code)}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!json.success) throw new Error(json.error);
      setData(json);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudo cargar tu entrada.');
    }
  }, [code]);

  useAutoLoad(initial ? noop : load);

  if (notFound) {
    return (
      <Shell>
        <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-soft)]">
          <XCircle className="h-10 w-10 text-rojo" aria-hidden />
          <h1 className="mt-3 font-display text-3xl">Este código no es de una entrada del Parrandón</h1>
          <p className="mt-2 text-ink-2">
            Revisa que hayas escaneado el QR de tu entrada de papel o que el código esté bien escrito.
          </p>
          <Link href="/activar" className="mt-5 inline-flex h-12 items-center rounded-xl bg-rojo px-5 font-bold text-paper hover:bg-rojo-2">
            Intentar de nuevo
          </Link>
        </div>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        {loadError ? (
          <Notice tone="error" title="No pudimos abrir tu entrada">
            <p>{loadError}</p>
            <button type="button" onClick={load} className="mt-2 font-bold underline underline-offset-4">
              Intentar de nuevo
            </button>
          </Notice>
        ) : (
          <Spinner label="Abriendo tu entrada…" />
        )}
      </Shell>
    );
  }

  const { entrada } = data;
  const reportada = entrada.status === 'por_verificar' || entrada.status === 'activa';
  // Paso 2: con el pago ya reportado, falta la mesa.
  const faltaMesa = reportada && !entrada.tableId && !entrada.checkedInAt;
  return (
    <Shell>
      <header className="flex flex-col items-start gap-3">
        <div>
          <p className="font-bold text-ink-3">Parrandón Navideño 2026</p>
          <h1 className="tabular font-display text-4xl leading-none sm:text-5xl">Entrada N.º {formatNumber(entrada.number)}</h1>
        </div>
        <StatusPill status={entrada.status} publicView className="text-base" />
      </header>
      {entrada.holderName && (
        <p className="mt-2 text-ink-2">
          Entregada por{' '}
          {entrada.holderType === 'seminarista'
            ? `el seminarista ${entrada.holderName}`
            : entrada.holderType === 'parroquia'
              ? `la ${entrada.holderName}`
              : entrada.holderType === 'taquilla'
                ? 'la taquilla'
                : entrada.holderName}
        </p>
      )}
      <div className="mt-8">
        {entrada.status === 'anulada' && (
          <Notice tone="error" title="Esta entrada fue anulada">
            Si crees que es un error, escríbenos por WhatsApp al 0412-0308674 con el número de tu entrada.
          </Notice>
        )}
        {entrada.status === 'sin_vender' && <ReportarPago data={data} code={code} onDone={setData} reload={load} />}
        {faltaMesa && (
          <EscogerMesa
            data={data}
            code={code}
            onDone={(d) => {
              setData(d);
              setRecienApartada(d.entrada.tableId);
            }}
          />
        )}
        {reportada && !faltaMesa && <EntradaReportada data={data} code={code} onChange={load} recienApartada={recienApartada} />}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grain flex-1">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">{children}</div>
    </div>
  );
}

// Dos pasos: 1) datos y pago, 2) mesa. La mesa se escoge con el pago ya reportado,
// así el pago queda registrado aunque la persona cierre la página antes de escogerla.
function Pasos({ actual }: { actual: 1 | 2 }) {
  const pasos = ['Tus datos y tu pago', 'Tu mesa'];
  return (
    <ol aria-label="Pasos para activar tu entrada" className="grid grid-cols-2 gap-2">
      {pasos.map((label, i) => {
        const n = i + 1;
        const hecho = n < actual;
        const ahora = n === actual;
        return (
          <li
            key={label}
            aria-current={ahora ? 'step' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl p-3',
              ahora ? 'bg-card shadow-[var(--shadow-soft)]' : 'bg-paper-2/60'
            )}
          >
            <span
              aria-hidden
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-lg',
                hecho ? 'bg-verde text-paper' : ahora ? 'bg-rojo text-paper' : 'border-2 border-line text-ink-3'
              )}
            >
              {hecho ? <Check className="h-5 w-5" strokeWidth={3} /> : n}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-sm text-ink-3">
                Paso {n}
                {hecho ? ' · listo' : ''}
              </span>
              <span className={cn('font-bold', ahora ? 'text-ink' : 'text-ink-2')}>{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- paso 1: datos y pago ----------

function ReportarPago({
  data,
  code,
  onDone,
  reload,
}: {
  data: Data;
  code: string;
  onDone: (d: Data) => void;
  reload: () => void;
}) {
  const { entrada, pago } = data;
  const [persona, setPersona] = useState<Persona>(PERSONA_VACIA);
  const [method, setMethod] = useState<'pago_movil' | 'zelle' | null>(null);
  const [reference, setReference] = useState('');
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const validate = () => {
    const e: Record<string, string> = { ...erroresPersona(persona, { cedula: true, phone: true }) };
    if (!method) e.method = 'Elige cómo pagaste.';
    if (reference.trim().length < 4) e.reference = 'Escribe el número de referencia (al menos 4 dígitos).';
    if (!proofUrl) e.proof = 'Sube el capture del pago.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) {
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/entradas/${encodeURIComponent(code)}/reportar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...persona, method, reference, proofUrl }),
      });
      const json = await res.json();
      if (!json.success) {
        if (json.reason === 'ya_reportada') reload();
        throw new Error(json.error);
      }
      onDone({ ...data, entrada: json.entrada });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo enviar. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-10">
      <div className="space-y-4">
        <Pasos actual={1} />
        {entrada.rejectionReason && (
          <Notice tone="error" title="Tu pago anterior no se pudo verificar">
            {entrada.rejectionReason} Revisa los datos y repórtalo de nuevo.
          </Notice>
        )}
        <p className="text-lg text-ink-2">
          Escribe tus datos y reporta tu pago de <strong className="text-ink">${pago.priceUsd}</strong> (
          {formatBs(montoBs(pago))} por Pago Móvil). Al enviarlo pasas a escoger tu mesa.
        </p>
      </div>

      <Seccion id="datos" title="¿Quién va a usar esta entrada?">
        <PersonaFields value={persona} onChange={setPersona} errors={errors} phoneHint="Por si hay que contactarte por el pago." />
      </Seccion>

      <Seccion id="pago" title="Tu pago">
        <div data-error={Boolean(errors.method)}>
          <Choice
            name="Método de pago"
            value={method}
            onChange={(v) => setMethod(v)}
            className="grid-cols-2"
            options={[
              { value: 'pago_movil', label: 'Pago Móvil', detail: formatBs(montoBs(pago)) },
              { value: 'zelle', label: 'Zelle', detail: `$${pago.priceUsd.toFixed(2)}` },
            ]}
          />
          {errors.method && <p className="mt-1.5 text-sm font-bold text-rojo">{errors.method}</p>}
        </div>
        {method && (
          <div className="mt-4 space-y-4">
            <PaymentDetails method={method} pago={pago} />
            <Field
              label="Número de referencia"
              htmlFor="referencia"
              error={errors.reference}
              hint={method === 'zelle' ? 'El número de confirmación que te dio Zelle.' : 'Los últimos dígitos de la referencia.'}
            >
              <TextInput
                id="referencia"
                inputMode={method === 'pago_movil' ? 'numeric' : 'text'}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                data-error={Boolean(errors.reference)}
              />
            </Field>
            <div data-error={Boolean(errors.proof)}>
              <p className="mb-1.5 text-[0.95rem] font-bold">Capture del pago</p>
              <ProofUpload value={proofUrl} onChange={setProofUrl} tag={`entrada-${entrada.number}`} error={errors.proof} />
            </div>
          </div>
        )}
      </Seccion>

      <div className="sticky bottom-3 z-20 space-y-2">
        {serverError && <Notice tone="error">{serverError}</Notice>}
        <Button type="submit" size="lg" loading={sending} className="w-full shadow-[var(--shadow-ticket)]">
          Enviar y escoger mi mesa
        </Button>
      </div>
    </form>
  );
}

function Seccion({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-4 font-display text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ---------- paso 2: mesa ----------

function EscogerMesa({ data, code, onDone }: { data: Data; code: string; onDone: (d: Data) => void }) {
  const { entrada, rules } = data;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmar = async (tableId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/entradas/${encodeURIComponent(code)}/mesa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onDone({ ...data, entrada: json.entrada });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo apartar la mesa.');
    } finally {
      setBusy(false);
    }
  };

  // Quien vuelve a escanear sin haber escogido mesa cae aquí directamente.
  const aviso =
    entrada.status === 'activa'
      ? { title: 'Tu entrada está activa', body: 'Tu pago ya fue verificado. Solo falta escoger tu mesa.' }
      : entrada.reportedBy === 'comprador'
        ? {
            title: 'Recibimos tus datos y tu pago',
            body: 'La organización lo verifica en estos días. Mientras tanto, escoge tu mesa: queda apartada a tu nombre.',
          }
        : {
            title: 'Tu pago ya está reportado',
            body: `${entrada.reportedBy === 'vendedor' ? 'Tu vendedor lo registró' : 'Quedó registrado'}${
              entrada.attendeeName ? ` a nombre de ${entrada.attendeeName}` : ''
            }. Solo falta escoger tu mesa.`,
          };

  return (
    <div className="space-y-8">
      <Pasos actual={2} />
      <Notice tone="ok" title={aviso.title}>
        {aviso.body}
      </Notice>
      <section aria-labelledby="escoger-mesa">
        <h2 id="escoger-mesa" className="font-display text-3xl">
          Escoge tu mesa
        </h2>
        <p className="mb-4 mt-1 text-ink-2">
          Si vienen en grupo, cada entrada escoge la misma mesa.
          {rules.canChangeTable ? ' La puedes cambiar hasta el día antes del evento.' : ''}
        </p>
        <MesaPicker onConfirm={confirmar} confirmLabel={(id) => `Apartar la mesa ${id}`} busy={busy} error={error} />
      </section>
    </div>
  );
}

// ---------- listo: pago reportado o entrada activa, con mesa ----------

function EntradaReportada({
  data,
  code,
  onChange,
  recienApartada,
}: {
  data: Data;
  code: string;
  onChange: () => void;
  recienApartada: string | null;
}) {
  const { entrada, rules } = data;
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmTable = async (tableId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/entradas/${encodeURIComponent(code)}/mesa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setChanging(false);
      onChange();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la mesa.');
    } finally {
      setBusy(false);
    }
  };

  const activa = entrada.status === 'activa';
  const canPick = !entrada.checkedInAt && (!entrada.tableId || rules.canChangeTable);

  return (
    <div className="space-y-8">
      {recienApartada && recienApartada === entrada.tableId && !entrada.checkedInAt && (
        <Notice tone="ok" title={`¡Listo! La mesa ${recienApartada} quedó apartada`}>
          Ya completaste los dos pasos. Guarda tu entrada de papel: esa noche la escanean en la puerta.
        </Notice>
      )}
      {entrada.checkedInAt ? (
        <div className="rounded-2xl bg-verde p-6 text-paper">
          <CheckCircle2 className="h-9 w-9 text-oro" aria-hidden />
          <p className="mt-2 font-display text-3xl">¡Ya estás en el Parrandón!</p>
          <p className="mt-1 text-paper/85">
            {punto(`Entraste el ${fecha(entrada.checkedInAt)}`)} Tu mesa es la {entrada.tableId}.
          </p>
        </div>
      ) : activa ? (
        <div className="rounded-2xl bg-verde p-6 text-paper">
          <CheckCircle2 className="h-9 w-9 text-oro" aria-hidden />
          <p className="mt-2 font-display text-3xl">Tu entrada está activa</p>
          <p className="mt-1 text-paper/85">
            Pago verificado. Esa noche muestra esta entrada de papel en la puerta y te indican tu mesa.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-oro-soft p-6">
          <Clock className="h-9 w-9 text-oro-ink" aria-hidden />
          <p className="mt-2 font-display text-3xl">Pago en verificación</p>
          <p className="mt-1 text-ink-2">
            {punto(
              `${entrada.reportedBy === 'vendedor' ? 'Tu vendedor reportó' : 'Reportaste'} el pago${
                entrada.reportedAt ? ` el ${fecha(entrada.reportedAt)}` : ''
              }`
            )}{' '}
            La organización lo revisa en estos días; vuelve a escanear tu QR para ver si ya está activa. Tu mesa queda
            apartada mientras tanto.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]" style={{ ['--perforation-bg' as string]: 'var(--color-paper)' }}>
        <dl className="grid grid-cols-2 gap-4 p-5 sm:p-6">
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-sm text-ink-3">A nombre de</dt>
            <dd className="text-lg font-bold">{entrada.attendeeName || 'Sin nombre todavía'}</dd>
            {entrada.attendeeCedula && <dd className="tabular text-ink-2">C.I. {entrada.attendeeCedula}</dd>}
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-sm text-ink-3">Pago</dt>
            <dd className="text-lg font-bold">
              {entrada.paymentMethod === 'zelle' ? 'Zelle' : entrada.paymentMethod === 'pago_movil' ? 'Pago Móvil' : 'Efectivo'}
              {entrada.paymentReference ? ` · Ref. ${entrada.paymentReference}` : ''}
            </dd>
          </div>
        </dl>
        <div className="perforation" aria-hidden />
        <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="text-sm text-ink-3">Tu mesa</p>
            <p className="font-display text-5xl leading-none">{entrada.tableId || '—'}</p>
            {entrada.tableId && <p className="mt-1 text-ink-2">Sector {entrada.tableId[0]}</p>}
          </div>
          {entrada.tableId && canPick && !changing && (
            <Button variant="outline" onClick={() => setChanging(true)}>
              Cambiar mesa
            </Button>
          )}
        </div>
      </div>

      {entrada.tableId && !rules.canChangeTable && !entrada.checkedInAt && (
        <p className="text-ink-2">Los cambios de mesa ya cerraron. Si necesitas ayuda, avísale al personal de la puerta.</p>
      )}

      {changing && canPick && (
        <section aria-labelledby="escoger-mesa">
          <h2 id="escoger-mesa" className="font-display text-2xl">
            {entrada.tableId ? 'Cambia tu mesa' : 'Escoge tu mesa'}
          </h2>
          <p className="mb-4 mt-1 text-ink-2">Si vienen en grupo, cada entrada escoge la misma mesa.</p>
          <MesaPicker
            mine={entrada.tableId}
            onConfirm={confirmTable}
            confirmLabel={(id) => (entrada.tableId ? `Cambiarme a la ${id}` : `Escoger la mesa ${id}`)}
            busy={busy}
            error={error}
          />
          {entrada.tableId && (
            <button type="button" onClick={() => setChanging(false)} className="mt-4 font-bold text-ink-2 underline underline-offset-4">
              Dejar mi mesa como está
            </button>
          )}
        </section>
      )}
    </div>
  );
}
