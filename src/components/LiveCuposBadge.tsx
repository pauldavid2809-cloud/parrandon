'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Users, AlertCircle } from 'lucide-react';
import { EventStats } from '@/types';

interface LiveCuposBadgeProps {
  initialStats?: Partial<EventStats>;
}

export default function LiveCuposBadge({ initialStats }: LiveCuposBadgeProps) {
  const [stats, setStats] = useState<Partial<EventStats>>(
    initialStats || {
      totalQuota: 500,
      confirmedTickets: 120,
      pendingTickets: 30,
      availableTickets: 350,
    }
  );

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/stats?t=${Date.now()}`, {
          cache: 'no-store'
        });
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Error fetching live stats:', err);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Polling every 10s for live counter
    return () => clearInterval(interval);
  }, []);

  const totalQuota = stats.totalQuota || 500;
  const available = stats.availableTickets ?? 350;
  const soldAndPending = Math.max(0, totalQuota - available);
  const percentFilled = Math.min(100, Math.round((soldAndPending / totalQuota) * 100));

  const isLowStock = available < 60;

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-white/[0.08] bg-slate-900/80 p-4 sm:p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-black text-emerald-400 tracking-wider uppercase">
            Disponibilidad en Vivo del Bulevar
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/30">
          <Users className="h-3.5 w-3.5" />
          <span>{totalQuota} Comensales (50 Mesas)</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            percentFilled > 85
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 animate-pulse'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400'
          }`}
          style={{ width: `${percentFilled}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-medium">
        <span className="text-slate-400">
          <strong className="text-white font-bold">{soldAndPending}</strong> puestos asignados ({percentFilled}%)
        </span>
        <span className={`font-black flex items-center gap-1.5 ${isLowStock ? 'text-rose-400' : 'text-amber-400'}`}>
          {isLowStock && <AlertCircle className="h-3.5 w-3.5" />}
          <span>{available} cupos disponibles</span>
        </span>
      </div>
    </div>
  );
}
