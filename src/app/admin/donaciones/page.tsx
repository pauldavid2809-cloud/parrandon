'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useState } from 'react';
import { Button, Notice, Spinner } from '@/components/ui';
import { api, fechaCorta, PageTitle } from '@/components/admin/api';
import type { Order } from '@/types';
import { formatCurrency } from '@/lib/utils';

const ESTADO: Record<Order['status'], string> = { pending: 'Por verificar', approved: 'Verificada', rejected: 'Rechazada' };

export default function DonacionesAdmin() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<{ orders: Order[] }>('/api/orders');
      setOrders(d.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar.');
    }
  }, []);

  useAutoLoad(load);

  const setStatus = async (id: string, status: 'approved' | 'rejected') => {
    setBusy(id + status);
    try {
      await api(`/api/orders/${id}/status`, {
        method: 'POST',
        body: { status, verifiedBy: 'Administración', rejectionReason: status === 'rejected' ? 'No se encontró el pago.' : undefined },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-5xl">
      <PageTitle title="Donaciones" />
      <p className="-mt-5 mb-6 max-w-[62ch] text-ink-2">
        Donaciones hechas desde la página (sin entrada). Aquí también aparecen las órdenes anteriores al sistema de
        entradas de papel.
      </p>
      {error && <Notice tone="error" className="mb-4">{error}</Notice>}
      {!orders && !error && <Spinner />}
      {orders && orders.length === 0 && <p className="text-ink-2">Todavía no hay donaciones.</p>}
      {orders && orders.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {o.buyerName} <span className="font-normal text-ink-3">· {o.isDonation ? 'Donación' : 'Orden anterior'} {o.id}</span>
                </p>
                <p className="tabular text-sm text-ink-2">
                  {fechaCorta(o.createdAt)} · {o.paymentMethod} · ref. {o.paymentReference}
                  {o.paymentProofUrl && (
                    <>
                      {' · '}
                      <a href={o.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">
                        capture
                      </a>
                    </>
                  )}
                </p>
              </div>
              <p className="tabular font-display text-2xl">{formatCurrency(o.convertedUsd || 0, 'USD')}</p>
              <p className="w-28 text-sm font-bold text-ink-2">{ESTADO[o.status]}</p>
              {o.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="verde" loading={busy === o.id + 'approved'} onClick={() => setStatus(o.id, 'approved')}>
                    Verificar
                  </Button>
                  <Button size="sm" variant="quiet" loading={busy === o.id + 'rejected'} onClick={() => setStatus(o.id, 'rejected')}>
                    Rechazar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
