'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Ticket, Home, Search, ArrowLeft } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-500/20 bg-slate-950/95 backdrop-blur-md">
      <div className="container mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Logo / Branding */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 via-amber-500 to-blue-950 p-0.5 shadow-lg shadow-blue-950/40 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-base font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors flex items-center gap-1 sm:gap-1.5">
              Parrandón <span className="hidden xs:inline">Navideño</span>
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                2026
              </span>
            </span>
            <span className="text-[9px] sm:text-[11px] text-sky-200/80 truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
              Seminario Sto. Tomás de Aquino
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1.5 sm:gap-3">
          {!isAdmin ? (
            <>
              <Link
                href="/"
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl transition-colors ${
                  pathname === '/' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Inicio"
              >
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Inicio</span>
              </Link>
              
              <Link
                href="/#consultar"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                title="Buscar entradas o comprobar orden"
              >
                <Search className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Buscar Entradas</span>
              </Link>

              <Link
                href="/comprar"
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all shadow-md ${
                  pathname === '/comprar'
                    ? 'bg-amber-500 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110'
                }`}
              >
                <Ticket className="h-3.5 w-3.5" />
                <span>Comprar<span className="hidden sm:inline"> Entradas</span></span>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/administracion-interna"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              >
                <span>Hub Operativo</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Portada</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
