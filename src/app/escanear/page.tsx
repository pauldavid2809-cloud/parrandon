'use client';

import { useState, useEffect } from 'react';
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

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleScanCode = async (code: string): Promise<ScanResult> => {
    const res = await fetch('/api/tickets/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketCode: code, scannedBy: 'Personal de Puerta' })
    });

    const data: ScanResult = await res.json();

    if (data.success && data.ticket) {
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
      fetchStats();
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
          <Link
            href="/admin"
            className="text-xs text-amber-400 hover:underline font-semibold"
          >
            Admin
          </Link>
        </div>

        {/* Real-time Attendance & Meals KPI Header */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-emerald-950/70 border border-emerald-500/40 p-3">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-semibold mb-1">
              <Users className="h-3.5 w-3.5" />
              <span>En Sala</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {stats?.attendance.scannedCount ?? 0}
            </div>
            <span className="text-[10px] text-emerald-300">Asistentes</span>
          </div>

          <div className="rounded-2xl bg-amber-950/70 border border-amber-500/40 p-3">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-semibold mb-1">
              <Utensils className="h-3.5 w-3.5" />
              <span>Platos Servidos</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300">
              {stats?.attendance.mealsServedCount ?? 0}
            </div>
            <span className="text-[10px] text-amber-400/80">Entregados</span>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-semibold mb-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Por Llegar</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-200">
              {stats?.attendance.pendingScanCount ?? 0}
            </div>
            <span className="text-[10px] text-slate-400">Entradas</span>
          </div>
        </div>

        {/* QR Scanner Component */}
        <QRCodeScanner
          onScanSuccess={handleScanCode}
          onStatsUpdate={fetchStats}
        />

        {/* Recently Scanned List */}
        {recentScans.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
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
