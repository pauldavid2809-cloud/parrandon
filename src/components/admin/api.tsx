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
