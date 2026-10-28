'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import MesaMap from '@/components/mesas/MesaMap';
import { useMesas, type MesaPublica } from '@/components/mesas/useMesas';
import { Leyenda, MesasResumenLine } from '@/components/mesas/Leyenda';
import { Notice } from '@/components/ui';

export function LiveResumen({ className }: { className?: string }) {
  const { resumen } = useMesas(20000);
  if (!resumen) return null;
  return (
    <p className={className}>
      <span className="tabular font-bold">{resumen.mesasConCupo}</span> mesas con puestos ·{' '}
      <span className="tabular font-bold">{resumen.mesasLlenas}</span> {resumen.mesasLlenas === 1 ? 'llena' : 'llenas'}
    </p>
  );
}

function describe(m: MesaPublica) {
  if (m.blocked) return 'Reservada por la organización';
  if (m.isFull) return 'Llena';
  return `${m.free} ${m.free === 1 ? 'puesto libre' : 'puestos libres'} de ${m.capacity}`;
}

// Croquis público: se puede tocar una mesa para ver cuántos puestos le quedan.
export default function LiveMesas({ intro }: { intro?: ReactNode }) {
  const { mesas, resumen, error } = useMesas(15000);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const current = pickedId ? mesas.find((m) => m.id === pickedId) || null : null;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_minmax(0,27rem)] md:gap-12 lg:grid-cols-[1fr_30rem]">
      <div className="md:sticky md:top-6 md:self-start">
        {intro}
        <MesasResumenLine resumen={resumen} className="mt-6 text-lg" />
        <Leyenda className="mt-4" />
        {error && (
          <Notice tone="warn" className="mt-4" title="El croquis no cargó">
            {error}
          </Notice>
        )}
        <div aria-live="polite" className="mt-6 hidden md:block">
          {current ? (
            <SelectedCard mesa={current} />
          ) : (
            <p className="rounded-2xl border-2 border-dashed border-line p-5 text-ink-2">
              Toca una mesa del croquis para ver cuántos puestos le quedan.
            </p>
          )}
        </div>
      </div>
      <div>
        <div className="rounded-3xl bg-card p-2 shadow-[var(--shadow-soft)] sm:p-4">
          <MesaMap mesas={mesas} selected={current?.id} onSelect={(m) => setPickedId((p) => (p === m.id ? null : m.id))} />
        </div>
        <div aria-live="polite" className="sticky bottom-3 z-10 mt-4 md:hidden">
          {current && <SelectedCard mesa={current} />}
        </div>
      </div>
    </div>
  );
}

function SelectedCard({ mesa }: { mesa: MesaPublica }) {
  const open = !mesa.isFull && !mesa.blocked;
  return (
    <div className="flash-in rounded-2xl bg-ink p-5 text-paper shadow-[var(--shadow-ticket)]">
      <p className="font-display text-2xl">Mesa {mesa.id}</p>
      <p className="mt-1 text-paper/85">
        Sector {mesa.sector} · {describe(mesa)}
      </p>
      {open && (
        <Link
          href="/activar"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-paper px-4 font-bold text-rojo hover:bg-card"
        >
          Activar mi entrada y escogerla
        </Link>
      )}
    </div>
  );
}
