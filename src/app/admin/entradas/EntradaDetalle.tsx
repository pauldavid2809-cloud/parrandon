'use client';

import { useState } from 'react';
import { ExternalLink, MessageCircle, X } from 'lucide-react';
import { Button, Choice, Field, Notice, StatusPill, TextInput } from '@/components/ui';
import MesaPicker from '@/components/mesas/MesaPicker';
import { fechaCorta, patchEntrada } from '@/components/admin/api';
import { formatBs } from '@/components/pago/PaymentDetails';
import { HOLDER_LABEL, METODO_LABEL, type Entrada, type MetodoPago } from '@/lib/entradas/types';
import { formatNumber, ticketUrl } from '@/lib/site';
import { cleanPhoneForWhatsApp } from '@/lib/utils';

type Panel = null | 'editar' | 'mesa' | 'pagada' | 'rechazar' | 'anular' | 'reiniciar';

export default function EntradaDetalle({
  entrada,
  onChange,
  onClose,
}: {
  entrada: Entrada;
  onChange: (e: Entrada) => void;
  onClose: () => void;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action);
    setError(null);
    try {
      const { entrada: updated } = await patchEntrada(entrada.code, { action, ...extra });
      onChange(updated);
      setPanel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar.');
    } finally {
      setBusy(null);
    }
  };

  const ocupa = entrada.status === 'activa' || entrada.status === 'por_verificar';
  const intacta =
    entrada.status === 'sin_vender' &&
    !entrada.attendeeName &&
    !entrada.tableId &&
    !entrada.checkedInAt &&
    !entrada.paymentReference &&
    !entrada.rejectionReason;
  const link = ticketUrl(entrada.code);
  const monto =
    entrada.amount == null ? null : entrada.currency === 'VES' ? formatBs(entrada.amount) : `$${entrada.amount.toFixed(2)}`;

  return (
    <div className="rounded-2xl bg-card shadow-[var(--shadow-ticket)]">
      <div className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="tabular font-display text-3xl">N.º {formatNumber(entrada.number)}</p>
          <p className="tabular text-sm text-ink-3">{entrada.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={entrada.status} />
          <button type="button" onClick={onClose} aria-label="Cerrar detalle" className="rounded-lg p-1.5 text-ink-2 hover:bg-paper-2">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line p-5 text-[0.95rem]">
        <Item label="Nombre" value={entrada.attendeeName} />
        <Item label="Teléfono" value={entrada.attendeePhone} />
        <Item label="Mesa" value={entrada.tableId} />
        <Item label="Lote" value={entrada.holderName ? `${entrada.holderName} (${HOLDER_LABEL[entrada.holderType]})` : 'Sin asignar'} />
        <Item label="Pago" value={entrada.paymentMethod ? `${METODO_LABEL[entrada.paymentMethod]}${monto ? ` · ${monto}` : ''}` : null} />
        <Item label="Referencia" value={entrada.paymentReference} />
        <Item label="Reportado" value={entrada.reportedAt ? `${fechaCorta(entrada.reportedAt)} por ${entrada.reportedBy}` : null} />
        <Item label="Verificado" value={entrada.verifiedAt ? `${fechaCorta(entrada.verifiedAt)} · ${entrada.verifiedBy}` : null} />
        <Item label="Ingresó" value={entrada.checkedInAt ? fechaCorta(entrada.checkedInAt) : null} />
        <Item label="Plato" value={entrada.mealServedAt ? `Servido ${fechaCorta(entrada.mealServedAt)}` : null} />
        {entrada.rejectionReason && <Item wide label="Último rechazo" value={entrada.rejectionReason} />}
        {entrada.notes && <Item wide label="Notas" value={entrada.notes} />}
        {entrada.paymentProofUrl && entrada.paymentProofUrl !== 'embedded' && (
          <div className="col-span-2">
            <a href={entrada.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">
              Ver capture del pago
            </a>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap gap-2 border-t border-line p-5">
        <a href={`/e/${entrada.code}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-ink-2 hover:bg-paper-2">
          <ExternalLink className="h-4 w-4" aria-hidden /> Abrir su página
        </a>
        {entrada.attendeePhone && (
          <a
            href={`https://wa.me/${cleanPhoneForWhatsApp(entrada.attendeePhone)}?text=${encodeURIComponent(
              `Hola ${entrada.attendeeName || ''}, esta es tu entrada N.º ${formatNumber(entrada.number)} del Parrandón Navideño 2026: ${link}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-ink-2 hover:bg-paper-2"
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> Escribirle por WhatsApp
          </a>
        )}
      </div>

      <div className="space-y-3 border-t border-line p-5">
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-wrap gap-2">
          {entrada.status === 'por_verificar' && (
            <>
              <Button size="sm" variant="verde" loading={busy === 'aprobar'} onClick={() => act('aprobar')}>
                Aprobar pago
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPanel('rechazar')}>
                Rechazar pago
              </Button>
            </>
          )}
          {entrada.status === 'sin_vender' && (
            <Button size="sm" variant="verde" onClick={() => setPanel('pagada')}>
              Registrar pago recibido
            </Button>
          )}
          {ocupa && (
            <Button size="sm" variant="outline" onClick={() => setPanel('mesa')}>
              {entrada.tableId ? 'Mover de mesa' : 'Asignar mesa'}
            </Button>
          )}
          {ocupa && entrada.tableId && !entrada.checkedInAt && (
            <Button size="sm" variant="quiet" loading={busy === 'quitar_mesa'} onClick={() => act('quitar_mesa')}>
              Quitar mesa
            </Button>
          )}
          {entrada.checkedInAt && (
            <Button size="sm" variant="quiet" loading={busy === 'deshacer_ingreso'} onClick={() => act('deshacer_ingreso')}>
              Deshacer ingreso
            </Button>
          )}
          <Button size="sm" variant="quiet" onClick={() => setPanel('editar')}>
            Editar datos
          </Button>
          {entrada.status === 'anulada' ? (
            <Button size="sm" variant="quiet" loading={busy === 'restaurar'} onClick={() => act('restaurar')}>
              Restaurar
            </Button>
          ) : (
            !entrada.checkedInAt && (
              <Button size="sm" variant="quiet" className="text-rojo" onClick={() => setPanel('anular')}>
                Anular entrada
              </Button>
            )
          )}
          {!intacta && (
            <Button size="sm" variant="quiet" className="text-rojo" onClick={() => setPanel('reiniciar')}>
              Reiniciar entrada
            </Button>
          )}
        </div>

        {panel === 'rechazar' && <Rechazar busy={busy === 'rechazar'} onSubmit={(reason) => act('rechazar', { reason })} onCancel={() => setPanel(null)} />}
        {panel === 'anular' && (
          <Rechazar
            label="¿Por qué se anula? (por ejemplo: entrada perdida o robada)"
            action="Anular entrada"
            busy={busy === 'anular'}
            onSubmit={(reason) => act('anular', { reason })}
            onCancel={() => setPanel(null)}
          />
        )}
        {panel === 'editar' && <Editar entrada={entrada} busy={busy === 'editar'} onSubmit={(v) => act('editar', v)} onCancel={() => setPanel(null)} />}
        {panel === 'pagada' && <MarcarPagada busy={busy === 'marcar_pagada'} onSubmit={(v) => act('marcar_pagada', v)} onCancel={() => setPanel(null)} />}
        {panel === 'reiniciar' && (
          <Reiniciar entrada={entrada} busy={busy === 'reiniciar'} onSubmit={() => act('reiniciar')} onCancel={() => setPanel(null)} />
        )}
        {panel === 'mesa' && <MoverMesa entrada={entrada} busy={busy === 'mesa'} error={error} onSubmit={(tableId, force) => act('mesa', { tableId, force })} onCancel={() => setPanel(null)} />}
      </div>
    </div>
  );
}

function Reiniciar({
  entrada,
  busy,
  onSubmit,
  onCancel,
}: {
  entrada: Entrada;
  busy: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const numero = formatNumber(entrada.number);
  const [typed, setTyped] = useState('');
  const ok = typed.trim().replace(/^#/, '') === numero || Number(typed.trim().replace(/^#/, '')) === entrada.number;
  return (
    <div className="space-y-3 rounded-xl bg-rojo-soft p-4 text-ink">
      <p className="font-bold">¿Reiniciar la entrada N.º {numero}?</p>
      <p className="text-sm">
        Queda como recién impresa: <strong>sin vender</strong>. Se borran el nombre, el teléfono, el pago y su capture, la
        mesa (se libera el puesto), el ingreso y el plato. Se mantienen el número, el QR y el lote
        {entrada.holderName ? ` (${entrada.holderName})` : ''}. Lo que había queda anotado en las notas.
      </p>
      {entrada.checkedInAt && (
        <p className="text-sm font-bold text-rojo-2">Ojo: esta persona ya entró al evento.</p>
      )}
      {entrada.status === 'activa' && (
        <p className="text-sm font-bold text-rojo-2">Ojo: el pago de esta entrada ya estaba verificado.</p>
      )}
      <Field label={`Escribe ${numero} para confirmar`} htmlFor="confirmar-reinicio">
        <TextInput
          id="confirmar-reinicio"
          inputMode="numeric"
          autoComplete="off"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="tabular w-32"
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" loading={busy} disabled={!ok} onClick={onSubmit}>
          Reiniciar la entrada N.º {numero}
        </Button>
        <Button size="sm" variant="quiet" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function Item({ label, value, wide }: { label: string; value: string | null | undefined; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <dt className="text-sm text-ink-3">{label}</dt>
      <dd className="break-words font-bold">{value || '—'}</dd>
    </div>
  );
}

function Rechazar({
  label = '¿Por qué se rechaza? La persona lo verá al escanear su entrada.',
  action = 'Rechazar',
  busy,
  onSubmit,
  onCancel,
}: {
  label?: string;
  action?: string;
  busy: boolean;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="space-y-2 rounded-xl bg-paper-2 p-4">
      <Field label={label} htmlFor="motivo">
        <TextInput id="motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="flex gap-2">
        <Button size="sm" loading={busy} disabled={!reason.trim()} onClick={() => onSubmit(reason)}>
          {action}
        </Button>
        <Button size="sm" variant="quiet" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function Editar({
  entrada,
  busy,
  onSubmit,
  onCancel,
}: {
  entrada: Entrada;
  busy: boolean;
  onSubmit: (v: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState({
    attendeeName: entrada.attendeeName || '',
    attendeePhone: entrada.attendeePhone || '',
    paymentReference: entrada.paymentReference || '',
    notes: entrada.notes || '',
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <div className="space-y-3 rounded-xl bg-paper-2 p-4">
      <Field label="Nombre" htmlFor="ed-nombre">
        <TextInput id="ed-nombre" value={v.attendeeName} onChange={set('attendeeName')} />
      </Field>
      <Field label="Teléfono" htmlFor="ed-tel">
        <TextInput id="ed-tel" value={v.attendeePhone} onChange={set('attendeePhone')} />
      </Field>
      <Field label="Referencia" htmlFor="ed-ref">
        <TextInput id="ed-ref" value={v.paymentReference} onChange={set('paymentReference')} />
      </Field>
      <Field label="Notas" htmlFor="ed-notas">
        <TextInput id="ed-notas" value={v.notes} onChange={set('notes')} />
      </Field>
      <div className="flex gap-2">
        <Button size="sm" loading={busy} onClick={() => onSubmit(v)}>
          Guardar
        </Button>
        <Button size="sm" variant="quiet" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function MarcarPagada({
  busy,
  onSubmit,
  onCancel,
}: {
  busy: boolean;
  onSubmit: (v: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<MetodoPago | null>(null);
  const [reference, setReference] = useState('');
  return (
    <div className="space-y-3 rounded-xl bg-paper-2 p-4">
      <p className="text-sm text-ink-2">Para pagos que recibiste directamente. La entrada queda activa de una vez.</p>
      <Field label="Nombre de quien la usa" htmlFor="mp-nombre">
        <TextInput id="mp-nombre" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Teléfono" htmlFor="mp-tel">
        <TextInput id="mp-tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Choice
        name="Método"
        value={method}
        onChange={setMethod}
        className="grid-cols-3"
        options={[
          { value: 'pago_movil', label: 'Pago Móvil' },
          { value: 'zelle', label: 'Zelle' },
          { value: 'efectivo_usd', label: 'Efectivo $' },
        ]}
      />
      <Field label="Referencia" htmlFor="mp-ref">
        <TextInput id="mp-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
      </Field>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="verde"
          loading={busy}
          disabled={!name.trim() || !method}
          onClick={() => onSubmit({ attendeeName: name, attendeePhone: phone, method: method!, reference })}
        >
          Activar entrada
        </Button>
        <Button size="sm" variant="quiet" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function MoverMesa({
  entrada,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  entrada: Entrada;
  busy: boolean;
  error: string | null;
  onSubmit: (tableId: string, force: boolean) => void;
  onCancel: () => void;
}) {
  const [force, setForce] = useState(false);
  return (
    <div className="space-y-3 rounded-xl bg-paper-2 p-3">
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="h-4 w-4 accent-[var(--color-rojo)]" />
        Permitir aunque la mesa esté llena o reservada
      </label>
      <MesaPicker
        mine={entrada.tableId}
        allowFull={force}
        onConfirm={(id) => onSubmit(id, force)}
        confirmLabel={(id) => `Mover a la ${id}`}
        busy={busy}
        error={error}
      />
      <Button size="sm" variant="quiet" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  );
}
