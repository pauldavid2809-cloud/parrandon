'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';

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
        Cargando cuenta regresiva...
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
    <div className="w-full max-w-xl mx-auto my-4">
      <div className="rounded-3xl border border-amber-500/30 bg-slate-900/80 backdrop-blur-md p-3.5 sm:p-4 shadow-xl">
        <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-400 mb-2.5">
          <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Cuenta Regresiva para la Gran Noche</span>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-2 sm:p-2.5">
            <span className="text-xl sm:text-3xl font-black text-white font-mono block leading-tight">
              {timeLeft.days}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Días</span>
          </div>

          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-2 sm:p-2.5">
            <span className="text-xl sm:text-3xl font-black text-amber-300 font-mono block leading-tight">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Horas</span>
          </div>

          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-2 sm:p-2.5">
            <span className="text-xl sm:text-3xl font-black text-sky-300 font-mono block leading-tight">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Min</span>
          </div>

          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-2 sm:p-2.5">
            <span className="text-xl sm:text-3xl font-black text-emerald-400 font-mono block leading-tight">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Seg</span>
          </div>
        </div>
      </div>
    </div>
  );
}
