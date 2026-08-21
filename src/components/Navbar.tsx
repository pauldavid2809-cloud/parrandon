'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Ticket, Home, Lock, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-500/20 bg-slate-950/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo / Branding */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 via-amber-500 to-blue-950 p-0.5 shadow-lg shadow-blue-950/40 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
              Parrandón Navideño
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                2026
              </span>
            </span>
            <span className="text-[11px] text-sky-200/80">Seminario Santo Tomás de Aquino</span>
          </div>
        </Link>

        {/* Public Navigation */}
        <nav className="flex items-center gap-2 sm:gap-3">
          {!isAdmin ? (
            <>
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  pathname === '/' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                <span>Inicio</span>
              </Link>
              
              <Link
                href="/comprar"
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-md ${
                  pathname === '/comprar'
                    ? 'bg-amber-500 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110'
                }`}
              >
                <Ticket className="h-3.5 w-3.5" />
                <span>Comprar Entradas</span>
              </Link>

              <Link
                href="/administracion-interna"
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  pathname.startsWith('/administracion-interna')
                    ? 'bg-blue-950 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
                title="Acceso exclusivo para el personal del Seminario"
              >
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Administración Interna</span>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/administracion-interna"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              >
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span>Administración Interna</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
              >
                ← Portada
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
