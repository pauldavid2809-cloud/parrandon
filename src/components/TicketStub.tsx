'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import QrImage from './QrImage';

// La entrada física del Parrandón, dibujada igual que la impresa:
// cuerpo con los datos del evento y talón troquelado con el QR.
export default function TicketStub({
  number,
  qrValue,
  qrLabel,
  stubCaption = 'Escanéame para activar',
  footer,
  className,
  perforationBg = 'var(--color-paper)',
}: {
  number: string;
  qrValue: string;
  qrLabel?: string;
  stubCaption?: ReactNode;
  footer?: ReactNode;
  className?: string;
  perforationBg?: string;
}) {
  // El talón se acomoda al lado o debajo según el ancho de la propia entrada, no de la pantalla.
  return (
    <div className={cn('@container', className)}>
    <div
      className="flex flex-col overflow-hidden rounded-2xl bg-card text-ink shadow-[var(--shadow-ticket)] @[30rem]:flex-row"
      style={{ ['--perforation-bg' as string]: perforationBg }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 @[30rem]:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-[1.65rem] leading-none text-rojo @[30rem]:text-3xl">Parrandón Navideño</p>
            <p className="mt-1 text-sm font-bold text-ink-2">Seminario Mayor Santo Tomás de Aquino&nbsp;·&nbsp;2026</p>
          </div>
          <p className="shrink-0 rounded-md bg-verde px-2 py-1 text-xs font-bold text-paper">Incluye plato</p>
        </div>
        <div className="h-px bg-oro/70" />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-ink-3">Fecha</dt>
            <dd className="font-bold">Vie. 11 de diciembre</dd>
          </div>
          <div>
            <dt className="text-ink-3">Hora</dt>
            <dd className="font-bold">6:00 p. m.</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-ink-3">Lugar</dt>
            <dd className="font-bold">Bulevar del Seminario, Maracaibo</dd>
          </div>
        </dl>
        <div className="mt-auto flex items-end justify-between gap-3">
          <p className="leading-none">
            <span className="block text-xs font-bold text-ink-3">Entrada N.º</span>
            <span className="tabular font-display text-4xl text-ink">{number}</span>
          </p>
          {footer}
        </div>
      </div>
      <div className="perforation mx-0 @[30rem]:hidden" aria-hidden />
      <div className="perforation-v hidden @[30rem]:block" aria-hidden />
      <div className="flex items-center gap-4 bg-paper-2/60 p-5 @[30rem]:w-48 @[30rem]:flex-col @[30rem]:justify-center @[30rem]:gap-3">
        <QrImage value={qrValue} label={qrLabel} className="w-28 shrink-0 @[30rem]:w-full" />
        <p className="text-sm font-bold leading-snug text-ink-2 @[30rem]:text-center">{stubCaption}</p>
      </div>
    </div>
    </div>
  );
}
