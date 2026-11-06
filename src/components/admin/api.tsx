'use client';

import type { Entrada } from '@/lib/entradas/types';

export async function api<T = Record<string, unknown>>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method || 'GET',
    cache: 'no-store',
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'La operación falló.');
  return json as T;
}

export function patchEntrada(code: string, body: Record<string, unknown>) {
  return api<{ entrada: Entrada }>(`/api/admin/entradas/${encodeURIComponent(code)}`, { method: 'PATCH', body });
}

// Deshace un rechazo hecho por error y explica qué pasó con la mesa que tenía.
export async function deshacerRechazo(code: string) {
  const r = await api<{ entrada: Entrada; mesa: string | null; mesaAntes: string | null }>(
    `/api/admin/entradas/${encodeURIComponent(code)}`,
    { method: 'PATCH', body: { action: 'deshacer_rechazo' } }
  );
  const aviso = r.mesa
    ? `Volvió a «por verificar», con su mesa ${r.mesa}.`
    : r.mesaAntes
      ? `Volvió a «por verificar». La mesa ${r.mesaAntes} ya no tenía puesto: asígnale otra, o la persona la escoge al escanear su QR.`
      : 'Volvió a «por verificar», sin mesa: asígnale una, o la persona la escoge al escanear su QR.';
  return { entrada: r.entrada, aviso };
}

export function fechaCorta(iso: string | null) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-VE', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Caracas',
  }).format(new Date(iso));
}

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
