'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui';

// Diálogo nativo: atrapa el foco, se cierra con Escape y devuelve el foco al botón.
export default function CaptureDialog({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
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
