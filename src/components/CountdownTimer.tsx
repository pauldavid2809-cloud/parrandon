'use client';

import { useState, useEffect } from 'react';
import { Clock, Sparkles } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEventStarted: boolean;
}

export default function CountdownTimer({ targetDate = '2026-12-12T18:00:00-04:00' }: { targetDate?: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft => {
      const eventTime = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = eventTime - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isEventStarted: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isEventStarted: false
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="h-16 sm:h-20 flex items-center justify-center text-slate-500 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <span>Sincronizando cuenta regresiva oficial...</span>
        </div>
      </div>
    );
  }

  if (timeLeft.isEventStarted) {
    return (
      <div className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-emerald-500/20 border border-emerald-500/40 px-5 py-2.5 text-emerald-300 font-bold text-xs sm:text-sm shadow-xl animate-pulse">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <span>¡El Parrandón Navideño 2026 está en curso hoy en el Bulevar!</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto my-5">
      <div className="rounded-3xl border border-white/[0.1] bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 shadow-2xl relative overflow-hidden group">
        {/* Ambient background refraction */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-amber-500/10 to-blue-600/5 pointer-events-none" />

        <div className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-300 mb-3 relative z-10">
          <Clock className="h-4 w-4 text-amber-400 animate-spin" style={{ animationDuration: '12s' }} />
          <span>Cuenta Regresiva para la Gran Noche de Gala</span>
        </div>

        <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 text-center relative z-10">
          {/* Days */}
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800/90 p-2.5 sm:p-3 shadow-inner hover:border-amber-500/30 transition-colors">
            <span className="text-2xl sm:text-4xl font-black text-white font-mono block leading-none tracking-tight">
              {timeLeft.days}
            </span>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 mt-1.5 block">Días</span>
          </div>

          {/* Hours */}
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800/90 p-2.5 sm:p-3 shadow-inner hover:border-amber-500/30 transition-colors">
            <span className="text-2xl sm:text-4xl font-black text-amber-300 font-mono block leading-none tracking-tight">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 mt-1.5 block">Horas</span>
          </div>

          {/* Minutes */}
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800/90 p-2.5 sm:p-3 shadow-inner hover:border-sky-500/30 transition-colors">
            <span className="text-2xl sm:text-4xl font-black text-sky-300 font-mono block leading-none tracking-tight">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 mt-1.5 block">Min</span>
          </div>

          {/* Seconds */}
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800/90 p-2.5 sm:p-3 shadow-inner hover:border-emerald-500/30 transition-colors">
            <span className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono block leading-none tracking-tight">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 mt-1.5 block">Seg</span>
          </div>
        </div>
      </div>
    </div>
  );
}
