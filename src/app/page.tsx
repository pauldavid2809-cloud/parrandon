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
  Heart, 
  Phone, 
  Award, 
  ChevronRight 
} from 'lucide-react';
import DonationModal from '@/components/DonationModal';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isDonationOpen, setIsDonationOpen] = useState(false);

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
          setSearchError(`No encontramos órdenes asociadas a "${searchQuery}". Verifica el número de orden o teléfono.`);
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
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION • GRAND GALA & FESTIVE BOULEVARD AMBIENCE */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-8 pb-20 sm:pt-14 sm:pb-28 border-b border-white/[0.08]">
        
        {/* Real High-Res Festive Background Photo with Deep Scrim Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-gala-ambient.jpg"
            alt="Bulevar del Seminario iluminado de fiesta navideña"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-30 scale-105 transform filter blur-[0.5px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/85 to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-950/40 to-slate-950" />
        </div>

        {/* Ambient Glow Orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[400px] sm:h-[550px] bg-gradient-to-b from-amber-400/15 via-sky-500/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/4 left-4 w-72 h-72 bg-blue-600/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/4 right-4 w-72 h-72 bg-amber-500/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="container mx-auto max-w-6xl px-4 sm:px-6 relative z-10 text-center">
          
          {/* Official Coat of Arms & Institution Heritage */}
          <div className="flex flex-col items-center justify-center mb-6 sm:mb-8 animate-festive-float">
            <div className="relative h-28 w-24 sm:h-36 sm:w-32 filter drop-shadow-[0_8px_30px_rgba(245,158,11,0.35)] transition-transform duration-300 hover:scale-105">
              <Image
                src="/images/seminario-logo.png"
                alt="Escudo Oficial Seminario Mayor Santo Tomás de Aquino - Sacerdos Lux"
                fill
                sizes="(max-width: 640px) 96px, 128px"
                className="object-contain"
                priority
              />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-slate-900/90 px-4 py-1.5 text-xs font-bold text-amber-300 mt-4 shadow-xl backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Seminario Mayor Santo Tomás de Aquino • Arquidiócesis de Maracaibo</span>
            </div>
          </div>

          {/* Main Display Headline */}
          <div className="inline-block mb-3">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/30 shadow-inner">
              ✨ Gran Gala Pro-Vocaciones Sacerdotales
            </span>
          </div>

          <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white max-w-5xl mx-auto leading-none mb-4">
            Gran Parrandón <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-300 via-amber-100 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(245,158,11,0.35)]">
              Navideño 2026
            </span>
          </h1>

          {/* Narrative Lead */}
          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-200 max-w-3xl mx-auto leading-relaxed font-normal px-2">
            Ven a celebrar la época más hermosa del año en el bulevar del Seminario. Una velada inolvidable con <strong>gaitas en vivo</strong>, <strong>plato navideño tradicional completo</strong> servido a tu mesa, bazar benéfico y el más fraterno ambiente familiar.
          </p>

          {/* Live Countdown Timer */}
          <div className="my-6 sm:my-8">
            <CountdownTimer />
          </div>

          {/* Live Boulevard Capacity Bar */}
          <div className="mb-8">
            <LiveCuposBadge />
          </div>

          {/* Call to Action Button Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-2xl mx-auto px-2">
            <Link
              href="/comprar"
              className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 px-8 py-4 text-sm sm:text-base font-black text-slate-950 shadow-2xl shadow-amber-500/35 transition-all hover:scale-105 active:scale-95 group"
            >
              <Armchair className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span>Elegir Mesa en Croquis 2D</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <button
              type="button"
              onClick={() => setIsDonationOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 px-6 py-4 text-sm font-black text-white shadow-xl shadow-rose-900/30 border border-rose-400/40 transition-all hover:scale-105 active:scale-95 group"
            >
              <Heart className="h-4 w-4 fill-white/20 text-rose-200 group-hover:scale-125 transition-transform" />
              <span>Hacer Donación (Fila Cero)</span>
            </button>

            <Link
              href="#consultar"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-amber-400 hover:bg-slate-800 px-5 py-4 text-sm font-bold text-slate-200 transition-all"
            >
              <Search className="h-4 w-4 text-amber-400" />
              <span>Consultar Pase</span>
            </Link>
          </div>

          {/* Direct Donation Quick Link */}
          <div className="mt-5 flex justify-center px-2">
            <button
              type="button"
              onClick={() => setIsDonationOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-950/40 hover:bg-rose-900/50 px-4 py-1.5 text-xs text-rose-200 transition-all shadow-md group backdrop-blur-md"
            >
              <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400/30 group-hover:scale-110 transition-transform" />
              <span>¿No puedes asistir el 12 de Dic? <strong>Apoya las vocaciones con tu aporte benéfico</strong></span>
              <ArrowRight className="h-3 w-3 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Reassurance Feature Bar */}
          <div className="mt-10 pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Estacionamiento Interno Vigilado</span>
            </div>
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-amber-400" />
              <span>Cena Completa por Entrada</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              <span>Ambiente 100% Familiar & Fraterno</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE 4 QUICK-FEATURE CARDS (Inspired by the Reference Image Row) */}
      {/* ========================================================================= */}
      <section className="relative z-20 -mt-8 sm:-mt-12 container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          
          {/* Card 1: Gaitas en Vivo */}
          <div className="rounded-3xl border border-white/[0.08] bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl glass-card-hover flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3.5 shadow-inner">
                <Music className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-white mb-1.5">Gaitas Zulianas en Vivo</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Conjuntos gaiteros destacados, furro, tambora, cuatro y villancicos corales toda la velada.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-amber-400">
              <span>Sonido profesional</span>
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 2: Plato Navideño */}
          <div className="rounded-3xl border border-white/[0.08] bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl glass-card-hover flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3.5 shadow-inner">
                <Utensils className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-white mb-1.5">Plato Navideño Completo</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hallaca casera, pernil asado horneado en su jugo, pan de jamón artesanal y ensalada de gallina.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-emerald-400">
              <span>Servido a tu mesa</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 3: 50 Mesas Numeradas */}
          <div className="rounded-3xl border border-white/[0.08] bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl glass-card-hover flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center mb-3.5 shadow-inner">
                <Armchair className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-white mb-1.5">50 Mesas Numeradas</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                5 sectores temáticos al aire libre en el bulevar. Selecciona tus sillas exactas en tiempo real.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-sky-400">
              <span>Croquis interactivo</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 4: Causa Pro-Seminario */}
          <div className="rounded-3xl border border-white/[0.08] bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl glass-card-hover flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-3.5 shadow-inner">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-white mb-1.5">Pro-Vocaciones 2026</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tu aporte sustenta directamente la alimentación y estudios de 30 seminaristas de Maracaibo.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-rose-400">
              <span>Sacerdos Lux</span>
              <Award className="h-3.5 w-3.5" />
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. "SOBRE EL EVENTO / LA OBRA VOCACIONAL" (Asymmetric Photo Layout) */}
      {/* ========================================================================= */}
      <section id="sobre-evento" className="py-16 sm:py-24 bg-slate-950 border-b border-white/[0.06] relative overflow-hidden">
        
        {/* Subtle decorative background blur */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-600/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="container mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Asymmetric Framed Photo with Corner Floating Badge */}
            <div className="lg:col-span-5 relative">
              
              {/* Tilted colorful accent backdrop */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-sky-600/20 to-blue-600/30 rotate-2 transform filter blur-sm -z-10" />
              
              {/* Main Photo Frame */}
              <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl aspect-[4/3] bg-slate-900">
                <Image
                  src="/images/seminario-comunidad.jpg"
                  alt="Comunidad del Seminario Mayor de Maracaibo en el patio colonial decorado de Navidad"
                  fill
                  sizes="(max-width: 1024px) 100vw, 450px"
                  className="object-cover object-center transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              </div>

              {/* Floating Badge Overlapping Image Corner (Signature Reference Motif) */}
              <div className="absolute -bottom-5 -right-3 sm:-right-5 bg-slate-900/95 border border-amber-400/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">
                    Seminario Mayor
                  </span>
                  <span className="text-xs font-bold text-white block">
                    30 Vocaciones en Formación
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Narrative Story & Key Highlights */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-300 mb-3.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Tradición, Encuentro y Solidaridad</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4">
                Una Noche Única de <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 bg-clip-text text-transparent">
                  Gaitas, Familia y Fe
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 font-normal">
                El <strong>Gran Parrandón Navideño</strong> es el acontecimiento benéfico más esperado por las familias marabinas. Un espacio pensado para reencontrarnos, celebrar nuestras raíces gaiteras y respaldar la misión pastoral de los jóvenes que han dicho <em>«Aquí estoy, Señor»</em> para servir como sacerdotes en las parroquias del Zulia.
              </p>

              {/* Checkmark Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <strong className="text-white block font-bold">Cena Navideña Gourmet</strong>
                    <span className="text-slate-400 text-xs">Hallaca, pernil, pan de jamón y ensalada incluida por entrada.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <strong className="text-white block font-bold">Música en Directo</strong>
                    <span className="text-slate-400 text-xs">Conjunto de gaitas, coros de villancicos y pista de baile.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <strong className="text-white block font-bold">Recinto Seguro y Privado</strong>
                    <span className="text-slate-400 text-xs">Estacionamiento interno vigilado dentro del bulevar.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <strong className="text-white block font-bold">Pase QR Instantáneo</strong>
                    <span className="text-slate-400 text-xs">Confirmación inmediata a tu WhatsApp y acceso sin colas.</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/comprar"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-6 py-3.5 text-xs sm:text-sm font-black text-slate-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-105"
                >
                  <span>Elegir Mesa en el Bulevar</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="https://wa.me/584120308674?text=Hola%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n%20sobre%20el%20Gran%20Parrand%C3%B3n%20Navide%C3%B1o%202026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 px-5 py-3.5 text-xs font-bold text-slate-300 transition-all hover:text-white"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Preguntar por WhatsApp</span>
                </a>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. "¿QUÉ VIVIREMOS EN EL GRAN PARRANDÓN?" (3 Cards with Floating Badges) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 bg-slate-900/50 border-b border-white/[0.06] relative">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-950/60 px-4 py-1 rounded-full border border-amber-500/30 inline-block mb-3">
              Experiencia de Gala
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              ¿Qué Viviremos en el Gran Parrandón?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-3 max-w-xl mx-auto">
              Tres pilares fundamentales reunidos en una velada familiar para inaugurar la Navidad con el corazón encendido.
            </p>
          </div>

          {/* 3 Pillar Cards with High-Res Photography & Floating Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
            
            {/* Card 1: Plato Navideño Tradicional */}
            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/90 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col justify-between glass-card-hover group">
              <div>
                {/* Photo with Scrim */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                  <Image
                    src="/images/plato-navideno.jpg"
                    alt="Plato navideño tradicional con hallaca, pernil asado, pan de jamón y ensalada"
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  
                  {/* Floating Circular Badge Overlapping Bottom Right of Photo */}
                  <div className="absolute bottom-3 right-3 h-12 w-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xl border-2 border-slate-900 transition-transform duration-300 group-hover:scale-110">
                    <Utensils className="h-6 w-6" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="inline-block text-[10px] font-black uppercase text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30 mb-2">
                    Gastronomía Navideña
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">
                    Plato Navideño Tradicional
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Cada boleto incluye un banquete completo: hallaca tradicional andina/zuliana, pernil horneado en su propio jugo glaseado, pan de jamón artesanal y ensalada de gallina fresca.
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Servicio directo a mesa</span>
                </span>
                <Link
                  href="/comprar"
                  className="text-xs font-bold text-slate-300 group-hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <span>Reservar</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Card 2: Gaitas y Música en Vivo */}
            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/90 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col justify-between glass-card-hover group">
              <div>
                {/* Photo with Scrim */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                  <Image
                    src="/images/gaitas-en-vivo.jpg"
                    alt="Agrupación gaitera tocando en vivo con furro, tambora y cuatro en el escenario"
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  
                  {/* Floating Circular Badge Overlapping Bottom Right of Photo */}
                  <div className="absolute bottom-3 right-3 h-12 w-12 rounded-2xl bg-sky-500 text-slate-950 flex items-center justify-center shadow-2xl border-2 border-slate-900 transition-transform duration-300 group-hover:scale-110">
                    <Music className="h-6 w-6" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="inline-block text-[10px] font-black uppercase text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-500/30 mb-2">
                    Música Zuliana
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">
                    Gaitas y Música en Vivo
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Conjuntos gaiteros de primera categoría interpretando los grandes éxitos pascueros, tambora, furro, cuatro y coros de villancicos preparados por los seminaristas.
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>Tarima & sonido pro</span>
                </span>
                <Link
                  href="/comprar"
                  className="text-xs font-bold text-slate-300 group-hover:text-sky-400 flex items-center gap-1 transition-colors"
                >
                  <span>Ver Mesas</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Card 3: Bazar y Pesebres */}
            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/90 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col justify-between glass-card-hover group">
              <div>
                {/* Photo with Scrim */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                  <Image
                    src="/images/bazar-navideno.jpg"
                    alt="Bazar navideño con artesanías de pesebres y dulcería criolla tradicional"
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  
                  {/* Floating Circular Badge Overlapping Bottom Right of Photo */}
                  <div className="absolute bottom-3 right-3 h-12 w-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-2xl border-2 border-slate-900 transition-transform duration-300 group-hover:scale-110">
                    <Gift className="h-6 w-6" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="inline-block text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30 mb-2">
                    Feria & Tradición
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">
                    Bazar, Dulces y Pesebres
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Bazar benéfico con postres típicos zulianos (dulce de lechosa, torta negra, limonsón), ponche casero artesanal, pesebres artesanales y grandes rifas especiales.
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Pro-Seminario</span>
                </span>
                <Link
                  href="/comprar"
                  className="text-xs font-bold text-slate-300 group-hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <span>Apoyar</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE SECTOR GUIDE (THE 5 BANQUET ZONES) */}
      {/* ========================================================================= */}
      <section id="sectores" className="py-16 sm:py-24 bg-slate-950 border-b border-white/[0.06]">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-950/60 px-4 py-1 rounded-full border border-amber-500/30 inline-block mb-3">
              Distribución del Bulevar
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              5 Sectores • 50 Mesas Numeradas
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-3">
              Cada mesa cuenta con capacidad para 10 personas. Puedes reservar mesas completas o sillas individuales con tu pase QR asegurado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Sector A */}
            <div className="rounded-3xl border border-sky-500/35 bg-gradient-to-b from-sky-950/40 via-slate-900 to-slate-950 p-5 shadow-xl glass-card-hover flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 inline-block mb-2.5">
                  Sector A (10 Mesas)
                </span>
                <h3 className="text-lg font-black text-white">Frente a Tarima</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Ubicación VIP con vista directa y despejada al escenario de gaitas y actos centrales.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-sky-300 mb-3">
                  <span>Mesas A1 a A10</span>
                  <span>100 Cupos</span>
                </div>
                <Link
                  href="/comprar"
                  className="w-full py-2 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-xs font-bold text-center block transition-colors"
                >
                  Elegir en Sector A →
                </Link>
              </div>
            </div>

            {/* Sector B */}
            <div className="rounded-3xl border border-emerald-500/35 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 p-5 shadow-xl glass-card-hover flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-block mb-2.5">
                  Sector B (10 Mesas)
                </span>
                <h3 className="text-lg font-black text-white">Zona Central Pista</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  El corazón del parrandón con acústica privilegiada y conexión con la pista de baile.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 mb-3">
                  <span>Mesas B1 a B10</span>
                  <span>100 Cupos</span>
                </div>
                <Link
                  href="/comprar"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold text-center block transition-colors"
                >
                  Elegir en Sector B →
                </Link>
              </div>
            </div>

            {/* Sector C */}
            <div className="rounded-3xl border border-amber-500/35 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 p-5 shadow-xl glass-card-hover flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-block mb-2.5">
                  Sector C (10 Mesas)
                </span>
                <h3 className="text-lg font-black text-white">Zona Central Familiar</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Visibilidad amplia y estratégica, preferida por grupos familiares y parroquias.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-amber-300 mb-3">
                  <span>Mesas C1 a C10</span>
                  <span>100 Cupos</span>
                </div>
                <Link
                  href="/comprar"
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold text-center block transition-colors"
                >
                  Elegir en Sector C →
                </Link>
              </div>
            </div>

            {/* Sector D */}
            <div className="rounded-3xl border border-purple-500/35 bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-950 p-5 shadow-xl glass-card-hover flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-block mb-2.5">
                  Sector D (10 Mesas)
                </span>
                <h3 className="text-lg font-black text-white">Zona Bazar & Pesebres</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Inmediato a los puestos de postres, artesanía navideña, ponche casero y rifas.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-purple-300 mb-3">
                  <span>Mesas D1 a D10</span>
                  <span>100 Cupos</span>
                </div>
                <Link
                  href="/comprar"
                  className="w-full py-2 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold text-center block transition-colors"
                >
                  Elegir en Sector D →
                </Link>
              </div>
            </div>

            {/* Sector E */}
            <div className="rounded-3xl border border-rose-500/35 bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950 p-5 shadow-xl glass-card-hover flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-block mb-2.5">
                  Sector E (10 Mesas)
                </span>
                <h3 className="text-lg font-black text-white">Terraza Arboleda</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Espacio fresco y relajado al aire libre cerca de los jardines y áreas de descanso.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-rose-300 mb-3">
                  <span>Mesas E1 a E10</span>
                  <span>100 Cupos</span>
                </div>
                <Link
                  href="/comprar"
                  className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold text-center block transition-colors"
                >
                  Elegir en Sector E →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FAST TICKET & ORDER LOOKUP MODULE */}
      {/* ========================================================================= */}
      <section id="consultar" className="py-16 sm:py-20 bg-slate-950 border-b border-white/[0.06] relative">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 text-center">
          
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 border border-amber-500/30 px-4 py-1.5 text-xs font-bold text-amber-300 mb-3.5 shadow-md">
            <QrCode className="h-4 w-4 text-amber-400" />
            <span>Pase Digital y Consulta en Vivo</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-black text-white mb-2">
            ¿Ya compraste tus entradas?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-xl mx-auto">
            Ingresa tu código de orden (ej: <code className="text-amber-300 font-mono font-bold">ORD-7492A</code>) o tu <strong>Teléfono WhatsApp</strong> registrado para abrir tu pase QR:
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
            <div className="mt-5 max-w-lg mx-auto rounded-3xl bg-slate-900/95 border border-slate-700 p-5 text-left space-y-3 shadow-2xl">
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

      {/* ========================================================================= */}
      {/* 7. PAYMENT METHODS & WHATSAPP SUPPORT BANNER */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 border-t border-white/[0.06] bg-slate-950/90 relative">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 text-center">
          
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
            Métodos de Pago Seguros y Verificados
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mb-8">
            Paga en bolívares por Pago Móvil a la tasa oficial del día, o en divisas vía Zelle, Binance Pay (USDT) o Taquilla.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 mb-8">
            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/70 p-5 text-center glass-card-hover">
              <span className="text-3xl block mb-2">📱</span>
              <span className="text-sm font-bold text-white block">Pago Móvil</span>
              <span className="text-[11px] text-emerald-400 font-medium">Tasa Oficial BCV</span>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/70 p-5 text-center glass-card-hover">
              <span className="text-3xl block mb-2">💵</span>
              <span className="text-sm font-bold text-white block">Zelle</span>
              <span className="text-[11px] text-sky-400 font-medium">Dólares directos ($)</span>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/70 p-5 text-center glass-card-hover">
              <span className="text-3xl block mb-2">🪙</span>
              <span className="text-sm font-bold text-white block">Binance Pay</span>
              <span className="text-[11px] text-amber-400 font-medium">USDT sin comisión</span>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/70 p-5 text-center glass-card-hover">
              <span className="text-3xl block mb-2">🏛️</span>
              <span className="text-sm font-bold text-white block">Taquilla / Efectivo</span>
              <span className="text-[11px] text-slate-400 font-medium">Seminario Mayor</span>
            </div>
          </div>

          {/* Official WhatsApp Direct Assistance Card */}
          <div className="max-w-2xl mx-auto rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-5 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <strong className="text-white text-sm font-bold block">
                  ¿Dudas o requerimientos de mesa corporativa?
                </strong>
                <span className="text-xs text-slate-300">
                  Atención directa vía WhatsApp con la Comisión Organizadora del Seminario.
                </span>
              </div>
            </div>
            <a
              href="https://wa.me/584120308674?text=Hola%2C%20quisiera%20atenci%C3%B3n%20sobre%20las%20entradas%20del%20Gran%20Parrand%C3%B3n%20Navide%C3%B1o"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105"
            >
              <span>0412-0308674</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

        </div>
      </section>

      {/* Direct Donation Modal */}
      <DonationModal
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
      />

    </div>
  );
}
