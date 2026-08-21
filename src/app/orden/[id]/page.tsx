'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import TicketCard from '@/components/TicketCard';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RefreshCw, 
  Share2, 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Hash, 
  Phone 
} from 'lucide-react';

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      setRefreshing(true);
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Auto refresh while pending
    const interval = setInterval(() => {
      if (order?.status === 'pending') {
        fetchOrder();
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [orderId, order?.status]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <RefreshCw className="h-8 w-8 text-amber-400 animate-spin mb-3" />
        <p className="text-sm text-slate-300">Buscando información de tu orden...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <XCircle className="h-12 w-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-white mb-1">Orden no encontrada</h2>
        <p className="text-xs text-slate-400 mb-6">
          No pudimos localizar la orden con identificador <code className="text-amber-300">{orderId}</code>.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-white"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const isApproved = order.status === 'approved';
  const isPending = order.status === 'pending';
  const isRejected = order.status === 'rejected';

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Back & Refresh */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a la portada</span>
          </Link>

          <button
            onClick={fetchOrder}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{refreshing ? 'Actualizando...' : 'Actualizar Estado'}</span>
          </button>
        </div>

        {/* Status Header Banner */}
        <div
          className={`rounded-2xl sm:rounded-3xl p-4 sm:p-8 border shadow-2xl relative overflow-hidden backdrop-blur-xl ${
            isApproved
              ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-slate-950/90 border-emerald-500/40'
              : isRejected
              ? 'bg-gradient-to-br from-rose-950/80 via-slate-900/90 to-slate-950/90 border-rose-500/40'
              : 'bg-gradient-to-br from-amber-950/80 via-slate-900/90 to-slate-950/90 border-amber-500/40'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className={`h-11 w-11 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isRejected
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {isApproved ? (
                  <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8" />
                ) : isRejected ? (
                  <XCircle className="h-6 w-6 sm:h-8 sm:w-8" />
                ) : (
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 animate-pulse" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                    {order.id}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      isApproved
                        ? 'bg-emerald-500 text-slate-950'
                        : isRejected
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {isApproved ? 'Pago Aprobado' : isRejected ? 'Pago Rechazado' : 'En Verificación'}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  {isApproved
                    ? '¡Tu pago ha sido verificado con éxito!'
                    : isRejected
                    ? 'No se pudo verificar el pago'
                    : 'Comprobante recibido y en revisión'}
                </h1>

                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {isApproved
                    ? 'Tus entradas digitales con código QR ya están disponibles a continuación. Preséntalas el día del evento en tu celular o impresas.'
                    : isRejected
                    ? `Motivo: ${order.rejectionReason || 'Comprobante no coincide con los registros bancarios.'} Por favor contáctanos al WhatsApp de administración.`
                    : 'Anabella y el equipo de administración del Seminario están validando tu transferencia bancaria. Una vez confirmada, tus QR se activarán automáticamente.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* IF APPROVED: SHOW DIGITAL TICKETS */}
        {isApproved && order.tickets && order.tickets.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Tus Entradas Oficiales ({order.tickets.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Cada entrada cuenta con su propio código QR para el control de acceso y plato navideño.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {order.tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  buyerName={order.buyerName}
                  buyerPhone={order.buyerPhone}
                />
              ))}
            </div>
          </div>
        )}

        {/* Order Details Breakdown */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
            Detalles de la Compra
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Comprador</span>
              <strong className="text-white text-sm block mt-0.5">{order.buyerName}</strong>
              <span className="text-slate-400 text-[10px]">{order.buyerDocId}</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Teléfono WhatsApp</span>
              <strong className="text-emerald-400 text-sm block mt-0.5">{order.buyerPhone}</strong>
              <span className="text-slate-500 text-[10px]">{formatDate(order.createdAt)}</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Método y Referencia</span>
              <strong className="text-white text-sm block mt-0.5 uppercase">{order.paymentMethod}</strong>
              <span className="text-amber-300 font-mono text-[11px]">Ref: {order.paymentReference}</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Monto Pagado</span>
              <strong className="text-emerald-400 text-sm block mt-0.5">
                {formatCurrency(order.amountPaid, order.currency)}
              </strong>
              <span className="text-slate-400 text-[10px]">
                {order.quantity} {order.quantity === 1 ? 'entrada' : 'entradas'} (${order.convertedUsd} USD)
              </span>
            </div>
          </div>
        </div>

        {/* Contact WhatsApp Help */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 text-center sm:text-left">
            <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>¿Tienes alguna duda sobre tu pago o entrada? Escríbenos a soporte:</span>
          </div>
          <a
            href={`https://wa.me/584147001122?text=Hola,%20tengo%20una%20consulta%20sobre%20mi%20orden%20${order.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-colors shrink-0"
          >
            Contactar por WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}
