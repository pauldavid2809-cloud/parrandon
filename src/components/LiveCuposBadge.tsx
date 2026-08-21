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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Error fetching live stats:', err);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 15000); // Polling every 15s for live counter
    return () => clearInterval(interval);
  }, []);

  const totalQuota = stats.totalQuota || 350;
  const available = stats.availableTickets ?? 88;
  const soldAndPending = totalQuota - available;
  const percentFilled = Math.min(100, Math.round((soldAndPending / totalQuota) * 100));

  const isLowStock = available < 50;

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
            Disponibilidad en Tiempo Real
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
          <Users className="h-3.5 w-3.5" />
          <span>{totalQuota} Capacidad Máxima</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            percentFilled > 85
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 animate-pulse'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500'
          }`}
          style={{ width: `${percentFilled}%` }}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className="text-slate-400">
          <strong className="text-white">{soldAndPending}</strong> entradas reservadas ({percentFilled}%)
        </span>
        <span className={`font-bold flex items-center gap-1 ${isLowStock ? 'text-rose-400' : 'text-amber-400'}`}>
          {isLowStock && <AlertCircle className="h-3.5 w-3.5" />}
          ¡Solo quedan {available} cupos!
        </span>
      </div>
    </div>
  );
}
