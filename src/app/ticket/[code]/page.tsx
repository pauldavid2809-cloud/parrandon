'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Ticket } from '@/types';
import TicketCard from '@/components/TicketCard';
import { RefreshCw, XCircle, ArrowLeft, Sparkles } from 'lucide-react';

export default function SingleTicketPage() {
  const params = useParams();
  const code = params?.code as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [orderInfo, setOrderInfo] = useState<{ id: string; buyerName: string; buyerPhone: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTicket() {
      if (!code) return;
      try {
        const res = await fetch(`/api/tickets/${code}`);
        const data = await res.json();
        if (data.success && data.ticket) {
          setTicket(data.ticket);
          setOrderInfo(data.order);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTicket();
  }, [code]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <RefreshCw className="h-8 w-8 text-amber-400 animate-spin mb-3" />
        <p className="text-sm text-slate-300">Cargando entrada digital con QR...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <XCircle className="h-12 w-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-white mb-1">Entrada no encontrada</h2>
        <p className="text-xs text-slate-400 mb-6">
          El código <code className="text-amber-300">{code}</code> no corresponde a una entrada válida.
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

  return (
    <div className="min-h-screen py-10 px-4 bg-slate-950 flex flex-col items-center justify-center">
      <div className="w-full max-w-md mb-4 flex items-center justify-between no-print">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Inicio</span>
        </Link>
        {orderInfo && (
          <Link
            href={`/orden/${orderInfo.id}`}
            className="text-xs text-amber-400 hover:underline"
          >
            Ver Orden Completa ({orderInfo.id})
          </Link>
        )}
      </div>

      <TicketCard
        ticket={ticket}
        buyerName={orderInfo?.buyerName}
        buyerPhone={orderInfo?.buyerPhone}
      />
    </div>
  );
}
