'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EventStats, Order } from '@/types';
import { 
  UtensilsCrossed, 
  Users, 
  Clock, 
  CheckCircle2, 
  QrCode, 
  RefreshCw, 
  ChefHat, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';

export default function AsistenciaLivePage() {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/orders')
      ]);
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      if (statsData.success) setStats(statsData.stats);
      if (ordersData.success) setOrders(ordersData.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // Poll every 8s for live kitchen/door count
    return () => clearInterval(interval);
  }, []);

  const totalConfirmed = stats?.confirmedTickets || 0;
  const scannedCount = stats?.attendance.scannedCount || 0;
  const pendingCount = stats?.attendance.pendingScanCount || 0;
  const mealsServed = stats?.attendance.mealsServedCount || 0;

  const attendancePercent = totalConfirmed > 0 ? Math.round((scannedCount / totalConfirmed) * 100) : 0;

  // Extract list of attendees sorted by scan time
  const scannedTickets: Array<{
    attendeeName: string;
    ticketCode: string;
    scannedAt: string;
    buyerName: string;
  }> = [];

  orders.forEach(o => {
    (o.tickets || []).forEach(t => {
      if (t.isUsed && t.scannedAt) {
        scannedTickets.push({
          attendeeName: t.attendeeName,
          ticketCode: t.ticketCode,
          scannedAt: t.scannedAt,
          buyerName: o.buyerName
        });
      }
    });
  });

  scannedTickets.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 text-amber-400" />
              Control de Asistencia y Platos en Vivo
            </h1>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitorea en tiempo real el ritmo de ingreso al evento para que el equipo de cocina prepare exactamente los platos requeridos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/escanear"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition-colors"
          >
            <QrCode className="h-4 w-4" />
            <span>Abrir Escáner de Puerta</span>
          </Link>
          <button
            onClick={fetchData}
            className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 p-2 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-time Big Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Platos Servidos */}
        <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-slate-950 p-6 text-center shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <ChefHat className="h-7 w-7" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
            Platos Servidos a la Mesa
          </span>
          <div className="text-4xl sm:text-5xl font-black text-amber-400 my-2">
            {mealsServed}
          </div>
          <span className="text-xs text-slate-300">
            de <strong className="text-white">{totalConfirmed}</strong> platos confirmados ({attendancePercent}%)
          </span>
        </div>

        {/* Asistentes en Sala */}
        <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 p-6 text-center shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Users className="h-7 w-7" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block">
            Asistentes en Sala (Check-in)
          </span>
          <div className="text-4xl sm:text-5xl font-black text-emerald-400 my-2">
            {scannedCount}
          </div>
          <span className="text-xs text-slate-300">
            Personas validadas con QR en puerta
          </span>
        </div>

        {/* Pendientes por Llegar */}
        <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 text-center shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Clock className="h-7 w-7" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Pendientes por Llegar
          </span>
          <div className="text-4xl sm:text-5xl font-black text-slate-200 my-2">
            {pendingCount}
          </div>
          <span className="text-xs text-slate-400">
            Entradas vendidas que aún no han ingresado
          </span>
        </div>

      </div>

      {/* Progress Bar of Attendance */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Progreso General de Llegada:
          </span>
          <span className="font-bold text-amber-400">{scannedCount} / {totalConfirmed} ({attendancePercent}%)</span>
        </div>
        <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${attendancePercent}%` }}
          />
        </div>
      </div>

      {/* Real-time Timeline of Entrances */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Bitácora de Ingreso en Puerta ({scannedTickets.length} registros):</span>
          <span className="text-xs text-emerald-400 font-normal">Sincronización en vivo</span>
        </h3>

        {scannedTickets.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Aún no se ha registrado ningún escaneo en puerta hoy.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {scannedTickets.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    #{index + 1}
                  </div>
                  <div>
                    <strong className="text-white text-sm block">{item.attendeeName}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ref QR: {item.ticketCode} • Comprador: {item.buyerName}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {new Date(item.scannedAt).toLocaleTimeString('es-VE')}
                  </span>
                  <span className="block text-[10px] text-emerald-400 font-medium">
                    Plato despachado ✅
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
