import { cn } from '@/lib/utils';
import type { MesasResumen } from '@/lib/entradas/types';

export function MesasResumenLine({ resumen, className }: { resumen: MesasResumen | null; className?: string }) {
  // Reserva dos renglones desde el principio para que el croquis no salte al cargar.
  if (!resumen) return <p className={cn('min-h-[3.1em] text-ink-2', className)}>Cargando mesas…</p>;
  return (
    <p className={cn('tabular min-h-[3.1em] text-ink-2', className)}>
      <strong className="text-verde-2">{resumen.mesasConCupo} mesas con puestos</strong>
      <span aria-hidden> · </span>
      <strong className="text-ink">
        {resumen.mesasLlenas} {resumen.mesasLlenas === 1 ? 'llena' : 'llenas'}
      </strong>
      <span aria-hidden> · </span>
      {resumen.puestosLibres} puestos libres de {resumen.puestosTotales}
    </p>
  );
}

export function Leyenda({ showMine = false, className }: { showMine?: boolean; className?: string }) {
  const item = (swatch: string, label: string) => (
    <li className="flex items-center gap-2">
      <span aria-hidden className={cn('h-4 w-4 shrink-0 rounded-full', swatch)} />
      {label}
    </li>
  );
  return (
    <ul className={cn('flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-ink-2', className)}>
      {item('bg-card border-[2.5px] border-verde', 'Con puestos')}
      {item('bg-card border-[3px] border-oro', 'Quedan pocos')}
      {item('bg-ink-2', 'Llena')}
      {showMine && item('bg-verde', 'Tu mesa')}
      {item('bg-rojo', 'Elegida')}
    </ul>
  );
}
