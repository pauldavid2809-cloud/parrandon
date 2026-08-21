'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LiveCuposBadge from '@/components/LiveCuposBadge';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  Utensils, 
  Music, 
  Gift, 
  Search, 
  ArrowRight,
  Lock,
  Armchair
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [searchCode, setSearchCode] = useState('');

  const handleSearchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    const clean = searchCode.trim().toUpperCase();
    if (clean.startsWith('ORD-') || clean.startsWith('PARR-')) {
      if (clean.startsWith('PARR-')) {
        router.push(`/ticket/${clean}`);
      } else {
        router.push(`/orden/${clean}`);
      }
    } else {
      router.push(`/orden/${clean}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Notification Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white text-[10px] sm:text-xs font-semibold py-2 px-3 sm:px-4 text-center border-b border-amber-500/20">
        🎄 Gran Parrandón Navideño 2026 • Seminario Mayor Santo Tomás de Aquino (500 Cupos en el Bulevar)
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24 border-b border-slate-800/80">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[250px] sm:h-[350px] bg-gradient-to-tr from-blue-600/10 via-amber-500/10 to-blue-900/10 blur-[90px] sm:blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto max-w-6xl px-3 sm:px-6 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-blue-950/60 px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold text-amber-300 mb-4 sm:mb-6 shadow-lg">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0" />
            <span>Fiesta Navideña Tradicional y Familiar • 2026</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Parrandón <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 bg-clip-text text-transparent">Navideño</span>
          </h1>
          <p className="mt-2 sm:mt-3 text-base sm:text-2xl font-bold text-sky-300">
            Seminario Mayor Santo Tomás de Aquino
          </p>

          <p className="mt-4 sm:mt-6 text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed px-2">
            Ven a celebrar en familia con gaitas en vivo, ambiente fraterno, bazar y el tradicional plato navideño completo. Elige tu mesa y sillas en el croquis 2D del bulevar.
          </p>

          {/* Real-time availability indicator */}
          <div className="mt-6 mb-8 sm:mt-8 sm:mb-10">
            <LiveCuposBadge />
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto px-2">
            <Link
              href="/comprar"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-black text-slate-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-105"
            >
              <span>Elegir Mesas & Comprar</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>

          {/* Quick Details Chips */}
          <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-400 block">Fecha y Hora</span>
                <span className="text-xs sm:text-sm font-bold text-white">Sáb 12 Dic 2026 • 6:00 PM</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-sky-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-400 block">Lugar del Evento</span>
                <span className="text-xs sm:text-sm font-bold text-white">Bulevar del Seminario, Maracaibo</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Utensils className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-400 block">Incluido en la Entrada</span>
                <span className="text-xs sm:text-sm font-bold text-white">1 Plato Navideño Completo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticket Lookup Box */}
      <section className="py-8 sm:py-10 bg-slate-950 border-b border-slate-800">
        <div className="container mx-auto max-w-3xl px-3 sm:px-4 text-center">
          <h3 className="text-sm sm:text-base font-bold text-white mb-1.5 flex items-center justify-center gap-2">
            <Search className="h-4 w-4 text-amber-400" />
            ¿Ya compraste tus entradas? Consulta tu orden o descarga tu QR
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mb-4">
            Ingresa tu número de orden (ej: <code className="text-amber-300 font-mono">ORD-7492A</code>) o código de ticket para ver tus pases digitales:
          </p>

          <form onSubmit={handleSearchOrder} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto px-2">
            <input
              type="text"
              placeholder="Ej: ORD-7492A o PARR-..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-amber-400 font-mono text-center sm:text-left"
            />
            <button
              type="submit"
              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition-colors"
            >
              Consultar
            </button>
          </form>
        </div>
      </section>

      {/* Highlights & Features */}
      <section className="py-12 sm:py-16 bg-slate-900/30">
        <div className="container mx-auto max-w-6xl px-3 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white">
              ¿Qué disfrutaremos en el Parrandón?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 sm:mt-2">
              Una experiencia navideña integral pensada para toda la familia con la calidez del Seminario.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 hover:border-amber-500/40 transition-colors">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 sm:mb-4">
                <Utensils className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Plato Navideño Tradicional</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cada entrada incluye un plato completo preparado con esmero: hallaca tradicional andina, pan de jamón, ensalada de gallina y pernil horneado.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 hover:border-blue-500/40 transition-colors">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-500/10 text-sky-400 flex items-center justify-center mb-3 sm:mb-4">
                <Music className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Gaitas y Música en Vivo</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conjuntos gaiteros, villancicos corales del coro del Seminario, música decembrina en vivo y ambiente fraterno para cantar y celebrar.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 hover:border-emerald-500/40 transition-colors">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 sm:mb-4">
                <Gift className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Bazar y Grandes Rifas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bazar navideño con postres tradicionales, ponche crema casero, pesebres y rifas especiales para colaborar con las obras del Seminario.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment methods badge */}
      <section className="py-10 sm:py-14 border-t border-slate-800 bg-slate-950">
        <div className="container mx-auto max-w-5xl px-3 sm:px-4 text-center">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">
            Métodos de Pago Fáciles y Flexibles
          </h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto mb-6 sm:mb-8 px-2">
            Paga en bolívares por Pago Móvil a la tasa oficial del día, o en dólares por PayPal, Tarjetas de Débito/Crédito, Zelle o Binance Pay.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4 text-center">
              <span className="text-xl sm:text-2xl block mb-1">📱</span>
              <span className="text-xs font-bold text-white block">Pago Móvil</span>
              <span className="text-[10px] text-slate-400">Todos los bancos en Bs</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4 text-center">
              <span className="text-xl sm:text-2xl block mb-1">💳</span>
              <span className="text-xs font-bold text-white block">PayPal & Tarjetas</span>
              <span className="text-[10px] text-slate-400">Débito / Crédito Int.</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4 text-center">
              <span className="text-xl sm:text-2xl block mb-1">💵</span>
              <span className="text-xs font-bold text-white block">Zelle</span>
              <span className="text-[10px] text-slate-400">Transferencias directas $</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4 text-center">
              <span className="text-xl sm:text-2xl block mb-1">🪙</span>
              <span className="text-xs font-bold text-white block">Binance Pay</span>
              <span className="text-[10px] text-slate-400">USDT sin comisiones</span>
            </div>
          </div>
        </div>
      </section>

      {/* Discrete Footer with Internal Admin Link */}
      <footer className="py-8 border-t border-slate-800 bg-slate-950 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 Seminario Mayor Santo Tomás de Aquino. Todos los derechos reservados.</p>
        <div>
          <Link
            href="/administracion-interna"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-400 text-[11px] transition-colors"
          >
            <Lock className="h-3 w-3" />
            <span>Administración Interna</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
