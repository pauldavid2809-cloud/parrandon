'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCodeScanner from '@/components/QRCodeScanner';
import { EventStats, ScanResult } from '@/types';
import { 
  Sparkles, 
  QrCode, 
  Utensils, 
  Users, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

export default function EscanearPage() {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [recentScans, setRecentScans] = useState<Array<{ name: string; ticketCode: string; time: string }>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/stats?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleScanCode = async (code: string): Promise<ScanResult> => {
    const res = await fetch('/api/tickets/scan', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({ ticketCode: code, scannedBy: 'Personal de Puerta' })
    });

    const data: ScanResult = await res.json();

    if (data.success && data.ticket) {
      // Optimistic update of live counters so UI updates immediately
      setStats(prev => {
        if (!prev) return prev;
        const newScanned = prev.attendance.scannedCount + 1;
        return {
          ...prev,
          attendance: {
            ...prev.attendance,
            scannedCount: newScanned,
            mealsServedCount: prev.attendance.mealsServedCount + (data.ticket?.mealServed ? 1 : 0),
            pendingScanCount: Math.max(0, prev.confirmedTickets - newScanned)
          }
        };
      });

      setRecentScans(prev => {
        if (prev.length > 0 && prev[0].ticketCode === data.ticket!.ticketCode) {
          return prev;
        }
        return [
          {
            name: data.ticket!.attendeeName,
            ticketCode: data.ticket!.ticketCode,
            time: new Date().toLocaleTimeString('es-VE')
          },
          ...prev.slice(0, 7)
        ];
      });

      // Synchronize with server
      setTimeout(fetchStats, 500);
    }

    return data;
  };

  return (
    <div className="min-h-screen py-6 px-4 bg-slate-950 flex flex-col items-center">
      <div className="w-full max-w-xl space-y-5">
        
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Inicio</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Control de Puerta en Vivo</span>
          </div>
          <button
            onClick={fetchStats}
            className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>

        {/* Real-time Attendance & Meals KPI Header */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-emerald-950/70 border border-emerald-500/40 p-3 shadow-lg">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-semibold mb-1">
              <Users className="h-3.5 w-3.5" />
              <span>En Sala</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {stats?.attendance.scannedCount ?? 0}
            </div>
            <span className="text-[10px] text-emerald-300 font-medium">Asistentes</span>
          </div>

          <div className="rounded-2xl bg-amber-950/70 border border-amber-500/40 p-3 shadow-lg">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-semibold mb-1">
              <Utensils className="h-3.5 w-3.5" />
              <span>Platos Servidos</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300">
              {stats?.attendance.mealsServedCount ?? 0}
            </div>
            <span className="text-[10px] text-amber-400/80 font-medium">Entregados</span>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 shadow-lg">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-semibold mb-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Por Llegar</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-200">
              {stats?.attendance.pendingScanCount ?? 0}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Entradas</span>
          </div>
        </div>

        {/* QR Scanner Component */}
        <QRCodeScanner
          onScanSuccess={handleScanCode}
          onStatsUpdate={fetchStats}
        />

        {/* Recently Scanned List */}
        {recentScans.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 shadow-xl">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Últimos ingresos escaneados:</span>
              <span className="text-emerald-400 font-mono text-[11px]">{recentScans.length} recientes</span>
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {recentScans.map((scan, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl text-xs border border-slate-800/80">
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white truncate">{scan.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({scan.ticketCode})</span>
                  </div>
                  <span className="text-[11px] text-amber-400 font-mono shrink-0 ml-2">{scan.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
