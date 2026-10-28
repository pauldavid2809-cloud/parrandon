'use client';

import { useEffect, useState } from 'react';
import MesaMap from './MesaMap';
import { useMesas, type MesaPublica } from './useMesas';
import { Leyenda, MesasResumenLine } from './Leyenda';
import { Button, Notice } from '@/components/ui';
import { cn } from '@/lib/utils';

// Croquis para escoger una mesa, con barra de confirmación fija abajo.
export default function MesaPicker({
  mine,
  value,
  onChange,
  onConfirm,
  confirmLabel = (id) => `Escoger la mesa ${id}`,
  busy,
  error,
  allowFull = false,
  hideConfirm = false,
  tone = 'paper',
  className,
}: {
  mine?: string | null;
  value?: string | null;
  onChange?: (id: string | null) => void;
  onConfirm?: (id: string) => void;
  confirmLabel?: (id: string) => string;
  busy?: boolean;
  error?: string | null;
  allowFull?: boolean;
  hideConfirm?: boolean;
  tone?: 'paper' | 'noche';
  className?: string;
}) {
  const { mesas, resumen, refresh, error: loadError } = useMesas(12000);
  const [internal, setInternal] = useState<string | null>(value ?? null);
  const [notice, setNotice] = useState<string | null>(null);
  const selected = value !== undefined ? value : internal;
  const current = selected ? mesas.find((m) => m.id === selected) : undefined;

  // Si la mesa elegida se llena mientras la persona decide, se le avisa.
  const fullNotice =
    current && current.isFull && !allowFull && current.id !== mine ? `La mesa ${current.id} se acaba de llenar. Escoge otra.` : null;

  useEffect(() => {
    if (error) refresh();
  }, [error, refresh]);

  const choose = (m: MesaPublica) => {
    if (!allowFull && m.id !== mine && (m.isFull || m.blocked)) {
      setNotice(m.blocked ? `La mesa ${m.id} está reservada por la organización.` : `La mesa ${m.id} está llena.`);
      return;
    }
    setNotice(null);
    const next = selected === m.id ? null : m.id;
    setInternal(next);
    onChange?.(next);
  };

  const dark = tone === 'noche';
  const canConfirm = Boolean(current && (allowFull || current.id === mine || (!current.isFull && !current.blocked)));

  return (
    <div className={className}>
      <div className={cn('flex flex-col gap-2', dark && 'text-paper')}>
        <MesasResumenLine resumen={resumen} className={cn(dark && 'text-paper/80 [&_strong]:text-paper')} />
        <Leyenda showMine={Boolean(mine)} className={cn(dark && 'text-paper/80')} />
      </div>
      {loadError && (
        <Notice tone="warn" className="mt-3">
          {loadError}
        </Notice>
      )}
      <div className="mt-4 rounded-2xl bg-card p-1.5 sm:p-3">
        <MesaMap mesas={mesas} selected={selected} mine={mine} mode={allowFull ? 'admin' : 'pick'} onSelect={choose} />
      </div>
      {(notice || fullNotice || error || (!hideConfirm && current)) && (
        <div aria-live="polite" className="sticky bottom-3 z-10 mt-3 space-y-2">
          {(notice || fullNotice || error) && <Notice tone="error">{notice || fullNotice || error}</Notice>}
          {!hideConfirm && current && onConfirm && (
            <div className="flash-in flex flex-col gap-3 rounded-2xl bg-ink p-4 text-paper shadow-[var(--shadow-ticket)] sm:flex-row sm:items-center sm:justify-between">
              <p>
                <span className="font-display text-xl">Mesa {current.id}</span>
                <span className="text-paper/80">
                  {' '}
                  · Sector {current.sector} ·{' '}
                  {current.isFull ? 'llena' : `${current.free} ${current.free === 1 ? 'puesto libre' : 'puestos libres'}`}
                </span>
              </p>
              <Button
                variant="cream"
                onClick={() => current && onConfirm(current.id)}
                disabled={!canConfirm}
                loading={busy}
              >
                {confirmLabel(current.id)}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
