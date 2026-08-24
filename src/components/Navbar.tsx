'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Sparkles, Ticket, Home, Search, ArrowLeft, ShieldCheck, Heart } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin') || pathname === '/administracion-interna' || pathname === '/escanear' || pathname === '/cocina';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-slate-950/85 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      {/* Top micro ribbon */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-amber-300 text-[10px] font-bold py-1 px-3 text-center border-b border-amber-500/15 flex items-center justify-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
        <span>Gran Parrandón Navideño 2026 • Seminario Mayor Santo Tomás de Aquino</span>
        <span className="hidden sm:inline text-sky-400 font-mono text-[9px] bg-sky-950/80 px-2 py-0.2 rounded border border-sky-500/20">SACERDOS LUX</span>
      </div>

      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Logo / Branding with Official Coat of Arms */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative h-10 w-8 sm:h-12 sm:w-10 shrink-0 transition-transform duration-200 group-hover:scale-105 filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)]">
            <Image
              src="/images/seminario-logo.png"
              alt="Escudo Oficial Seminario Mayor Santo Tomás de Aquino"
              fill
              sizes="48px"
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                Parrandón <span className="text-amber-400">Navideño</span>
              </span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-extrabold text-amber-300 border border-amber-500/30 font-mono">
                2026
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-sky-300/90 font-medium tracking-tight truncate max-w-[160px] xs:max-w-[240px] sm:max-w-none">
              Seminario Mayor Santo Tomás de Aquino
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1.5 sm:gap-3">
          {!isAdmin ? (
            <>
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                  pathname === '/'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
                title="Inicio"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Inicio</span>
              </Link>
              
              <Link
                href="/#consultar"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
                title="Buscar entradas o comprobar orden"
              >
                <Search className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Buscar Entradas</span>
              </Link>

              <Link
                href="/comprar"
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-black rounded-xl transition-all shadow-lg ${
                  pathname === '/comprar'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-300 scale-105'
                    : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-amber-500/20'
                }`}
              >
                <Ticket className="h-4 w-4" />
                <span>Comprar<span className="hidden sm:inline"> Entradas</span></span>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/administracion-interna"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 border border-slate-700 text-amber-300 hover:text-white shadow-md"
              >
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span>Hub Operativo</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Ver Portada</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
