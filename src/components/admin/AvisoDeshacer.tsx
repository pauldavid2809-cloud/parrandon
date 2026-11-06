'use client';

import type { ReactNode } from 'react';

// Aviso fijo abajo, como el de la cocina: se ve aunque la tarjeta que se tocó ya no esté en
// pantalla, y deja deshacer lo que se hizo sin querer.
export default function AvisoDeshacer({
  children,
  onDeshacer,
  deshaciendo = false,
  onCerrar,
}: {
  children: ReactNode;
  onDeshacer?: () => void;
  deshaciendo?: boolean;
  onCerrar: () => void;
}) {
  return (
    <div
      role="status"
      className="flash-in fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl bg-ink p-4 text-paper shadow-[var(--shadow-ticket)]"
    >
      <p>{children}</p>
      <div className="flex shrink-0 gap-1">
        {onDeshacer && (
          <button
            type="button"
            onClick={onDeshacer}
            disabled={deshaciendo}
            className="h-10 rounded-lg px-3 font-bold text-oro hover:bg-noche-2 disabled:opacity-60"
          >
            {deshaciendo ? 'Deshaciendo…' : 'Deshacer'}
          </button>
        )}
        <button type="button" onClick={onCerrar} className="h-10 rounded-lg px-3 font-bold text-paper/70 hover:bg-noche-2">
          Cerrar
        </button>
      </div>
    </div>
  );
}
