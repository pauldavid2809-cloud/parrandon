'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Notice, Spinner } from '@/components/ui';
import type { Order } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

// Comprobante de una donación (u orden anterior al sistema de entradas de papel).
export default function OrdenPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => (d.success ? setOrder(d.order) : setError(d.error || 'No encontramos ese registro.')))
      .catch(() => setError('No se pudo cargar. Revisa tu conexión.'));
  }, [id]);

  return (
    <div className="paper-grain flex-1">
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
        {error && <Notice tone="error">{error}</Notice>}
        {!order && !error && <Spinner />}
        {order && (
          <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-ticket)]" style={{ ['--perforation-bg' as string]: 'var(--color-paper)' }}>
            <div className="p-6">
              <p className="font-bold text-ink-3">{order.isDonation ? 'Donación' : 'Orden'} {order.id}</p>
              <p className="mt-1 font-display text-3xl">{order.buyerName}</p>
              <p className="mt-1 text-ink-2">{formatDate(order.createdAt)}</p>
            </div>
            <div className="perforation" aria-hidden />
            <div className="space-y-4 p-6">
              <p className="tabular font-display text-4xl">{formatCurrency(order.convertedUsd || order.amountPaid, 'USD')}</p>
              {order.status === 'approved' && (
                <p className="flex items-center gap-2 font-bold text-verde-2">
                  <CheckCircle2 className="h-5 w-5" aria-hidden /> Pago verificado. ¡Gracias!
                </p>
              )}
              {order.status === 'pending' && (
                <p className="flex items-center gap-2 font-bold text-oro-ink">
                  <Clock className="h-5 w-5" aria-hidden /> Pago en verificación
                </p>
              )}
              {order.status === 'rejected' && (
                <p className="flex items-center gap-2 font-bold text-rojo">
                  <XCircle className="h-5 w-5" aria-hidden /> No pudimos verificar el pago
                  {order.rejectionReason ? `: ${order.rejectionReason}` : ''}
                </p>
              )}
              {!order.isDonation && (
                <Notice tone="warn">
                  Las entradas digitales anteriores fueron reemplazadas por entradas de papel con QR. Escríbenos por
                  WhatsApp al 0412-0308674 con este número de orden para entregarte las tuyas.
                </Notice>
              )}
              <Link href="/" className="inline-block font-bold text-ink-2 underline underline-offset-4">
                Volver al inicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
