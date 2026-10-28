'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Notice, Spinner, TextInput } from '@/components/ui';
import { api, fechaCorta, PageTitle, patchEntrada } from '@/components/admin/api';
import { formatBs } from '@/components/pago/PaymentDetails';
import { METODO_LABEL, type Entrada } from '@/lib/entradas/types';
import { formatNumber } from '@/lib/site';
import { cn } from '@/lib/utils';

const MOTIVOS = ['No aparece el pago en la cuenta.', 'El monto está incompleto.', 'La referencia no coincide.'];
const POR: Record<string, string> = {
  comprador: 'el comprador',
  vendedor: 'el vendedor',
  puerta: 'la puerta',
  taquilla: 'la taquilla',
  admin: 'administración',
};

export default function Verificaciones() {
  const [entradas, setEntradas] = useState<Entrada[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'pendientes' | 'puerta'>(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'puerta' ? 'puerta' : 'pendientes'
  );

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

  const pendientes = (entradas || [])
    .filter((e) => e.status === 'por_verificar')
    .sort((a, b) => (a.reportedAt || '').localeCompare(b.reportedAt || ''));
  const puerta = pendientes.filter((e) => e.doorActivated);
  const lista = tab === 'puerta' ? puerta : pendientes;

  return (
    <div className="max-w-4xl">
      <PageTitle title="Verificar pagos" />
      <div role="tablist" className="mb-6 inline-flex rounded-xl bg-paper-2 p-1">
        {(
          [
            ['pendientes', `Por verificar (${pendientes.length})`],
            ['puerta', `Activadas en puerta (${puerta.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn('h-10 rounded-lg px-4 font-bold', tab === key ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink')}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {!entradas && !error && <Spinner />}
      {entradas && lista.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-line p-8 text-center text-lg text-ink-2">
          {tab === 'puerta'
            ? 'No hay entradas activadas en la puerta por revisar.'
            : 'No hay pagos esperando verificación. Cuando alguien reporte un pago, aparece aquí.'}
        </p>
      )}
      <ul className="space-y-4">
        {lista.map((e) => (
          <PagoCard key={e.code} entrada={e} onDone={load} />
        ))}
      </ul>
    </div>
  );
}

function PagoCard({ entrada, onDone }: { entrada: Entrada; onDone: () => void }) {
  const [proof, setProof] = useState<string | null>(entrada.paymentProofUrl === 'embedded' ? null : entrada.paymentProofUrl);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (entrada.paymentProofUrl !== 'embedded') return;
    api<{ entrada: Entrada }>(`/api/admin/entradas/${encodeURIComponent(entrada.code)}`)
      .then((d) => setProof(d.entrada.paymentProofUrl))
      .catch(() => setProof(null));
  }, [entrada]);

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action);
    setError(null);
    try {
      await patchEntrada(entrada.code, { action, ...extra });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar.');
      setBusy(null);
    }
  };

  const monto =
    entrada.amount == null ? '—' : entrada.currency === 'VES' ? formatBs(entrada.amount) : `$${entrada.amount.toFixed(2)}`;

  return (
    <li className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_9rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <p className="tabular font-display text-2xl">N.º {formatNumber(entrada.number)}</p>
            <p className="text-lg font-bold">{entrada.attendeeName}</p>
          </div>
          <p className="text-ink-2">
            {entrada.attendeePhone || 'Sin teléfono'} · Mesa {entrada.tableId || 'sin escoger'}
            {entrada.checkedInAt ? ' · ya entró' : ''}
          </p>
          <dl className="tabular mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-ink-3">Método</dt>
              <dd className="font-bold">{entrada.paymentMethod ? METODO_LABEL[entrada.paymentMethod] : '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-3">Monto</dt>
              <dd className="font-bold">{monto}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-3">Referencia</dt>
              <dd className="break-all font-bold">{entrada.paymentReference || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-3">Reportó</dt>
              <dd className="font-bold">{entrada.reportedBy ? POR[entrada.reportedBy] : '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-3">Cuándo</dt>
              <dd className="font-bold">{fechaCorta(entrada.reportedAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-3">Lote</dt>
              <dd className="font-bold">{entrada.holderName || 'Sin asignar'}</dd>
            </div>
          </dl>
          {entrada.notes && <p className="mt-3 text-sm text-ink-2">Nota: {entrada.notes}</p>}
        </div>
        <div>
          {proof ? (
            <button type="button" onClick={() => setZoom(true)} className="block w-full overflow-hidden rounded-xl bg-paper-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proof} alt={`Capture del pago de la entrada ${entrada.number}`} className="h-40 w-full object-cover" />
              <span className="block py-1 text-center text-sm font-bold text-ink-2">Ver capture</span>
            </button>
          ) : (
            <p className="grid h-40 place-items-center rounded-xl bg-paper-2 p-3 text-center text-sm text-ink-3">
              {entrada.paymentProofUrl ? 'Cargando capture…' : 'Sin capture'}
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-line bg-paper-2/50 p-4">
        {error && <Notice tone="error" className="mb-3">{error}</Notice>}
        {rejecting ? (
          <div className="space-y-3">
            <p className="font-bold">¿Por qué se rechaza? La persona lo verá al escanear su entrada.</p>
            <div className="flex flex-wrap gap-2">
              {MOTIVOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setReason(m)}
                  className={cn('rounded-full border-2 px-3 py-1 text-sm font-bold', reason === m ? 'border-ink bg-ink text-paper' : 'border-line')}
                >
                  {m}
                </button>
              ))}
            </div>
            <TextInput aria-label="Motivo del rechazo" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Otro motivo" />
            <div className="flex gap-2">
              <Button variant="primary" loading={busy === 'rechazar'} disabled={!reason.trim()} onClick={() => act('rechazar', { reason })}>
                Rechazar y liberar la mesa
              </Button>
              <Button variant="quiet" onClick={() => setRejecting(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="verde" loading={busy === 'aprobar'} onClick={() => act('aprobar')}>
              Pago recibido: activar
            </Button>
            <Button variant="outline" onClick={() => setRejecting(true)} disabled={Boolean(entrada.checkedInAt)}>
              No encuentro el pago
            </Button>
            {entrada.doorActivated && (
              <Button variant="quiet" loading={busy === 'revisada_puerta'} onClick={() => act('revisada_puerta')}>
                Marcar revisada
              </Button>
            )}
          </div>
        )}
      </div>
      {zoom && proof && (
        <CaptureDialog src={proof} alt={`Capture del pago de la entrada ${entrada.number}`} onClose={() => setZoom(false)} />
      )}
    </li>
  );
}

// Diálogo nativo: atrapa el foco, se cierra con Escape y devuelve el foco al botón.
function CaptureDialog({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    // Al desmontarse, el diálogo sale del DOM y se cierra solo; no hace falta cerrarlo aquí.
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label="Capture del pago"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto max-h-[92vh] max-w-[92vw] rounded-2xl bg-card p-3 backdrop:bg-noche/85"
    >
      <div className="mb-2 flex justify-end">
        <Button size="sm" variant="quiet" onClick={onClose} autoFocus>
          Cerrar
        </Button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-h-[80vh] max-w-full rounded-xl" />
    </dialog>
  );
}
