'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import LiveCuposBadge from '@/components/LiveCuposBadge';
import CountdownTimer from '@/components/CountdownTimer';
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
  ShieldCheck,
  Armchair,
  Loader2,
  AlertCircle,
  QrCode,
  CheckCircle2,
  Users,
  Compass
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);
    setSearchResults(null);

    const clean = searchQuery.trim().toUpperCase();

    // Fast direct routing for exact standard prefixes
    if (clean.startsWith('PARR-')) {
      router.push(`/ticket/${clean}`);
      return;
    }
    if (clean.startsWith('ORD-') && clean.length >= 8) {
      router.push(`/orden/${clean}`);
      return;
    }

    // Query the search API
    try {
      const res = await fetch(`/api/orders?search=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (data.success) {
        if (data.ticketMatch?.ticket) {
          router.push(`/ticket/${data.ticketMatch.ticket.ticketCode}`);
          return;
        }

        if (data.orders && data.orders.length === 1) {
          router.push(`/orden/${data.orders[0].id}`);
          return;
        }

        if (data.orders && data.orders.length > 1) {
          setSearchResults(data.orders);
        } else {
          setSearchError(`No encontramos órdenes asociadas a "${searchQuery}". Verifica el número de orden, cédula o teléfono.`);
        }
      } else {
        setSearchError('Error al realizar la búsqueda.');
      }
    } catch (err) {
      console.error(err);
      setSearchError('Error de conexión al consultar.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* HERO SECTION • GRAND GALA & INSTITUTION HERITAGE */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24 border-b border-white/[0.06]">
        
        {/* Festive Ambient Background Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] sm:w-[900px] h-[350px] sm:h-[500px] bg-gradient-to-b from-amber-500/10 via-sky-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="container mx-auto max-w-6xl px-4 sm:px-6 relative z-10 text-center">
          
          {/* Official Coat of Arms & Institution Motto */}
          <div className="flex flex-col items-center justify-center mb-6 sm:mb-8 animate-festive-float">
            <div className="relative h-28 w-24 sm:h-36 sm:w-32 filter drop-shadow-[0_8px_24px_rgba(245,158,11,0.3)] transition-transform duration-300 hover:scale-105">
              <Image
                src="/images/seminario-logo.png"
                alt="Escudo Oficial Seminario Mayor Santo Tomás de Aquino - Sacerdos Lux"
                fill
                sizes="(max-width: 640px) 96px, 128px"
                className="object-contain"
                priority
              />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-slate-900/90 px-4 py-1.5 text-xs font-bold text-amber-300 mt-4 shadow-lg backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Seminario Mayor Santo Tomás de Aquino • Maracaibo</span>
            </div>
          </div>

          {/* Main Display Title */}
          <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white max-w-5xl mx-auto leading-none mb-3">
            Gran Parrandón <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 bg-clip-text text-transparent">
              Navideño 2026
            </span>
          </h1>

          {/* Value Prop Narrative */}
          <p className="mt-4 sm:mt-6 text-sm sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium px-2">
            Celebremos juntos en familia con gaitas en vivo, plato navideño tradicional completo, ambiente fraterno y bazar benéfico en el bulevar del Seminario.
          </p>

          {/* Live Countdown Timer */}
          <CountdownTimer />

          {/* Live Boulevard Capacity Bar */}
          <div className="my-6">
            <LiveCuposBadge />
          </div>

          {/* Call to Action Button Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto mt-6 px-2">
            <Link
              href="/comprar"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 px-8 py-4 text-base font-black text-slate-950 shadow-2xl shadow-amber-500/30 transition-all hover:scale-105"
            >
              <Armchair className="h-5 w-5" />
              <span>Elegir Mesa en Croquis 2D</span>
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="#consultar"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-amber-400 hover:bg-slate-800 px-6 py-4 text-sm font-bold text-slate-200 transition-all"
            >
              <Search className="h-4 w-4 text-amber-400" />
              <span>Consultar mi Entrada</span>
            </Link>
          </div>

          {/* 3 Quick Pillar Cards */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/70 p-4 sm:p-5 shadow-xl backdrop-blur-md glass-card-hover">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider block">Fecha de Gala</span>
                  <span className="text-sm font-bold text-white block">Sáb 12 Dic 2026</span>
                  <span className="text-xs text-slate-400 font-medium">6:00 PM (Apertura de Puerta)</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/70 p-4 sm:p-5 shadow-xl backdrop-blur-md glass-card-hover">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/20">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-sky-400 tracking-wider block">Lugar del Evento</span>
                  <span className="text-sm font-bold text-white block">Bulevar del Seminario</span>
                  <span className="text-xs text-slate-400 font-medium">Maracaibo, Estado Zulia</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/70 p-4 sm:p-5 shadow-xl backdrop-blur-md glass-card-hover">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <Utensils className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider block">Boleto Incluye</span>
                  <span className="text-sm font-bold text-white block">1 Plato Navideño Completo</span>
                  <span className="text-xs text-slate-400 font-medium">Hallaca, Pernil, Pan & Ensalada</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* INTERACTIVE SECTOR GUIDE (THE 5 BANQUET ZONES) */}
      <section className="py-12 sm:py-16 bg-slate-950 border-b border-white/[0.06]">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-950/60 px-3.5 py-1 rounded-full border border-amber-500/30">
              Distribución del Bulevar
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-3">
              5 Sectores • 50 Mesas Numeradas
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Cada mesa cuenta con capacidad para 10 personas. Puedes comprar mesas completas o sillas individuales con tu pase QR asegurado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Sector A */}
            <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-b from-sky-950/40 via-slate-900 to-slate-950 p-5 shadow-xl glass-card-hover">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 inline-block mb-2">
                Sector A (10 Mesas)
              </span>
              <h3 className="text-lg font-black text-white">Frente a Tarima</h3>
              <p className="text-xs text-slate-400 mt-1">Ubicación VIP con vista directa al escenario de gaitas y actos centrales.</p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-sky-300">
                <span>Mesas A1 a A10</span>
                <span>100 Cupos</span>
              </div>
            </div>

            {/* Sector B */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 p-5 shadow-xl glass-card-hover">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-block mb-2">
                Sector B (10 Mesas)
              </span>
              <h3 className="text-lg font-black text-white">Zona Central</h3>
              <p className="text-xs text-slate-400 mt-1">El corazón del parrandón con excelente acústica y cercanía a la pista.</p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-emerald-300">
                <span>Mesas B1 a B10</span>
                <span>100 Cupos</span>
              </div>
            </div>

            {/* Sector C */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 p-5 shadow-xl glass-card-hover">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-block mb-2">
                Sector C (10 Mesas)
              </span>
              <h3 className="text-lg font-black text-white">Zona Central</h3>
              <p className="text-xs text-slate-400 mt-1">Amplia visibilidad central ideal para grupos familiares y parroquias.</p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-amber-300">
                <span>Mesas C1 a C10</span>
                <span>100 Cupos</span>
              </div>
            </div>

            {/* Sector D */}
            <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-950 p-5 shadow-xl glass-card-hover">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-block mb-2">
                Sector D (10 Mesas)
              </span>
              <h3 className="text-lg font-black text-white">Zona Bazar</h3>
              <p className="text-xs text-slate-400 mt-1">Junto a los stands de postres, pesebres, ponche casero y rifas.</p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-purple-300">
                <span>Mesas D1 a D10</span>
                <span>100 Cupos</span>
              </div>
            </div>

            {/* Sector E */}
            <div className="rounded-3xl border border-rose-500/30 bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950 p-5 shadow-xl glass-card-hover">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-block mb-2">
                Sector E (10 Mesas)
              </span>
              <h3 className="text-lg font-black text-white">Zona Lateral</h3>
              <p className="text-xs text-slate-400 mt-1">Espacio cómodo y fresco cerca de la arboleda y áreas de descanso.</p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-rose-300">
                <span>Mesas E1 a E10</span>
                <span>100 Cupos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENTO GRID • EXPERIENCE HIGHLIGHTS */}
      <section className="py-14 sm:py-20 bg-slate-900/40 border-b border-white/[0.06]">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              ¿Qué Viviremos en el Gran Parrandón?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Una velada de encuentro fraterno y tradición zuliana pro-fondos para las vocaciones sacerdotales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/80 p-6 sm:p-7 shadow-xl glass-card-hover flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4">
                  <Utensils className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Plato Navideño Tradicional</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Cada boleto incluye un plato completo preparado con esmero: hallaca tradicional andina/zuliana, pernil horneado en su jugo, ensalada de gallina y pan de jamón artesanal.
                </p>
              </div>
              <div className="mt-5 text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Servicio directo a tu mesa</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/80 p-6 sm:p-7 shadow-xl glass-card-hover flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/20 flex items-center justify-center mb-4">
                  <Music className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Gaitas y Música en Vivo</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Agrupaciones gaiteras destacadas de la región, villancicos corales de los seminaristas y un ambiente musical festivo para cantar y celebrar en familia.
                </p>
              </div>
              <div className="mt-5 text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Sonido e iluminación profesional</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/80 p-6 sm:p-7 shadow-xl glass-card-hover flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <Gift className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Bazar y Grandes Rifas</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Bazar navideño con postres típicos, dulcería criolla, ponche casero, pesebres y rifas benéficas especiales para apoyar la formación de nuestros seminaristas.
                </p>
              </div>
              <div className="mt-5 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Pro-fondos Seminario Santo Tomás</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAST TICKET & ORDER LOOKUP MODULE */}
      <section id="consultar" className="py-12 sm:py-16 bg-slate-950 border-b border-white/[0.06]">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 border border-amber-500/30 px-4 py-1.5 text-xs font-bold text-amber-300 mb-3 shadow-md">
            <QrCode className="h-4 w-4 text-amber-400" />
            <span>Pase Digital y Consulta en Vivo</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
            ¿Ya compraste tus entradas?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-xl mx-auto">
            Ingresa tu número de orden (ej: <code className="text-amber-300 font-mono font-bold">ORD-7492A</code>) o tu <strong>Teléfono WhatsApp</strong> para abrir tu pase QR:
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Ej: ORD-7492A o 04141234567"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-2xl bg-slate-900 border border-slate-700 px-5 py-3.5 text-sm text-white focus:outline-none focus:border-amber-400 text-center sm:text-left shadow-inner"
            />
            <button
              type="submit"
              disabled={searching}
              className="rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-7 py-3.5 text-xs font-black text-slate-950 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-amber-500/20"
            >
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <span>Consultar</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {searchError && (
            <div className="mt-4 max-w-lg mx-auto rounded-2xl bg-rose-950/80 border border-rose-500/40 p-3.5 text-xs text-rose-300 flex items-center gap-2.5 text-left shadow-xl animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{searchError}</span>
            </div>
          )}

          {searchResults && searchResults.length > 1 && (
            <div className="mt-5 max-w-lg mx-auto rounded-3xl bg-slate-900/90 border border-slate-700 p-5 text-left space-y-3 shadow-2xl">
              <span className="text-xs font-bold text-amber-300 block uppercase tracking-wider">
                Se encontraron {searchResults.length} órdenes asociadas:
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {searchResults.map((ord: any) => (
                  <Link
                    key={ord.id}
                    href={`/orden/${ord.id}`}
                    className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800 hover:border-amber-400 text-xs transition-colors group"
                  >
                    <div>
                      <strong className="text-white font-mono text-sm block group-hover:text-amber-300">{ord.id}</strong>
                      <span className="text-slate-400 text-xs">{ord.buyerName} • {ord.quantity} entrada(s)</span>
                    </div>
                    <span className="text-amber-400 font-bold text-xs group-hover:translate-x-1 transition-transform">Ver Pase →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PAYMENT METHODS & SECURITY ASSURANCE */}
      <section className="py-12 sm:py-16 border-t border-white/[0.06] bg-slate-950/80">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
            Métodos de Pago Transparentes y Verificados
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mb-8">
            Paga en bolívares por Pago Móvil a la tasa oficial del día, o en dólares vía Zelle, Binance Pay (USDT), PayPal o Taquilla.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-4 sm:p-5 text-center glass-card-hover">
              <span className="text-2xl sm:text-3xl block mb-2">📱</span>
              <span className="text-xs sm:text-sm font-bold text-white block">Pago Móvil</span>
              <span className="text-[11px] text-emerald-400 font-medium">Tasa Oficial BCV</span>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-4 sm:p-5 text-center glass-card-hover">
              <span className="text-2xl sm:text-3xl block mb-2">💵</span>
              <span className="text-xs sm:text-sm font-bold text-white block">Zelle</span>
              <span className="text-[11px] text-sky-400 font-medium">Dólares directos ($)</span>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-4 sm:p-5 text-center glass-card-hover">
              <span className="text-2xl sm:text-3xl block mb-2">🪙</span>
              <span className="text-xs sm:text-sm font-bold text-white block">Binance Pay</span>
              <span className="text-[11px] text-amber-400 font-medium">USDT sin comisión</span>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-4 sm:p-5 text-center glass-card-hover">
              <span className="text-2xl sm:text-3xl block mb-2">💳</span>
              <span className="text-xs sm:text-sm font-bold text-white block">PayPal & Taquilla</span>
              <span className="text-[11px] text-slate-400 font-medium">Efectivo / Tarjetas</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
